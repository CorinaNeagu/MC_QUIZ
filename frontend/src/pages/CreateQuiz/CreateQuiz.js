import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";


const CreateQuiz = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [retakeAllowed, setRetakeAllowed] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [noQuestions, setNoQuestions] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [deductionPercentage, setDeductionPercentage] = useState(0);


  // Get user details from localStorage
  const user_id = localStorage.getItem("user_id"); 

  useEffect(() => {
    // Fetch categories from the backend
    const fetchCategories = async () => {
      try {
         const [catRes, subcatRes] = await Promise.all([
        axios.get("http://localhost:5000/api/categories"),
        axios.get("http://localhost:5000/api/subcategories")
      ]);
        setCategories(catRes.data.categories);
        setSubcategories(subcatRes.data.subcategories);
      } catch (error) {
        console.error("Error fetching categories and subcategories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token || !user_id) {
      alert("Please log in first.");
      return;
    }

    // Validate input fields
    const validTimeLimit = parseInt(timeLimit, 10);
    if (isNaN(validTimeLimit) || validTimeLimit <= 0) {
      alert("Please provide a valid time limit greater than 0.");
      return;
    }

    
    const validDeductionPercentage = deductionPercentage === "" || isNaN(deductionPercentage)? 0 : parseFloat(deductionPercentage);
    if (validDeductionPercentage < 0 || validDeductionPercentage > 100) {
      alert("Deduction percentage must be between 0 and 100.");
    return;
    }



    const validNoQuestions = parseInt(noQuestions, 10);
    if (isNaN(validNoQuestions) || validNoQuestions <= 0) {
      alert("Number of questions must be greater than 0.");
      return;
    }

    // Construct the form data to send to the server
    const formData = {
      title,
      category,
      subcategory,
      timeLimit: validTimeLimit,
      deductionPercentage: validDeductionPercentage,
      retakeAllowed: retakeAllowed ? 1 : 0,
      isActive: isActive ? 1 : 0,
      noQuestions: validNoQuestions,
    };

    console.log("Form Data:", formData);

    try {
      // API call to create a quiz
      const response = await axios.post("http://localhost:5000/api/quizzes", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        alert("Quiz created successfully!");
        const quizId = response.data.quizId;
        navigate(`/create-question/${quizId}`, {
          state: {
            professor_id: user_id,  // Pass user_id to create question
            noQuestions: validNoQuestions,
            category, // Pass selected category
            quizId,
          },
        });
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      alert("There was an error creating the quiz.");
    }
  };

  // Filter subcategories based on selected category
const filteredSubcategories = subcategories.filter(
  (subcat) => subcat.category_id === categories.find((cat) => cat.category_name === category)?.category_id
);

  return (
    <div className="create-quiz-container">
            <Sidebar showBackButton={true} /> 

      <h2>Create a New Quiz</h2>
      <form onSubmit={handleSubmit} className="create-quiz-form">

        <div className="form-group">
          <label htmlFor="title">Quiz Title</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select 
            id="category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            required
          >
            <option value="">Select a Category</option>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_name}>
                  {cat.category_name}
                </option>
              ))
            ) : (
              <option value="">Loading categories...</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subcategory">Subcategory</label>
          <select 
            id="subcategory" 
            value={subcategory} 
            onChange={(e) => setSubcategory(e.target.value)} 
            required
          >
            <option value="">Select a Subcategory</option>
            {filteredSubcategories.map((subcat) => (
              <option key={subcat.subcategory_id} value={subcat.subcategory_id}>
                {subcat.subcategory_name}
              </option>
            ))}
          </select>
        </div>


        <div className="form-group">
          <label htmlFor="timeLimit">Time Limit (minutes)</label>
          <input 
            type="number" 
            id="timeLimit" 
            value={timeLimit} 
            onChange={(e) => setTimeLimit(e.target.value)} 
            required 
          />
        </div>

         <div className="form-group">
          <label htmlFor="deductionPercentage">Deduction Percentage</label>
          <input
            type="number"
            step="0.01"
            id="deductionPercentage"
            value={deductionPercentage}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (value >= 0 && value <= 100)) {
                setDeductionPercentage(value);
              }
            }}
            required
          />
        </div>

               <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="retakeAllowed"
            checked={retakeAllowed}
            onChange={() => setRetakeAllowed(!retakeAllowed)}
            className="checkbox-input"
          />
          <label htmlFor="retakeAllowed" className="checkbox-custom"> </label>
          Allow Retakes
        </div>

        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
            className="checkbox-input"
          />
          <label htmlFor="isActive" className="checkbox-custom"></label>
          Activate Quiz
        </div>

        <div className="form-group">
          <label htmlFor="noQuestions">Number of Questions</label>
          <input 
            type="number" 
            id="noQuestions" 
            value={noQuestions} 
            onChange={(e) => setNoQuestions(e.target.value)} 
            required 
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-button">Next</button>
      </form>
    </div>
  );
};

export default CreateQuiz;
