import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./DisplayQuestion.css";

const DisplayQuestion = () => {
  const { quizId, attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);  // Timer state
  const [startTime, setStartTime] = useState(null);
  const user_id = localStorage.getItem("user_id");

  // Extract timeLeft and startTime from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const timeLeftFromUrl = parseInt(params.get("timeLeft"), 10);
    const startTimeFromUrl = parseInt(params.get("startTime"), 10);

    if (timeLeftFromUrl) {
      setTimeLeft(timeLeftFromUrl);
    }
    if (startTimeFromUrl) {
      setStartTime(startTimeFromUrl);
    }

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
  }, [quizId, location.search]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers((prevAnswers) => {
      const sanitizedQuestionId = Number(questionId);
      const currentAnswers = prevAnswers[sanitizedQuestionId] || [];

      if (currentAnswers.includes(selectedOption)) {
        return {
          ...prevAnswers,
          [sanitizedQuestionId]: currentAnswers.filter((id) => id !== selectedOption),
        };
      } else {
        return {
          ...prevAnswers,
          [sanitizedQuestionId]: [...currentAnswers, selectedOption],
        };
      }
    });
  };

  // Submit quiz
  const submitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized: Please log in again.");
        return;
      }

      const formattedAnswers = {};

      // Loop through all the questions and their answers
      for (const [questionId, selectedAnswerIds] of Object.entries(answers)) {
        const sanitizedQuestionId = Number(questionId);
        const sanitizedAnswerIds = selectedAnswerIds.map((answerId) => {
          const sanitizedAnswerId = Number(answerId);
          return isNaN(sanitizedAnswerId) ? null : sanitizedAnswerId;
        }).filter((answerId) => answerId !== null);

        // Only include answers that have been selected
        if (sanitizedAnswerIds.length > 0) {
          formattedAnswers[sanitizedQuestionId] = sanitizedAnswerIds;
        }
      }

      // For any unanswered questions, assign them a score of 0
      // Here we assume that `questions` is an array of all the questions in the quiz.
      const unansweredQuestions = questions.filter((question) => !formattedAnswers[question.question_id]);

      // Mark unanswered questions with a score of 0
      unansweredQuestions.forEach((question) => {
        formattedAnswers[question.question_id] = [0]; // Assign 0 for unanswered questions
      });

      // Calculate time taken for quiz submission
      const endTime = new Date().getTime();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      // Send the quiz answers to the server along with the time taken and other data
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

      // Redirect to the display score page after submission
      navigate(`/display-score/${attemptId}`);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Error submitting the quiz.");
    }
  };

  // Handle navigation to next question
  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => {
      if (prevIndex < questions.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  // Format the timer
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <div className={`timer-box ${timeLeft <= 60 ? "timer-warning" : ""}`}>
        <div className="time">{formatTime(timeLeft)}</div>
      </div>
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
                    id={`answer-${answer.answer_id}`}
                    checked={answers[questions[currentQuestionIndex].question_id]?.includes(answer.answer_id) || false}
                    onChange={() => handleAnswerSelect(
                      questions[currentQuestionIndex].question_id,
                      answer.answer_id
                    )}
                    className="checkbox-input"
                  />
                  <label htmlFor={`answer-${answer.answer_id}`} className="checkbox-label">
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
    </div>
  );
};

export default DisplayQuestion;
