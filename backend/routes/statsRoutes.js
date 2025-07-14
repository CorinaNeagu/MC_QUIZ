const express = require('express');
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const db = require("../db");

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

// quiz attempts per category for logged-in student
router.get('/pie-chart/quiz-category', authenticateJWT, async (req, res) => {
  const studentId = req.user.id;  
  console.log("Student ID:", studentId);  

  const query = `
    SELECT 
  c.category_name, 
  c.category_id, 
  COUNT(DISTINCT q.quiz_id) AS quizzes_taken
FROM QuizAttempt qa
JOIN Quiz q ON qa.quiz_id = q.quiz_id
JOIN Category c ON q.category_id = c.category_id
WHERE qa.student_id = ?
GROUP BY c.category_name, c.category_id
  `;
  try {
    const results = await queryAsync(query, [studentId]);


    res.status(200).json(results);
  } catch (err) {
    console.error(" Error fetching quiz stats:", err);
    res.status(500).json({ message: "Error fetching quiz category statistics" });
  }
});

router.get('/quizzes-by-category/:categoryId', authenticateJWT, async (req, res) => {
  const { categoryId } = req.params;
  const studentId      = req.user.id;

  const sql = `
    SELECT DISTINCT
      q.quiz_id,
      q.title AS quiz_title,
      c.category_name,
      c.category_id
    FROM QuizAttempt qa
    JOIN Quiz        q ON qa.quiz_id    = q.quiz_id
    JOIN Category    c ON q.category_id = c.category_id
    WHERE qa.student_id  = ?   -- same filter as the pie
      AND c.category_id  = ?
  `;

  try {
    const rows = await queryAsync(sql, [studentId, categoryId]);
    if (!rows.length) {
      return res.status(404).json({ message: 'No attempted quizzes in this category' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quizzes for category:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/student-category-quizzes/:categoryId', authenticateJWT, (req, res) => {
  const { categoryId } = req.params;
  const studentId = req.user.id; 

  const query = `
    SELECT 
      c.category_name, 
      sc.subcategory_name,
      sc.subcategory_id,
      q.title, 
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

  db.query(query, [studentId, categoryId], (err, results) => {
    if (err) {
      console.error('Error fetching student quizzes:', err);
      return res.status(500).json({ message: 'Error fetching quizzes' });
    }

    const transformedResults = results.map(result => ({
      category_name: result.category_name,
      quiz_title: result.title,
      real_score: result.real_score,
      subcategory_id: result.subcategory_id,
      subcategory_name: result.subcategory_name
    }));

    console.log('Transformed Results:', transformedResults);

    res.status(200).json(transformedResults);
  });
});

router.get('/quizzes-taken-by-user/:quizId', authenticateJWT, (req, res) => {
  const studentId = req.user.id; 

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
  db.query(query, [studentId, req.params.quizId], (err, results) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Fetched quizzes with scores:', results);  
    res.json(results);  
  });
});

router.get('/unique-quizzes', authenticateJWT, (req, res) => {
  const studentId = req.user.id;
  if (!studentId) {
    return res.status(400).json({ error: 'User ID is missing or invalid' });
  }

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

    res.json(results); 
  });
});

router.get('/professor-grade-distribution', authenticateJWT, (req, res) => {
  const professorId = req.user.id;
  const userType = req.user.userType;
  console.log('Professor ID:', professorId);
  console.log('User Type:', userType);

  if (userType !== 'professor') {
    return res.status(403).json({ error: 'Access denied' });
  }

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

  db.query(query, [professorId], (err, result) => {
    if (err) {
      console.error('Error fetching professor grade distribution:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const rows = result.map(row => ({
      name: row.name,
      value: row.value
    }));

    res.json(rows);
  });
});

//Comparative performance
router.get('/professor/quiz-scores/:quizId', authenticateJWT, async (req, res) => {
  const professorId = req.user.id;
  const userType = req.user.userType;
  const { quizId } = req.params;

  if (userType !== 'professor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const query = `
   SELECT 
  s.username AS student_name,
  ROUND((qa.score / (qs.no_questions * qp.points_per_question)) * 100, 2) AS score_percentage
FROM Quiz q
JOIN QuizAttempt qa ON q.quiz_id = qa.quiz_id
JOIN Student s ON qa.student_id = s.student_id
JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
JOIN (
  SELECT quiz_id, MAX(points_per_question) AS points_per_question
  FROM Questions
  GROUP BY quiz_id
) qp ON q.quiz_id = qp.quiz_id
WHERE q.quiz_id = ?
  AND q.professor_id = ?
  AND qa.attempt_id = (
    SELECT MAX(attempt_id)
    FROM QuizAttempt
    WHERE quiz_id = q.quiz_id AND student_id = qa.student_id
  )
ORDER BY score_percentage DESC;

  `;

  try {
    const results = await queryAsync(query, [quizId, professorId]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching student scores for quiz:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/group-leaderboard/:groupId', authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  const { quizId } = req.query; 

  let query;
  let queryParams;

  if (quizId) {
    query = `
      SELECT 
        s.student_id,
        s.username,
        ROUND(AVG(
          CASE 
            WHEN qs.no_questions IS NOT NULL AND qp.points_per_question IS NOT NULL 
            THEN (qa.score / (qs.no_questions * qp.points_per_question)) * 100
            ELSE NULL
          END
        ), 2) AS average_score
      FROM groupMembers gm
      JOIN Student s ON gm.student_id = s.student_id
      LEFT JOIN QuizAttempt qa ON s.student_id = qa.student_id AND qa.quiz_id = ?
      LEFT JOIN Quiz q ON qa.quiz_id = q.quiz_id
      LEFT JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
      LEFT JOIN (
        SELECT quiz_id, MAX(points_per_question) AS points_per_question
        FROM Questions
        GROUP BY quiz_id
      ) qp ON q.quiz_id = qp.quiz_id
      WHERE gm.group_id = ?
        AND (qa.attempt_id IS NULL OR qa.attempt_id = (
          SELECT MAX(sub.attempt_id)
          FROM QuizAttempt sub
          WHERE sub.quiz_id = qa.quiz_id AND sub.student_id = qa.student_id
        ))
      GROUP BY s.student_id, s.username
      ORDER BY average_score DESC;
    `;
    queryParams = [quizId, groupId];
  } else {
    query = `
      SELECT 
        s.student_id,
        s.username,
        ROUND(AVG(
          CASE 
            WHEN qs.no_questions IS NOT NULL AND qp.points_per_question IS NOT NULL 
            THEN (qa.score / (qs.no_questions * qp.points_per_question)) * 100
            ELSE NULL
          END
        ), 2) AS average_score
      FROM groupMembers gm
      JOIN Student s ON gm.student_id = s.student_id
      LEFT JOIN QuizAttempt qa ON s.student_id = qa.student_id
      LEFT JOIN Quiz q ON qa.quiz_id = q.quiz_id
      LEFT JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
      LEFT JOIN (
        SELECT quiz_id, MAX(points_per_question) AS points_per_question
        FROM Questions
        GROUP BY quiz_id
      ) qp ON q.quiz_id = qp.quiz_id
      WHERE gm.group_id = ?
        AND (qa.attempt_id IS NULL OR qa.attempt_id = (
          SELECT MAX(sub.attempt_id)
          FROM QuizAttempt sub
          WHERE sub.quiz_id = qa.quiz_id AND sub.student_id = qa.student_id
        ))
      GROUP BY s.student_id, s.username
      ORDER BY average_score DESC;
    `;
    queryParams = [groupId];
  }


  try {
    const results = await queryAsync(query, queryParams);
    console.log('Leaderboard results count:', results.length);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching group leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/retake-scores-history/:studentId', authenticateJWT, async (req, res) => {
  const { studentId } = req.params;

  if (req.user.id !== parseInt(studentId) && req.user.userType !== 'professor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `
    SELECT 
      q.quiz_id,
      q.title,
      qa.attempt_id,
      qa.score,
      qa.start_time,
      qs.no_questions,
      qp.points_per_question
    FROM Quiz q
    JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
    JOIN QuizAttempt qa ON qa.quiz_id = q.quiz_id
    JOIN (
      SELECT quiz_id, MAX(points_per_question) AS points_per_question
      FROM Questions
      GROUP BY quiz_id
    ) qp ON q.quiz_id = qp.quiz_id
    WHERE qa.student_id = ?
      AND qs.retake_allowed = 1
    ORDER BY q.quiz_id, qa.start_time;
  `;

  try {
    const results = await queryAsync(query, [studentId]);

    if (!results.length) {
      return res.status(200).json([]);
    }


    const quizHistory = {};

    for (const row of results) {
      const percentageScore = Math.round((row.score / (row.no_questions * row.points_per_question)) * 100);

      if (!quizHistory[row.quiz_id]) {
        quizHistory[row.quiz_id] = {
          quiz_id: row.quiz_id,
          title: row.title,
          scores: []
        };
      }

      quizHistory[row.quiz_id].scores.push({
        attempt_id: row.attempt_id,
        start_time: row.start_time,
        percentage_score: percentageScore
      });
    }

    const formatted = Object.values(quizHistory);

    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching retake scores history:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/quiz-averages', authenticateJWT, async (req, res) => {
  const professorId    = req.user.id;
  const userType       = req.user.userType;
  const subcategoryId  = req.query.subcategory_id;

  if (userType !== 'professor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!subcategoryId) {
    return res.status(400).json({ error: 'subcategory_id query param required' });
  }

  const sql = `
    SELECT
      q.title               AS quiz_title,
      ROUND(
        AVG((qa.score / (qs.no_questions * qp.points_per_question)) * 100),
        2
      ) AS avg_percentage
    FROM Quiz q
    JOIN QuizAttempt qa   ON qa.quiz_id = q.quiz_id
    JOIN QuizSettings qs  ON qs.quiz_id = q.quiz_id
    JOIN (
      SELECT quiz_id, MAX(points_per_question) AS points_per_question
      FROM Questions
      GROUP BY quiz_id
    ) qp                  ON qp.quiz_id = q.quiz_id
    WHERE q.professor_id   = ?
      AND q.subcategory_id = ?
      AND qa.attempt_id = (
        SELECT MAX(sub.attempt_id)
        FROM QuizAttempt sub
        WHERE sub.quiz_id = qa.quiz_id
          AND sub.student_id = qa.student_id
      )
    GROUP BY q.title
    ORDER BY q.title;
  `;

  try {
    const rows = await queryAsync(sql, [professorId, subcategoryId]);
    res.json(rows.map(r => ({ quiz_title: r.quiz_title, avg_percentage: r.avg_percentage })));
  } catch (err) {
    console.error('Error fetching quiz averages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subcategory-averages', authenticateJWT, async (req, res) => {
  const { id: professorId, userType } = req.user;

  if (userType !== 'professor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const query = `
    SELECT
      sc.subcategory_name,
      ROUND(
        AVG((qa.score / (qs.no_questions * qp.points_per_question)) * 100),
        2
      ) AS avg_percentage
    FROM Quiz q
    JOIN Subcategory sc ON q.subcategory_id = sc.subcategory_id
    JOIN QuizAttempt qa ON qa.quiz_id = q.quiz_id
    JOIN QuizSettings qs ON qs.quiz_id = q.quiz_id
    JOIN (
      SELECT quiz_id, MAX(points_per_question) AS points_per_question
      FROM Questions
      GROUP BY quiz_id
    ) qp ON qp.quiz_id = q.quiz_id
    WHERE q.professor_id = ?
      AND qa.attempt_id = (
        SELECT MAX(sub.attempt_id)
        FROM QuizAttempt sub
        WHERE sub.quiz_id = qa.quiz_id
          AND sub.student_id = qa.student_id
      )
    GROUP BY sc.subcategory_name
    ORDER BY sc.subcategory_name;
  `;

  try {
    const rows = await queryAsync(query, [professorId]);

    const formatted = rows.map(({ subcategory_name, avg_percentage }) => ({
      subcategory_name,
      avg_percentage,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching subcategory averages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subcategories/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;

  const query = `
    SELECT *
    FROM Subcategory
    WHERE category_id = ?
  `;

  try {
    const results = await queryAsync(query, [categoryId]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No subcategories found for this category' });
    }
    res.json(results);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router;
