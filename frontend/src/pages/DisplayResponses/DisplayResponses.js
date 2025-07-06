import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './DisplayResponses.css';
import Sidebar from "../../components/Sidebar/Sidebar";

const DisplayResponses = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);
  const [deductionPercentage, setDeductionPercentage] = useState(0);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view your responses.");
          return;
        }

        const { data } = await axios.get(
          `http://localhost:5000/api/score/quiz_attempts/${attemptId}/responses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data) {
          setResponses(data.responses);
          setDeductionPercentage(data.deduction_percentage || 0);
          console.log("Fetched responses:", data.responses);
        }
      } catch (err) {
        console.error("Error fetching responses:", err);
        setError("Error loading your responses.");
      }
    };

    fetchResponses();
  }, [attemptId]);

  const normalizeAnswers = (answers) => {
    console.log("Normalizing answers:", answers);
  
    if (typeof answers === 'string') {
      return answers.split(',').map(answer => answer.trim().toLowerCase());
    }
  
    if (Array.isArray(answers)) {
      return answers.map(answer => {
        if (typeof answer === 'string') {
          return answer.trim().toLowerCase(); 
        } else if (typeof answer === 'object' && answer.answerContent) {
          return answer.answerContent.trim().toLowerCase(); 
        } else if (typeof answer === 'object') {
          console.warn(`Unexpected object structure:`, answer);
          return ''; 
        } else {
          console.warn(`Unexpected type in array: ${typeof answer}`);
          return ''; 
        }
      });
    }
  
    if (typeof answers === 'object' && answers !== null) {
      return Object.values(answers).map(value => {
        if (typeof value === 'string') {
          return value.trim().toLowerCase(); 
        } else if (typeof value === 'object' && value.answerContent) {
          return value.answerContent.trim().toLowerCase(); 
        } else {
          console.warn(`Unexpected value type: ${typeof value}`);
          return ''; 
        }
      });
    }
  
    console.error(`Invalid answers type: ${typeof answers}`);
    return [];
  };
  
  
  
  const removeDuplicates = (answers) => {
    console.log("Removing duplicates from:", answers);
    return [...new Set(answers)];
  };

  const checkAnswerCorrectness = (userAnswer, correctAnswers) => {
    const normalizedUserAnswer = normalizeAnswers(userAnswer);
    const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);
  
    const matchedAnswers = normalizedUserAnswer.filter(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  
    return matchedAnswers.length; 
  };

  const calculatePartialPoints = (studentAnswers, correctAnswers, totalPoints) => {
    const normalizedStudentAnswers = normalizeAnswers(studentAnswers);
    const uniqueCorrectAnswers = removeDuplicates(normalizeAnswers(correctAnswers));
    
    const correctSelections = normalizedStudentAnswers.filter(answer =>
      uniqueCorrectAnswers.includes(answer)
    ).length;
  
    const correctAnswerCount = uniqueCorrectAnswers.length;
    
    if (correctAnswerCount === 0) return 0;
  
    const pointsPerCorrectAnswer = totalPoints / correctAnswerCount;
  
    return pointsPerCorrectAnswer * correctSelections;
  };
  


  const calculateDeduction = (points, wrongAnswersCount) => {
    console.log("Calculating deduction - Points:", points, "Wrong Answers Count:", wrongAnswersCount);
    if (wrongAnswersCount > 0 && deductionPercentage > 0) {
      const deductionPerWrongAnswer = (deductionPercentage / 100) * points;
      return deductionPerWrongAnswer * wrongAnswersCount;
    }
    return 0;
  };

  const calculatePointsAwarded = (response) => {
    const userAnswers = normalizeAnswers(response.studentAnswer);
    const correctAnswers = normalizeAnswers(response.correctAnswers);
  
    const correctSelections = userAnswers.filter(answer =>
      correctAnswers.includes(answer)
    ).length;
  
    const pointsPerCorrectAnswer = response.points / correctAnswers.length;
    let awardedPoints = pointsPerCorrectAnswer * correctSelections;
  
    awardedPoints = awardedPoints < 0 ? 0 : awardedPoints;
  
    return awardedPoints;
  };
  
  

  const getAnswerStatus = (userAnswer, correctAnswers) => {
    const normalizedUserAnswer = normalizeAnswers(userAnswer);
    const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);
  
    const correctMatches = normalizedUserAnswer.filter(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  
    if (correctMatches.length === 0) {
      return "Incorrect";
    }
  
    if (correctMatches.length === normalizedCorrectAnswers.length) {
      return "Correct";
    }
      return "Partially Correct";
  };
  

  const handleBackToScore = () => {
    navigate(`/display-score/${attemptId}`);
  };

  return (
    <div>
      <Sidebar showBackButton />
    <div className="responses-container">
      {error && <p>{error}</p>}
      {responses.length > 0 ? (
        <div>
          <h2>Your Responses</h2>
          <button className = "btn-back" 
                  onClick={handleBackToScore}>
          ❮❮ Back to Score
          </button>
          <ul className="responses-list">
            {responses.map((response, index) => (
              <li key={index} className="response-item">
                <div className="response-details">
                  <div className="question">
                    <strong>Question: </strong>
                    <pre className="preformatted">{response.questionText}</pre>
                  </div>
                  <div className="your-answer">
                    <strong>Your Answer(s): </strong>
                    <div className="answer-list">
                      <pre className="preformatted">{(normalizeAnswers(response.studentAnswer) || []).map((answer, idx) => (
                         <div key={idx}>{answer || 'Unanswered'}</div>
                      ))}</pre>
                      
                    </div>
                  </div>
                  <div className="correct-answers">
                    <strong>Correct Answer(s): </strong>
                    <div className="answer-list">
                      <pre className="preformatted">{removeDuplicates(normalizeAnswers(response.correctAnswers)).map((answer, idx) => (
                        <div key={idx} className="correct-answer">{answer}</div>
                      ))}</pre>
                      
                    </div>
                  </div>
                  <div className="answer-status">
                    <strong>Your Answer Was: </strong>
                    {getAnswerStatus(response.studentAnswer, response.correctAnswers)}
                  </div>
                  <div className="points-awarded">
                    <strong>Points Awarded: </strong>
                    {calculatePointsAwarded(response)}
                  </div>
                </div>
                <hr />
              </li>
            ))}
          </ul>
          
        </div>
      ) : (
        <p>Loading responses...</p>
      )}
    </div>
        </div>

  );
};

export default DisplayResponses;
