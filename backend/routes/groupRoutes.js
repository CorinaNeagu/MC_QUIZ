const express = require('express');
const router = express.Router();
const authenticateJWT = require("../middleware/authMiddleware");
const db = require("../db");

router.get('/professor-groups', authenticateJWT, (req, res) => {
  console.log("Authenticated user:", req.user);  // Log user object
  if (req.user.userType !== 'professor') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.query(
    'SELECT * FROM studyGroup WHERE professor_id = ?',
    [req.user.id],  // Use req.user.id instead of req.user.userId
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

router.post('/create-group', authenticateJWT, (req, res) => {
  const { group_name, group_code } = req.body;  // Extract the group name and code from request body
  const professor_id = req.user.id;  // Use the authenticated user's ID (professor)

  // Check if the user is a professor
  if (req.user.userType !== 'professor') {
    return res.status(403).json({ error: 'Only professors can create groups' });
  }

  // Check for duplicate group code
  db.query('SELECT * FROM studyGroup WHERE group_code = ?', [group_code], (err, results) => {
    if (err) {
      console.error("Error checking for duplicate group code:", err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // If a group with the same code already exists
      return res.status(400).json({ error: 'Group code already exists' });
    }

    // Insert the new group into the database
    db.query(
      'INSERT INTO studyGroup (group_name, professor_id, group_code) VALUES (?, ?, ?)', 
      [group_name, professor_id, group_code], 
      (err2, result2) => {
        if (err2) {
          console.error("Error creating group:", err2);
          return res.status(500).json({ error: 'Error inserting group into database' });
        }

        // Successfully created the group
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
    SELECT s.student_id, s.username, s.email 
    FROM groupMembers gm
    JOIN student s ON gm.student_id = s.student_id
    WHERE gm.group_id = ?
  `;

  db.query(query, [groupId], (err, results) => {
    if (err) {
      console.error('Error fetching group members:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

router.get('/student-groups', authenticateJWT, (req, res) => {
  const studentId = req.user.id; // Get student ID from JWT
  db.query(
    `SELECT g.group_id, g.group_name, g.group_code 
    FROM studyGroup g 
    JOIN groupMembers gm ON g.group_id = gm.group_id 
    WHERE gm.student_id = ?`, 
    [studentId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    res.json(results); // Return the list of groups the student is a part of
  });
});




module.exports = router;
