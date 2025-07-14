const express = require("express");
const db = require("../db");
const authenticateJWT = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const { id, userType } = req.user || {};
    const prefix = userType === 'student' ? 'stud' : 'prof';
    cb(null, `${prefix}_${id}${ext}`);
  },
});


const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter(req, file, cb) {
    const ALLOWED = ['image/jpeg', 'image/png'];
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG image files are allowed!'));
    }
    cb(null, true);
  },
});


router.post(
  '/upload-profile-pic',
  authenticateJWT,
  upload.single('profilePic'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { id, userType } = req.user;
    const table = userType === 'student' ? 'Student' : 'Professor';
    const userKey = userType === 'student' ? 'student_id' : 'professor_id';
    const profilePicPath = `/uploads/${req.file.filename}`; 

    const sel = `SELECT profile_picture FROM ${table} WHERE ${userKey} = ?`;
    db.query(sel, [id], (selErr, [row] = []) => {
      if (selErr) return res.status(500).json({ error: 'Database error.' });
      if (!row)   return res.status(404).json({ error: 'User not found.' });

      const upd = `UPDATE ${table} SET profile_picture = ? WHERE ${userKey} = ?`;
      db.query(upd, [profilePicPath, id], (updErr) => {
        if (updErr) return res.status(500).json({ error: 'Update failed.' });

        if (row.profile_picture) {
          const oldPath = path.join(
            __dirname,
            '..',
            row.profile_picture.replace(/^\/+/g, '')
          );
          fs.rm(oldPath, { force: true }, (rmErr) => {
            if (rmErr) console.warn('Could not delete old pic:', rmErr.message);
          });
        }

        console.log('File saved as:', req.file.path); // absolute file path on disk
console.log('Profile pic URL:', profilePicPath); // relative URL served by static middleware


        return res.json({
          message: 'Profile picture uploaded successfully.',
          profilePicPath,
        });
      });
    });
  }
);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer:', err.message);
    return res.status(400).json({ error: err.message });
  }
  console.error('Unexpected error:', err.stack || err);
  res.status(500).json({ error: 'Server error.' });
});


// User Profile route
router.get('/profile', authenticateJWT, (req, res) => {
    const { id, userType } = req.user;  


    const table = userType === "student" ? "Student" : "Professor";
    const userKey = userType === "student" ? "student_id" : "professor_id";

    const query = `SELECT username, email, created_at, profile_picture FROM ${table} WHERE ${userKey} = ?`;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            console.log(`${userType} not found for ${userKey}:`, id);
            return res.status(404).json({ error: `${userType.charAt(0).toUpperCase() + userType.slice(1)} not found` });
        }

        res.json({
            username: result[0].username,
            email: result[0].email,
            created_at: result[0].created_at, 
            userType, 
            profilePic: result[0].profile_picture || "",
        });
    });
});

router.get('/professor/quizzes', authenticateJWT, (req, res) => {
  const { id, userType } = req.user; 
  
  if (userType !== 'professor') {
    return res.status(403).json({ error: 'You are not authorized to view quizzes.' });
  }  
  const query = `
     SELECT 
    q.quiz_id, 
    q.title, 
    c.category_name, 
    s.subcategory_name, 
    qs.is_active, 
    qs.retake_allowed
    FROM Quiz q
    JOIN Category c ON q.category_id = c.category_id
    LEFT JOIN Subcategory s ON q.subcategory_id = s.subcategory_id
    JOIN QuizSettings qs ON q.quiz_id = qs.quiz_id
    WHERE q.professor_id = ?;
    `;
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error fetching quizzes:", err);
      return res.status(500).json({ error: "Error fetching quizzes" });
    }

    if (result.length === 0) {
      return res.json([]);
    }

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

    res.json(rows[0]); 
  });
});

