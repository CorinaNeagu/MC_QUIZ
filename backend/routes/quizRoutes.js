const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();

router.get('/categories', (req, res) => {
    // SQL query to fetch all categories
    const query = 'SELECT * FROM Category';
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Error fetching categories' });
      }
  
      res.status(200).json({ categories: results });
    });
  });


  // POST - Create a new quiz
  router.post('/quizzes', authenticateJWT, (req, res) => {
    // Extract the fields from the request body
    const { title, category, timeLimit, deductionPercentage, retakeAllowed, isActive, noQuestions } = req.body;
    const professorId = req.user.id; // Get the professor's ID from the JWT payload
  
    console.log("Received data:", req.body); // Log to confirm
  
    // Parse and convert values to the correct types
    const timeLimitNum = parseInt(timeLimit, 10);
    const deductionPercentageNum = parseFloat(deductionPercentage);
    const noQuestionsNum = parseInt(noQuestions, 10);
  
    console.log("Parsed Data:", { timeLimitNum, deductionPercentageNum, noQuestionsNum });
  
    // Check if all required fields are provided
    if (!title || !category || isNaN(timeLimitNum) || isNaN(deductionPercentageNum) || isNaN(noQuestionsNum)) {
      console.log("Error: Missing required fields.");
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Validate timeLimit (Must be a positive number)
    if (timeLimitNum <= 0 || isNaN(timeLimitNum)) {
      return res.status(400).json({ message: 'Time limit must be a positive number' });
    }
  
    // Validate deductionPercentage (Must be between 0 and 100)
    if (deductionPercentageNum < 0 || deductionPercentageNum > 100 || isNaN(deductionPercentageNum)) {
      return res.status(400).json({ message: 'Deduction percentage must be between 0 and 100' });
    }
  
    // Validate noQuestions (Must be a positive number)
    if (noQuestionsNum <= 0 || isNaN(noQuestionsNum)) {
      return res.status(400).json({ message: 'Number of questions must be a positive number' });
    }
  
    // Proceed to insert the data into the database
    const query = `INSERT INTO Quiz (professor_id, title, category_id)
                   SELECT ?, ?, category_id FROM Category WHERE category_name = ? LIMIT 1`;
  
    db.query(query, [professorId, title, category], (err, result) => {
      if (err) {
        console.error('Error inserting quiz:', err);
        return res.status(500).json({ message: 'Error creating quiz' });
      }
  
      const quizId = result.insertId;
  
      console.log('Inserting quiz settings:', {
        quizId,
        timeLimit: timeLimitNum,
        deductionPercentage: deductionPercentageNum,
        retakeAllowed,
        isActive,
        noQuestions: noQuestionsNum,
      });
  
      const settingsQuery = `INSERT INTO QuizSettings (quiz_id, time_limit, deduction_percentage, retake_allowed, is_active, no_questions)
                             VALUES (?, ?, ?, ?, ?, ?)`;
  
      db.query(settingsQuery, [quizId, timeLimitNum, deductionPercentageNum, retakeAllowed, isActive, noQuestionsNum], (err) => {
        if (err) {
          console.error('Error inserting quiz settings:', err);
          return res.status(500).json({ message: 'Error saving quiz settings' });
        }
  
        res.status(200).json({ message: 'Quiz created successfully', quizId });
      });
    });
  });
  
  


// POST - Add a question to the QuestionBank table
router.post('/quizzes/questions', authenticateJWT, (req, res) => {
  const { questionContent, isMultipleChoice, quizId, answers } = req.body;
  const professorId = req.user.id;

  // Validate the incoming data
  if (!questionContent || !quizId || !answers || answers.length === 0) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  // Insert the question into QuestionBank table
  const query = `INSERT INTO QuestionBank (professor_id, category_id, question_content, is_multiple_choice)
                 VALUES (?, (SELECT category_id FROM Quiz WHERE quiz_id = ?), ?, ?)`;

  db.query(query, [professorId, quizId, questionContent, isMultipleChoice], (err, result) => {
      if (err) {
          console.error("Error inserting question:", err);
          return res.status(500).json({ message: "Error creating question" });
      }

      const questionId = result.insertId;

      // Insert answers into the AnswerBank table
      answers.forEach((answer) => {
          const { answerContent, isCorrect } = answer;
          const score = isCorrect ? 1 : 0; // Correct answers get a score of 1, incorrect get 0.

          const answerQuery = `INSERT INTO AnswerBank (question_bank_id, answer_content, is_correct, score)
                               VALUES (?, ?, ?, ?)`;

          db.query(answerQuery, [questionId, answerContent, isCorrect, score], (err) => {
              if (err) {
                  console.error("Error inserting answer:", err);
              }
          });
      });

      res.status(200).json({ message: 'Question added successfully', questionId });
  });
});

router.post('/answers', authenticateJWT, (req, res) => {
    const { question_bank_id, answerContent, isCorrect, score } = req.body;

    if (!question_bank_id || !answerContent) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const query = `INSERT INTO AnswerBank (question_bank_id, answer_content, is_correct, score)
                   VALUES (?, ?, ?, ?)`;

    db.query(query, [question_bank_id, answerContent, isCorrect, score], (err, result) => {
      if (err) {
        console.error("Error inserting answer:", err);
        return res.status(500).json({ message: "Error saving answer" });
      }

      res.status(200).json({ message: 'Answer added successfully' });
    });
});

module.exports = router;
