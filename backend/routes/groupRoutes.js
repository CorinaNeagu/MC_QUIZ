const express = require('express');
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const db = require("../db");

router.get('/professor-groups', authenticateJWT, (req, res) => {
   if (req.user.userType !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Professors only' });
  }
  console.log("Authenticated user:", req.user);  // Log user object
  if (req.user.userType !== 'professor') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.query(
    'SELECT * FROM studyGroup WHERE professor_id = ?',
    [req.user.id], 
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

router.post('/create-group', authenticateJWT, (req, res) => {
  const { group_name, group_code } = req.body; 
  const professor_id = req.user.id;  

  if (req.user.userType !== 'professor') {
    return res.status(403).json({ error: 'Only professors can create groups' });
  }

  db.query('SELECT * FROM studyGroup WHERE group_code = ?', [group_code], (err, results) => {
    if (err) {
      console.error("Error checking for duplicate group code:", err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Group code already exists' });
    }

    db.query(
      'INSERT INTO studyGroup (group_name, professor_id, group_code) VALUES (?, ?, ?)', 
      [group_name, professor_id, group_code], 
      (err2, result2) => {
        if (err2) {
          console.error("Error creating group:", err2);
          return res.status(500).json({ error: 'Error inserting group into database' });
        }

        res.status(201).json({ message: 'Group created successfully' });
      }
    );
  });
});

router.post('/join-group', authenticateJWT, (req, res) => {
  const { group_code } = req.body;
  const studentId = req.user.id;

  if (req.user.userType !== 'student') {
    return res.status(403).json({ error: 'Only students can join groups.' });
  }

  db.query('SELECT group_id FROM studyGroup WHERE group_code = ?', [group_code], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error while finding group' });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const groupId = results[0].group_id;

    // Check if the student is already a member
    db.query(
      'SELECT * FROM groupMembers WHERE group_id = ? AND student_id = ?',
      [groupId, studentId],
      (checkErr, checkResults) => {
        if (checkErr) return res.status(500).json({ error: 'Error checking membership' });

        if (checkResults.length > 0) {
          return res.status(400).json({ error: 'You have already joined this group.' });
        }

        // Insert if not already a member
        db.query(
          'INSERT INTO groupMembers (group_id, student_id) VALUES (?, ?)',
          [groupId, studentId],
          (insertErr) => {
            if (insertErr) {
              return res.status(500).json({ error: 'Failed to join group' });
            }

            res.json({ message: 'Joined group successfully' });
          }
        );
      }
    );
  });
});

router.get('/group-members/:groupId', authenticateJWT, (req, res) => {
  if (req.user.userType !== 'professor') {
    return res.status(403).json({ error: 'Only professors can view group members.' });
  }

  const groupId = req.params.groupId;

  const query = `
    SELECT s.student_id, s.username, s.email, s.profile_picture
    FROM groupMembers gm
    JOIN student s ON gm.student_id = s.student_id
    WHERE gm.group_id = ?
  `;

  db.query(query, [groupId], (err, results) => {
    if (err) {
  console.error('Error fetching group members:', err.sqlMessage);
  return res.status(500).json({ error: 'Database error' });
}
console.log('Fetched group members:', results);
    res.json(results);
  });
});

router.get('/student-groups', authenticateJWT, (req, res) => {
  const studentId = req.user.id;

  db.query(
    `SELECT 
      g.group_id, 
      g.group_name, 
      g.group_code,
      p.username AS professor_username
      FROM studyGroup g
      JOIN groupMembers gm ON g.group_id = gm.group_id
      LEFT JOIN Professor p ON g.professor_id = p.professor_id
      WHERE gm.student_id = ?
    `, 
    [studentId], 
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});


router.post('/assign-quiz', (req, res) => {
  const { quiz_id, group_id, deadline } = req.body;

  if (!quiz_id || !group_id || !deadline) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const checkQuery = `SELECT * FROM groupQuiz WHERE quiz_id = ? AND group_id = ?`;
  db.query(checkQuery, [quiz_id, group_id], (err, results) => {
    if (err) {
      console.error('Error checking existing assignment:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'This quiz has already been assigned to this group.' });
    }

    const insertQuery = `INSERT INTO groupQuiz (quiz_id, group_id, deadline) VALUES (?, ?, ?)`;
    db.query(insertQuery, [quiz_id, group_id, deadline], (err, result) => {
      if (err) {
        console.error('Error assigning quiz:', err);
        return res.status(500).json({ message: 'Error assigning quiz' });
      }

      return res.status(200).json({ message: 'Quiz assigned successfully' });
    });
  });
});

router.get('/student-assigned-quizzes/:groupId', authenticateJWT, (req, res) => {
  const studentId = req.user.id;
  const groupId = req.params.groupId;

  const query = `
    SELECT 
      q.quiz_id, 
      q.title, 
      c.category_name AS category_name,  
      s.subcategory_name AS subcategory_name,  
      gq.deadline 
    FROM groupQuiz AS gq
    JOIN quiz AS q ON gq.quiz_id = q.quiz_id
    JOIN studyGroup AS g ON g.group_id = gq.group_id
    JOIN groupMembers AS gm ON gm.group_id = g.group_id
    LEFT JOIN category AS c ON q.category_id = c.category_id
    LEFT JOIN subcategory AS s ON q.subcategory_id = s.subcategory_id
    WHERE gm.student_id = ? AND g.group_id = ?
  `;

  db.query(query, [studentId, groupId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Error fetching assigned quizzes', error: err.message });
    }

    console.log(results); 
    res.json(results); 
  });
});


router.delete('/delete-group/:groupId', authenticateJWT, (req, res) => {
  if (req.user.userType !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Professors only' });
  }

  const groupId = req.params.groupId;
  const professorId = req.user.id;

  // First check if the group exists and belongs to this professor
  db.query(
    'SELECT * FROM studyGroup WHERE group_id = ? AND professor_id = ?',
    [groupId, professorId],
    (err, results) => {
      if (err) {
        console.error('Error querying group:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Group not found or not owned by professor' });
      }

      // Delete group members first
      db.query('DELETE FROM groupMembers WHERE group_id = ?', [groupId], (err2) => {
        if (err2) {
          console.error('Error deleting group members:', err2);
          return res.status(500).json({ message: 'Error deleting group members' });
        }

        // Delete group quizzes next
        db.query('DELETE FROM groupquiz WHERE group_id = ?', [groupId], (err3) => {
          if (err3) {
            console.error('Error deleting group quizzes:', err3);
            return res.status(500).json({ message: 'Error deleting group quizzes' });
          }

          // Now delete the group itself
          db.query('DELETE FROM studyGroup WHERE group_id = ?', [groupId], (err4) => {
            if (err4) {
              console.error('Error deleting group:', err4);
              return res.status(500).json({ message: 'Error deleting group' });
            }

            res.json({ message: 'Group deleted successfully' });
          });
        });
      });
    }
  );
});

router.get('/professors-with-groups', authenticateJWT, (req, res) => {
  const query = `
  SELECT 
    p.professor_id, 
    p.username AS professor_name, 
    sg.group_id, 
    sg.group_name
  FROM Professor p
  LEFT JOIN studyGroup sg ON sg.professor_id = p.professor_id
  ORDER BY p.professor_id, sg.group_name;
`;


  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching professors and groups:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    const aggregated = results.reduce((acc, row) => {
      const existing = acc.find(p => p.professor_id === row.professor_id);
      if (existing) {
        if (row.group_id) {
          existing.groups.push({ group_id: row.group_id, group_name: row.group_name });
        }
      } else {
        acc.push({
          professor_id: row.professor_id,
          professor_name: row.professor_name,
          groups: row.group_id ? [{ group_id: row.group_id, group_name: row.group_name }] : []
        });
      }
      return acc;
    }, []);

    res.json({ professors: aggregated });
  });
});



module.exports = router;
