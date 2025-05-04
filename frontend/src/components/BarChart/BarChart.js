import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BarChart = ({ selectedCategory }) => {
  const [quizData, setQuizData] = useState([]);

  useEffect(() => {
    if (selectedCategory) {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token');
  
          if (!token) {
            console.error("No token found.");
            return;
          }
  
          const response = await axios.get(
            `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
            {
              headers: {
                Authorization: `Bearer ${token}`, 
              },
            }
          );
  
          setQuizData(response.data);
        } catch (error) {
          console.error('Error fetching quiz data:', error);
        }
      };
  
      fetchData();
    }
  }, [selectedCategory]);
  

  // Get the maximum score to set the scaling of the bars
  const maxScore = Math.max(...quizData.map((quiz) => quiz.score));

  const chartWidth = 500;
  const chartHeight = 300;
  const barWidth = 50;

  const yTicks = [];
  for (let i = 0; i <= maxScore; i += 10) {
    yTicks.push(i);
  }

  const topPadding = 30;


  return (
    <div className="bar-chart-wrapper">
      <h3>Quiz Scores for Category: {selectedCategory}</h3>
      <div className="bar-chart-container">


      <svg width={chartWidth} height={chartHeight + topPadding + 50}>
        {/* Y-axis grid */}
        {yTicks.map((tick) => {
          const yPos = topPadding + (chartHeight - (tick / maxScore) * chartHeight);
          return (
            <g key={tick}>
              <line x1="450" y1={yPos} x2="10" y2={yPos} stroke="black" />
              <text x="25" y={yPos - 5} textAnchor="end" fontSize="12px" fill="black">
                {tick}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1="0"
          y1={topPadding + chartHeight}
          x2={chartWidth}
          y2={topPadding + chartHeight}
          stroke="black"
          strokeWidth="2"
        />

        {/* Bars */}
        {quizData.map((quiz, index) => {
          const barHeight = (quiz.score / maxScore) * chartHeight;
          const x = index * (barWidth + 20);
          return (
            <g key={quiz.title}>
              <rect
                x={x + 120}
                y={topPadding + (chartHeight - barHeight)}
                width={barWidth}
                height={barHeight}
                fill="rgba(75, 192, 192, 0.6)"
              />
              <text
                x={x + 120 + barWidth / 2}
                y={topPadding + (chartHeight - barHeight) - 5}
                textAnchor="middle"
                fill="black"
                fontSize="12px"
              >
                {quiz.score}
              </text>
              <text
                x={x + 120 + barWidth / 2}
                y={topPadding + chartHeight + 15}
                textAnchor="middle"
                fill="black"
                fontSize="12px"
              >
                {quiz.title}
              </text>
            </g>
          );
        })}
      </svg>

      </div>
    </div>
  );
  
};

export default BarChart;
