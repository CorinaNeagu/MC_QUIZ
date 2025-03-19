const express = require('express');
const db = require('../db');
const authenticateJWT = require('../middleware/authMiddleware'); // Import the authentication middleware
const router = express.Router();

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


  // POST - Create a new quiz
  router.post('/quizzes', authenticateJWT, (req, res) => {
    // Extract the fields from the request body
    const { title, category, timeLimit, deductionPercentage, retakeAllowed, isActive, noQuestions } = req.body;
    const professorId = req.user.id; // Get the professor's ID from the JWT payload
  
    console.log("Received data:", req.body); // Log to confirm
  
    // Parse and convert values to the correct types
    const timeLimitNum = parseInt(timeLimit, 10);
    const deductionPercentageNum = parseFloat(deductionPercentage);
    const noQuestionsNum = parseInt(noQuestions, 10);
  
    console.log("Parsed Data:", { timeLimitNum, deductionPercentageNum, noQuestionsNum });
  
    // Check if all required fields are provided
    if (!title || !category || isNaN(timeLimitNum) || isNaN(deductionPercentageNum) || isNaN(noQuestionsNum)) {
      console.log("Error: Missing required fields.");
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Validate timeLimit (Must be a positive number)
    if (timeLimitNum <= 0 || isNaN(timeLimitNum)) {
      return res.status(400).json({ message: 'Time limit must be a positive number' });
    }
  
    // Validate deductionPercentage (Must be between 0 and 100)
    if (deductionPercentageNum < 0 || deductionPercentageNum > 100 || isNaN(deductionPercentageNum)) {
      return res.status(400).json({ message: 'Deduction percentage must be between 0 and 100' });
    }
  
    // Validate noQuestions (Must be a positive number)
    if (noQuestionsNum <= 0 || isNaN(noQuestionsNum)) {
      return res.status(400).json({ message: 'Number of questions must be a positive number' });
    }
  
    // Proceed to insert the data into the database
    const query = `INSERT INTO Quiz (professor_id, title, category_id)
                   SELECT ?, ?, category_id FROM Category WHERE category_name = ? LIMIT 1`;
  
    db.query(query, [professorId, title, category], (err, result) => {
      if (err) {
        console.error('Error inserting quiz:', err);
        return res.status(500).json({ message: 'Error creating quiz' });
      }
  
      const quizId = result.insertId;
  
      console.log('Inserting quiz settings:', {
        quizId,
        timeLimit: timeLimitNum,
        deductionPercentage: deductionPercentageNum,
        retakeAllowed,
        isActive,
        noQuestions: noQuestionsNum,
      });
  
      const settingsQuery = `INSERT INTO QuizSettings (quiz_id, time_limit, deduction_percentage, retake_allowed, is_active, no_questions)
                             VALUES (?, ?, ?, ?, ?, ?)`;
  
      db.query(settingsQuery, [quizId, timeLimitNum, deductionPercentageNum, retakeAllowed, isActive, noQuestionsNum], (err) => {
        if (err) {
          console.error('Error inserting quiz settings:', err);
          return res.status(500).json({ message: 'Error saving quiz settings' });
        }
  
        res.status(200).json({ message: 'Quiz created successfully', quizId });
      });
    });
  });
  
  


// POST - Add a question to the QuestionBank table
router.post("/questions", (req, res) => {
  const { questionContent, isMultipleChoice, professor_id, category } = req.body;

  // Step 1: Get category_id from category_name
  const getCategoryQuery = `SELECT category_id FROM Category WHERE category_name = ?`;

  db.query(getCategoryQuery, [category], (err, categoryResults) => {
    if (err) {
      console.error("Error fetching category ID:", err);
      return res.status(500).json({ message: "Error fetching category ID" });
    }

    if (categoryResults.length === 0) {
      return res.status(400).json({ message: "Invalid category name" });
    }

    const category_id = categoryResults[0].category_id;

    // Step 2: Insert the question into the QuestionBank table
    const insertQuestionQuery = `
      INSERT INTO QuestionBank (professor_id, category_id, question_content, is_multiple_choice)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertQuestionQuery,
      [professor_id, category_id, questionContent, isMultipleChoice],
      (err, results) => {
        if (err) {
          console.error("Error inserting question:", err);
          return res.status(500).json({ message: "Error inserting question" });
        }

        res.status(200).json({
          message: "Question successfully added to QuestionBank!",
          question_bank_id: results.insertId, 
       });
      }
    );
  });
});

router.post("/answers", async (req, res) => {
  const { question_bank_id, answers } = req.body;

  // Log incoming request data
  console.log("Received data for answers:", req.body);

  if (!question_bank_id || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Invalid request. Question ID and answers are required." });
  }

  // Begin transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Failed to start transaction." });
    }

    try {
      // Insert each answer into the AnswerBank table
      const insertPromises = answers.map((answer) => {
        return new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO AnswerBank (question_bank_id, answer_content, is_correct, score)
             VALUES (?, ?, ?, ?)`,
            [question_bank_id, answer.answerContent, answer.isCorrect, answer.score],
            (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results);
              }
            }
          );
        });
      });

      Promise.all(insertPromises)
        .then((results) => {
          // Log inserted answers
          console.log("Inserted answers:", results);

          // Commit the transaction
          db.commit((commitError) => {
            if (commitError) {
              console.error("Commit error:", commitError);
              return res.status(500).json({ error: "Error committing transaction." });
            }
            res.status(201).json({ message: "Answers saved successfully!" });
          });
        })
        .catch((insertError) => {
          // Rollback transaction on error
          db.rollback(() => {
            console.error("Error inserting answers:", insertError);
            res.status(500).json({ error: "Database error while saving answers." });
          });
        });
    } catch (error) {
      console.error("Error processing answers:", error);
      db.rollback(() => {
        res.status(500).json({ error: "Database error while processing answers." });
      });
    }
  });
});
module.exports = router;
