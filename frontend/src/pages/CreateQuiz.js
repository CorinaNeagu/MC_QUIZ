import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateQuiz.css";

const CreateQuiz = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [deductionPercentage, setDeductionPercentage] = useState("");
  const [retakeAllowed, setRetakeAllowed] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [noQuestions, setNoQuestions] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in first.");
      return;
    }

    const formData = {
      title,
      category,
      timeLimit: parseInt(timeLimit),
      deductionPercentage: parseFloat(deductionPercentage),
      retakeAllowed: retakeAllowed ? 1 : 0,
      isActive: isActive ? 1 : 0,
      noQuestions: parseInt(noQuestions),
    };

    try {
      const response = await axios.post("http://localhost:5000/api/quizzes", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        alert("Quiz created successfully!");
        const quizId = response.data.quizId;
        navigate(`/create-question/${quizId}`);
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      alert("There was an error creating the quiz.");
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Create a New Quiz</h2>
      <form onSubmit={handleSubmit} className="create-quiz-form">
        
        <div className="form-group">
          <label htmlFor="title">Quiz Title</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select a Category</option>
            <option value="Cybernetics">Cybernetics</option>
            <option value="Statistics">Statistics</option>
            <option value="Informatics">Informatics</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="timeLimit">Time Limit (minutes)</label>
          <input type="number" id="timeLimit" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="deductionPercentage">Deduction Percentage</label>
          <input type="number" step="0.01" id="deductionPercentage" value={deductionPercentage} onChange={(e) => setDeductionPercentage(e.target.value)} required />
        </div>

        {/* Checkbox for Allow Retakes */}
        <div className="form-group checkbox-container">
          <label htmlFor="retakeAllowed">Allow Retakes</label>
          <input type="checkbox" id="retakeAllowed" checked={retakeAllowed} onChange={() => setRetakeAllowed(!retakeAllowed)} />
        </div>

        {/* Checkbox for Activate Quiz */}
        <div className="form-group checkbox-container">
          <label htmlFor="isActive">Activate Quiz</label>
          <input type="checkbox" id="isActive" checked={isActive} onChange={() => setIsActive(!isActive)} />
        </div>

        <div className="form-group">
          <label htmlFor="noQuestions">Number of Questions</label>
          <input type="number" id="noQuestions" value={noQuestions} onChange={(e) => setNoQuestions(e.target.value)} required />
        </div>

        <button type="submit" className="submit-button">Next</button>
      </form>
    </div>
  );
};

export default CreateQuiz;
