const express = require('express');
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const db = require("../db");

// Helper function to use async/await with db.query
function queryAsync(query, values) {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

// GET quiz attempts per category for logged-in student
router.get('/pie-chart/quiz-category', authenticateJWT, async (req, res) => {
  console.log("🚀 /quiz-category route hit!");

  // Get student ID from JWT
  const studentId = req.user.id;  
  console.log("Student ID:", studentId);  // Log the student ID to verify

  // SQL query to fetch quiz attempts per category for the logged-in student
  const query = `
    SELECT c.category_name, c.category_id, COUNT(q.quiz_id) AS quizzes_taken
    FROM QuizAttempt qa
    JOIN Quiz q ON qa.quiz_id = q.quiz_id
    JOIN Category c ON q.category_id = c.category_id
    WHERE qa.student_id = ?
    GROUP BY c.category_name, c.category_id
  `;

  try {
    // Execute the query and get the results
    const results = await queryAsync(query, [studentId]);

    console.log("📊 Results:", results);  // Log the results for debugging

    // Check if any data is returned
    if (results.length > 0) {
      // Return the results as JSON
      res.status(200).json(results);
    } else {
      // If no data, return an empty array or a message
      res.status(404).json({ message: "No data available" });
    }
  } catch (err) {
    // Catch any errors and return an appropriate response
    console.error("❌ Error fetching quiz stats:", err);
    res.status(500).json({ message: "Error fetching quiz category statistics" });
  }
});

router.get('/quizzes-by-category/:category_id', (req, res) => {
  const categoryId = req.params.category_id; // Get category_id from the URL parameter
  console.log("From URL " ,categoryId);

  // SQL query to get quizzes for the selected category
  const query = `
    SELECT 
      q.quiz_id, 
      q.title AS quiz_title, 
      c.category_name,
      c.category_id
    FROM 
      Quiz q
    JOIN 
      Category c
    ON 
      q.category_id = c.category_id
    WHERE 
      c.category_id = ?;
  `;

  // Execute the query with the category ID as a parameter
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error('Error fetching quizzes for category:', err);
      return res.status(500).json({ message: 'Error fetching quizzes' });
    }

    console.log("Results from DB:", results);
    // If results are found, send them as a JSON response
    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ message: 'No quizzes found for this category' });
    }
  });
});

// Backend Route to Get Quiz Scores
router.get('/line-chart/quiz-scores', authenticateJWT, async (req, res) => {
  console.log("🚀 /quiz-scores route hit!");

  const studentId = req.user.id;  
  console.log("Student ID:", studentId); 

  const query = `
    SELECT q.quiz_id, q.title, qa.score
    FROM QuizAttempt qa
    JOIN Quiz q ON qa.quiz_id = q.quiz_id
    WHERE qa.student_id = ?
  `;

  try {
    const results = await queryAsync(query, [studentId]);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ message: "No data available" });
    }
  } catch (err) {
    console.error("❌ Error fetching quiz scores:", err);
    res.status(500).json({ message: "Error fetching quiz scores" });
  }
});

module.exports = router;
