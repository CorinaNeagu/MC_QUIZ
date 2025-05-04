import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import './DisplayScore.css';

const DisplayScore = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [score, setScore] = useState(null);
  const [maxScore, setMaxScore] = useState(null);
  const [deduction, setDeduction] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [error, setError] = useState("");

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
  
        setScore(fetchedScore);
        setMaxScore(fetchedMaxScore);
        setWrongAnswers(wrong_answer_count);
  
        // Assume fixed points per question (adjust as needed)
        const pointsPerQuestion = 10;
        const calculatedDeduction = wrong_answer_count * pointsPerQuestion * (deduction_percentage / 100);
        setDeduction(calculatedDeduction);
  
        const cappedScore = Math.min(fetchedScore, fetchedMaxScore);
        const final = Math.max(cappedScore - calculatedDeduction, 0);
        setFinalScore(Math.round(final * 100) / 100);
      } catch (err) {
        console.error("Error fetching score:", err);
        setError("Error loading your score.");
      }
    };
  
    fetchScore();
  }, [attemptId]);
  

  const calculateGrade = () => {
    if (finalScore !== null && maxScore !== null && maxScore > 0) {
      return Math.round((finalScore / maxScore) * 100);
    }
    return 0;
  };

  const handleGoToDashboard = () => {
    navigate("/home");
  };

  return (
    <div className="page-wrapper">
              <Sidebar showBackButton={true} />

    <div className="score-page-container">


      {error && <p>{error}</p>}
      {finalScore !== null ? (
        <>
          <h1>Quiz Completed</h1>
          <p>Great job! You've completed the quiz.</p>

          <div className="score-value">
            Your Score: {finalScore.toFixed(2)} / {maxScore}
          </div>

          <div className="grade">
            Grade: {calculateGrade()} / 100
          </div>

          {deduction > 0 ? (
            <p>Deduction Applied: -{deduction.toFixed(2)} points for {wrongAnswers} wrong answer(s)</p>
          ) : (
            <p>No deductions applied!</p>
          )}

          <button onClick={handleGoToDashboard}>Go to Dashboard</button>

          <button className="view-responses-btn" 
                  onClick={() => navigate(`/responses/${attemptId}`)}>
            View My Responses
          </button>
        </>
      ) : (
        <p>Loading your score...</p>
      )}
    </div>
    </div>
  );
};

export default DisplayScore;
