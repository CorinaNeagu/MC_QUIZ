import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./DisplayQuiz.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const DisplayQuiz = () => {
  const { quizId } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [quizSettings, setQuizSettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [error, setError] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to view the quiz.");
      return;
    }

    const fetchQuizDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/takeQuiz/quiz/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Quiz Data:", response.data);  // Add this
        setQuizData(response.data);
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("There was an error fetching quiz details.");
      }
    };

    const fetchQuizSettings = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/takeQuiz/quiz-settings/${quizId}`
        );
        setQuizSettings(response.data.settings);
      } catch (err) {
        console.error("Failed to fetch quiz settings", err);
        setError("There was an error fetching quiz settings.");
      }
    };

    fetchQuizDetails();
    fetchQuizSettings();
  }, [quizId]);

  useEffect(() => {
    if (!quizStarted || timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStarted, timeLeft]);

  const startQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const studentId = localStorage.getItem("user_id");
  
      if (!studentId) {
        alert("You must be logged in to start the quiz.");
        return;
      }
  
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
        setQuizStarted(true);
        if (!quizSettings?.time_limit) {
          alert("Invalid quiz time limit.");
          return;
        }
        setTimeLeft(quizSettings.time_limit * 60); 
        setStartTime(Date.now()); // Start time
  
        navigate(`/display-question/${quizId}/${response.data.attemptId}?timeLeft=${quizSettings.time_limit * 60}&startTime=${Date.now()}`);
      }
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("There was an error starting the quiz.");
    }
  };
  

  const handleSubmit = async () => {
    const endTime = Date.now();
    const timeTakenInSeconds = Math.floor((endTime - startTime) / 1000);
    try {
      alert("Submitting your answers...");
  
      await axios.post(
        `http://localhost:5000/api/takeQuiz/submit-quiz`, 
        {
          attempt_id: quizAttemptId,
          time_taken: timeTakenInSeconds,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      alert(`Quiz submitted! Time taken: ${timeTakenInSeconds} seconds`);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("There was an error submitting the quiz.");
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="display-quiz-container">
      <Sidebar showBackButton={true} /> {/* Pass the showBackButton prop to Sidebar */}
      {quizData ? (
        <>
          <h2>{quizData.title}</h2>
          <div className="quiz-details">
            <p><strong>Category:</strong> {quizData.category_name}</p>
            <p><strong>Subcategory:</strong> {quizData.subcategory_name}</p> 
            <p><strong>Time Limit:</strong> {quizSettings?.time_limit} minutes</p>
            <p><strong>Deduction Percentage:</strong> {quizSettings?.deduction_percentage}%</p>
            <p><strong>Retake Allowed:</strong> {quizSettings?.retake_allowed ? "Yes" : "No"}</p>
            <p><strong>Active:</strong> {quizSettings?.is_active ? "Yes" : "No"}</p>
            <p><strong>Number of Questions:</strong> {quizSettings?.no_questions}</p>
          </div>

          {!quizStarted ? (
            <div className="start-quiz-button">
              <button onClick={startQuiz}>Start Quiz</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "1.5rem", margin: "20px 0" }}>
                Time Left: <strong>{formatTime(timeLeft)}</strong>
              </div>

              {/* Replace this with your actual quiz question rendering */}
              <p>Questions will go here...</p>

              <button onClick={handleSubmit}>Submit Quiz</button>
            </div>
          )}
        </>
      ) : (
        <p>Loading quiz details...</p>
      )}
    </div>
  );
};

export default DisplayQuiz;
