import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './DisplayResponses.css';

const DisplayResponses = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);

  // Fetch user responses for the quiz
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
        }
      } catch (err) {
        console.error("Error fetching responses:", err);
        setError("Error loading your responses.");
      }
    };

    fetchResponses();
  }, [attemptId]);

  // Normalize and compare answers
  const normalizeAnswers = (answers) => {
    if (Array.isArray(answers)) {
      return answers.map(answer => answer.trim().toLowerCase());
    }
    return answers.split(',').map(answer => answer.trim().toLowerCase());
  };

  const checkAnswerCorrectness = (userAnswer, correctAnswers) => {
    const normalizedUserAnswer = normalizeAnswers(userAnswer);
    const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);

    // Check if user's answer matches any of the correct answers
    return normalizedUserAnswer.some(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  };

  // Navigate back to DisplayScore page
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
                    {/* Displaying user answers in a div */}
                    <div className="answer-list">
                      {Array.isArray(response.studentAnswer) ? (
                        response.studentAnswer.map((answer, idx) => (
                          <div key={idx}>{answer}</div>
                        ))
                      ) : (
                        <div>{response.studentAnswer}</div>
                      )}
                    </div>
                  </div>
                  <div className="correct-answers">
                    <strong>Correct Answer(s): </strong>
                    {/* Displaying correct answers in separate divs */}
                    <div className="answer-list">
                      {Array.isArray(response.correctAnswers) ? (
                        response.correctAnswers.map((answer, idx) => (
                          <div key={idx} className="correct-answer">{answer}</div>
                        ))
                      ) : (
                        response.correctAnswers.split(",").map((answer, idx) => (
                          <div key={idx} className="correct-answer">{answer.trim()}</div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="answer-status">
                    <strong>Your Answer Was: </strong>
                    {checkAnswerCorrectness(response.studentAnswer, response.correctAnswers)
                      ? "Correct"
                      : "Incorrect"}
                  </div>
                  <div className="points-awarded">
                    <strong>Points Awarded: </strong>
                    {checkAnswerCorrectness(response.studentAnswer, response.correctAnswers)
                      ? response.points
                      : 0}
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
