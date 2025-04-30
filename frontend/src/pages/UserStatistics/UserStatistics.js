import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import './UserStatistics.css';
import Sidebar from "../../components/Sidebar/Sidebar";

const UserStatistics = () => {
  const [quizStats, setQuizStats] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizzesInCategory, setQuizzesInCategory] = useState([]);
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [pieChartData, setPieChartData] = useState([]);
  const [gradeDistributionData, setGradeDistributionData] = useState([]); // For the second pie chart

  useEffect(() => {
    const fetchQuizCategoryStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to see quiz statistics.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/stats/pie-chart/quiz-category', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && Array.isArray(response.data)) {
          setQuizStats(response.data);

          // Set pieChartData for the first chart
          const chartData = response.data.map((stat) => ({
            name: stat.category_name,
            value: stat.quizzes_taken,
            category_id: stat.category_id,
          }));
          setPieChartData(chartData); // Set pie chart data for the first chart
        } else {
          setError('No data available.');
        }
      } catch (err) {
        setError('Error fetching quiz category statistics.');
        console.error(err);
      }
    };

    fetchQuizCategoryStats();
  }, []); // Fetch quiz stats once when the component mounts

  // Fetch grade distribution data
  useEffect(() => {
    const fetchGradeDistributionData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to see grade distribution.');
          return;
        }
  
        const response = await axios.get('http://localhost:5000/api/stats/pie-chart/grade-distribution', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        // Log the entire API response to check its structure
        console.log('API Response:', response.data);
  
        if (response.data && Array.isArray(response.data)) {
          // Transform data for Recharts
          const transformed = response.data.map((quiz) => {
            const name = quiz.name || 'Unknown';  // Use 'name' field for quiz title
            const value = parseFloat(quiz.value);  // Convert value from string to number
  
            // Check if value is valid, otherwise default to 0
            return {
              name,
              value: isNaN(value) ? 0 : value,  // Default to 0 if value is not a valid number
            };
          });
  
          console.log('Transformed data:', transformed); // Log the transformed data to verify
  
          // Set the transformed data to state
          setGradeDistributionData(transformed);
        } else {
          setError('No grade distribution data available.');
        }
      } catch (err) {
        setError('Error fetching grade distribution data.');
        console.error(err);
      }
    };
  
    fetchGradeDistributionData();
  }, []);
  
  
  
  
   

  const handlePieClick = async (data, index, event) => {
    if (!data || !data.category_id) {
      console.error("Error: category_id is missing from the pie slice data!");
      return;
    }

    // Capture mouse position from the event
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const selectedCategoryId = data.category_id;
    setSelectedCategory(data.name);
    setModalPosition({ x: mouseX, y: mouseY });  // Set modal position to mouse coordinates
    setIsModalOpen(true);  // Open the modal

    try {
      const response = await axios.get(`http://localhost:5000/api/stats/quizzes-by-category/${selectedCategoryId}`);
      setQuizzesInCategory(response.data);
    } catch (err) {
      setError('Error fetching quizzes for the selected category');
      console.error(err);
    }
  };

  const COLORS = ['#4169E1', '#00CED1', '#191970', '#4B9CD3', '#ADD8E6'];

  return (
    <div>
      <h1>Quiz Category Statistics</h1>
      <Sidebar showBackButton={true} />

      {/* Check if quizStats exists and has data */}
      {quizStats.length > 0 ? (
        <div className="chart-container">
          {/* First Pie Chart Card */}
          <div className="chart-card">
            <h2>Quiz Categories</h2>
            <PieChart width={300} height={300}>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                isAnimationActive={isAnimationActive}
                animationDuration={1000}
                onClick={(data, index, event) => handlePieClick(data, index, event)}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-1-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Second Pie Chart Card for Grade Distribution */}
          {gradeDistributionData.length > 0 ? (
            <div className="chart-card">
              <h2>Grade Distribution</h2>
              <PieChart width={400} height={400}>
                <Pie
                  data={gradeDistributionData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={150}
                  fill="#8884d8"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          ) : (
            <p>No grade distribution data available.</p>
          )}
        </div>
      ) : (
        <p>No data available</p>
      )}

      {/* Modal remains unchanged */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            left: `${modalPosition.x + 10}px`,
            top: `${modalPosition.y + 10}px`,
          }}
        >
          <h2>Quizzes in Category: {selectedCategory}</h2>
          {quizzesInCategory.length > 0 ? (
            <ul>
              {quizzesInCategory.map((quiz) => (
                <li key={quiz.quiz_id}>{quiz.quiz_title}</li>
              ))}
            </ul>
          ) : (
            <p>No quizzes found in this category.</p>
          )}
          <button onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default UserStatistics;
