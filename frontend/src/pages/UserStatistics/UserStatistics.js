import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserStatistics.css';
import { jwtDecode } from 'jwt-decode';

import Sidebar from "../../components/Sidebar/Sidebar";
import PieChartComponent from "../../components/Stats/PieChart/PieChart";
import BarChart from '../../components/Stats/BarChart/BarChart';
import GroupLeaderboard from '../../components/Stats/GroupLeaderboard/GroupLeaderboard';

const UserStatistics = () => {
  const [userType, setUserType] = useState(null);

  // Student-specific states
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Decode token to get user type
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUserType(decoded.userType);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, []);

  // Fetch quizzes (for students)
  useEffect(() => {
    if (userType !== "student") return;

    const fetchStudentQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/stats/unique-quizzes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(res.data);
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
      }
    };

    fetchStudentQuizzes();
  }, [userType]);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories for a selected category
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const uniqueSubs = [...new Set(res.data.map(q => q.subcategory_name))];
        setSubcategories(uniqueSubs);
      } catch (err) {
        console.error("Failed to fetch subcategories:", err);
      }
    };

    fetchSubcategories();
  }, [selectedCategory]);

  const renderStudentCharts = () => (
    <div className="chart-container">
      <div className="chart-card">
        <PieChartComponent />
      </div>

      <div className="chart-card">
        <p>Select a Category</p>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Select a Category</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
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
    </div>
  );

  const renderProfessorCharts = () => (
    <div className="chart-container">
      <div className="chart-card">
        <BarChart selectedCategory={selectedCategory} />
      </div>
      
      <div className="chart-card">
        <GroupLeaderboard />
      </div>
    </div>
  );

  return (
    <div className="statistics-container">
      <Sidebar showBackButton={true} />
      <h2 className = "header">📊📈 Quiz Statistics</h2>

      <div className="charts-section">
        {userType === "student"
          ? renderStudentCharts()
          : userType === "professor"
          ? renderProfessorCharts()
          : <p>Loading...</p>}
      </div>
    </div>
  );
};

export default UserStatistics;
