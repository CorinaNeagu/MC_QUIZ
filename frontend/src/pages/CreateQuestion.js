import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CreateQuestion.css";

const CreateQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch professor_id and noQuestions from location state passed via navigate in CreateQuiz
  const { professor_id, noQuestions, category } = location?.state;

  const [question, setQuestion] = useState(""); // State for the question content
  const [isMultipleChoice, setIsMultipleChoice] = useState(false); // Whether the question is multiple choice
  const [answers, setAnswers] = useState([{ answerContent: "", isCorrect: false }]); // Array of answers
  const [questionsAdded, setQuestionsAdded] = useState(0); // Track how many questions are added
  const [questionList, setQuestionList] = useState([]); // List of added questions to display below the form
  const [questionContent, setQuestionContent] = useState("")

  const [categories, setCategories] = useState([]); // State to store categories
  const [selectedCategory, setSelectedCategory] = useState(category); // State for selected category


  // Use professor_id from the location state if passed, or fall back to null
  const [professorId, setProfessorId] = useState(professor_id); 

  useEffect(() => {
    // Log the received state for debugging
    console.log("Received state:", location.state);

    // Fetch categories from the backend
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [location.state]); // Run this effect when location.state changes



  // Handle the form submission for each question
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    const correctAnswersCount = answers.filter((answer) => answer.isCorrect).length;

    if (!questionContent || answers.some((answer) => !answer.answerContent)) {
      alert("Please enter a valid question and answers.");
      return;
    }

    if (!isMultipleChoice && correctAnswersCount !== 1) {
      alert("You must select exactly one correct answer.");
      return;
    }

    if (questionsAdded < noQuestions) {
      setQuestionList([
        ...questionList,
        {
          questionContent,
          answers: answers.map((answer) => answer.answerContent),
        },
      ]);
      setQuestionsAdded(questionsAdded + 1);
    } else {
      alert(`You have reached the maximum number of ${noQuestions} questions.`);
    }

    setQuestionContent(""); 
    setAnswers([{ answerContent: "", isCorrect: false }]); 
  };

  // Add a new answer input field
  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false }]);
  };

  const handleAnswerChange = (index, e) => {
    const { name, value } = e.target;
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) => (i === index ? { ...answer, [name]: value } : answer))
    );
  };

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

  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice((prev) => !prev);
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) => ({ ...answer, isCorrect: false }))
    );
  };

  const handleAddNewQuestion = () => {
    if (questionsAdded < noQuestions) {
      if (!question || answers.some((answer) => !answer.answerContent)) {
        alert("Please enter a valid question and answers.");
        return;
      }

      setQuestionList([
        ...questionList,
        {
          questionContent: question,
          answers: answers.map((answer) => answer.answerContent),
        },
      ]);
      setQuestionsAdded(questionsAdded + 1);

      setQuestionContent(""); 
      setAnswers([{ answerContent: "", isCorrect: false }]);
    } else {
      alert(`You have reached the maximum number of ${noQuestions} questions.`);
    }
  };

  // When submitting the form, check if selectedCategory is valid
  const handleSubmitQuiz = async () => {
    const token = localStorage.getItem("token");
  
    // Validate that a category is selected
    if (!selectedCategory) {
      alert("Please select a valid category.");
      return;
    }

    console.log("Question content:", question);
  
    const formData = {
      professor_id: professorId,
      category: selectedCategory, // Send category_name as a string
      questionContent,
      isMultipleChoice: isMultipleChoice,
    };
  
    console.log("Submitting form with data:", formData);
  
    try {
      const response = await axios.post("http://localhost:5000/api/questions", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200) {
        alert("Question added successfully to Question Bank!");
      }
    } catch (err) {
      console.error("Error creating question:", err);
      alert("There was an error adding the question.");
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
            disabled={questionsAdded >= noQuestions} 
          >
            Add Another Answer
          </button>

          <button
            type="button"
            onClick={handleAddNewQuestion}
            className="add-new-question-button"
            disabled={questionsAdded >= noQuestions} 
          >
            Add New Question
          </button>

          {questionsAdded >= noQuestions && (
            <div className="limit-reached-message">
              You have reached the maximum number of questions ({noQuestions}).
            </div>
          )}

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
