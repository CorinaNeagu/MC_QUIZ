import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const COLORS = ['#4169E1', '#00CED1', '#191970', '#4B9CD3', '#ADD8E6'];

const PieChartComponent = () => {
  const [quizStats, setQuizStats] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizzesInCategory, setQuizzesInCategory] = useState([]);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);

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

          // Prepare the data for Pie chart
          const chartData = response.data.map((stat) => ({
            name: stat.category_name,
            value: stat.quizzes_taken,
            category_id: stat.category_id,
          }));
          console.log(chartData);
          setPieChartData(chartData);  // Store the data for pie chart
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
  
  

  return (
    <div className="chart-container">
      {pieChartData.length > 0 ? (
        <div className="chart-card">
          <h2>Quiz Categories</h2>
          <PieChart width={300} height={300}>
            <Pie
              data={pieChartData}  // Use pieChartData here
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              fill="#8884d8"
              isAnimationActive={true}
              animationDuration={1000}
              onClick={(data, index, event) => handlePieClick(data, index, event)}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      ) : (
        <p>No data available for the pie chart.</p>
      )}

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

export default PieChartComponent;
