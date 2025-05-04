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

router.get('/pie-chart/grade-distribution', authenticateJWT, async (req, res) => {
  console.log("🚀 /grade-distribution route hit!");

  // Get student ID from JWT
  const studentId = req.user.id;  
  console.log("Student ID:", studentId);  // Log the student ID to verify

  // SQL query to fetch quiz attempts and calculate grade distribution
  const query = `
SELECT
    qa.attempt_id,               -- Unique ID per attempt
    qa.quiz_id,
    q.title,
    qa.score AS attempt_score,
    max_scores.max_score,
    ROUND((qa.score / max_scores.max_score) * 100, 2) AS grade_percentage
FROM
    QuizAttempt qa
JOIN
    Quiz q ON qa.quiz_id = q.quiz_id
JOIN (
    SELECT
        qz.quiz_id,
        qs.no_questions * COALESCE(MAX(qst.points_per_question), 1) AS max_score
    FROM
        Quiz qz
    JOIN
        QuizSettings qs ON qz.quiz_id = qs.quiz_id
    LEFT JOIN
        Questions qst ON qz.quiz_id = qst.quiz_id
    GROUP BY
        qz.quiz_id, qs.no_questions
) AS max_scores ON qa.quiz_id = max_scores.quiz_id
WHERE
    qa.student_id = ?  -- Replace with the student ID
    AND qa.start_time = (
        SELECT MAX(start_time)
        FROM QuizAttempt
        WHERE quiz_id = qa.quiz_id
        AND student_id = qa.student_id
    )
ORDER BY
    q.title;  -- Optional: you can order by quiz title or any other column

  `;

  try {
    const results = await queryAsync(query, [studentId]);

    if (results.length > 0) {
      const pieChartData = results.map((quiz) => ({
        name: quiz.title,
        value: quiz.grade_percentage
      }));
      res.status(200).json(pieChartData);
    } else {
      res.status(404).json({ message: "No grade distribution data available" });
    }
  } catch (err) {
    console.error("❌ Error fetching grade distribution:", err);
    res.status(500).json({ message: "Error fetching grade distribution data" });
  }
});

router.get('/quizzes-in-range', (req, res) => {
  
  const { gradeRange } = req.query;  // Get grade range from query parameters

  if (!gradeRange) {
    return res.status(400).json({ message: 'Grade range is required.' });
  }

  // Define grade ranges (you can modify this based on your grading system)
  const gradeRanges = {
    A: { min: 90, max: 100 },
    B: { min: 80, max: 89 },
    C: { min: 70, max: 79 },
    D: { min: 60, max: 69 },
    F: { min: 0, max: 59 }
  };

  // Check if the gradeRange is valid
  const range = gradeRanges[gradeRange];
  if (!range) {
    return res.status(400).json({ message: 'Invalid grade range.' });
  }

  const { min, max } = range;

  // SQL query to get quizzes within the grade range and include the quiz title and category name
  const query = `
    SELECT 
      q.quiz_id, 
      q.title AS quiz_title, 
      c.category_name
    FROM 
      Quiz q
    JOIN 
      Categories c ON q.category_id = c.category_id
    WHERE 
      q.grade BETWEEN ? AND ?;
  `;

  // Execute the query with grade range as parameters
  db.query(query, [min, max], (err, results) => {
    if (err) {
      console.error('Error fetching quizzes in grade range:', err);
      return res.status(500).json({ message: 'Error fetching quizzes' });
    }

    // If results are found, send them as a JSON response
    if (results.length > 0) {
      // Send quiz titles along with category names
      res.json(results);
    } else {
      res.status(404).json({ message: 'No quizzes found in this grade range' });
    }
  });
});

router.get('/quizzes-taken-by-user/:quizId', authenticateJWT, (req, res) => {
  const studentId = req.user.id;  // Extract userId from the token

  console.log('User IDxxx:', studentId);  // Debugging log

  if (!studentId) {
    return res.status(400).json({ error: 'User ID is missing or invalid' });
  }

  const query = `
    SELECT 
      q.quiz_id, 
      q.title, 
      a.start_time, 
      a.score
    FROM QuizAttempt a
    JOIN Quiz q ON a.quiz_id = q.quiz_id
    WHERE a.student_id = ?
      AND a.quiz_id = ?
    ORDER BY a.start_time DESC
    LIMIT 5;
  `;

  // Using db.query with parameterized values properly
  db.query(query, [studentId, req.params.quizId], (err, results) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Fetched quizzes with scores:', results);  // Log query results
    res.json(results);  // Return quizzes taken by the authenticated user along with their scores
  });
});


// Assuming you have a route handler for '/api/stats/unique-quizzes'
router.get('/unique-quizzes', authenticateJWT, (req, res) => {
  const studentId = req.user.id; // Extract userId from the token

  if (!studentId) {
    return res.status(400).json({ error: 'User ID is missing or invalid' });
  }

  // Query to fetch unique quiz titles taken by the user
  const query = `
    SELECT DISTINCT q.quiz_id, q.title
    FROM QuizAttempt a
    JOIN Quiz q ON a.quiz_id = q.quiz_id
    WHERE a.student_id = ?
    ORDER BY q.title;
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results); // Return unique quiz titles and quiz_ids
  });
});



module.exports = router;
