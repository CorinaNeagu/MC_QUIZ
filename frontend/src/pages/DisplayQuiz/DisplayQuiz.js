import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./DisplayQuiz.css"; 

const DisplayQuiz = () => {
  const { quizId } = useParams(); 
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate(); 
  const [quizAttemptId, setQuizAttemptId] = useState(null); 

  useEffect(() => {
    // Fetch quiz details
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view the quiz.");
          return;
        }

        const response = await axios.get(
         `http://localhost:5000/api/takeQuiz/quiz/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setQuizData(response.data); 
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("There was an error fetching quiz details.");
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  const startQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const studentId = localStorage.getItem("user_id"); 

      if (!studentId) {
        alert("You must be logged in to start the quiz.");
        return;
      }

      // Create a quiz attempt entry
      const response = await axios.post(
        `http://localhost:5000/api/takeQuiz/quiz_attempts`, 
        {
          student_id: studentId,
          quiz_id: quizId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Successfully created quiz attempt, now redirect to DisplayQuestion page
        setQuizAttemptId(response.data.attemptId);  // Store the quiz attempt ID

        // Navigate to DisplayQuestion page with quiz attempt ID and quiz ID
        navigate(`/display-question/${quizId}/${response.data.attemptId}`);
      }
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("There was an error starting the quiz.");
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="display-quiz-container">
      {quizData ? (
        <>
          <h2>{quizData.title}</h2>
          <div className="quiz-details">
            <p><strong>Category:</strong> {quizData.category_name}</p>
            <p><strong>Time Limit:</strong> {quizData.time_limit} minutes</p>
            <p><strong>Deduction Percentage:</strong> {quizData.deduction_percentage}%</p>
            <p><strong>Retake Allowed:</strong> {quizData.retake_allowed ? "Yes" : "No"}</p>
            <p><strong>Active:</strong> {quizData.is_active ? "Yes" : "No"}</p>
            <p><strong>Number of Questions:</strong> {quizData.no_questions}</p>
          </div>

          {/* Start Quiz Button */}
          <div className="start-quiz-button">
            <button onClick={startQuiz}>Start Quiz</button>
          </div>
        </>
      ) : (
        <p>Loading quiz details...</p>
      )}
    </div>
  );
};

export default DisplayQuiz;
