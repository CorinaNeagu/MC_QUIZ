import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const BarChart = ({ selectedCategory }) => {
  const [quizData, setQuizData] = useState([]);  // Initialized as empty array
  const [professorData, setProfessorData] = useState([]);  // Initialized as empty array
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        navigate("/");
      } else {
        setUserType(decodedToken.userType);
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Student-specific data fetch
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
      if (userType === "student" && selectedCategory) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Fetched student quiz data:", response.data);
          setQuizData(response.data);  // Set quiz data for the student
        } catch (err) {
          console.error("Error fetching student quiz data:", err);
        }
      } else if (userType === "professor") {
        try {
          const response = await axios.get(
            'http://localhost:5000/api/stats/professor-grade-distribution',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Fetched professor grade distribution:", response.data);
          setProfessorData(response.data);  // Set professor data
        } catch (err) {
          console.error("Error fetching professor grade distribution:", err);
        }
      }
    };
  
    fetchData();
  }, [userType, selectedCategory]);
  

  // Check if loading or error
  if (loading) return <p>Loading...</p>;
  if (error) return <div>{error}</div>;

  // Log the quizData and professorData just before rendering the chart
  console.log('quizData:', quizData);
  console.log('professorData:', professorData);

  // Ensure quizData and professorData are non-empty arrays
  if (userType === "student" && (!quizData || quizData.length === 0)) {
    return <div>No quizzes found for the selected category.</div>;
  }

  if (userType === "professor" && (!professorData || professorData.length === 0)) {
    return <div>No grade distribution data found.</div>;
  }

  // === Chart Rendering Logic ===

  const renderBarChart = (data, labelKey, valueKey) => {
    const maxValue = Math.max(...data.map(entry => parseFloat(entry[valueKey])), 100);
    const chartHeight = 300;
    const barWidth = 60;
    const barSpacing = 30;
    const topPadding = 30;
  
    return (
      <svg width={data.length * (barWidth + barSpacing) + 100} height={chartHeight + topPadding + 50}>
        {[0, 20, 40, 60, 80, 100].map(tick => {
          const y = topPadding + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={tick}>
              <line x1="40" y1={y} x2="1000" y2={y} stroke="#ccc" />
              <text x="35" y={y - 5} textAnchor="end" fontSize="12">{tick}</text>
            </g>
          );
        })}
  
        {data.map((entry, index) => {
          const barHeight = (parseFloat(entry[valueKey]) / maxValue) * chartHeight;
          const x = 60 + index * (barWidth + barSpacing);
          return (
            <g key={entry[labelKey]}>
              <rect
                x={x}
                y={topPadding + chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill="#4B9CD3"
              />
              <text
                x={x + barWidth / 2}
                y={topPadding + chartHeight - barHeight - 5}
                textAnchor="middle"
                fontSize="12"
              >
                {entry[valueKey]}
              </text>
              <text
                x={x + barWidth / 2}
                y={topPadding + chartHeight + 15}
                textAnchor="middle"
                fontSize="12"
              >
                {entry[labelKey].length > 10 ? entry[labelKey].slice(0, 10) + '…' : entry[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };
  

  return (
    <div className="bar-chart-wrapper">
      {/* Render for student */}
      {userType === "student" && quizData.length > 0 && (
        <>
          <h3>Quiz Scores for Category: {selectedCategory}</h3>
          {renderBarChart(quizData, "quiz_title", "real_score")} 
        </>
      )}
  
      {userType === "student" && quizData.length === 0 && (
        <div>No quizzes found for the selected category.</div>  
      )}
  
      {/* Render for professor */}
      {userType === "professor" && professorData.length > 0 && (
        <>
          <h3>Average Grades for Your Quizzes</h3>
          {renderBarChart(professorData, "name", "value")}  
        </>
      )}
  
      {userType === "professor" && professorData.length === 0 && (
        <div>No grade distribution data found.</div>  
      )}
    </div>
  );
  
};

export default BarChart;
