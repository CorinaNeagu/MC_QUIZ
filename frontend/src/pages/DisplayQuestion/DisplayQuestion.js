import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./DisplayQuestion.css";

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); 
    [array[i], array[j]] = [array[j], array[i]]; 
  }
  return array;
};

const DisplayQuestion = () => {
  const { quizId, attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
  const storedIndex = localStorage.getItem(`quizIndex_${quizId}_${attemptId}`);
    return storedIndex ? Number(storedIndex) : 0;
  });

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null); 
  const [startTime, setStartTime] = useState(null);
  const user_id = localStorage.getItem("user_id");

  useEffect(() => {
    const storedStart = localStorage.getItem(`quizStartTime_${quizId}`);
    const storedAttempt = localStorage.getItem(`quizAttemptId_${quizId}`);

    if (storedStart && storedAttempt === attemptId) {
      const start = parseInt(storedStart, 10);
      const now = Date.now();
      const totalDurationSeconds = parseInt(localStorage.getItem(`quizDuration_${quizId}`), 10);
      const timePassed = Math.floor((now - start) / 1000);
      const remaining = totalDurationSeconds - timePassed;

      if (remaining <= 0) {
        submitQuiz(true);
      } else {
        setStartTime(start);
        setTimeLeft(remaining);
      }
    } else {
      const params = new URLSearchParams(location.search);
      const timeLeftFromUrl = parseInt(params.get("timeLeft"), 10);
      const startTimeFromUrl = parseInt(params.get("startTime"), 10);

      if (timeLeftFromUrl && startTimeFromUrl) {
        setStartTime(startTimeFromUrl);
        setTimeLeft(timeLeftFromUrl);

        localStorage.setItem(`quizStartTime_${quizId}`, startTimeFromUrl);
        localStorage.setItem(`quizAttemptId_${quizId}`, attemptId);
        localStorage.setItem(`quizDuration_${quizId}`, timeLeftFromUrl);
      }
    }

    const fetchQuestions = async () => {
      try {
        const storedQuestions = localStorage.getItem(`quizQuestions_${quizId}_${attemptId}`);
        const storedAnswers = localStorage.getItem(`quizAnswers_${quizId}_${attemptId}`);
        const storedIndex = localStorage.getItem(`quizIndex_${quizId}_${attemptId}`);


        if (storedQuestions) {
    const parsedQuestions = JSON.parse(storedQuestions);
    setQuestions(parsedQuestions);

    if (storedAnswers) {
      setAnswers(JSON.parse(storedAnswers));
    } else {
      const initialAnswers = parsedQuestions.reduce((acc, question) => {
        acc[question.question_id] = [];
        return acc;
      }, {});
      setAnswers(initialAnswers);
    }
    setLoading(false);
    return;
  }
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

      const shuffledQuestions = shuffleArray(response.data);
      shuffledQuestions.forEach((q) => {
        q.answers = shuffleArray(q.answers);
      });

      localStorage.setItem(`quizQuestions_${quizId}_${attemptId}`, JSON.stringify(shuffledQuestions));

      const initialAnswers = shuffledQuestions.reduce((acc, question) => {
        acc[question.question_id] = [];
        return acc;
      }, {});

      setQuestions(shuffledQuestions);
      setAnswers(initialAnswers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Error loading quiz questions.");
      setLoading(false);
    }
  };

  fetchQuestions();
}, [quizId, attemptId, location.search]);

useEffect(() => {
  localStorage.setItem(`quizIndex_${quizId}_${attemptId}`, currentQuestionIndex);
}, [currentQuestionIndex, quizId, attemptId]);



  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`quizAnswers_${quizId}_${attemptId}`, JSON.stringify(answers));
    }
  }, [answers, quizId, attemptId]);


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

  const submitQuiz = async (forceSubmit = false) => {
  const lastQuestionId = questions[questions.length - 1].question_id;
  const lastQuestionAnswer = answers[lastQuestionId];

  if (!forceSubmit && (!lastQuestionAnswer || lastQuestionAnswer.length === 0)) {
    alert("Please answer the last question before submitting the quiz.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Unauthorized: Please log in again.");
      return;
    }

    const formattedAnswers = {};
    for (const [questionId, selectedAnswerIds] of Object.entries(answers)) {
      const sanitizedQuestionId = Number(questionId);
      const sanitizedAnswerIds = selectedAnswerIds.map((answerId) => {
        const sanitizedAnswerId = Number(answerId);
        return isNaN(sanitizedAnswerId) ? null : sanitizedAnswerId;
      }).filter((answerId) => answerId !== null);

      if (sanitizedAnswerIds.length > 0) {
        formattedAnswers[sanitizedQuestionId] = sanitizedAnswerIds;
      }
    }

    // Add zero score for unanswered questions
    const unansweredQuestions = questions.filter(
      (question) => !formattedAnswers[question.question_id]
    );
    unansweredQuestions.forEach((question) => {
      formattedAnswers[question.question_id] = [0];
    });

    const endTime = new Date().getTime();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    await axios.post(
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

    localStorage.removeItem(`quizQuestions_${quizId}_${attemptId}`);
    localStorage.removeItem(`quizStartTime_${quizId}`);
    localStorage.removeItem(`quizAttemptId_${quizId}`);
    localStorage.removeItem(`quizDuration_${quizId}`);
    localStorage.removeItem(`quizAnswers_${quizId}_${attemptId}`);
    localStorage.removeItem(`quizIndex_${quizId}_${attemptId}`);

    navigate(`/display-score/${attemptId}`);
  } catch (err) {
    console.error("Error submitting quiz:", err);
    setError("Error submitting the quiz.");
  }
};

  
  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswers = answers[currentQuestion.question_id];

    if (!selectedAnswers || selectedAnswers.length === 0) {
      alert("Please select an answer before moving to the next question.");
      return; 
    } else {
      setError(""); 
      setCurrentQuestionIndex((prevIndex) => {
        if (prevIndex < questions.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="question-container">
      <div className={`timer-box ${timeLeft <= 60 ? "timer-warning" : ""}`}>
        <div className="time">{formatTime(timeLeft)}</div>
      </div>
  
      <div className="answer-container">
        {questions.length > 0 ? (
          <div className = "container">
            <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <div className = "pre-container">
                <pre className="preformatted">{questions[currentQuestionIndex].question_content}</pre>
            </div>  
            <div className="options">
              {questions[currentQuestionIndex].answers.map((answer) => {
                const isSelected = answers[questions[currentQuestionIndex].question_id]?.includes(answer.answer_id);
                return (
                  <div key={answer.answer_id} className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id={`answer-${answer.answer_id}`}
                      checked={isSelected}
                      onChange={() =>
                        handleAnswerSelect(questions[currentQuestionIndex].question_id, answer.answer_id)
                      }
                      className="checkbox-input"
                    />
                    <label
                      htmlFor={`answer-${answer.answer_id}`}
                      className={`checkbox-label ${isSelected ? "selected-answer" : ""}`}
                    >
                      <pre className="preformatted">{answer.answer_content}</pre>
                    </label>
                  </div>
                );
              })}
            </div>
  
            <div className="button-group">
              <button
                className="next-btn"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next Question
              </button>
  
              <button
                className="submit-btn"
                onClick={() => {
                  if (window.confirm("Are you sure you want to submit the quiz?")) {
                    submitQuiz();
                  }
                }}
              >
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
