const express = require("express");
const db = require("../db");
const authenticateJWT = require("../middleware/authMiddleware");
const router = express.Router();

// Protected Route - Get User Profile
// User Profile route
router.get('/profile', authenticateJWT, (req, res) => {
    const { id, userType } = req.user;  // Extract from JWT payload

    console.log('Fetching profile for id:', id);

    // Dynamically choose the table based on userType
    const table = userType === "student" ? "Student" : "Professor";
    const userKey = userType === "student" ? "student_id" : "professor_id";

    // Query the respective table for the user by the ID (either student_id or professor_id)
    const query = `SELECT username, email, created_at FROM ${table} WHERE ${userKey} = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            console.log(`${userType} not found for ${userKey}:`, id);
            return res.status(404).json({ error: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found` });
        }

        // Send the user data to frontend
        res.json({
            username: result[0].username,
            email: result[0].email,
            created_at: result[0].created_at, // Send the created_at field
            userType, // Include userType in the response
        });
    });
});

router.get('/professor/quizzes', authenticateJWT, (req, res) => {
  const { id, userType } = req.user; // Extract from JWT payload
  
  // Ensure the user is a professor
  if (userType !== 'professor') {
    return res.status(403).json({ error: 'You are not authorized to view quizzes.' });
  }

  console.log('Fetching quizzes for professor id:', id);
  
  // Query to fetch quizzes for the professor, with category name
  const query = `
    SELECT q.quiz_id, q.title, c.category_name
    FROM Quiz q
    JOIN Category c ON q.category_id = c.category_id
    WHERE q.professor_id = ?;
  `;
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error fetching quizzes:", err);
      return res.status(500).json({ error: "Error fetching quizzes" });
    }

    // If no quizzes found, send an empty array
    if (result.length === 0) {
      return res.json([]);
    }

    // Return the quizzes along with their categories
    res.json(result);
  });
});

router.get('/professor/questions/:quizId', authenticateJWT, (req, res) => {
  const { id, userType } = req.user;
  const { quizId } = req.params;

  if (userType !== 'professor') {
    return res.status(403).json({ error: 'You are not authorized to view questions.' });
  }

  const query = `
    SELECT q.question_id, q.question_content, q.is_multiple_choice, c.category_name
    FROM questions q
    JOIN quiz qu ON q.quiz_id = qu.quiz_id
    JOIN category c ON qu.category_id = c.category_id
    WHERE qu.professor_id = ? AND q.quiz_id = ?
  `;

  db.query(query, [id, quizId], (err, result) => {
    if (err) {
      console.error("Error fetching questions:", err);
      return res.status(500).json({ error: "Error fetching questions" });
    }

    res.json(result);
  });
});


router.get('/settings/:quizId', authenticateJWT, (req, res) => {
  const { quizId } = req.params;

  // Fetch the settings for the specific quizId
  const query = `
    SELECT time_limit, deduction_percentage, retake_allowed, is_active 
    FROM QuizSettings 
    WHERE quiz_id = ?
  `;

  db.query(query, [quizId], (err, rows) => {
    if (err) {
      console.error('Error fetching quiz settings:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Settings not found for this quiz.' });
    }

    res.json(rows[0]); // Respond with the first row (there should be only one)
  });
});


