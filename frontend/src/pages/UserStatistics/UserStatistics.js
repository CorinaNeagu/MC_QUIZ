import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserStatistics.css';
import { jwtDecode } from 'jwt-decode';

import Sidebar from "../../components/Sidebar/Sidebar";
import PieChartComponent from "../../components/Stats/PieChart/PieChart";
import BarChart from '../../components/Stats/BarChart/BarChart';
import GroupLeaderboard from '../../components/Stats/GroupLeaderboard/GroupLeaderboard';
import RetakeLineChart from '../../components/Stats/LineChart/LineChart';

const UserStatistics = () => {
  const [userType, setUserType] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [studentId, setStudentId] = useState(null);

  const [expandedSections, setExpandedSections] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUserType(decoded.userType);
      setStudentId(decoded.id);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, []);

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

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section) 
        : [...prev, section]               
    );
  };

  const renderStudentSections = () => (
    <div className="accordion-container">

      <div className="accordion-item">
        <button
          className="accordion-header"
          onClick={() => toggleSection('pieChart')}
        >
          Quiz Category {expandedSections.includes('pieChart') ? '▲' : '▼'}
        </button>
        {expandedSections.includes('pieChart') && (
          <div className="accordion-content">
            <PieChartComponent />
          </div>
        )}
      </div>

      <div className="accordion-item">
        <button
          className="accordion-header"
          onClick={() => toggleSection('lineChart')}
        >
          Retake History {expandedSections.includes('lineChart') ? '  ▲' : '  ▼'}
        </button>
        {expandedSections.includes('lineChart') && (
          <div className="accordion-content">
            <h3>Retake History</h3>
              <RetakeLineChart studentId={studentId} />
          </div>
        )}
      </div>

      <div className="accordion-item">
        <button
          className="accordion-header"
          onClick={() => toggleSection('barChart')}
        >
          Bar Chart {expandedSections.includes('barChart') ? '▲' : '▼'}
        </button>

          {expandedSections.includes('barChart') && (
            <div className="accordion-content">
              <div className = "dropdown">
              <label className="select-label" htmlFor="categorySelect">Select a Category</label>
              <select
                id="categorySelect"
                className="custom-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>

              <label className="select-label" htmlFor="subcategorySelect">Select a Subcategory</label>
              <select
                id="subcategorySelect"
                className="custom-select"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((sub, idx) => (
                  <option key={idx} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              </div>

              {selectedCategory ? (
                <BarChart
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  margin={{ bottom: 200 }}
                />
              ) : (
                <p className="info-text">Select a category to see quizzes</p>
              )}
            </div>
          )}
      </div>
    </div>
  );

  const renderProfessorSections = () => (
    <div className="accordion-container">

      <div className="accordion-item">
        <button
          className="accordion-header"
          onClick={() => toggleSection('barChart')}
        >
          Quiz Average {expandedSections.includes('barChart') ? '▲' : '▼'}
        </button>
        {expandedSections.includes('barChart') && (
          <div className="accordion-content">
            <BarChart selectedCategory={selectedCategory} />
          </div>
        )}
      </div>

      <div className="accordion-item">
        <button
          className="accordion-header"
          onClick={() => toggleSection('groupLeaderboard')}
        >
          Group Leaderboard {expandedSections.includes('groupLeaderboard') ? '▲' : '▼'}
        </button>
        {expandedSections.includes('groupLeaderboard') && (
          <div className="accordion-content">
            <GroupLeaderboard />
          </div>
        )}
      </div>

    </div>
  );

  return (
    <div className="statistics-container">
      <Sidebar showBackButton={true} />
      <h2 className="header">📊📈 Quiz Statistics</h2>

      <div className="charts-section">
        {userType === 'student'
          ? renderStudentSections()
          : userType === 'professor'
            ? renderProfessorSections()
            : <p>Loading...</p>}
      </div>
    </div>
  );
};

export default UserStatistics;
