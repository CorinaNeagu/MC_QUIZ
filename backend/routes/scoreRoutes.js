const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/quiz_attempts/:attempt_id/submit', (req, res) => {
  console.log("Received POST request for submitting quiz.");
  const { attempt_id } = req.params;
  console.log("Attempt ID: ", attempt_id);
  const { answers } = req.body;
  console.log("Answers: ", answers);
  const end_time = new Date();

  if (typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: 'No answers provided or invalid format' });
  }

  // Query to get quizId and studentId for this attempt
  const selectQuizAndStudentQuery = `
    SELECT quiz_id, student_id
    FROM QuizAttempt
    WHERE attempt_id = ?
  `;

  db.query(selectQuizAndStudentQuery, [attempt_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    const quizId = results[0].quiz_id;
    const studentId = results[0].student_id;
    console.log("Quiz ID: ", quizId);
    console.log("Student ID: ", studentId);

    const selectStartTimeQuery = `SELECT start_time FROM QuizAttempt WHERE attempt_id = ?`;

    db.query(selectStartTimeQuery, [attempt_id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: 'Quiz attempt not found' });
      }

      const start_time = new Date(results[0].start_time);
      const time_taken = Math.floor((end_time - start_time) / 1000);

      const insertAnswersQuery = `
        INSERT INTO StudentResponses (attempt_id, quiz_id, student_id, question_id, answer_id) 
        VALUES ?
      `;

      // Prepare values from the answers object
      const answerValues = [];
      for (const [questionId, answerIds] of Object.entries(answers)) {
        answerIds.forEach(answerId => {
          answerValues.push([attempt_id, quizId, studentId, questionId, answerId]);
        });
      }

      db.query(insertAnswersQuery, [answerValues], (insertErr) => {
        if (insertErr) {
          console.error("Error inserting answers:", insertErr);
          return res.status(500).json({ message: 'Error saving student responses.' });
        }

        const calculateScoreQuery = `
          SELECT SUM(a.score) AS total_score
          FROM StudentResponses sr
          JOIN Answers a ON sr.answer_id = a.answer_id
          WHERE sr.attempt_id = ? AND a.is_correct = TRUE;
        `;

        db.query(calculateScoreQuery, [attempt_id], (scoreErr, scoreResults) => {
          if (scoreErr) {
            console.error("Error calculating score:", scoreErr);
            return res.status(500).json({ message: 'Error calculating score.' });
          }

          const total_score = scoreResults[0].total_score || 0;

          const updateAttemptQuery = `
            UPDATE QuizAttempt
            SET end_time = ?, time_taken = ?, score = ?
            WHERE attempt_id = ?
          `;

          db.query(updateAttemptQuery, [end_time, time_taken, total_score, attempt_id], (updateErr) => {
            if (updateErr) {
              console.error("Error updating quiz attempt:", updateErr);
              return res.status(500).json({ message: 'Error updating quiz attempt.' });
            }

            return res.status(200).json({ message: 'Quiz attempt submitted successfully!', score: total_score });
          });
        });
      });
    });
  });
});


router.get('/quiz_attempts/:attempt_id/score', (req, res) => {
  const { attempt_id } = req.params;

  const selectScoreQuery = `
    SELECT 
        qa.score AS score,
        qs.deduction_percentage AS deduction_percentage,
        SUM(a.score) AS max_score
    FROM QuizAttempt qa
    LEFT JOIN QuizSettings qs ON qa.quiz_id = qs.quiz_id
    LEFT JOIN Questions q ON qa.quiz_id = q.quiz_id
    LEFT JOIN Answers a ON q.question_id = a.question_id
    WHERE qa.attempt_id = ?
    GROUP BY qa.attempt_id, qs.deduction_percentage`
  ;

  db.query(selectScoreQuery, [attempt_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching score.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }

    const score = results[0].score;
    const deductionPercentage = results[0].deduction_percentage;
    const maxScore = results[0].max_score || 0;

    return res.status(200).json({
      score: score,  // Return the raw score
      deduction_percentage: deductionPercentage,
      max_score: maxScore
    });
  });
});


  


module.exports = router;