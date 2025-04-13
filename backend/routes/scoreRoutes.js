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
    WHERE attempt_id = ?`;

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
      // Calculate time taken in seconds
      const time_taken = Math.floor((end_time - start_time) / 1000);
      console.log("Time taken: ", time_taken, "seconds");

      // Query to get default_answer_id for 'No Response'
      const getDefaultAnswerQuery = `
        SELECT default_answer_id
        FROM DefaultAnswers
        WHERE answer_content = "No Response"`;

      db.query(getDefaultAnswerQuery, (err, defaultAnswerResults) => {
        if (err || defaultAnswerResults.length === 0) {
          console.error("Error fetching default answer ID:", err);
          return res.status(500).json({ message: 'Error fetching default answer.' });
        }

        const defaultAnswerId = defaultAnswerResults[0].default_answer_id;
        console.log("Default Answer ID: ", defaultAnswerId);

        // Prepare values for StudentResponses
        const answerValues = [];
        const unansweredQuestions = new Set();

        // Loop through the answers and create values for the StudentResponses
        for (const [questionId, answerIds] of Object.entries(answers)) {
          answerIds.forEach(answerId => {
            if (!answerId) {
              // If the answer is null or empty, use the default answer
              answerId = defaultAnswerId;
            }
            answerValues.push([attempt_id, quizId, studentId, questionId, answerId, null]);
          });
        }

        // Query to get all questions for the quiz
        const getQuestionsQuery = `
          SELECT question_id
          FROM Questions
          WHERE quiz_id = ?`;

        db.query(getQuestionsQuery, [quizId], (getQuestionsErr, questions) => {
          if (getQuestionsErr || questions.length === 0) {
            console.error("Error fetching questions:", getQuestionsErr);
            return res.status(500).json({ message: 'Error fetching questions for the quiz.' });
          }

          // Find unanswered questions (those that are not in answers)
          questions.forEach(question => {
            if (!answers[question.question_id]) {
              unansweredQuestions.add(question.question_id);
              // Assign default answer (answer_id = default_answer_id, default_answer_id = 2) to unanswered questions in StudentResponses
              answerValues.push([attempt_id, quizId, studentId, question.question_id, defaultAnswerId, 2]);
            }
          });

          // Insert all the answers (including unanswered ones with score 0)
          const insertAnswersQuery = `
            INSERT INTO StudentResponses (attempt_id, quiz_id, student_id, question_id, answer_id, default_answer_id) 
            VALUES ?`;

          db.query(insertAnswersQuery, [answerValues], (insertErr) => {
            if (insertErr) {
              console.error("Error inserting answers:", insertErr);
              return res.status(500).json({ message: 'Error saving student responses.' });
            }

            // Query to get deduction points for the quiz
            const getDeductionQuery = `
              SELECT qs.deduction_percentage AS deduction_points
              FROM QuizSettings qs
              JOIN QuizAttempt qa ON qs.quiz_id = qa.quiz_id
              WHERE qa.attempt_id = ?`;

            db.query(getDeductionQuery, [attempt_id], (deductionErr, deductionResults) => {
              if (deductionErr || deductionResults.length === 0) {
                console.error("Error fetching deduction:", deductionErr);
                return res.status(500).json({ message: 'Error fetching deduction setting.' });
              }

              const deductionPoints = deductionResults[0].deduction_points || 0;

              // Calculate score based on correct answers, excluding unanswered questions
              const calculateScoreQuery = `
                SELECT SUM(a.score) AS total_score
                FROM StudentResponses sr
                JOIN Answers a ON sr.answer_id = a.answer_id
                WHERE sr.attempt_id = ? AND a.is_correct = TRUE AND sr.default_answer_id IS NULL`; // Exclude unanswered questions

              db.query(calculateScoreQuery, [attempt_id], (scoreErr, scoreResults) => {
                if (scoreErr) {
                  console.error("Error calculating score:", scoreErr);
                  return res.status(500).json({ message: 'Error calculating score.' });
                }

                let total_score = scoreResults[0]?.total_score || 0; // Use optional chaining to ensure safe access
                console.log("Total score after correct answers:", total_score);

                // Calculate the total number of wrong answers, excluding unanswered questions
                const wrongAnswersQuery = `
                  SELECT COUNT(*) AS wrong_answers
                  FROM StudentResponses sr
                  JOIN Answers a ON sr.answer_id = a.answer_id
                  WHERE sr.attempt_id = ? AND a.is_correct = FALSE AND sr.default_answer_id IS NULL`; // Exclude unanswered questions

                db.query(wrongAnswersQuery, [attempt_id], (wrongErr, wrongResults) => {
                  if (wrongErr) {
                    console.error("Error fetching wrong answers:", wrongErr);
                    return res.status(500).json({ message: 'Error calculating wrong answers.' });
                  }

                  const wrongAnswersCount = wrongResults[0].wrong_answers;

                  // Apply deduction if there are wrong answers
                  if (wrongAnswersCount > 0) {
                    total_score -= deductionPoints;
                  }

                  // Prevent negative score
                  total_score = Math.max(total_score, 0);

                  // Update the quiz attempt with the final score
                  const updateAttemptQuery = `
                    UPDATE QuizAttempt
                    SET end_time = ?, time_taken = ?, score = ?
                    WHERE attempt_id = ?`;

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
      });
    });
  });
});




router.get('/quiz_attempts/:attempt_id/score', (req, res) => {
  const { attempt_id } = req.params;

  const query = `
    SELECT 
      qa.score AS score,
      qs.deduction_percentage AS deduction_percentage,
      (
        SELECT SUM(a.score)
        FROM Questions q
        JOIN Answers a ON q.question_id = a.question_id
        WHERE q.quiz_id = qa.quiz_id AND a.is_correct = TRUE
      ) AS max_score,
      (
        SELECT COUNT(*) 
        FROM StudentResponses sr
        JOIN Answers a ON sr.answer_id = a.answer_id
        WHERE sr.attempt_id = qa.attempt_id AND a.is_correct = FALSE
      ) AS wrong_answer_count
    FROM QuizAttempt qa
    JOIN QuizSettings qs ON qa.quiz_id = qs.quiz_id
    WHERE qa.attempt_id = ?
  `;

  db.query(query, [attempt_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching score.' });
    if (results.length === 0) return res.status(404).json({ message: 'Quiz attempt not found.' });

    const { score, deduction_percentage, max_score, wrong_answer_count } = results[0];

    res.status(200).json({
      score: parseFloat(score),
      max_score: parseFloat(max_score),
      deduction_percentage: parseFloat(deduction_percentage),
      wrong_answer_count: parseInt(wrong_answer_count)
    });
  });
});



router.get('/quiz_attempts/:attempt_id/responses', (req, res) => {
  const { attempt_id } = req.params;

  const query = `
    SELECT q.question_content, 
       MAX(a.answer_content) AS student_answer, 
       MAX(a.is_correct) AS student_is_correct,
       GROUP_CONCAT(DISTINCT correct_answers.answer_content) AS correct_answers, -- DISTINCT to remove duplicates
       q.points_per_question AS points
    FROM StudentResponses sr
    JOIN Questions q ON sr.question_id = q.question_id
    JOIN Answers a ON sr.answer_id = a.answer_id
    JOIN Answers correct_answers ON q.question_id = correct_answers.question_id 
    AND correct_answers.is_correct = TRUE
    WHERE sr.attempt_id = ?
    GROUP BY sr.question_id, q.question_content, q.points_per_question;
    `;

  db.query(query, [attempt_id], (err, results) => {
    if (err) {
      console.error("Error fetching responses:", err);
      return res.status(500).json({ message: 'Error fetching responses.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No responses found for this attempt.' });
    }

    const responses = results.map(row => ({
      questionText: row.question_content,
      studentAnswer: row.student_answer,
      studentIsCorrect: row.student_is_correct,
      correctAnswers: row.correct_answers.split(', '), // Convert correct answers string into an array
      points: row.points,
    }));

    return res.status(200).json({ responses });
  });
});

module.exports = router;