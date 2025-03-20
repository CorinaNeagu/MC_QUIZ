// ScorePage.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ScorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Access the state passed from the DisplayQuestion component
  const { score } = location.state || { score: 0 }; // Default score is 0 if not provided

  return (
    <div className="score-page-container">
      <h1>Your Score</h1>
      <p>You scored: {score} out of X points</p> {/* Replace X with the total score */}
      <button onClick={() => navigate("/home")}>Back to Home</button>
    </div>
  );
};

export default ScorePage;
