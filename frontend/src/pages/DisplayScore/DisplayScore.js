import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import './DisplayScore.css';

const DisplayScore = () => {
  const { attemptId } = useParams();
  const [score, setScore] = useState(null);
  const [maxScore, setMaxScore] = useState(null); 
  const [deduction, setDeduction] = useState(0); 
  const [finalScore, setFinalScore] = useState(null); 
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view the score.");
          return;
        }

        // Fetch score and deduction percentage
        const response = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/score`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data) {
          const fetchedScore = response.data.score;
          const fetchedMaxScore = response.data.max_score; 
          console.log(fetchedMaxScore);
          const fetchedDeduction = response.data.deduction_percentage || 0;
          console.log(fetchedDeduction);

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

  useEffect(() => {
    if (score !== null && maxScore !== null) {
      console.log("Score:", score);  
      console.log("Max Score:", maxScore);  

     
  
      if (score !== null && deduction !== null) {
        // Calculate the deduction from the max score
        const deductionAmount = (deduction / 100) * maxScore;
        console.log("Deduction Amount (before rounding):", deductionAmount);
  
        const finalScore = score - deductionAmount;
        console.log("Final Score (before rounding):", finalScore);
  
        const final = Math.round(finalScore * 100) / 100;  
  
        // Ensure the final score is not negative
        setFinalScore(Math.max(final, 0)); 
        console.log("Final Score (after rounding):", final); 
      }
    }
  }, [score, deduction, maxScore]);
  

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
          <button onClick={() => window.location.href = "/home"}>Go to Dashboard</button>
        </>
      ) : (
        <p>Loading your score...</p>
      )}
    </div>
  );
};

export default DisplayScore;
