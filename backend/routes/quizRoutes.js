const express = require("express");
const db = require("../db");
const authenticateJWT = require("../middleware/authMiddleware");
const router = express.Router();

// Assuming Express.js and MySQL are being used
router.post("/quizzes", authenticateJWT, (req, res) => {
    const { quizTitle, question, options } = req.body;
    const professor_id = req.user.id; // Get professor ID from JWT token
  
    if (!quizTitle || !question || !options.length) {
      return res.status(400).json({ message: "All fields are required." });
    }
  
    // Insert quiz into the database
    const query = "INSERT INTO quizzes (title, question, professor_id) VALUES (?, ?, ?)";
    db.query(query, [quizTitle, question, professor_id], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Error creating quiz." });
      }
  
      // Get the quiz ID and insert options
      const quizId = result.insertId;
      options.forEach((option) => {
        const optionQuery = "INSERT INTO quiz_options (quiz_id, option_text, is_correct) VALUES (?, ?, ?)";
        db.query(optionQuery, [quizId, option.text, option.correct], (err) => {
          if (err) {
            console.error("Error inserting option:", err);
          }
        });
      });
  
      res.status(200).json({ message: "Quiz created successfully." });
    });
  });
  
  module.exports = router;