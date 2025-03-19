import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CreateQuestion.css";

const CreateQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract data from state passed via navigation
  const { professor_id, noQuestions, category } = location?.state;

  const [questionContent, setQuestionContent] = useState(""); 
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [answers, setAnswers] = useState([{ answerContent: "", isCorrect: false }]);
  const [questionsAdded, setQuestionsAdded] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [professorId, setProfessorId] = useState(professor_id);

  useEffect(() => {
    // Log received state for debugging
    console.log("Received location.state:", location.state);

    // Fetch categories from the backend
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/categories");
        console.log("Fetched categories:", response.data);
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [location.state]);

  // Handle form submission for a single question
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting question:", questionContent);
    console.log("Current answers:", answers);

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

      console.log(`Added question ${questionsAdded + 1}:`, {
        questionContent,
        answers: answers.map((answer) => ({
          answerContent: answer.answerContent,
          isCorrect: answer.isCorrect,
        })),
      });
    } else {
      alert(`You have reached the maximum number of ${noQuestions} questions.`);
    }

    // Reset answers for the next question
    setAnswers([{ answerContent: "", isCorrect: false }]);
  };

  // Add a new answer input field
  const handleAddAnswer = () => {
    setAnswers([...answers, { answerContent: "", isCorrect: false }]);
    console.log("Added new answer field. Total answers:", answers.length + 1);
  };

  const handleAnswerChange = (index, e) => {
    const { name, value } = e.target;
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer, i) => (i === index ? { ...answer, [name]: value } : answer))
    );
    console.log(`Updated answer ${index + 1}:`, value);
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
    console.log(`Updated correct answer at index ${index}`);
  };

  const handleMultipleChoiceChange = () => {
    setIsMultipleChoice((prev) => !prev);
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) => ({ ...answer, isCorrect: false }))
    );
    console.log("Multiple choice mode changed to:", !isMultipleChoice);
  };

  const handleSubmitAnswers = async (questionBankId, answers) => {
    const token = localStorage.getItem("token");
  
    console.log("Submitting answers:", answers);
  
    try {
      const response = await axios.post(
        "http://localhost:5000/api/answers",
        {
          question_bank_id: questionBankId,
          answers: answers.map(answer => ({
            answerContent: answer.answerContent,
            isCorrect: answer.isCorrect,
            score: answer.isCorrect ? 1 : 0 // Assign score based on correctness
          }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("Answers saved successfully:", response.data);
      alert("Answers saved!");
    } catch (err) {
      console.error("Error saving answers:", err);
      alert("There was an error saving the answers.");
    }
  };
  

  // Submit the full quiz with all questions
  const handleSubmitQuiz = async () => {
    const token = localStorage.getItem("token");

    if (!selectedCategory) {
      alert("Please select a valid category.");
      return;
    }

    const formData = {
      professor_id: professorId,
      category: selectedCategory,
      questionContent: questionContent,
      isMultipleChoice: isMultipleChoice,
    };

    console.log("Submitting quiz with data:", formData);

    try {
      const response = await axios.post("http://localhost:5000/api/questions", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        console.log("Quiz submitted successfully:", response.data);
        alert("Question added successfully to Question Bank!");

        const questionBankId = response.data.question_bank_id; 
        await handleSubmitAnswers(questionBankId, answers);

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
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
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

          <button type="button" onClick={handleAddAnswer}>Add Another Answer</button>

          <button
            type="button"
            onClick={handleQuestionSubmit}
            disabled={questionsAdded >= noQuestions} 
          >
            Add New Question
          </button>

          <button type="button" onClick={handleSubmitQuiz}>Submit Quiz</button>
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
                <li key={idx}>{answer}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateQuestion;
