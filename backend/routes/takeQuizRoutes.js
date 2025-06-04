const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();
const jwt = require('jsonwebtoken'); 

// GET quiz settings
router.get('/quiz-settings/:quizId', (req, res) => {
  const quizId = req.params.quizId;

  const query = `
    SELECT time_limit, deduction_percentage, retake_allowed, is_active, no_questions
    FROM QuizSettings
    WHERE quiz_id = ?
  `;

  db.query(query, [quizId], (err, results) => {
    if (err) {
      console.error("Error fetching quiz settings:", err);
      return res.status(500).json({ message: "Failed to retrieve settings" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Settings not found for this quiz" });
    }

    res.status(200).json({ settings: results[0] });
  });
});

router.get('/quiz/:quizId', async (req, res) => {
    const quizId = req.params.quizId;
  
    try {
        // First query to fetch quiz information and settings
        const quizQuery = `
             SELECT q.quiz_id, q.title, q.created_at, c.category_name, qs.time_limit, 
                   qs.deduction_percentage, qs.retake_allowed, qs.is_active, qs.no_questions
            FROM Quiz q
            JOIN Category c ON q.category_id = c.category_id
            JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
            WHERE q.quiz_id = ?;
        `;
        
        // Second query to fetch the questions for the quiz
        const questionsQuery = `
            SELECT * FROM Questions WHERE quiz_id = ?;
        `;
        
        // Third query to fetch the answers for the quiz questions
        const answersQuery = `
            SELECT * FROM Answers WHERE question_id IN (SELECT question_id FROM Questions WHERE quiz_id = ?);
        `;
        
        db.query(quizQuery, [quizId], (err, quizResult) => {
            if (err) {
                console.error("Error fetching quiz info:", err);
                return res.status(500).json({ message: 'Error fetching quiz details from database.' });
            }

            // Fetch questions
            db.query(questionsQuery, [quizId], (err, questionsResult) => {
                if (err) {
                    console.error("Error fetching questions:", err);
                    return res.status(500).json({ message: 'Error fetching questions.' });
                }

                // Fetch answers
                db.query(answersQuery, [quizId], (err, answersResult) => {
                    if (err) {
                        console.error("Error fetching answers:", err);
                        return res.status(500).json({ message: 'Error fetching answers.' });
                    }

                    // Combine all results
                    const quizData = {
                        ...quizResult[0],  // Quiz info
                        questions: questionsResult.map(question => ({
                            ...question,
                            answers: answersResult.filter(answer => answer.question_id === question.question_id)
                        }))
                    };
                    

                    return res.status(200).json(quizData);
                });
            });
        });

    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ message: 'An error occurred while fetching quiz details.' });
    }

});


router.post('/quiz_attempts', (req, res) => {
    const { quiz_id } = req.body; 
  
    const token = req.headers['authorization']?.split(' ')[1]; 
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
  
      const student_id = decoded.id; 

      const insertAttemptQuery = `
        INSERT INTO QuizAttempt (student_id, quiz_id, score, start_time, time_taken)
        VALUES (?, ?, 0.00, NOW(), 0)`
      ;
  
      db.query(insertAttemptQuery, [student_id, quiz_id], (attemptErr, attemptResults) => {
        if (attemptErr) {
          console.error("Error creating quiz attempt:", attemptErr);
          return res.status(500).json({ message: 'Error starting quiz attempt' });
        }

        const attemptId = attemptResults.insertId;

        return res.status(200).json({ message: 'Quiz attempt created successfully', attemptId });
      });
    });
});


  router.get('/quiz/:quiz_id/questions', (req, res) => {
    const { quiz_id } = req.params;

    const getQuestionsQuery = `
        SELECT q.question_id, q.question_content, a.answer_id, a.answer_content
        FROM Questions q
        LEFT JOIN Answers a ON q.question_id = a.question_id
        WHERE q.quiz_id = ?
    `;

    db.query(getQuestionsQuery, [quiz_id], (err, results) => {
        if (err) {
            console.error("Error fetching questions:", err);
            return res.status(500).json({ message: "Error fetching questions" });
        }

        const questionsMap = {};
        results.forEach(row => {
            if (!questionsMap[row.question_id]) {
                questionsMap[row.question_id] = {
                    question_id: row.question_id,
                    question_content: row.question_content,
                    answers: []
                };
            }
            if (row.answer_id) { // Only add answers if they exist
                questionsMap[row.question_id].answers.push({
                    answer_id: row.answer_id,
                    answer_content: row.answer_content
                });
            }
        });

        const questions = Object.values(questionsMap);
        res.status(200).json(questions);
    });
});

// POST submit quiz
router.post('/takeQuiz/submit-quiz', (req, res) => {
    const { attempt_id, time_taken } = req.body;
  
    const query = `
      UPDATE QuizAttempts
      SET end_time = NOW(), time_taken = ?
      WHERE attempt_id = ?
    `;
  
    db.query(query, [time_taken, attempt_id], (err, result) => {
      if (err) {
        console.error("Error submitting quiz:", err);
        return res.status(500).json({ message: "Failed to submit quiz" });
      }
  
      res.status(200).json({ message: "Quiz submitted successfully" });
    });
  });

 router.get('/student-assigned-quizzes/:groupId', authenticateJWT, (req, res) => {
  const studentId = req.user.id;
  const groupId = req.params.groupId;

  if (!studentId) {
    return res.status(401).json({ message: 'Unauthorized: studentId missing' });
  }

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required' });
  }

  const query = `
    SELECT 
  q.quiz_id, 
  q.title, 
  c.category_name AS category_name,
  sc.subcategory_name AS subcategory_name,
  gq.deadline, 
  qs.retake_allowed,
  CASE
    WHEN qs.retake_allowed = 0 AND EXISTS (
      SELECT 1 FROM QuizAttempt qa 
      WHERE qa.quiz_id = q.quiz_id AND qa.student_id = ?
    ) THEN TRUE
    ELSE FALSE
  END AS alreadyTaken
FROM groupQuiz gq
JOIN Quiz q ON gq.quiz_id = q.quiz_id
JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
JOIN groupMembers gm ON gm.group_id = gq.group_id AND gm.student_id = ?
LEFT JOIN Category c ON q.category_id = c.category_id
LEFT JOIN Subcategory sc ON q.subcategory_id = sc.subcategory_id
WHERE gq.group_id = ?;

  `;

  const params = [studentId, studentId, groupId];

  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching assigned quizzes:', error);
      return res.status(500).json({ message: 'Server error fetching assigned quizzes' });
    }
    res.json(results);
  });
});




  module.exports = router;