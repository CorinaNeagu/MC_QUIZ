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
  
    // Case 1: If it's a string, split by commas and normalize each answer
    if (typeof answers === 'string') {
      return answers.split(',').map(answer => answer.trim().toLowerCase());
    }
  
    // Case 2: If it's an array, normalize each item
    if (Array.isArray(answers)) {
      return answers.map(answer => {
        if (typeof answer === 'string') {
          return answer.trim().toLowerCase(); // Normalize string
        } else if (typeof answer === 'object' && answer.answerContent) {
          // Extract the 'answerContent' property if it's an object
          return answer.answerContent.trim().toLowerCase(); // Normalize string from the object
        } else if (typeof answer === 'object') {
          // Handle other cases for objects (like logging or handling unexpected object structures)
          console.warn(`Unexpected object structure:`, answer);
          return ''; // Default fallback
        } else {
          console.warn(`Unexpected type in array: ${typeof answer}`);
          return ''; // Fallback to empty string
        }
      });
    }
  
    // Case 3: If it's an object (likely a map or dictionary), handle its values
    if (typeof answers === 'object' && answers !== null) {
      return Object.values(answers).map(value => {
        if (typeof value === 'string') {
          return value.trim().toLowerCase(); // Normalize string
        } else if (typeof value === 'object' && value.answerContent) {
          // Extract 'answerContent' from the object and normalize
          return value.answerContent.trim().toLowerCase(); // Normalize the string
        } else {
          console.warn(`Unexpected value type: ${typeof value}`);
          return ''; // Fallback to empty string
        }
      });
    }
  
    // If none of the cases above are true, log the issue and return an empty array
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
  
    // Return true if the user’s answer matches any of the correct answers
    const matchedAnswers = normalizedUserAnswer.filter(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  
    return matchedAnswers.length; // Return how many answers match
  };

  const calculatePartialPoints = (studentAnswers, correctAnswers, totalPoints) => {
    const normalizedStudentAnswers = normalizeAnswers(studentAnswers);
    const uniqueCorrectAnswers = removeDuplicates(normalizeAnswers(correctAnswers));
    
    // Count how many of the student's answers match the correct answers
    const correctSelections = normalizedStudentAnswers.filter(answer =>
      uniqueCorrectAnswers.includes(answer)
    ).length;
  
    // Total number of unique correct answers
    const correctAnswerCount = uniqueCorrectAnswers.length;
    
    // If there are no correct answers, return 0 points
    if (correctAnswerCount === 0) return 0;
  
    // Calculate points per correct answer
    const pointsPerCorrectAnswer = totalPoints / correctAnswerCount;
  
    // Return the total points based on how many answers are correct
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
  
    // Count how many correct answers the user selected
    const correctSelections = userAnswers.filter(answer =>
      correctAnswers.includes(answer)
    ).length;
  
    // Calculate partial points based on how many correct answers were selected
    const pointsPerCorrectAnswer = response.points / correctAnswers.length;
    let awardedPoints = pointsPerCorrectAnswer * correctSelections;
  
    // Ensure the points are not negative
    awardedPoints = awardedPoints < 0 ? 0 : awardedPoints;
  
    return awardedPoints;
  };
  
  

  const getAnswerStatus = (userAnswer, correctAnswers) => {
    const normalizedUserAnswer = normalizeAnswers(userAnswer);
    const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);
  
    // Match the student's answers with the correct ones
    const correctMatches = normalizedUserAnswer.filter(answer =>
      normalizedCorrectAnswers.includes(answer)
    );
  
    // Case when no answers are correct
    if (correctMatches.length === 0) {
      return "Incorrect";
    }
  
    // Case when all answers match
    if (correctMatches.length === normalizedCorrectAnswers.length) {
      return "Correct";
    }
  
    // Case when some answers match
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
                    <strong>Question: </strong>{response.questionText}
                  </div>
                  <div className="your-answer">
                    <strong>Your Answer(s): </strong>
                    <div className="answer-list">
                      {normalizeAnswers(response.studentAnswer).map((answer, idx) => (
                        <div key={idx}>{answer}</div>
                      ))}
                    </div>
                  </div>
                  <div className="correct-answers">
                    <strong>Correct Answer(s): </strong>
                    <div className="answer-list">
                      {removeDuplicates(normalizeAnswers(response.correctAnswers)).map((answer, idx) => (
                        <div key={idx} className="correct-answer">{answer}</div>
                      ))}
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
