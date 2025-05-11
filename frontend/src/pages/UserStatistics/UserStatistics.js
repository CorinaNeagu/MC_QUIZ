import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserStatistics.css'; // Make sure to add your CSS here
import { jwtDecode } from 'jwt-decode';
import Sidebar from "../../components/Sidebar/Sidebar";
import PieChartComponent from "../../components/PieChart/PieChart";
import BarChart from '../../components/BarChart/BarChart';
import LineChart from '../../components/LineChart/LineChart';

const UserStatistics = () => {
  const [userType, setUserType] = useState(null);
  const [quizId, setQuizId] = useState(null); // Track selected quizId
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("Select a quiz");
  const [categories, setCategories] = useState([]); // State to store categories
  const [selectedCategory, setSelectedCategory] = useState(''); // State to store selected category
  const[subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(''); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserType(decoded.userType);
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, []);

  // Fetch unique quizzes for the student
  useEffect(() => {
    if (userType === "student") {
      const fetchUniqueQuizzes = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/stats/unique-quizzes', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setQuizzes(response.data);
        } catch (error) {
          console.error('Error fetching unique quizzes:', error);
        }
      };

      fetchUniqueQuizzes();
    }
  }, [userType]);

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
  const fetchSubcategoriesFromQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (selectedCategory) {
        const response = await axios.get(
          `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const subcategories = [...new Set(response.data.map(q => q.subcategory_name))];
        setSubcategories(subcategories);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  fetchSubcategoriesFromQuizzes();
}, [selectedCategory]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleQuizChange = (event) => {
    setSelectedQuizId(event.target.value);
    setQuizId(event.target.value); // Update quizId for LineChart component
  };

  return (
    <div className="statistics-container">
      <Sidebar showBackButton={true} />

      <div className="charts-section">
        <h1>Quiz Statistics</h1>

        {userType === "student" ? (
          <div className="chart-container">
            <div className="chart-card">
              <PieChartComponent />
            </div>

          <div className="chart-card">
              <h2>Select a Category</h2>
              
              <select onChange={handleCategoryChange} value={selectedCategory}>
                <option value="">Select a Category</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>

            <select
              id="subcategorySelect"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
            >
              <option value="">All Subcategories</option>
              {subcategories.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>


            {selectedCategory ? (
              <BarChart
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
              />
            ) : (
              <p>Select a category to see quizzes</p>
            )}         
          </div>
           
            <div className="chart-card">
              <h2>Quiz Score Trends</h2>
              <select onChange={handleQuizChange} value={selectedQuizId}>
                <option value="">Select a Quiz</option>
                {quizzes.map(quiz => (
                  <option key={quiz.quiz_id} value={quiz.quiz_id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
              {quizId ? <LineChart quizId={quizId} /> : <p>Select a quiz to see trends</p>}
            </div>

          </div>
        ) : userType === "professor" ? (
          <div className="chart-container">

            <div className="chart-card">
              <BarChart selectedCategory={selectedCategory} /> {/* Pass selectedCategory */}
            </div>

            <div className="chart-card">
              <BarChart selectedCategory={selectedCategory} /> {/* Pass selectedCategory */}
            </div>

            <div className="chart-card">
              <BarChart selectedCategory={selectedCategory} /> {/* Pass selectedCategory */}
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default UserStatistics;
