const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();

// Route to fetch questions by quizId
// GET - Get quiz questions for a specific quiz
router.get('/quizzes/:quizId/questions', (req, res) => {
  const { quizId } = req.params;
  
  const query = `
    SELECT 
      q.question_bank_id, 
      q.question_content AS question_text, 
      a.answer_id, 
      a.answer_content, 
      a.is_correct, 
      a.score
    FROM QuizQuestions qq
    JOIN QuestionBank q ON qq.question_bank_id = q.question_bank_id
    JOIN AnswerBank a ON q.question_bank_id = a.question_bank_id
    WHERE qq.quiz_id = ?
  `;
  
  db.query(query, [quizId], (err, results) => {
    if (err) {
      console.error('Error fetching quiz questions:', err);
      return res.status(500).json({ error: 'Error fetching quiz questions' });
    }

    console.log('Raw query results:', results); // Log raw results for debugging
    
    // Process the results into a format that matches frontend expectations
    const formattedQuestions = results.reduce((acc, row) => {
      // Find if the question already exists in the accumulator
      const questionIndex = acc.findIndex(q => q.question_bank_id === row.question_bank_id);

      if (questionIndex === -1) {
        // If question doesn't exist, add it with the first option
        acc.push({
          question_bank_id: row.question_bank_id,
          question_text: row.question_text,
          options: [{
            answer_id: row.answer_id,
            answer_content: row.answer_content,
            is_correct: row.is_correct,
            score: row.score
          }]
        });
      } else {
        // If question exists, add the option to it
        acc[questionIndex].options.push({
          answer_id: row.answer_id,
          answer_content: row.answer_content,
          is_correct: row.is_correct,
          score: row.score
        });
      }

      return acc;
    }, []);
    
    // Log each question's options separately using JSON.stringify for better readability
    formattedQuestions.forEach(question => {
      console.log(`Question ID: ${question.question_bank_id}`);
      console.log(`Options for question ${question.question_bank_id}:`);
      console.log(JSON.stringify(question.options, null, 2));  // This will format the options
    });

    // Return the formatted questions with options (matching frontend expectations)
    res.json(formattedQuestions);
  });
});




router.get("/quiz/answers/:questionId", (req, res) => {
    const { questionId } = req.params;
  
    const query = "SELECT * FROM AnswerBank WHERE question_bank_id = ?";
    
    db.query(query, [questionId], (err, results) => { // ✅ Replaced `pool` with `db`
      if (err) {
        console.error("Error fetching answers:", err);
        return res.status(500).json({ message: "Server error fetching answers." });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "No answers found for this question." });
      }
  
      res.json(results);
    });
  });


// POST: Start Quiz - Create a new QuizAttempt
router.post('/quiz/:quizId/start', (req, res) => {
  const { quizId } = req.params;
  const { studentId } = req.body; // Assume studentId is passed in the body

  const query = 'INSERT INTO QuizAttempt (quiz_id, student_id, score) VALUES (?, ?, 0)';
  const values = [quizId, studentId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error creating quiz attempt:', err);
      return res.status(500).json({ error: 'Failed to start quiz attempt' });
    }

    const attemptId = results.insertId;  // Get the attempt ID
    res.status(201).json({ attemptId });  // Return the attemptId for future reference
  });
});

// POST: Submit Student's Response to a Question
router.post('/quiz/:quizId/attempt/:attemptId/response', (req, res) => {
  const { quizId, attemptId } = req.params;
  const { studentId, questionBankId, answerId, isCorrect } = req.body; // Assume these are sent in the body

  const query = `
    INSERT INTO StudentResponse (student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [studentId, questionBankId, answerId, quizId, attemptId, isCorrect];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error storing student response:', err);
      return res.status(500).json({ error: 'Failed to store response' });
    }

    res.status(201).json({ message: 'Response saved successfully' });
  });
});

// POST: Submit Quiz Attempt and Update Score
router.post('/quiz/:quizId/attempt/:attemptId/submit', (req, res) => {
  const { attemptId, quizId } = req.params;
  const { studentId, score } = req.body; // Assume score is calculated and passed in the body

  // Update the score in the QuizAttempt table
  const query = 'UPDATE QuizAttempt SET score = ? WHERE attempt_id = ?';
  const values = [score, attemptId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error updating quiz attempt score:', err);
      return res.status(500).json({ error: 'Failed to update score' });
    }

    res.status(200).json({ message: 'Quiz submitted and score updated' });
  });
});


// GET: Get All Responses for a Quiz Attempt (For Admin/Teacher Review)
router.get('/quiz/:quizId/attempt/:attemptId/responses', (req, res) => {
  const { quizId, attemptId } = req.params;

  const query = `
    SELECT sr.*, q.question_content, a.answer_content
    FROM StudentResponse sr
    JOIN QuestionBank q ON sr.question_bank_id = q.question_bank_id
    JOIN AnswerBank a ON sr.answer_id = a.answer_id
    WHERE sr.quiz_id = ? AND sr.attempt_id = ?
  `;
  const values = [quizId, attemptId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error fetching student responses:', err);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }

    res.status(200).json(results);
  });
});

module.exports = router;