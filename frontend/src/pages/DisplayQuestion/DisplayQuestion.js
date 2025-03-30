import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const DisplayQuestion = () => {
  const { quizId, attemptId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const navigate = useNavigate();

  const user_id = localStorage.getItem("user_id");

  useEffect(() => {
    setStartTime(new Date().getTime());

    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to take the quiz.");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/takeQuiz/quiz/${quizId}/questions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setQuestions(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Error loading quiz questions.");
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId]);

  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers(prevAnswers => {
      const sanitizedQuestionId = Number(questionId);
      const currentAnswers = prevAnswers[sanitizedQuestionId] || [];
  
      if (currentAnswers.includes(selectedOption)) {
        return {
          ...prevAnswers,
          [sanitizedQuestionId]: currentAnswers.filter(id => id !== selectedOption),
        };
      } else {
        return {
          ...prevAnswers,
          [sanitizedQuestionId]: [...currentAnswers, selectedOption],
        };
      }
    });
  };
  
  const submitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized: Please log in again.");
        return;
      }
  
      const formattedAnswers = {};
  
      for (const [questionId, selectedAnswerIds] of Object.entries(answers)) {
        const sanitizedQuestionId = Number(questionId);
        const sanitizedAnswerIds = selectedAnswerIds.map(answerId => {
          const sanitizedAnswerId = Number(answerId);
          return isNaN(sanitizedAnswerId) ? null : sanitizedAnswerId; 
        }).filter(answerId => answerId !== null); 
  
        if (sanitizedAnswerIds.length > 0) {
          formattedAnswers[sanitizedQuestionId] = sanitizedAnswerIds;
        }
      }
  
      const endTime = new Date().getTime();
      const timeTaken = Math.floor((endTime - startTime) / 1000);
  
      const response = await axios.post(
        `http://localhost:5000/api/score/quiz_attempts/${attemptId}/submit`,
        {
          answers: formattedAnswers, 
          quiz_id: quizId,
          student_id: user_id,
          start_time: startTime,
          end_time: endTime,
          time_taken: timeTaken,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      navigate(`/display-score/${attemptId}`);
        } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Error submitting the quiz.");
    }
  };
  
  
  

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prevIndex => {
      if (prevIndex < questions.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex; 
    });
  };

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="question-container">
      {questions.length > 0 ? (
        <div>
          <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <p>{questions[currentQuestionIndex].question_content}</p>
  
          <div className="options">
            {questions[currentQuestionIndex].answers.map((answer) => (
              <div key={answer.answer_id} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id={`answer-${answer.answer_id}`} // Correct string interpolation
                  checked={answers[questions[currentQuestionIndex].question_id]?.includes(answer.answer_id) || false}
                  onChange={() => handleAnswerSelect(
                    questions[currentQuestionIndex].question_id,
                    answer.answer_id
                  )}
                  className="checkbox-input"
                />
                <label htmlFor={`answer-${answer.answer_id}`} className="checkbox-label"> {/* Correct string interpolation */}
                  {answer.answer_content}
                </label>
              </div>
            ))}
          </div>
  
          <div className="button-group">
            <button className="next-btn" onClick={handleNextQuestion}>
              Next Question
            </button>
  
            <button className="submit-btn" onClick={submitQuiz}>
              Submit Quiz
            </button>
          </div>
        </div>
      ) : (
        <p>No questions found.</p>
      )}
    </div>
  );
  
};

export default DisplayQuestion;