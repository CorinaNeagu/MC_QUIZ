import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateQuiz.css"; // Add CSS for styling

const CreateQuiz = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ text: "", correct: false }]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Handle changes in form fields
  const handleQuizTitleChange = (e) => setQuizTitle(e.target.value);
  const handleQuestionChange = (e) => setQuestion(e.target.value);

  const handleOptionChange = (index, e) => {
    const newOptions = [...options];
    newOptions[index].text = e.target.value;
    setOptions(newOptions);
  };

  const handleCorrectChange = (index) => {
    const newOptions = [...options];
    newOptions[index].correct = !newOptions[index].correct;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: "", correct: false }]);
  };

  const removeOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizTitle || !question || options.some((option) => !option.text)) {
      setMessage("Please fill out all fields.");
      return;
    }

    const quizData = {
      quizTitle,
      question,
      options,
    };

    try {
      const response = await fetch("http://localhost:5000/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(quizData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Quiz created successfully!");
        navigate("/manage-quizzes"); // Redirect to quiz management page
      } else {
        setMessage(data.message || "Error creating quiz");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      setMessage("An error occurred while creating the quiz.");
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Create a New Quiz</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Quiz Title</label>
          <input
            type="text"
            value={quizTitle}
            onChange={handleQuizTitleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Question</label>
          <textarea
            value={question}
            onChange={handleQuestionChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} className="option">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e)}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={option.correct}
                  onChange={() => handleCorrectChange(index)}
                />
                Correct Answer
              </label>
              <button type="button" onClick={() => removeOption(index)}>
                Remove Option
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption}>
            Add Option
          </button>
        </div>

        <button type="submit">Create Quiz</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateQuiz;
