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
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 }); // Store mouse position

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

  const chartData = quizStats.map((stat) => ({
    name: stat.category_name,
    value: stat.quizzes_taken,
    category_id: stat.category_id,
  }));

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimationActive(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const COLORS = ['#4169E1', '#00CED1', '#191970', '#4B9CD3', '#ADD8E6'];

  return (
    <div>
      <h1>Quiz Category Statistics</h1>
      <Sidebar showBackButton={true} />

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
              isAnimationActive={isAnimationActive}
              animationDuration={1000}
              onClick={(data, index, event) => handlePieClick(data, index, event)} // Pass event here
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      ) : (
        <p>No data available</p>
      )}

      {/* Pop-up modal near the mouse pointer */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            left: `${modalPosition.x + 10}px`,  // Add a slight offset for better visibility
            top: `${modalPosition.y + 10}px`,
            position: 'absolute',
            zIndex: 1000,
            padding: '10px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
            width: '300px',
            height: 'auto',
            overflowY: 'auto',
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
