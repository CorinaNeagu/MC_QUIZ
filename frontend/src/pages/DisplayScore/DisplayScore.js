import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './DisplayScore.css';

const DisplayScore = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate(); // Using useNavigate for navigation
  
  const [score, setScore] = useState(null);
  const [maxScore, setMaxScore] = useState(null);
  const [deduction, setDeduction] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState("");
  
  // Fetch score data and handle calculation
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view your score.");
          return;
        }

        // Fetch score, max score, and deduction details
        const { data } = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/score`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data) {
          const { score: fetchedScore, max_score: fetchedMaxScore, deduction_percentage: fetchedDeduction } = data;
          setScore(fetchedScore);
          setMaxScore(fetchedMaxScore);
          setDeduction(fetchedDeduction);
        }
      } catch (err) {
        console.error("Error fetching score:", err);
        setError("Error loading your score.");
      }
    };

    fetchScore();
  }, [attemptId]);

  // Handle final score calculation with deduction
  useEffect(() => {
    if (score !== null && deduction !== null && maxScore !== null) {
      const cappedScore = Math.min(score, maxScore);  // Cap the score at maxScore
      const finalScoreBeforeDeduction = cappedScore - deduction;
      const final = Math.round(finalScoreBeforeDeduction * 100) / 100;  // Round the score to 2 decimal places

      setFinalScore(Math.max(final, 0));  // Prevent negative score
    }
  }, [score, deduction, maxScore]);

  // Handle navigating back to the dashboard
  const handleGoToDashboard = () => {
    navigate("/home");  // Navigate to the dashboard
  };

  return (
    <div className="score-page-container">
      {error && <p>{error}</p>}
      {finalScore !== null ? (
        <>
          <h1>Quiz Completed</h1>
          <p>Great job! You've completed the quiz.</p>

          <div className="score-value">Your Score: {finalScore.toFixed(2)}</div>
          {deduction > 0 ? (
            <p>Deduction Applied: {deduction}%</p>
          ) : (
            <p>No deductions applied!</p>
          )}
          <button onClick={handleGoToDashboard}>Go to Dashboard</button>

          {/* Button to show responses */}
          <button className="view-responses-btn" 
                  onClick={() => navigate(`/responses/${attemptId}`)}>
            View My Responses
          </button>

        </>
      ) : (
        <p>Loading your score...</p>
      )}
    </div>
  );
};

export default DisplayScore;
