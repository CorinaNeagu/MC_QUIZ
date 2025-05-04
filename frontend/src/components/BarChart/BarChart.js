import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BarChart = () => {
  const [gradeDistributionData, setGradeDistributionData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGradeDistributionData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/stats/pie-chart/grade-distribution', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGradeDistributionData(response.data);
      } catch (err) {
        setError('Error fetching grade distribution data.');
        console.error(err);
      }
    };

    fetchGradeDistributionData();
  }, []);

  if (gradeDistributionData.length === 0) return null;

  const maxValue = Math.max(...gradeDistributionData.map(entry => entry.value));

  // Calculate dimensions dynamically
  const barWidth = 80;
  const gap = 20;
  const chartHeight = 400;
  const totalWidth = gradeDistributionData.length * (barWidth + gap);

  return (
    <div className="bar-chart-container" style={{ width: '100%', overflowX: 'auto' }}>
      <h2>Grade Distribution</h2>
      {error && <p>{error}</p>}

      <svg width="100%" height={chartHeight} viewBox={`0 0 ${totalWidth} ${chartHeight}`}>
        {gradeDistributionData.map((entry, index) => {
          const barHeight = (entry.value / maxValue) * (chartHeight - 50); // padding for labels
          const x = index * (barWidth + gap);

          return (
            <g key={index} transform={`translate(${x}, 0)`}>
              <rect
                y={chartHeight - barHeight - 30}
                width={barWidth}
                height={barHeight}
                fill="#4B9CD3"
                className="bar-element"
              />
              <text
                x={barWidth / 2}
                y={chartHeight - 5}
                textAnchor="middle"
                fontSize="14"
                fill="#000"
              >
                {entry.name}
              </text>
              <text
                x={barWidth / 2}
                y={chartHeight - barHeight - 40}
                textAnchor="middle"
                fontSize="14"
                fill="#000"
              >
                {entry.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;