router.put('/update-quiz-settings/:quizId', authenticateJWT, (req, res) => {
  const { quizId } = req.params;
  const { time_limit, deduction_percentage, retake_allowed, is_active, title } = req.body;

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
      res.json({ message: 'Quiz settings updated successfully!' });
    }
  });
});



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

              // Step 6: Delete from groupquiz referencing this quiz
              db.query("DELETE FROM groupquiz WHERE quiz_id = ?", [quizId], (err, result) => {
                if (err) {
                  console.error(`Error deleting from groupquiz: ${err.message}`);
                  return res.status(500).json({ message: "Error deleting from groupquiz.", error: err.message });
                }
                console.log(`Groupquiz entries deleted for quizId: ${quizId}`);

                // Step 7: Finally, delete the quiz itself
                db.query("DELETE FROM Quiz WHERE quiz_id = ?", [quizId], (err, result) => {
                  if (err) {
                    console.error(`Error deleting quiz: ${err.message}`);
                    return res.status(500).json({ message: "Error deleting quiz.", error: err.message });
                  }

                  if (result.affectedRows === 0) {
                    console.log(`No quiz found with quizId: ${quizId}`);
                    return res.status(404).json({ message: "Quiz not found." });
                  }

                  console.log(`Quiz with quizId ${quizId} deleted successfully.`);

                  return res.status(200).json({
                    message: "Quiz and its related data deleted successfully."
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  
  router.get('/deadlines', authenticateJWT, (req, res) => {
    const studentId = req.user.id;

   const query = `
      SELECT 
        gq.assignment_id, 
        q.quiz_id, 
        q.title, 
        gq.deadline,
        gq.group_id,
        sg.group_name,
        qs.retake_allowed AS allowRetake,
        EXISTS (
          SELECT 1 
          FROM QuizAttempt qa 
          WHERE qa.quiz_id = q.quiz_id AND qa.student_id = ?
        ) AS taken
      FROM groupQuiz gq
      JOIN quiz q ON q.quiz_id = gq.quiz_id
      JOIN groupMembers gm ON gm.group_id = gq.group_id
      JOIN studyGroup sg ON sg.group_id = gq.group_id
      LEFT JOIN QuizSettings qs ON qs.quiz_id = q.quiz_id
      WHERE gm.student_id = ? AND gq.deadline > NOW()
      ORDER BY gq.deadline ASC;
    `;

    db.query(query, [studentId, studentId], (err, results) => {
      if (err) {
        console.error('Error fetching deadlines:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }
      res.json({ deadlines: results });
    });
  });

router.put('/update-deadline/:quizId/:groupId', authenticateJWT, (req, res) => {
  const { quizId, groupId } = req.params;
  const { deadline } = req.body;

  const query = `UPDATE groupQuiz SET deadline = ? WHERE quiz_id = ? AND group_id = ?`;

  db.query(query, [deadline, quizId, groupId], (err, result) => {
    if (err) {
      console.error('Error updating deadline:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Quiz not found for this group.' });
    }

    res.json({ message: 'Deadline updated for the selected group!' });
  });
});

router.get('/quiz-groups/:quizId', authenticateJWT, (req, res) => {
  const { quizId } = req.params;

  const query = `
    SELECT g.group_id, g.group_name, q.deadline
    FROM groupQuiz q
    JOIN studyGroup g ON g.group_id = q.group_id
    WHERE q.quiz_id = ?
  `;

  db.query(query, [quizId], (err, results) => {
    if (err) {
      console.error("Error fetching quiz groups:", err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    res.json(results);
  });
});




// Get student quiz attempt history
router.get('/history', authenticateJWT, (req, res) => {
  const { id, userType } = req.user; 

  if (userType !== 'student') {
    return res.status(403).json({ error: 'Access denied. Only students can view history.' });
  }

  const query = `
SELECT 
  qa.attempt_id,
  qa.quiz_id,
  q.title AS quiz_title,
  qa.score,
  qa.start_time AS attempt_time,
  qa.end_time,
  qa.time_taken,
  (
    SELECT SUM(points_per_question) 
    FROM Questions 
    WHERE quiz_id = qa.quiz_id
  ) AS max_points
FROM QuizAttempt qa
JOIN Quiz q ON qa.quiz_id = q.quiz_id
WHERE qa.student_id = ?
ORDER BY qa.start_time DESC;

`;


  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching student history:", err);
      return res.status(500).json({ error: "Failed to retrieve quiz history." });
    }

    res.json({ history: results });
  });
});



module.exports = router;
