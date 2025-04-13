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
  const [wrongAnswers, setWrongAnswers] = useState(0);
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
  
        const { data } = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/score`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        const {
          score: fetchedScore,
          max_score: fetchedMaxScore,
          deduction_percentage,
          wrong_answer_count
        } = data;
  
        const deduction = (deduction_percentage / 100) * fetchedScore * wrong_answer_count;
  
        setScore(fetchedScore);
        setMaxScore(fetchedMaxScore);
        setDeduction(deduction);
        setWrongAnswers(wrong_answer_count);
      } catch (err) {
        console.error("Error fetching score:", err);
        setError("Error loading your score.");
      }
    };
  
    fetchScore();
  }, [attemptId]);

  // Final score calculation
  useEffect(() => {
    if (score !== null && deduction !== null && maxScore !== null) {
      const cappedScore = Math.min(score, maxScore);
      const finalScoreBeforeDeduction = cappedScore - deduction;
      const final = Math.round(finalScoreBeforeDeduction * 100) / 100;
      setFinalScore(Math.max(final, 0));
    }
  }, [score, deduction, maxScore]);

  // Calculate Grade out of 100
  const calculateGrade = () => {
    if (finalScore !== null && maxScore !== null) {
      const grade = (finalScore / maxScore) * 100;
      return Math.round(grade);
    }
    return 0;
  };

  const handleGoToDashboard = () => {
    navigate("/home");
  };

  return (
    <div className="score-page-container">
      {error && <p>{error}</p>}
      {finalScore !== null ? (
        <>
          <h1>Quiz Completed</h1>
          <p>Great job! You've completed the quiz.</p>

          <div className="score-value">
            Your Score: {finalScore.toFixed(2)} / {maxScore}
          </div>

          {/* Calculate Grade */}
          <div className="grade">
            Grade: {calculateGrade()} / 100
          </div>

          {deduction > 0 ? (
            <p>Deduction Applied: -{deduction.toFixed(2)} points for {wrongAnswers} wrong answers</p>
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
