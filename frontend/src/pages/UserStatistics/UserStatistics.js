import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Tooltip, Legend, Pie, Cell } from 'recharts';
import './UserStatistics.css';
import Sidebar from "../../components/Sidebar/Sidebar";

const UserStatistics = () => {
  const [quizStats, setQuizStats] = useState([]);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isAnimationActive, setIsAnimationActive] = useState(true);

  useEffect(() => {
    const fetchQuizCategoryStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to see quiz statistics.');
          return;
        }

        // Fetch data from the backend
        const response = await axios.get('http://localhost:5000/api/stats/pie-chart/quiz-category', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Check if the response contains valid data
        if (response.data && Array.isArray(response.data)) {
          setQuizStats(response.data);  // Set the quiz stats data
        } else {
          setError('No data available.');
        }
      } catch (err) {
        setError('Error fetching quiz category statistics.');
        console.error(err);
      }
    };

    fetchQuizCategoryStats();
  }, []);

  // Prepare chart data
  const chartData = quizStats.map((stat) => ({
    name: stat.category_name,
    value: stat.quizzes_taken,
  }));

  const handlePieClick = (data, index) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    // Enable animation when the page loads
    const timeout = setTimeout(() => {
      setIsAnimationActive(true);
    }, 500); // Start animation after 0.5s delay (you can adjust this)

    return () => clearTimeout(timeout); // Cleanup timeout when the component unmounts
  }, []);

  // Colors for each segment of the pie chart
  const COLORS = ['#4169E1', '#00CED1','#191970',  '#4B9CD3', '#ADD8E6'];

  return (
    <div>
      <h1>Quiz Category Statistics</h1>
      <Sidebar showBackButton={true}/>

      {/* Display pie chart if data is available */}
      {quizStats.length > 0 ? (
        <div style={{ height: 400, width: '100%' }}>
          <PieChart width={400} height={400}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={150}
              fill="#8884d8"
              isAnimationActive={isAnimationActive}  // Trigger animation on page load
              animationDuration={1000}  // Duration of the animation
              onClick={handlePieClick}  // Handle slice click
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={index === activeIndex ? 'black' : 'transparent'} // Highlight clicked slice
                  strokeWidth={index === activeIndex ? 4 : 0} // Increase stroke width for focus effect
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};



export default UserStatistics;
