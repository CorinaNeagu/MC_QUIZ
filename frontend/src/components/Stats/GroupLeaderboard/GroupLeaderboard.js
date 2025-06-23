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
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate('/');
  }, [navigate, token]);

  // Fetch groups on mount or token change
  useEffect(() => {
    if (!token) return;

    const fetchGroups = async () => {
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

  // Fetch quizzes when group changes and single quiz toggle is on
  useEffect(() => {
    if (!token || !selectedGroup || !useSingleQuiz) {
      setQuizzes([]);
      setSelectedQuiz('');
      return;
    }

    const fetchQuizzes = async () => {
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

  // Fetch leaderboard when dependencies change
  useEffect(() => {
    if (!token || !selectedGroup) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = useSingleQuiz && selectedQuiz ? { quizId: selectedQuiz } : {};
        const res = await axios.get(
          `http://localhost:5000/api/stats/group-leaderboard/${selectedGroup}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
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

  const formatUsername = (name) => (name.length > 10 ? name.slice(0, 10) + '…' : name);

  return (
    <div className="leaderboard-wrapper">
      <h3 className="leaderboard-title">Group Leaderboard</h3>

      <div className="controls">
        {/* Group Selector */}
        <div className="control-group">
          <label htmlFor="group-select" className="control-label">Select Group:</label>
          <select
            id="group-select"
            className="control-select"
            value={selectedGroup}
            onChange={e => {
              setSelectedGroup(e.target.value);
              setSelectedQuiz('');
              setLeaderboard([]);
            }}
          >
            <option value="">Choose a group</option>
            {groups.map(group => (
              <option key={group.group_id} value={group.group_id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>

        {/* Single Quiz Toggle */}
        <div className="control-group checkbox-group">
          <input
            type="checkbox"
            id="quiz-toggle"
            className="checkbox-input"
            checked={useSingleQuiz}
            onChange={e => setUseSingleQuiz(e.target.checked)}
          />
          <label htmlFor="quiz-toggle" className="checkbox-label">
            View leaderboard for a specific quiz
          </label>
        </div>

        {/* Quiz Selector */}
        {useSingleQuiz && quizzes.length > 0 && (
          <div className="control-group">
            <label htmlFor="quiz-select" className="control-label">Select Quiz:</label>
            <select
              id="quiz-select"
              className="control-select"
              value={selectedQuiz}
              onChange={e => setSelectedQuiz(e.target.value)}
            >
              <option value="">Choose a quiz</option>
              {quizzes.map(quiz => (
                <option key={quiz.quiz_id} value={quiz.quiz_id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="chart-container">
        {loading ? (
          <p>Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p>No leaderboard data found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={leaderboard}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="username"
                tickFormatter={formatUsername}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
                className="x-axis"
              />
              <YAxis domain={[0, 100]} className="y-axis" />
              <Tooltip
                formatter={value => (typeof value === 'number' ? value.toFixed(1) : value)}
                labelFormatter={label => `User: ${label}`}
              />
              <Bar
                dataKey="average_score"
                fill="#4a90e2"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default GroupLeaderboard;
