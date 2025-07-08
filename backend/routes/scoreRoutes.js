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
  sr.question_id,
  q.points_per_question,
  GROUP_CONCAT(DISTINCT a.answer_content ORDER BY a.answer_content) AS student_answers,
  GROUP_CONCAT(DISTINCT correct_a.answer_content ORDER BY correct_a.answer_content) AS correct_answers
FROM StudentResponses sr
JOIN Questions q ON sr.question_id = q.question_id
JOIN Answers a ON sr.answer_id = a.answer_id
JOIN Answers correct_a ON q.question_id = correct_a.question_id AND correct_a.is_correct = TRUE
WHERE sr.attempt_id = ?
GROUP BY sr.question_id, q.points_per_question;

  `;

  const deductionQuery = `
    SELECT deduction_percentage FROM QuizSettings 
    WHERE quiz_id = (SELECT quiz_id FROM QuizAttempt WHERE attempt_id = ?) LIMIT 1
  `;

  db.query(query, [attempt_id], (err, results) => {
    if (err) {
      console.error("Score calc error:", err);
      return res.status(500).json({ message: 'Error fetching score.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No responses found for this attempt.' });
    }

    db.query(deductionQuery, [attempt_id], (err2, deductionRes) => {
      const deduction_percentage = deductionRes?.[0]?.deduction_percentage || 0;

      let totalPointsBeforeDeduction = 0;
      let totalPointsAwarded = 0;
      let wrongAnswers = 0;

      results.forEach(row => {
        const studentAnswers = row.student_answers?.split(',').map(s => s.trim()) || [];
        const correctAnswers = row.correct_answers?.split(',').map(s => s.trim()) || [];

        const allCorrect = correctAnswers.every(ans => studentAnswers.includes(ans));
        const anyIncorrect = studentAnswers.some(ans => !correctAnswers.includes(ans));

        totalPointsBeforeDeduction += parseFloat(row.points_per_question) || 0;

        if (allCorrect && !anyIncorrect) {
          totalPointsAwarded += parseFloat(row.points_per_question);
        } else if (studentAnswers.some(ans => correctAnswers.includes(ans))) {
          totalPointsAwarded += parseFloat(row.points_per_question) * 0.667; // example partial credit
        } else {
          wrongAnswers += 1;
        }
      });

      const deductionPerWrong = (deduction_percentage / 100) * (totalPointsBeforeDeduction / results.length);
      const totalDeduction = wrongAnswers * deductionPerWrong;
      const finalScore = Math.max(0, totalPointsAwarded - totalDeduction);
      const grade = (finalScore / totalPointsBeforeDeduction) * 100;

      return res.status(200).json({
        score: parseFloat(finalScore.toFixed(2)),
        max_score: parseFloat(totalPointsBeforeDeduction.toFixed(2)),
        grade: parseFloat(grade.toFixed(2)),
        deduction: parseFloat(totalDeduction.toFixed(2)),
        deduction_percentage,
        wrong_answer_count: wrongAnswers,
        points_before_deduction: parseFloat(totalPointsAwarded.toFixed(2)),
      });
    });
  });
});


router.get('/quiz/:quiz_id/question-points', (req, res) => {
  const { quiz_id } = req.params;

  const query = `
    SELECT 
      question_id,
      question_content,
      points_per_question
    FROM Questions
    WHERE quiz_id = ?
  `;

  db.query(query, [quiz_id], (err, results) => {
    if (err) {
      console.error("SQL Error fetching question points:", err);
      return res.status(500).json({ message: 'Failed to fetch question points.' });
    }

    res.status(200).json(results);
  });
});



router.get('/quiz_attempts/:attempt_id/responses', (req, res) => {
  const { attempt_id } = req.params;

  const quizIdQuery = `SELECT quiz_id FROM QuizAttempt WHERE attempt_id = ?`;

  db.query(quizIdQuery, [attempt_id], (err, quizResult) => {
    if (err) {
      console.error("Error fetching quiz id:", err);
      return res.status(500).json({ message: 'Error fetching quiz id.' });
    }

    if (quizResult.length === 0) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }

    const quizId = quizResult[0].quiz_id;

    const deductionQuery = `SELECT deduction_percentage FROM QuizSettings WHERE quiz_id = ? LIMIT 1`;

    db.query(deductionQuery, [quizId], (err2, deductionResult) => {
      if (err2) {
        console.error("Error fetching deduction:", err2);
        return res.status(500).json({ message: 'Error fetching deduction.' });
      }

      // Fix here: use deduction_percentage instead of deduction
      const deduction_percentage = deductionResult.length > 0 ? deductionResult[0].deduction_percentage : 0;

      const responsesQuery = `
        SELECT 
          q.question_content, 
          GROUP_CONCAT(DISTINCT a.answer_content ORDER BY a.answer_content) AS student_answers,
          GROUP_CONCAT(DISTINCT correct_answers.answer_content ORDER BY correct_answers.answer_content) AS correct_answers,
          q.points_per_question AS points,
          q.question_id
        FROM StudentResponses sr
        JOIN Questions q ON sr.question_id = q.question_id
        JOIN Answers a ON sr.answer_id = a.answer_id
        JOIN Answers correct_answers ON q.question_id = correct_answers.question_id AND correct_answers.is_correct = TRUE
        WHERE sr.attempt_id = ?
        GROUP BY sr.question_id, q.question_content, q.points_per_question;
      `;

      db.query(responsesQuery, [attempt_id], (err3, results) => {
        if (err3) {
          console.error("Error fetching responses:", err3);
          return res.status(500).json({ message: 'Error fetching responses.' });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: 'No responses found for this attempt.' });
        }

        const responses = results.map(row => {
          const studentAnswers = row.student_answers ? row.student_answers.split(',').map(ans => ans.trim()) : [];
          const correctAnswers = row.correct_answers ? row.correct_answers.split(',').map(ans => ans.trim()) : [];

          return {
            questionText: row.question_content,
            studentAnswer: studentAnswers,
            correctAnswers: correctAnswers,
            points: parseFloat(row.points),
          };
        });

        return res.status(200).json({ responses, deduction_percentage });
      });
    });
  });
});


router.put('/quiz_attempts/:attemptId/update_awarded_score', async (req, res) => {
  const { attemptId } = req.params;
  const { awardedScore } = req.body;

  try {
    const query = "UPDATE QuizAttempt SET score = ? WHERE attempt_id = ?";
    const result = await db.execute(query, [awardedScore, attemptId]); // db.execute is your MySQL query executor

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Attempt not found" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});






module.exports = router;