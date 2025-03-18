import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CreateQuestion.css";

const CreateQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch noQuestions from the location state passed via navigate in CreateQuiz.js
  const noQuestions = location?.state?.noQuestions;

  const [question, setQuestion] = useState(""); // State for the question content
  const [isMultipleChoice, setIsMultipleChoice] = useState(false); // Whether the question is multiple choice
  const [answers, setAnswers] = useState([{ answerContent: "", isCorrect: false }]); // Array of answers
  const [questionsAdded, setQuestionsAdded] = useState(0); // Track how many questions are added
  const [questionList, setQuestionList] = useState([]); // List of added questions to display below the form

  // Handle the form submission
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    const correctAnswersCount = answers.filter((answer) => answer.isCorrect).length;

    // Prevent submitting if no question or answers are provided
    if (!question || answers.some((answer) => !answer.answerContent)) {
      alert("Please enter a valid question and answers.");
      return;
    }

    if (!isMultipleChoice && correctAnswersCount !== 1) {
      alert("You must select exactly one correct answer.");
      return;
    }

    if (questionsAdded < noQuestions) {
      // Add the question and answers to the list
      setQuestionList([
        ...questionList,
        {
          questionContent: question,
          answers: answers.map((answer) => answer.answerContent),
        },
      ]);

      // Increment the question count
      setQuestionsAdded(questionsAdded + 1);
    } else {
      alert(`You have reached the maximum number of ${noQuestions} questions.`);
    }

    // Clear the form after submitting
    setQuestion(""); // Reset question
    setAnswers([{ answerContent: "", isCorrect: false }]); // Reset answers
  };

  // Add a new answer input field
  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false }]);
  };

  // Handle input change for answers
  const handleAnswerChange = (index, e) => {
    const { name, value } = e.target;
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) => (i === index ? { ...answer, [name]: value } : answer))
    );
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (index) => {
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) =>
        isMultipleChoice
          ? i === index
            ? { ...answer, isCorrect: !answer.isCorrect }
            : answer
          : { ...answer, isCorrect: i === index }
      )
    );
  };

  // Toggle multiple choice
  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice((prev) => !prev);
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) => ({ ...answer, isCorrect: false }))
    );
  };

  // Add a new question
  const handleAddNewQuestion = () => {
    if (questionsAdded < noQuestions) {
      // Prevent adding blank questions or answers
      if (!question || answers.some((answer) => !answer.answerContent)) {
        alert("Please enter a valid question and answers.");
        return;
      }

      // Add the current question to the list immediately after clicking "Add New Question"
      setQuestionList([
        ...questionList,
        {
          questionContent: question,
          answers: answers.map((answer) => answer.answerContent),
        },
      ]);
      setQuestionsAdded(questionsAdded + 1); // Increment the question count

      // Reset form fields for a new question
      setQuestion(""); // Clear question
      setAnswers([{ answerContent: "", isCorrect: false }]); // Clear answers
    } else {
      alert(`You have reached the maximum number of ${noQuestions} questions.`);
    }
  };

  // Submit the quiz
  const handleSubmitQuiz = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in first.");
      return;
    }

    const formData = {
      questionList, // Sending the question list to backend
    };

    try {
      const response = await axios.post("http://localhost:5000/api/quizzes/questions", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        alert("Quiz submitted successfully!");
        // Navigate to the next page after submission (could be a success page or quiz preview page)
        navigate("/quiz-preview");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("There was an error submitting the quiz.");
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Add Questions to Quiz</h2>
      <div className="create-quiz-form-wrapper">
        <form onSubmit={handleQuestionSubmit} className="create-quiz-form">
          <div className="form-group">
            <label htmlFor="question">Question Content</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              placeholder="Enter your question here"
            />
          </div>

          <div className="multiple-choice-label">
            <label htmlFor="isMultipleChoice">Multiple Choice?</label>
            <input
              type="checkbox"
              id="isMultipleChoice"
              checked={isMultipleChoice}
              onChange={handleMultipleChoiceChange}
            />
          </div>

          {answers.map((answer, index) => (
            <div key={index} className="answer-container">
              <label htmlFor={`answer-${index}`}>Answer {index + 1}</label>
              <input
                type="text"
                name="answerContent"
                id={`answer-${index}`}
                value={answer.answerContent}
                onChange={(e) => handleAnswerChange(index, e)}
                required
                placeholder={`Enter answer ${index + 1}`}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={answer.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                />
                Mark as Correct
              </label>
            </div>
          ))}

          <button 
            type="button" 
            onClick={handleAddAnswer}
            disabled={questionsAdded >= noQuestions} // Disable button if max questions are added
          >
            Add Another Answer
          </button>

          <button
            type="button"
            onClick={handleAddNewQuestion}
            className="add-new-question-button"
            disabled={questionsAdded >= noQuestions} // Disable button if max questions are added
          >
            Add New Question
          </button>

          {questionsAdded >= noQuestions && (
            <div className="limit-reached-message">
              You have reached the maximum number of questions ({noQuestions}).
            </div>
          )}

          {/* Change the button from Preview Quiz to Submit Quiz */}
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="submit-quiz-button"
          >
            Submit Quiz
          </button>
        </form>
      </div>

      <div className="added-questions">
        <h3>Questions Added:</h3>
        {questionList.map((questionData, index) => (
          <div key={index} className="added-question">
            <h4>Question {index + 1}:</h4>
            <p>{questionData.questionContent}</p>
            <ul>
              {questionData.answers.map((answer, idx) => (
                <li key={idx}>
                  {answer}{" "}
                  {answers[idx]?.isCorrect && <span style={{ color: 'green' }}>(Correct)</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateQuestion;
