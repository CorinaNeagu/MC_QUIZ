const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();
const jwt = require('jsonwebtoken'); 

const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err); // Reject promise if error occurs
      } else {
        resolve(results); // Resolve promise with results if no error
      }
    });
  });
};

router.get('/categories', (req, res) => {
    // SQL query to fetch all categories
    const query = 'SELECT * FROM Category';
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Error fetching categories' });
      }
  
      res.status(200).json({ categories: results });
    });
  });

  // Quiz creation endpoint
router.post('/quizzes', (req, res) => {
  const {
    title,
    category,
    timeLimit,
    deductionPercentage,
    retakeAllowed,
    isActive,
    noQuestions,
  } = req.body;

  const token = req.headers['authorization']?.split(' ')[1]; // Extract JWT token from the header

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    const professor_id = decoded.id; // Assuming 'id' is the professor's ID from the JWT payload

    // Insert quiz data into the `Quiz` table
    const insertQuizQuery = `
      INSERT INTO Quiz (professor_id, title, category_id, created_at)
      VALUES (?, ?, (SELECT category_id FROM Category WHERE category_name = ?), NOW())
    `;
    db.query(insertQuizQuery, [professor_id, title, category], (quizErr, quizResults) => {
      if (quizErr) {
        console.error('Error inserting quiz:', quizErr);
        return res.status(500).json({ message: 'Error creating quiz' });
      }

      const quiz_id = quizResults.insertId;

      // Insert quiz settings into the `QuizSettings` table
      const insertQuizSettingsQuery = `
        INSERT INTO QuizSettings (quiz_id, time_limit, deduction_percentage, retake_allowed, is_active, no_questions)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertQuizSettingsQuery,
        [quiz_id, timeLimit, deductionPercentage, retakeAllowed, isActive, noQuestions],
        (settingsErr, settingsResults) => {
          if (settingsErr) {
            console.error('Error inserting quiz settings:', settingsErr);
            return res.status(500).json({ message: 'Error creating quiz settings' });
          }

          // Return the created quiz ID in the response
          return res.status(200).json({ message: 'Quiz created successfully', quizId: quiz_id });
        }
      );
    });
  });
});

// Create a new question
router.post("/questions", async (req, res) => {
  const { quizId, questionContent, isMultipleChoice, pointsPerQuestion } = req.body; 
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const professor_id = decoded.id;

    if (!quizId || !questionContent || pointsPerQuestion == null) {  
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    const questionQuery = `INSERT INTO Questions (quiz_id, question_content, is_multiple_choice, points_per_question) VALUES (?, ?, ?, ?)`;
    db.query(questionQuery, [quizId, questionContent, isMultipleChoice, pointsPerQuestion], (err, result) => {
      if (err) {
        console.error('Error creating question:', err);
        return res.status(500).json({ message: 'Database error while creating question' });
      }

      const questionId = result.insertId;

      return res.status(200).json({
        message: "Question created successfully!",
        questionId: questionId,
      });
    });
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
});

// Create answer(s) for a question
router.post("/answers", async (req, res) => {
  const { questionId, answerContent, isCorrect } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    // Validate required fields
    if (!questionId || !answerContent || isCorrect == null) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Fetch points_per_question for the question
    const questionQuery = `SELECT points_per_question FROM Questions WHERE question_id = ?`;
    db.query(questionQuery, [questionId], (err, result) => {
      if (err) {
        console.error('Error fetching question points:', err);
        return res.status(500).json({ message: 'Database error while fetching question points' });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'Question not found' });
      }

      const pointsPerQuestion = result[0].points_per_question;

      // Fetch the current answers for this question
      const fetchAnswersQuery = `SELECT * FROM Answers WHERE question_id = ?`;
      db.query(fetchAnswersQuery, [questionId], (err, answersResult) => {
        if (err) {
          console.error('Error fetching answers:', err);
          return res.status(500).json({ message: 'Database error while fetching answers' });
        }

        // Count the number of correct answers already in the system
        const correctAnswers = answersResult.filter(answer => answer.is_correct);

        // Calculate the score per correct answer
        const correctAnswersCount = correctAnswers.length + (isCorrect ? 1 : 0); // Include the new correct answer if applicable
        const scorePerAnswer = correctAnswersCount > 0 ? pointsPerQuestion / correctAnswersCount : 0;

        // Update the scores for all correct answers
        const updateQuery = `UPDATE Answers SET score = ? WHERE question_id = ? AND is_correct = 1`;
        db.query(updateQuery, [scorePerAnswer, questionId], (err, updateResult) => {
          if (err) {
            console.error('Error updating answers:', err);
            return res.status(500).json({ message: 'Database error while updating answers' });
          }

          // Now insert the new answer
          const answerScore = isCorrect ? scorePerAnswer : 0;
          const insertAnswerQuery = `INSERT INTO Answers (question_id, answer_content, is_correct, score) VALUES (?, ?, ?, ?)`;
          db.query(insertAnswerQuery, [questionId, answerContent, isCorrect, answerScore], (err, insertResult) => {
            if (err) {
              console.error('Error creating answer:', err);
              return res.status(500).json({ message: 'Database error while creating answer' });
            }

            return res.status(200).json({ message: "Answer created successfully!" });
          });
        });
      });
    });
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
});





// GET route to fetch all questions for a specific quiz
router.get('/questions/:quizId', async (req, res) => {
  const quizId = req.params.quizId;  // Extract quizId from URL parameters

  // Validate quizId
  if (!quizId) {
    return res.status(400).json({ message: 'Quiz ID is required.' });
  }

  try {
    // Query the database to get all questions for the specific quizId
    const query = 'SELECT * FROM Questions WHERE quiz_id = ?';
    
    db.query(query, [quizId], (err, result) => {
      if (err) {
        console.error('Error fetching questions:', err);
        return res.status(500).json({ message: 'Error fetching questions from database.' });
      }

      // Send back the questions as a response
      return res.status(200).json({
        message: 'Questions fetched successfully.',
        questions: result,
      });
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'An error occurred while fetching questions.' });
  }
});

router.get('/answers/:questionId', async (req, res) => {
  const questionId = req.params.questionId;  // Extract questionId from URL parameters

  // Validate questionId
  if (!questionId) {
    return res.status(400).json({ message: 'Question ID is required.' });
  }

  try {
    // Query the database to get all answers for the specific questionId
    const query = 'SELECT * FROM Answers WHERE question_id = ?';
    
    db.query(query, [questionId], (err, result) => {
      if (err) {
        console.error('Error fetching answers:', err);
        return res.status(500).json({ message: 'Error fetching answers from database.' });
      }

      // Send back the answers as a response
      return res.status(200).json({
        message: 'Answers fetched successfully.',
        answers: result, // Return the fetched answers
      });
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'An error occurred while fetching answers.' });
  }
});

// Route to fetch quiz data (questions and answers)
router.get('/quizPreview/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    // Fetch the quiz questions from the database
    const quizQuestions = await queryAsync(
      'SELECT * FROM questions WHERE quiz_id = ?', 
      [quizId]
    );

    if (quizQuestions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    // Fetch the answers for the fetched questions
    const questionIds = quizQuestions.map((q) => q.question_id);
    const answers = await queryAsync(
      'SELECT * FROM answers WHERE question_id IN (?)', 
      [questionIds]
    );

    // Organize the answers by question_id
    const quizDetails = quizQuestions.map((question) => {
      const questionAnswers = answers.filter(
        (answer) => answer.question_id === question.question_id
      );
      return {
        ...question,
        answers: questionAnswers,
      };
    });

    // Send the quiz details as response
    res.json({ questions: quizDetails });
  } catch (err) {
    console.error('Error fetching quiz preview:', err);
    res.status(500).json({ message: 'Error fetching quiz details' });
  }
});


router.get('/display/quizzes', (req, res) => {
  // SQL query to get quizzes with their categories
  const query = `
    SELECT q.quiz_id, q.title, q.category_id, c.category_name
    FROM Quiz q
    LEFT JOIN Category c ON q.category_id = c.category_id;
  `;

  // Execute the query to fetch quizzes and categories
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
      return res.status(500).json({ error: 'Error fetching quizzes from the database' });
    }
    
    // Respond with the list of quizzes
    res.json(results);
  });
});


router.delete("/delete/:questionId", authenticateJWT, (req, res) => {
  const { questionId } = req.params;

  // First delete the answers related to the question
  db.query("DELETE FROM answers WHERE question_id = ?", [questionId], (err, result) => {
    if (err) {
      console.error("Error deleting answers:", err);
      return res.status(500).json({ message: "Failed to delete answers.", error: err.message });
    }

    // Then delete the question itself
    db.query("DELETE FROM questions WHERE question_id = ?", [questionId], (err, result) => {
      if (err) {
        console.error("Error deleting question:", err);
        return res.status(500).json({ message: "Failed to delete question.", error: err.message });
      }

      // If no rows were affected in the second query, the question was not found
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      res.status(200).json({ message: "Question and its answers deleted successfully." });
    });
  });
});




module.exports = router;
