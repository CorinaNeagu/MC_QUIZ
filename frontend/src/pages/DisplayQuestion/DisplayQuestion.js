import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const DisplayQuestion = () => {
  const { quizId } = useParams(); // Get the quizId from the URL params
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [studentId, setStudentId] = useState(localStorage.getItem("user_id")); // Get studentId from localStorage

  // Fetch the quiz questions and start quiz attempt
  useEffect(() => {
    if (!quizId || !studentId) {
      console.log("No quizId or studentId, redirecting to home.");
      navigate("/home"); // Redirect if no quizId or studentId is found
      return;
    }

    const startQuizAttempt = async () => {
      try {
        console.log("Starting quiz attempt...");
        const response = await axios.post(`http://localhost:5000/api/takeQuiz/quiz/${quizId}/start`, { studentId });
        setAttemptId(response.data.attemptId);
        fetchQuestions();
      } catch (error) {
        console.error("Error starting quiz attempt:", error);
        setLoading(false);
      }
    };

    startQuizAttempt();
  }, [quizId, studentId, navigate]);

  // Fetch quiz questions
 const fetchQuestions = async () => {
  try {
    console.log("Fetching quiz questions...");
    const response = await axios.get(`http://localhost:5000/api/takeQuiz/quizzes/${quizId}/questions`);
    console.log("Fetched Questions:", response.data);

    // Now fetch answers for each question
    const questionsWithAnswers = await Promise.all(
      response.data.map(async (question) => {
        const answersResponse = await axios.get(`http://localhost:5000/api/takeQuiz/quiz/answers/${question.question_bank_id}`);
        console.log(`Answers for question ${question.question_bank_id}:`, answersResponse.data);

        return {
          ...question, // Add the question data
          options: answersResponse.data, // Add the options (answers) to the question
        };
      })
    );

    setQuestions(questionsWithAnswers); // Set the state with questions and their answers
    setLoading(false);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    setLoading(false);
  }
};


  // Handle answer change for the current question
  const handleAnswerChange = (questionId, selectedOption) => {
    console.log(`Selected option ${selectedOption} for question ${questionId}`);
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: selectedOption,
    }));
  };

  // Navigate to the next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  // Navigate to the previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Calculate the score based on selected answers
  const calculateScore = () => {
    return questions.reduce((score, question) => {
      const selectedAnswerId = answers[question.question_bank_id];
      console.log(`Calculating score for question ${question.question_bank_id}. Selected Answer: ${selectedAnswerId}`);

      if (!question.options || question.options.length === 0) {
        console.log(`No options for question ${question.question_bank_id}`);
        return score;
      }

      const correctAnswer = question.options.find(option => option.is_correct);
      if (selectedAnswerId === correctAnswer?.answer_id) {
        console.log(`Correct answer selected for question ${question.question_bank_id}. Adding score: ${correctAnswer.score}`);
        return score + correctAnswer.score;
      }
      return score;
    }, 0);
  };

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    console.log("Submitting quiz...");
    if (!attemptId) {
      console.error("No attempt ID found");
      return;
    }
  
    const score = calculateScore();
    console.log("Score to submit:", score);
  
    // Prepare the responses to be submitted
    const responses = Object.entries(answers).map(([questionId, selectedOption]) => {
      const question = questions.find(q => q.question_bank_id === questionId);
      if (!question || !question.options || question.options.length === 0) {
        console.error(`No options found for question ${questionId}`);
        return null; // Skip this question if options are not available
      }
  
      const selectedOptionObj = question.options.find(option => option.answer_id === selectedOption);
      if (!selectedOptionObj) {
        console.error(`Selected option not found for question ${questionId}`);
        return null; // Skip this question if selected option is not found
      }
  
      const isCorrect = selectedOptionObj.is_correct;
      console.log(`Processing answer for questionId: ${questionId}, selectedOption: ${selectedOption}, isCorrect: ${isCorrect}`);
  
      return {
        student_id: studentId,
        quiz_id: quizId,
        question_bank_id: questionId,
        answer_id: selectedOption,
        attempt_id: attemptId,
        is_correct: isCorrect,
      };
    }).filter(response => response !== null); // Remove null responses
  
    console.log("Responses to submit:", responses);
  
    // If there are no valid responses, stop the submission
    if (responses.length === 0) {
      console.error("No valid responses to submit");
      return;
    }
  
    try {
      await axios.post(`http://localhost:5000/api/takeQuiz/quiz/${quizId}/attempt/${attemptId}/response`, responses);
      await axios.post(`http://localhost:5000/api/takeQuiz/quiz/${quizId}/attempt/${attemptId}/submit`, { studentId, score });
      navigate(`/score/${attemptId}`); // Redirect to the score page
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
    }
  };

  // Loading state and empty questions state
  if (loading) return <div>Loading questions...</div>;

  if (questions.length === 0) return <div>No questions available for this quiz.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  console.log("Current question:", currentQuestion);

  return (
    <div className="quiz-container">
      <h2>Quiz</h2>
      
      <div className="question-container">
        <h3>Question {currentQuestionIndex + 1}</h3>
        <p>{currentQuestion.question_text}</p>
        
        <div className="options-container">
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((option, index) => (
              <div key={index} className="option">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name={`question-${currentQuestion.question_bank_id}`}
                  value={option.answer_id}
                  checked={answers[currentQuestion.question_bank_id] === option.answer_id}
                  onChange={() => handleAnswerChange(currentQuestion.question_bank_id, option.answer_id)}
                />
                <label htmlFor={`option-${index}`}>{option.answer_content}</label>
              </div>
            ))
          ) : (
            <p>No options available for this question.</p>
          )}
        </div>

        <div className="navigation-buttons">
          <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </button>
          <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
            Next
          </button>
        </div>
      </div>

      <div className="submit-button">
        <button onClick={handleSubmitQuiz}>Submit Quiz</button>
      </div>
    </div>
  );
};

export default DisplayQuestion;
