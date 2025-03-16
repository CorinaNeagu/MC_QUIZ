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
  const { title, category, timeLimit, deductionPercentage, retakeAllowed, isActive, noQuestions } = req.body;
  const professorId = req.user.id; // Get the professor's ID from the JWT payload

  // Check if all required fields are provided
  if (!title || !category || !timeLimit || !deductionPercentage || !noQuestions) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Insert quiz data into the Quiz table
  const query = `INSERT INTO Quiz (professor_id, title, category_id) 
                 SELECT ?, ?, category_id FROM Category WHERE category_name = ? LIMIT 1`;

  db.query(query, [professorId, title, category], (err, result) => {
    if (err) {
      console.error('Error inserting quiz:', err);
      return res.status(500).json({ message: 'Error creating quiz' });
    }

    const quizId = result.insertId;

    // Insert quiz settings
    const settingsQuery = `INSERT INTO QuizSettings (quiz_id, time_limit, deduction_percentage, retake_allowed, is_active, no_questions)
                           VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(settingsQuery, [quizId, timeLimit, deductionPercentage, retakeAllowed, isActive, noQuestions], (err) => {
      if (err) {
        console.error('Error inserting quiz settings:', err);
        return res.status(500).json({ message: 'Error saving quiz settings' });
      }

      res.status(200).json({ message: 'Quiz created successfully' });
    });
  });
});

router.post('/questions', authenticateJWT, (req, res) => {
    const { questionContent, isMultipleChoice, quizId } = req.body;
    const professorId = req.user.id;

    if (!questionContent || !quizId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const query = `INSERT INTO QuestionBank (professor_id, category_id, question_content, is_multiple_choice)
                   VALUES (?, (SELECT category_id FROM Quiz WHERE quiz_id = ?), ?, ?)`;

    db.query(query, [professorId, quizId, questionContent, isMultipleChoice], (err, result) => {
      if (err) {
        console.error("Error inserting question:", err);
        return res.status(500).json({ message: "Error creating question" });
      }

      res.status(200).json({ message: 'Question added successfully', questionId: result.insertId });
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
