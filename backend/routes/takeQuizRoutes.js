const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();

// Route to fetch questions by quizId
router.get('/quizzes/:quizId/questions', (req, res) => {
    const { quizId } = req.params;
    console.log(`🔹 Fetching questions for quizId: ${quizId}`);
  
    // SQL query to fetch question details only
    const query = `
      SELECT 
        qq.quiz_id, 
        q.question_bank_id, 
        q.question_content
      FROM QuizQuestions qq
      JOIN QuestionBank q ON qq.question_bank_id = q.question_bank_id
      WHERE qq.quiz_id = ?;
    `;
  
    db.query(query, [quizId], (err, results) => {
      if (err) {
        console.error('Error fetching quiz questions:', err);
        return res.status(500).json({ error: 'Error fetching quiz questions' });
      }
  
      // Format the results into an array of questions
      const formattedQuestions = results.map(row => ({
        question_bank_id: row.question_bank_id,
        question_content: row.question_text
      }));
  
      // Log formatted questions for debugging
      console.log("Formatted questions:", JSON.stringify(formattedQuestions, null, 2));
  
      // Return the formatted questions
      res.json(formattedQuestions);
    });
  });


  // Route to fetch answers for a specific question by question_bank_id
router.get('/questions/:questionBankId/answers', (req, res) => {
    const { questionBankId } = req.params;
    
    const query = `
      SELECT 
        a.answer_id, 
        a.answer_content, 
        a.is_correct, 
        a.score
      FROM AnswerBank a
      WHERE a.question_bank_id = ?;
    `;
    
    db.query(query, [questionBankId], (err, results) => {
      if (err) {
        console.error('Error fetching answers for question:', err);
        return res.status(500).json({ error: 'Error fetching answers' });
      }
  
      // Format the answers into the desired response
      const formattedAnswers = results.map(row => ({
        answer_id: row.answer_id,
        answer_content: row.answer_content,
        is_correct: row.is_correct,
        score: row.score
      }));
  
      // Return the list of answers
      res.json(formattedAnswers);
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
    const responses = req.body; // This will be an array of responses

    if (!responses || responses.length === 0) {
        return res.status(400).json({ error: 'No responses provided' });
    }

    // Loop through each response and insert it into the database
    responses.forEach((response) => {
        const { student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct } = response;

        if (!student_id || !question_bank_id || !answer_id || is_correct === undefined) {
            return res.status(400).json({ error: 'Missing required fields in response' });
        }

        // Prepare the query to insert the response
        const query = `
            INSERT INTO StudentResponse (student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct)
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        // Values to be inserted into the query
        const values = [student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct];

        // Execute the query
        db.query(query, values, (err, results) => {
            if (err) {
                console.error('Error storing student response:', err);
                return res.status(500).json({ error: 'Failed to store response' });
            }

            // Send success response
            res.status(201).json({ message: 'Response saved successfully', responseId: results.insertId });
        });
    });
});

// Route to submit the quiz attempt
router.post('/quiz/:quizId/attempt/:attemptId/submit', async (req, res) => {
    const { quizId, attemptId } = req.params;
    const { studentId, score } = req.body;  // studentId and score sent from the frontend

    // Ensure studentId and score are present
    if (!studentId || score === undefined) {
        return res.status(400).json({ error: 'Missing studentId or score' });
    }

    try {
        // 1. Insert responses into StudentResponse table
        const responses = req.body.responses;  // Assuming responses are passed in the body as an array

        if (!responses || responses.length === 0) {
            return res.status(400).json({ error: 'No responses provided' });
        }

        // Loop through responses and insert each into the database
        for (const response of responses) {
            const { student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct } = response;

            if (!student_id || !question_bank_id || !answer_id || is_correct === undefined) {
                return res.status(400).json({ error: 'Missing required fields in response' });
            }

            const query = `
                INSERT INTO StudentResponse (student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct)
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const values = [student_id, question_bank_id, answer_id, quiz_id, attempt_id, is_correct];

            // Use the promise version of the query for async/await compatibility
            await db.promise().query(query, values);
        }

        // 2. Update quiz attempt with final score
        const updateAttemptQuery = `
            UPDATE QuizAttempt
            SET score = ?
            WHERE attempt_id = ? AND student_id = ?;
        `;
        // Use the promise version of the query for async/await compatibility
        await db.promise().query(updateAttemptQuery, [score, attemptId, studentId]);

        // 3. Send success response
        res.status(201).json({ message: 'Quiz submitted successfully', score });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

  
  

module.exports = router;