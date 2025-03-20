import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./HomePage.css";
import DropdownMenu from "../../components/DropdownMenu";

const HomePage = () => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login"); // Redirect to login if there's no token
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        navigate("/login"); // If token is expired, navigate to login
      } else {
        setUserType(decodedToken.userType); // Set the user type
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/login"); // Redirect to login if the token is invalid
    } finally {
      setLoading(false); // Set loading to false after the process is complete
    }
  }, [navigate]);

  // Fetch quizzes and categories
  useEffect(() => {
    if (userType === "student") {
      // Fetch quizzes from backend
      axios
        .get("http://localhost:5000/api/display/quizzes") // Adjust API endpoint as needed
        .then((response) => {
          setQuizzes(response.data);
          setFilteredQuizzes(response.data); // Initially display all quizzes
        })
        .catch((error) => {
          console.error("Error fetching quizzes:", error);
        });

      // Fetch categories for the dropdown filter
      axios
        .get("http://localhost:5000/api/categories") // Adjust API endpoint as needed
        .then((response) => {
          setCategories(response.data.categories); // Access categories array here
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
        });
    }
  }, [userType]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);

    // Filter quizzes based on the selected category
    const filtered = quizzes.filter((quiz) =>
      categoryId ? quiz.category_id === parseInt(categoryId) : true
    );
    setFilteredQuizzes(filtered);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();

    const filtered = quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(query)
    );
    setFilteredQuizzes(filtered);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="homepage-container">
      {/* Separate Header Section */}
      <div className="homepage-header">
        <h1>Welcome to Your Dashboard</h1>
        <DropdownMenu />
      </div>

      {userType === "student" ? (
        <div className="student-content">
          <h3>Available Quizzes</h3>

          {/* Search Bar and Category Filter on the same line */}
          <div className="filters-container">
            {/* Search Bar with Magnifying Glass Icon */}
            <div className="search-bar-container">
              <input
                type="text"
                placeholder="Search quizzes by title..."
                onChange={handleSearchChange}
                className="search-bar"
              />
              <i className="fas fa-search search-icon"></i>
            </div>

            {/* Category Filter */}
            <div className="category-filter">
              <select
                onChange={handleCategoryChange}
                value={selectedCategory}
                className="category-select"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display Quizzes */}
          {filteredQuizzes.length === 0 ? (
            <p>No quizzes available at the moment.</p>
          ) : (
            <div className="quiz-card-container">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="quiz-card">
                  <h4>{quiz.title}</h4>
                  <p>Category: {quiz.category_id}</p>
                  <button
                    className="start-quiz-btn"
                    onClick={() => navigate(`/quiz/${quiz.quiz_id}`)}
                  >
                    Start Quiz
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : userType === "professor" ? (
        <div className="professor-content">
          <h2>Professor Dashboard</h2>
          <p>Welcome, professor! Here you can manage quizzes, view your students' progress, and update your profile.</p>
          <button onClick={() => navigate("/manage-quizzes")}>Manage Quizzes</button>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
          <button onClick={() => navigate("/create-quiz")}>Create Quiz</button>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default HomePage;
