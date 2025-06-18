import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './GroupLeaderboard.css';

const GroupLeaderboard = () => {
  const [groups, setGroups] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [useSingleQuiz, setUseSingleQuiz] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/');
  }, [navigate, token]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/groups/professor-groups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data);
      } catch {
        setGroups([]);
      }
    };
    fetchGroups();
  }, [token]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!token || !selectedGroup || !useSingleQuiz) {
        setQuizzes([]);
        setSelectedQuiz('');
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:5000/api/groups/student-assigned-quizzes/${selectedGroup}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuizzes(res.data);
      } catch {
        setQuizzes([]);
      }
    };
    fetchQuizzes();
  }, [token, selectedGroup, useSingleQuiz]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!token || !selectedGroup) {
        setLeaderboard([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/stats/group-leaderboard/${selectedGroup}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: useSingleQuiz && selectedQuiz ? { quizId: selectedQuiz } : {},
          }
        );
        setLeaderboard(res.data);
      } catch {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, selectedGroup, selectedQuiz, useSingleQuiz]);

  const formatUsername = (name) => (name.length > 8 ? name.slice(0, 8) + '…' : name);

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>

      <div className="controls">
        <div className="select-container">
          <label htmlFor="group-select">Select Group:</label>
          <select
            id="group-select"
            className="dropdown"
            value={selectedGroup}
            onChange={e => {
              setSelectedGroup(e.target.value);
              setSelectedQuiz('');
              setLeaderboard([]);
            }}
          >
            <option value=""> Choose a group </option>
            {groups.map(group => (
              <option key={group.group_id} value={group.group_id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>

        <div className="checkbox-container">
          <input
            type="checkbox"
            id="quiz-toggle"
            checked={useSingleQuiz}
            onChange={e => setUseSingleQuiz(e.target.checked)}
          />
          <label htmlFor="quiz-toggle">View leaderboard for a specific quiz</label>
        </div>

        {useSingleQuiz && quizzes.length > 0 && (
          <div className="select-container">
            <label htmlFor="quiz-select">Select Quiz:</label>
            <select
              id="quiz-select"
              className="dropdown"
              value={selectedQuiz}
              onChange={e => setSelectedQuiz(e.target.value)}
            >
              <option value=""> Choose a quiz </option>
              {quizzes.map(quiz => (
                <option key={quiz.quiz_id} value={quiz.quiz_id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="chart-wrapper" style={{ width: '100%', height: 350 }}>
        {loading ? (
          <p className="message">Loading leaderboard...</p>
        ) : leaderboard.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={leaderboard}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="username"
                tickFormatter={formatUsername}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => 
                  typeof value === 'number' ? value.toFixed(1) : value
                }
                labelFormatter={(label) => `User: ${label}`}
              />
              <Bar
                dataKey="average_score"
                fill="#4a90e2"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="message">No leaderboard data yet.</p>
        )}
      </div>
    </div>
  );
};

export default GroupLeaderboard;
