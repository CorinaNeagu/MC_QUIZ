import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const DisplayQuestion = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [studentId, setStudentId] = useState(() => {
    const storedId = localStorage.getItem("user_id");
    const parsedId = parseInt(storedId, 10);
    return isNaN(parsedId) ? 0 : parsedId; // Default to 0 if the value is not a valid integer
  });

  // Fetch quiz questions and start quiz attempt
  useEffect(() => {
    if (!quizId || !studentId) {
      console.error("No quizId or studentId, redirecting to home.");
      navigate("/home");
      return;
    }

    const startQuizAttempt = async () => {
      try {
        console.log("🔹 Starting quiz attempt for quiz:", quizId);
        const response = await axios.post(`http://localhost:5000/api/takeQuiz/quiz/${quizId}/start`, { studentId });

        console.log("✅ Quiz attempt started. Attempt ID:", response.data.attemptId);
        setAttemptId(response.data.attemptId);
      } catch (error) {
        console.error("❌ Error starting quiz attempt:", error);
        setLoading(false);
      }
    };

    startQuizAttempt();
  }, [quizId, studentId, navigate]);

  // Fetch questions after attemptId is set
  useEffect(() => {
    if (attemptId) {
      console.log("🔹 Attempt ID set, fetching questions...");
      fetchQuestions();
    }
  }, [attemptId]);

  // Fetch quiz questions and answers
  const fetchQuestions = async () => {
    try {
      console.log("🔹 Fetching quiz questions...");
      const questionsResponse = await axios.get(`http://localhost:5000/api/takeQuiz/quizzes/${quizId}/questions`);
      console.log("✅ Questions fetched:", JSON.stringify(questionsResponse.data, null, 2));

      const questionsWithAnswers = await Promise.all(
        questionsResponse.data.map(async (question) => {
          try {
            console.log(`🔹 Fetching answers for question ${question.question_bank_id}...`);
            const answersResponse = await axios.get(`http://localhost:5000/api/takeQuiz/questions/${question.question_bank_id}/answers`);
            console.log(`✅ Answers for question ${question.question_bank_id}:`, JSON.stringify(answersResponse.data, null, 2));

            return {
              ...question,
              options: answersResponse.data.length > 0 ? answersResponse.data : [],
            };
          } catch (error) {
            console.error(`❌ Error fetching answers for question ${question.question_bank_id}:`, error);
            return { ...question, options: [] };
          }
        })
      );

      setQuestions(questionsWithAnswers);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching quiz questions:", error);
      setLoading(false);
    }
  };

  // Handle answer change
  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = { ...prevAnswers, [questionId]: selectedOption };
      return updatedAnswers;
    });
  };

  // Calculate the score based on selected answers
  const calculateScore = () => {
    return questions.reduce((score, question) => {
      const selectedAnswerId = answers[question.question_bank_id];

      const correctAnswer = question.options.find((option) => option.is_correct);
      if (selectedAnswerId === correctAnswer?.answer_id) {
        return score + correctAnswer.score;
      }

      return score;
    }, 0);
  };

  // Submit responses separately
  // Submit responses separately
const submitResponses = async () => {
  const responses = Object.entries(answers)
    .map(([questionId, selectedOption]) => {
      const questionBankId = parseInt(questionId, 10);
      const selectedOptionId = parseInt(selectedOption, 10);

      const question = questions.find((q) => q.question_bank_id === questionBankId);

      if (!question) return null;

      const selectedOptionObj = question.options.find((option) => option.answer_id === selectedOptionId);
      if (!selectedOptionObj) return null;

      console.log("quizId:", quizId);
      console.log("attemptId:", attemptId);
      console.log("studentId:", studentId); // Ensure you are sending this

      return {
        student_id: studentId,  // Add student_id here
        question_bank_id: questionBankId,
        answer_id: selectedOptionId,
        quiz_id: parseInt(quizId, 10),
        attempt_id: attemptId,
        is_correct: selectedOptionObj.is_correct,
      };
    })
    .filter((response) => response !== null);

  console.log("Responses to be submitted:", responses);  // Add this log

  if (responses.length === 0) {
    console.error("❌ No valid responses to submit.");
    return null;  // If no responses, return null
  }

  return responses; // Return the responses
};


  

  // Final quiz submit
  // Final quiz submit
const handleSubmitQuiz = async () => {
  const score = calculateScore();

  // Get the responses and ensure it's properly returned
  const responses = await submitResponses();  // Make sure responses are obtained here

  // If responses are null, don't proceed with the submission
  if (!responses) {
    console.error("❌ No responses to submit.");
    return;
  }

  try {
    await axios.post(`http://localhost:5000/api/takeQuiz/quiz/${quizId}/attempt/${attemptId}/submit`, {
      studentId,
      score,
      responses,  // Pass the responses here
    });
    navigate(`/score/${attemptId}`, { state: { score, totalQuestions: questions.length } }); 
   } catch (error) {
    console.error("❌ Error submitting quiz:", error);
  }
};


  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };

  if (loading) return <div>Loading questions...</div>;
  if (questions.length === 0) return <div>No questions available for this quiz.</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <h2>Quiz</h2>
      <h3>Question {currentQuestionIndex + 1}</h3>
      <p>{currentQuestion.question_text}</p>

      <div className="options-container">
        {currentQuestion.options.length > 0 ? (
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
          <p>⚠️ No options available.</p>
        )}
      </div>

      <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
      <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>Next</button>
      <button onClick={handleSubmitQuiz}>Submit Quiz</button>
    </div>
  );
};

export default DisplayQuestion;
