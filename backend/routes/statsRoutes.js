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

router.get('/student-category-quizzes/:categoryId', authenticateJWT, (req, res) => {
  const { categoryId } = req.params;
  const studentId = req.user.id; // Get student_id from JWT
  console.log('Student ID:', studentId);  // Log student ID for debugging
  console.log('Category ID:', categoryId); // Log category ID for debugging

  const query = `
    SELECT 
      c.category_name, 
      sc.subcategory_name,
      sc.subcategory_id,
      q.title, 
      -- Calculate the score out of 100
      ROUND(
        (qa.score / (qs.no_questions * qp.points_per_question)) * 100, 
        2
      ) AS real_score
    FROM Quiz q
    JOIN QuizAttempt qa ON q.quiz_id = qa.quiz_id
    JOIN Category c ON q.category_id = c.category_id
    JOIN Subcategory sc ON q.subcategory_id = sc.subcategory_id
    JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
    JOIN (
      SELECT quiz_id, MAX(points_per_question) AS points_per_question
      FROM Questions
      GROUP BY quiz_id
    ) qp ON q.quiz_id = qp.quiz_id
    WHERE qa.student_id = ? 
      AND q.category_id = ?
      AND qa.attempt_id = (
        SELECT MAX(attempt_id)
        FROM QuizAttempt
        WHERE quiz_id = q.quiz_id AND student_id = qa.student_id
      );
  `;

  // Log the query being executed with parameters for debugging
  console.log('Executing query:', query);
  console.log('Parameters:', [studentId, categoryId]);

  db.query(query, [studentId, categoryId], (err, results) => {
    if (err) {
      console.error('Error fetching student quizzes:', err);
      return res.status(500).json({ message: 'Error fetching quizzes' });
    }

    // Log the raw query results
    console.log('Query Results:', results);

    // Transform the results if necessary and log the transformed data
    const transformedResults = results.map(result => ({
      category_name: result.category_name,
      quiz_title: result.title,
      real_score: result.real_score,
      subcategory_id: result.subcategory_id,
      subcategory_name: result.subcategory_name
    }));

    console.log('Transformed Results:', transformedResults);

    // Send the transformed results as the response
    res.status(200).json(transformedResults);
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

router.get('/professor-grade-distribution', authenticateJWT, (req, res) => {
  const professorId = req.user.id;
  const userType = req.user.userType;
  console.log('Professor ID:', professorId);
  console.log('User Type:', userType);

  // Only allow professors to access their grade distribution data
  if (userType !== 'professor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Query to get grade distribution (average scores per quiz)
  const query = `
      SELECT
        q.title AS name,
        s.subcategory_name,
        ROUND(AVG((qa.score / (qs.no_questions * qp.points_per_question)) * 100), 2) AS value
      FROM Quiz q
      JOIN Subcategory s ON q.subcategory_id = s.subcategory_id
      JOIN QuizAttempt qa ON q.quiz_id = qa.quiz_id
      JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
      JOIN (
        SELECT quiz_id, MAX(points_per_question) AS points_per_question
        FROM Questions
        GROUP BY quiz_id
      ) qp ON q.quiz_id = qp.quiz_id
      WHERE q.professor_id = ?
      GROUP BY q.title, s.subcategory_name
      ORDER BY q.title;

  `;

  console.log('Executing query:', query);
  console.log('Professor ID for query:', professorId);

  // Execute the query
  db.query(query, [professorId], (err, result) => {
    if (err) {
      console.error('Error fetching professor grade distribution:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Query result:', result);

    // Transform the result to match the front-end format
    const rows = result.map(row => ({
      name: row.name,
      value: row.value
    }));

    console.log('Transformed rows:', rows);

    // Send the data as a JSON response
    res.json(rows);
  });
});



module.exports = router;
