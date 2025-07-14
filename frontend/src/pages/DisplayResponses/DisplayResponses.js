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

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchResponses = async () => {
        setLoading(true);                       
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setError("Please log in to view your responses.");
            return;
          }

          const { data } = await axios.get(
            `http://localhost:5000/api/score/quiz_attempts/${attemptId}/responses`,
            { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
          );

          setResponses(data.responses ?? []);
          setDeductionPercentage(data.deduction_percentage ?? 0);
        } catch (err) {
          if (err.code !== "ERR_CANCELED") {
            console.error(err);
            setError("Error loading your responses.");
          }
        } finally {
          setLoading(false);                    
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
    


  const calculateDeductionPoints = (response, deductionPercentage) => {
    const userAnswers = normalizeAnswers(response.studentAnswer);
    const correctAnswers = normalizeAnswers(response.correctAnswers);

    const uniqueCorrectAnswers = removeDuplicates(correctAnswers);
    if (uniqueCorrectAnswers.length === 0) return 0;

    const pointsPerQuestion = response.points;

    const correctSelections = userAnswers.filter(ans => uniqueCorrectAnswers.includes(ans)).length;
    const wrongSelections = userAnswers.filter(ans => !uniqueCorrectAnswers.includes(ans)).length;

    const deductionPct = parseFloat(deductionPercentage) || 0;

    if (correctSelections > 0) {
      return Math.round(pointsPerQuestion * (deductionPct / 100) * wrongSelections * 100) / 100;
    } else {
      return 0; // no deduction if no correct answer selected
    }
  };

  const calculatePointsBeforeDeduction = (response) => {
    const userAnswers = normalizeAnswers(response.studentAnswer);
    const correctAnswers = normalizeAnswers(response.correctAnswers);

    const uniqueCorrectAnswers = removeDuplicates(correctAnswers);
    if (uniqueCorrectAnswers.length === 0) return 0;

    const pointsPerQuestion = response.points;
    const correctSelections = userAnswers.filter(ans => uniqueCorrectAnswers.includes(ans)).length;
    const pointsPerCorrectAnswer = pointsPerQuestion / uniqueCorrectAnswers.length;

    const awardedPointsBeforeDeduction = pointsPerCorrectAnswer * correctSelections;

    return Math.round(awardedPointsBeforeDeduction * 100) / 100;
  };

  const calculatePointsAwarded = (response, deductionPercentage) => {
    const userAnswers = normalizeAnswers(response.studentAnswer);
    const correctAnswers = normalizeAnswers(response.correctAnswers);

    console.log("User Answers:", userAnswers);
    console.log("Correct Answers:", correctAnswers);

    const uniqueCorrectAnswers = removeDuplicates(correctAnswers);
    if (uniqueCorrectAnswers.length === 0) {
      console.log("No correct answers found, returning 0 points.");
      return 0;
    }

    const pointsPerQuestion = response.points;
    console.log("Points per Question:", pointsPerQuestion);

    const correctSelections = userAnswers.filter(ans => uniqueCorrectAnswers.includes(ans)).length;
    const wrongSelections = userAnswers.filter(ans => !uniqueCorrectAnswers.includes(ans)).length;
    const missedCorrect = uniqueCorrectAnswers.filter(ans => !userAnswers.includes(ans)).length;

    console.log("Correct Selections:", correctSelections);
    console.log("Wrong Selections:", wrongSelections);
    console.log("Missed Correct Answers:", missedCorrect);

    const deductionPct = parseFloat(deductionPercentage) || 0;
    console.log("Deduction Percentage:", deductionPct);

    const pointsPerCorrectAnswer = pointsPerQuestion / uniqueCorrectAnswers.length;

    const awardedPointsBeforeDeduction = pointsPerCorrectAnswer * correctSelections;

    let finalPoints;
    let deductionPoints = 0;
    if (correctSelections > 0) {
      deductionPoints = pointsPerQuestion * (deductionPct / 100) * wrongSelections;
      finalPoints = awardedPointsBeforeDeduction - deductionPoints;
    } else {
          finalPoints = 0;
    }

    console.log("Points per Correct Answer:", pointsPerCorrectAnswer);
    console.log("Points Before Deduction:", awardedPointsBeforeDeduction);
    console.log("Deduction Points:", deductionPoints);
    console.log("Final Points Awarded:", finalPoints);

    return Math.round(Math.max(finalPoints, 0) * 100) / 100;
  };

    const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();

    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

    const getAnswerStatus = (userAnswer, correctAnswers) => {
      const normalizedUserAnswer = normalizeAnswers(userAnswer).filter(a => a); // remove empty strings if any
      const normalizedCorrectAnswers = normalizeAnswers(correctAnswers).filter(a => a);

      if (normalizedUserAnswer.length === 0) return "Incorrect";

      if (arraysEqual(normalizedUserAnswer, normalizedCorrectAnswers)) {
        return "Correct";
      }

    const hasAnyCorrect = normalizedUserAnswer.some(ans =>
        normalizedCorrectAnswers.includes(ans)
      );
      if (hasAnyCorrect) {
        return "Partially Correct";
      }

      return "Incorrect";
    };


    const handleBackToScore = () => {
      navigate(`/display-score/${attemptId}`);
    };


    if (loading)  return <p>Loading responses…</p>;
    if (error)    return <p>{error}</p>;
    if (!responses.length) return <p>No responses were recorded for this attempt.</p>;

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
                        {(normalizeAnswers(response.studentAnswer) || []).map((answer, idx) => {
                            const normalizedCorrectAnswers = removeDuplicates(normalizeAnswers(response.correctAnswers));
                            const isCorrect = normalizedCorrectAnswers.includes(answer);
                              return (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <pre className="preformatted" style={{ margin: 0 }}>
                                    {answer || 'Unanswered'}
                                  </pre>
                                  <span style={{ 
                                    color: isCorrect ? 'green' : 'red', 
                                    fontWeight: 'bold',
                                    fontSize: '0.9em'
                                  }}>
                                    {isCorrect ? ' - Correct' : ' - Incorrect'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                        <div className="correct-answers">
                          <strong>Correct Answer(s): </strong>
                          <div className="answer-list">
                            {removeDuplicates(normalizeAnswers(response.correctAnswers)).map((answer, idx) => (
                              <pre key={idx} className="preformatted correct-answer">{answer}</pre>
                            ))}
                          </div>
                        </div>
                        <div className="answer-status">
                          <strong>Your Answer Was: </strong>
                          {getAnswerStatus(response.studentAnswer, response.correctAnswers)}
                        </div>

                        <div className= "points-before">
                          <strong>Points Before Deduction: </strong>
                          {calculatePointsBeforeDeduction(response).toFixed(2)}
                        </div>

                        <div className="deduction-points">
                          <strong>Deduction: </strong>
                          -{calculateDeductionPoints(response, deductionPercentage).toFixed(2)}
                        </div>

                        <div className="points-awarded">
                          <strong>Points Awarded: </strong>
                          {calculatePointsAwarded(response, deductionPercentage).toFixed(2)}
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
