const express = require('express');
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const db = require("../db");


router.get('/student-assigned-quizzes/:groupId', authenticateJWT, (req, res) => {
  const studentId = req.user.id;  
  const groupId = req.params.groupId;

  const sql = `
    SELECT 
      q.quiz_id, 
      q.title, 
      c.category_name, 
      s.subcategory_name, 
      gq.deadline
    FROM groupQuiz AS gq
    JOIN quiz AS q ON gq.quiz_id = q.quiz_id
    JOIN category AS c ON q.category_id = c.category_id
    LEFT JOIN subcategory AS s ON q.subcategory_id = s.subcategory_id
    JOIN groupMembers AS gm ON gm.group_id = gq.group_id AND gm.student_id = ?
    WHERE gq.group_id = ?
  `;

  db.query(sql, [studentId, groupId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned quizzes:', err);
      return res.status(500).json({ message: 'Error fetching assigned quizzes' });
    }

    if (!results.length) {
      return res.status(404).json({ message: 'No quizzes found for this group/student' });
    }

    res.json(results);
  });
});

// Get latest quiz attempts by students in a group for a specific quiz
router.get('/quiz-attempts/:groupId/:quizId', authenticateJWT, (req, res) => {
  const { groupId, quizId } = req.params;

  const sql = `
    SELECT 
      st.student_id,
      st.username,
      ROUND((qa.score / total_score.total_points) * 100, 2) AS score,
      qa.end_time AS attempted_at
    FROM QuizAttempt qa
    JOIN Student st ON qa.student_id = st.student_id
    JOIN groupMembers gm ON gm.student_id = st.student_id AND gm.group_id = ?
    JOIN (
      SELECT quiz_id, SUM(points_per_question) AS total_points
      FROM Questions
      WHERE quiz_id = ?
      GROUP BY quiz_id
    ) AS total_score ON total_score.quiz_id = qa.quiz_id
    WHERE qa.quiz_id = ?
      AND gm.group_id = ?
      AND qa.end_time = (
        SELECT MAX(end_time) 
        FROM QuizAttempt 
        WHERE student_id = st.student_id AND quiz_id = ?
      )
    ORDER BY qa.end_time DESC
  `;

  db.query(sql, [groupId, quizId, quizId, groupId, quizId], (err, results) => {
    if (err) {
      console.error('Error fetching quiz attempts:', err);
      return res.status(500).json({ message: 'Error fetching quiz attempts' });
    }

    res.json(results);
  });
});



module.exports = router;
