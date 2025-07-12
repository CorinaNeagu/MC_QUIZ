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
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(
          'http://localhost:5000/api/groups/professor-groups',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGroups(data);
      } catch {
        setGroups([]);
      }
    };

    fetchGroups();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedGroup || !useSingleQuiz) {
      setQuizzes([]);
      setSelectedQuiz('');
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/groups/student-assigned-quizzes/${selectedGroup}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuizzes(data);
      } catch {
        setQuizzes([]);
      }
    };

    fetchQuizzes();
  }, [token, selectedGroup, useSingleQuiz]);

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
        const { data } = await axios.get(
          `http://localhost:5000/api/stats/group-leaderboard/${selectedGroup}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
          }
        );
        setLeaderboard(data);
      } catch {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, selectedGroup, selectedQuiz, useSingleQuiz]);

  const formatUsername = (name) =>
    name.length > 10 ? `${name.slice(0, 10)}…` : name;

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    setSelectedQuiz('');
    setUseSingleQuiz(false);
    setLeaderboard([]);
  };

  const handleQuizChange = (e) => setSelectedQuiz(e.target.value);

  const handleToggleSingleQuiz = (e) => {
    setUseSingleQuiz(e.target.checked);
    if (!e.target.checked) setSelectedQuiz('');
  };

  return (
    <div className="leaderboard-wrapper">
      <h2 className="header2">Group Leaderboard</h2>

      <div className="controls">
        <div className="control-group full-width">
          <label htmlFor="group-select" className="control-label">
            Select Group:
          </label>
          <select
            id="group-select"
            className="control-select"
            value={selectedGroup}
            onChange={handleGroupChange}
          >
            <option value="" disabled>
              Choose a group
            </option>
            {groups.map(({ group_id, group_name }) => (
              <option key={group_id} value={group_id}>
                {group_name}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div className="controls-inline">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="quiz-toggle"
                className="checkbox-input"
                checked={useSingleQuiz}
                onChange={handleToggleSingleQuiz}
              />
              <label htmlFor="quiz-toggle" className="checkbox-label">
                View leaderboard for a specific quiz
              </label>
            </div>

            <div className="control-group quiz-select-inline">
              <label htmlFor="quiz-select" className="control-label">
                Select Quiz:
              </label>
              <select
                id="quiz-select"
                className="control-select"
                value={selectedQuiz}
                onChange={handleQuizChange}
                disabled={!useSingleQuiz}
              >
                <option value="" disabled>
                  Choose a quiz
                </option>
                {quizzes.map(({ quiz_id, title }) => (
                  <option key={quiz_id} value={quiz_id}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
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
                formatter={(value) =>
                  typeof value === 'number' ? value.toFixed(1) : value
                }
                labelFormatter={(label) => `User: ${label}`}
              />
              <Bar
                dataKey="average_score"
                name="Score"
                fill="#4a90e2"
                radius={[6, 6, 0, 0]}
                isAnimationActive
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
