import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import './DisplayScore.css';

// Utility functions
const normalizeAnswers = (answers) => {
  if (typeof answers === 'string') {
    return answers.split(',').map(a => a.trim().toLowerCase());
  }
  if (Array.isArray(answers)) {
    return answers.map(a =>
      typeof a === 'string' ? a.trim().toLowerCase() :
      a?.answerContent ? a.answerContent.trim().toLowerCase() : ''
    );
  }
  if (typeof answers === 'object' && answers !== null) {
    return Object.values(answers).map(v =>
      typeof v === 'string' ? v.trim().toLowerCase() :
      v?.answerContent ? v.answerContent.trim().toLowerCase() : ''
    );
  }
  return [];
};

const removeDuplicates = (answers) => [...new Set(answers)];

const calculatePointsAwarded = (response, deductionPercentage) => {
  const userAnswers = normalizeAnswers(response.studentAnswer);
  const correctAnswers = removeDuplicates(normalizeAnswers(response.correctAnswers));
  if (correctAnswers.length === 0) return 0;

  const pointsPerQuestion = response.points;
  const correctSelections = userAnswers.filter(ans => correctAnswers.includes(ans)).length;
  const wrongSelections = userAnswers.filter(ans => !correctAnswers.includes(ans)).length;

  const pointsPerCorrect = pointsPerQuestion / correctAnswers.length;
  const basePoints = pointsPerCorrect * correctSelections;

  const deduction = correctSelections > 0
    ? pointsPerQuestion * (deductionPercentage / 100) * wrongSelections
    : 0;

  return Math.round(Math.max(basePoints - deduction, 0) * 100) / 100;
};

const calculatePointsBeforeDeduction = (response) => {
  const userAnswers = normalizeAnswers(response.studentAnswer);
  const correctAnswers = removeDuplicates(normalizeAnswers(response.correctAnswers));
  if (correctAnswers.length === 0) return 0;

  const correctSelections = userAnswers.filter(ans => correctAnswers.includes(ans)).length;
  const pointsPerCorrect = response.points / correctAnswers.length;
  return Math.round((pointsPerCorrect * correctSelections) * 100) / 100;
};

const calculateDeductionPoints = (response, deductionPercentage) => {
  const before = calculatePointsBeforeDeduction(response);
  const awarded = calculatePointsAwarded(response, deductionPercentage);
  return Math.round((before - awarded) * 100) / 100;
};

// Main Component
const DisplayScore = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [maxScore, setMaxScore] = useState(null);
  const [deductionPercentage, setDeductionPercentage] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScoreAndResponses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view your score.");
          return;
        }

        // Fetch main score details
        const scoreRes = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/score`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const {
          max_score,
          deduction_percentage,
          wrong_answer_count,
          deduction: fetchedDeduction = 0,
        } = scoreRes.data;

        setMaxScore(parseFloat(max_score) || 0);
        setDeductionPercentage(parseFloat(deduction_percentage) || 0);
        setWrongAnswers(wrong_answer_count);
        setDeduction(parseFloat(fetchedDeduction) || 0);

        // Fetch responses
        const responseRes = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/responses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setResponses(responseRes.data.responses || []);

      } catch (err) {
        console.error("Error loading score or responses:", err);
        setError("Error loading your score.");
      }
    };

    fetchScoreAndResponses();
  }, [attemptId]);

  const totals = responses.reduce(
    (acc, r) => {
      acc.before += calculatePointsBeforeDeduction(r);
      acc.deduction += calculateDeductionPoints(r, deductionPercentage);
      acc.awarded += calculatePointsAwarded(r, deductionPercentage);
      return acc;
    },
    { before: 0, deduction: 0, awarded: 0 }
  );

  const calculateGrade = () => {
    if (maxScore && maxScore > 0) {
      return Math.round((totals.awarded / maxScore) * 10000) / 100;
    }
    return 0;
  };

  const handleGoToDashboard = () => navigate("/home");

  return (
    <div className="page-wrapper">
      <Sidebar showBackButton={true} />
      <div className="score-page-container">
        {error && <p>{error}</p>}
        {maxScore !== null ? (
          <>
            <h1>Quiz Completed</h1>

            <div className="score-value">
              Your Score: {totals.awarded.toFixed(2)} / {maxScore}
            </div>

            <div>
              <strong>Calculated From Responses:</strong>
              <p>Points Before Deduction: {totals.before.toFixed(2)}</p>
              <p>Deduction Points: -{totals.deduction.toFixed(2)}</p>
            </div>

            <div className="grade">
              Grade: {calculateGrade()} / 100
            </div>

            {deduction > 0 ? (
              <p>
                {/* Deduction Applied: -{deduction.toFixed(2)} points for {wrongAnswers} wrong answer
                {wrongAnswers !== 1 ? "s" : ""} */}
              </p>
            ) : wrongAnswers > 0 && totals.awarded === 0 ? (
              <p>You didn’t answer any questions, so no deductions were applied.</p>
            ) : (
              <p>No deductions applied!</p>
            )}

            <button onClick={handleGoToDashboard}>Go to Dashboard</button>
            <button
              className="view-responses-btn"
              onClick={() => navigate(`/responses/${attemptId}`)}
            >
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
