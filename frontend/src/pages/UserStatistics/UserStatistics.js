import React, { useEffect, useState } from 'react';import axios from 'axios';
import './UserStatistics.css'; // Make sure to add your CSS here
import Sidebar from "../../components/Sidebar/Sidebar";
import PieChartComponent from "../../components/PieChart/PieChart";
import BarChart from '../../components/BarChart/BarChart';
import LineChart from '../../components/LineChart/LineChart';

const UserStatistics = () => {
  const [quizId, setQuizId] = useState(null); // Track selected quizId
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("Select a quiz");

  useEffect(() => {
    const fetchUniqueQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/stats/unique-quizzes', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Set the quizzes in state
        setQuizzes(response.data);
      } catch (error) {
        console.error('Error fetching unique quizzes:', error);
      }
    };

    fetchUniqueQuizzes();
  }, []);
  
  const handleQuizSelect = (id) => {
    setQuizId(id); // Update the quizId when a quiz is selected
  };

  const handleQuizChange = (event) => {
    setSelectedQuizId(event.target.value);
    setQuizId(event.target.value); // Update quizId for LineChart component
  };


  return (
    <div className='statistics-container'>
      <Sidebar showBackButton={true} />

      <div className="charts-section">
      <h1>Quiz Statistics</h1>

      <div className="chart-container">
        <div className="chart-card">
          <PieChartComponent />
        </div>

        <div className="chart-card">
          <BarChart />
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

    </div>
    </div>
  );
};


export default UserStatistics;