//Method to update DB content
router.put('/update-quiz-settings/:quizId', authenticateJWT, (req, res) => {
  const { quizId } = req.params;
  const { time_limit, deduction_percentage, retake_allowed, is_active, title } = req.body;

  // First, update the settings in QuizSettings table
  const query = `
    UPDATE QuizSettings 
    SET time_limit = ?, 
        deduction_percentage = ?, 
        retake_allowed = ?, 
        is_active = ?
    WHERE quiz_id = ?
  `;

  db.query(query, [time_limit, deduction_percentage, retake_allowed, is_active, quizId], (err, result) => {
    if (err) {
      console.error('Error updating quiz settings:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Quiz settings not found for this quiz.' });
    }

    // If title is being updated, update it in the Quiz table
    if (title) {
      const titleUpdateQuery = `
        UPDATE Quiz 
        SET title = ? 
        WHERE quiz_id = ?
      `;
      
      db.query(titleUpdateQuery, [title, quizId], (err, result) => {
        if (err) {
          console.error('Error updating quiz title:', err);
          return res.status(500).json({ message: 'Internal server error.' });
        }
        
        res.json({ message: 'Quiz settings and title updated successfully!' });
      });
    } else {
      // If no title update is required, just respond with the settings update success
      res.json({ message: 'Quiz settings updated successfully!' });
    }
  });
});

  //Delete Quiz from DB
  router.delete("/delete-quiz/:quizId", authenticateJWT, (req, res) => {
    const { quizId } = req.params;
  
    if (!quizId) {
      console.error("No quizId provided.");
      return res.status(400).json({ message: "Quiz ID is required." });
    }
  
    console.log(`Starting to delete quiz with quizId: ${quizId}`);
  
    // Step 1: Delete student responses that reference quiz attempts
    db.query("DELETE FROM studentresponses WHERE attempt_id IN (SELECT attempt_id FROM quizattempt WHERE quiz_id = ?)", [quizId], (err, result) => {
      if (err) {
        console.error(`Error deleting student responses: ${err.message}`);
        return res.status(500).json({ message: "Error deleting student responses.", error: err.message });
      }
      console.log(`Student responses deleted for quizId: ${quizId}`);
  
      // Step 2: Delete quiz attempts
      db.query("DELETE FROM quizattempt WHERE quiz_id = ?", [quizId], (err, result) => {
        if (err) {
          console.error(`Error deleting quiz attempts: ${err.message}`);
          return res.status(500).json({ message: "Error deleting quiz attempts.", error: err.message });
        }
        console.log(`Quiz attempts deleted for quizId: ${quizId}`);
  
        // Step 3: Delete answers
        db.query("DELETE FROM Answers WHERE question_id IN (SELECT question_id FROM Questions WHERE quiz_id = ?)", [quizId], (err, result) => {
          if (err) {
            console.error(`Error deleting answers: ${err.message}`);
            return res.status(500).json({ message: "Error deleting answers.", error: err.message });
          }
          console.log(`Answers deleted for quizId: ${quizId}`);
  
          // Step 4: Delete quiz settings
          db.query("DELETE FROM QuizSettings WHERE quiz_id = ?", [quizId], (err, result) => {
            if (err) {
              console.error(`Error deleting QuizSettings: ${err.message}`);
              return res.status(500).json({ message: "Error deleting QuizSettings.", error: err.message });
            }
            console.log(`QuizSettings deleted for quizId: ${quizId}`);
  
            // Step 5: Delete questions
            db.query("DELETE FROM Questions WHERE quiz_id = ?", [quizId], (err, result) => {
              if (err) {
                console.error(`Error deleting questions: ${err.message}`);
                return res.status(500).json({ message: "Error deleting questions.", error: err.message });
              }
              console.log(`Questions deleted for quizId: ${quizId}`);
  
              // Step 6: Finally, delete the quiz itself
              db.query("DELETE FROM Quiz WHERE quiz_id = ?", [quizId], (err, result) => {
                if (err) {
                  console.error(`Error deleting quiz: ${err.message}`);
                  return res.status(500).json({ message: "Error deleting quiz.", error: err.message });
                }
  
                // If no rows were affected, quiz wasn't found
                if (result.affectedRows === 0) {
                  console.log(`No quiz found with quizId: ${quizId}`);
                  return res.status(404).json({ message: "Quiz not found." });
                }
  
                console.log(`Quiz with quizId ${quizId} deleted successfully.`);
  
                // Final success response
                return res.status(200).json({
                  message: "Quiz and its related student responses, answers, questions, and settings deleted successfully."
                });

              });
            });
          });
        });
      });
    });
  });
  
  
  
  
  
  
  
  
  



module.exports = router;
