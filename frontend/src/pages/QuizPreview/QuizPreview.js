import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

import './QuizPreview.css';

const QuizPreview = () => {
  const location = useLocation();
  const { quizId } = location.state; // Get quizId from the state passed via navigate
  const navigate = useNavigate(); // Initialize useNavigate

  const [quizDetails, setQuizDetails] = useState([]); // Store quiz details
  const [error, setError] = useState(""); // Error state
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    // Fetch the quiz details (questions and answers)
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view the quiz.");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/quizPreview/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Ensure that response data contains questions
        if (response.data && response.data.questions) {
          setQuizDetails(response.data.questions); // Set quiz questions and answers
        } else {
          setError("No questions found for this quiz.");
        }
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("There was an error fetching quiz details.");
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  // If there is an error, display it
  if (error) return <div>{error}</div>;

  // Show loading state while the data is being fetched
  if (loading) return <div>Loading quiz details...</div>;


  return (
    <div className="quiz-preview-container">
                    <Sidebar showBackButton={true} />

      <h2>Quiz Preview</h2>
      {quizDetails.length > 0 ? (
        <ul>
          {quizDetails.map((question) => (
            <li key={question.question_id}>
              <h3>{question.question_content}</h3>
              {question.answers && question.answers.length > 0 ? (
                <ul>
                  {question.answers.map((answer) => (
                    <li 
                      key={answer.answer_id}
                      className={answer.is_correct ? 'correct' : 'incorrect'}
                    >
                      {answer.answer_content} - 
                      <strong>{answer.is_correct ? "Correct" : "Incorrect"}</strong> - 
                      Score: {answer.is_correct ? answer.score : "0.00"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No answers available for this question.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No questions found for this quiz.</p>
      )}
    </div>
  );
};

export default QuizPreview;
