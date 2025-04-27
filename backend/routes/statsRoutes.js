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
    SELECT c.category_name, COUNT(q.quiz_id) AS quizzes_taken
    FROM QuizAttempt qa
    JOIN Quiz q ON qa.quiz_id = q.quiz_id
    JOIN Category c ON q.category_id = c.category_id
    WHERE qa.student_id = ?
    GROUP BY c.category_name
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
