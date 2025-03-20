import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './ScorePage.css';

const ScorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Access score and totalQuestions from state
  const { score, totalQuestions } = location.state;

  return (
    <div className="score-page-container">
      <h1>Your Score</h1>
      <p>You scored: {score} out of {totalQuestions} points</p> {/* Dynamically show total questions */}
      <button onClick={() => navigate("/home")}>Back to Home</button>
    </div>
  );
};

export default ScorePage;
