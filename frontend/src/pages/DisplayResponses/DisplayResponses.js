import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './DisplayResponses.css';

const DisplayResponses = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [deductionPercentage, setDeductionPercentage] = useState(0);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view your responses.");
          return;
        }

        const { data } = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/responses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data) {
          setResponses(data.responses);
          setDeductionPercentage(data.deduction_percentage || 0);
        }
      } catch (err) {
        console.error("Error fetching responses:", err);
        setError("Error loading your responses.");
      }
    };

    fetchResponses();
  }, [attemptId]);

  const normalizeAnswers = (answers) => {
    if (typeof answers === 'string') {
      return [answers.trim().toLowerCase()];
    }
    return answers.map(answer => answer.trim().toLowerCase());
  };

  const removeDuplicates = (answers) => {
    return [...new Set(answers)];
  };

  const checkAnswerCorrectness = (userAnswer, correctAnswers) => {
    const normalizedUserAnswer = normalizeAnswers(userAnswer);
    const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);
  
    // Check if any normalized user answer matches any correct answer
    return normalizedUserAnswer.some(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  };

  const calculatePartialPoints = (studentAnswers, correctAnswers, totalPoints) => {
    const normalizedStudentAnswers = normalizeAnswers(studentAnswers);
    const uniqueCorrectAnswers = removeDuplicates(normalizeAnswers(correctAnswers));
    const correctSelections = normalizedStudentAnswers.filter(answer =>
      uniqueCorrectAnswers.includes(answer)
    ).length;

    const correctAnswerCount = uniqueCorrectAnswers.length;
    const pointsPerCorrectAnswer = totalPoints / correctAnswerCount;
    return pointsPerCorrectAnswer * correctSelections;
  };

  const calculateDeduction = (points, wrongAnswersCount) => {
    if (wrongAnswersCount > 0 && deductionPercentage > 0) {
      const deductionPerWrongAnswer = (deductionPercentage / 100) * points;
      return deductionPerWrongAnswer * wrongAnswersCount;
    }
    return 0;
  };

  const calculatePointsAwarded = (response) => {
    const wrongAnswersCount = response.studentAnswer
      .split(', ')
      .filter(answer => !checkAnswerCorrectness(answer, response.correctAnswers)).length;

    const deduction = calculateDeduction(response.points, wrongAnswersCount);
    let awardedPoints = calculatePartialPoints(response.studentAnswer, response.correctAnswers, response.points) - deduction;

    return awardedPoints > 0 ? awardedPoints : 0;
  };

  // Example: Check the correctness for multiple correct answers
const getAnswerStatus = (userAnswer, correctAnswers) => {
  const normalizedUserAnswer = normalizeAnswers(userAnswer);
  const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);

  const matchedAnswers = normalizedUserAnswer.filter(userAnswer =>
    normalizedCorrectAnswers.includes(userAnswer)
  );

  if (matchedAnswers.length === 0) {
    return "Incorrect";
  } else if (matchedAnswers.length < normalizedCorrectAnswers.length) {
    return "Partially Correct";
  } else {
    return "Correct";
  }
};

  const handleBackToScore = () => {
    navigate(`/display-score/${attemptId}`);
  };

  return (
    <div className="responses-container">
      {error && <p>{error}</p>}
      {responses.length > 0 ? (
        <div>
          <h2>Your Responses</h2>
          <ul className="responses-list">
            {responses.map((response, index) => (
              <li key={index} className="response-item">
                <div className="response-details">
                  <div className="question">
                    <strong>Question: </strong>{response.questionText}
                  </div>
                  <div className="your-answer">
                    <strong>Your Answer(s): </strong>
                    <div className="answer-list">
                      {normalizeAnswers(response.studentAnswer).map((answer, idx) => (
                        <div key={idx}>{answer}</div>
                      ))}
                    </div>
                  </div>
                  <div className="correct-answers">
                    <strong>Correct Answer(s): </strong>
                    <div className="answer-list">
                      {removeDuplicates(normalizeAnswers(response.correctAnswers)).map((answer, idx) => (
                        <div key={idx} className="correct-answer">{answer}</div>
                      ))}
                    </div>
                  </div>
                  <div className="answer-status">
                    <strong>Your Answer Was: </strong>
                    {getAnswerStatus(response.studentAnswer, response.correctAnswers)}
                  </div>
                  <div className="points-awarded">
                    <strong>Points Awarded: </strong>
                    {calculatePointsAwarded(response)}
                  </div>
                </div>
                <hr />
              </li>
            ))}
          </ul>
          <button onClick={handleBackToScore}>Back to Score</button>
        </div>
      ) : (
        <p>Loading responses...</p>
      )}
    </div>
  );
};

export default DisplayResponses;
