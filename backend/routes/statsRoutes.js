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
router.get('/quiz-category', authenticateJWT, async (req, res) => {
  console.log("🚀 /quiz-category route hit!");

  // Change this to match the payload in the JWT
  const studentId = req.user.id;  // Using 'id' from JWT payload
  console.log("Student ID:", studentId); // Log the student ID to verify

  const query = `
    SELECT c.category_name, COUNT(q.quiz_id) AS quizzes_taken
    FROM QuizAttempt qa
    JOIN Quiz q ON qa.quiz_id = q.quiz_id
    JOIN Category c ON q.category_id = c.category_id
    WHERE qa.student_id = ?
    GROUP BY c.category_name
  `;

  try {
    const results = await queryAsync(query, [studentId]);
    console.log("📊 Results:", results);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ message: "No data available" });
    }
  } catch (err) {
    console.error("❌ Error fetching quiz stats:", err);
    res.status(500).json({ message: "Error fetching quiz category statistics" });
  }
});


module.exports = router;
