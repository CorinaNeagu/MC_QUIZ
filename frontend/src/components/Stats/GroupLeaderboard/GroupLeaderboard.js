  import React, { useEffect, useState } from 'react';
  import axios from 'axios';
  import { useNavigate } from 'react-router-dom';
  import './GroupLeaderboard.css';

  const GroupLeaderboard = () => {
    const [groups, setGroups] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [useSingleQuiz, setUseSingleQuiz] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

    const navigate = useNavigate();

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
      }
    }, [navigate]);

    useEffect(() => {
      const fetchGroups = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await axios.get('http://localhost:5000/api/groups/professor-groups', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGroups(res.data);
        } catch {
          setGroups([]);
        }
      };
      fetchGroups();
    }, []);

    useEffect(() => {
      const fetchQuizzes = async () => {
        const token = localStorage.getItem('token');
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
    }, [selectedGroup, useSingleQuiz]);

    useEffect(() => {
      const fetchLeaderboard = async () => {
        const token = localStorage.getItem('token');
        if (!token || !selectedGroup) {
          setLeaderboard([]);
          setLoading(false);
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
    }, [selectedGroup, selectedQuiz, useSingleQuiz]);

      const barWidth = 30;
      const gap = 20;
      const chartHeight = 300;
      const chartWidth = 400
      const leftPadding = 30;
      const rightPadding = 30;
      const topPadding = 30;
      const maxScore = Math.max(...leaderboard.map(s => s.average_score), 100);
      
      const renderBarChart = () => (
      <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
          role="img"
          aria-label="Leaderboard bar chart"
          preserveAspectRatio="xMinYMin meet"
      >
      {[0, 20, 40, 60, 80, 100].map(tick => {
        const y = topPadding + chartHeight - (tick / maxScore) * chartHeight;
              return (
              <g key={tick}>
              <line x1={leftPadding} y1={y} x2={chartWidth - rightPadding} y2={y} stroke="#ccc" />
              <text
                  x={leftPadding - 5}
                  y={y + 4}
                  fontSize="12"
                  textAnchor="end"
                  fill="#555"
              >
                  {tick}
              </text>
              </g>
          );
      })}

      {leaderboard.map((student, index) => {
        const barHeight = (student.average_score / maxScore) * chartHeight;
        const x = leftPadding + index * (barWidth + gap);
        const y = chartHeight - barHeight;

        return (
          <g
            key={student.student_id}
            tabIndex={0}
            onMouseEnter={(e) => {
              const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top,
                content: `${student.username}: ${Number(student.average_score).toFixed(1)}`,
              });
            }}
            onMouseMove={(e) => {
              const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              setTooltip(prev => ({
                ...prev,
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top,
              }));
            }}
            onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '' })}
          >
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" />
            <text
              x={x + barWidth / 2}
              y={y - 8}
              fontSize="12"
              fill="#2d3748"
              textAnchor="middle"
              fontWeight="600"
            >
              {student.average_score !== null && !isNaN(student.average_score)
                ? Number(student.average_score).toFixed(1)
                : '0.0'}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 20}
              fontSize="14"
              fill="#2d3748"
              fontWeight="600"
              textAnchor="middle"
              style={{ userSelect: 'none' }}
            >
              {student.username.length > 8
                ? student.username.slice(0, 8) + '…'
                : student.username}
            </text>
          </g>
        );
      })}

      <line
        x1={leftPadding}
        y1={chartHeight}
        x2={chartWidth - rightPadding}
        y2={chartHeight}
        stroke="#2d3748"
        strokeWidth={1.5}
      />
      </svg>
  );


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
              <option value="">-- Choose a group --</option>
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
              className="checkbox"
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
                <option value="">-- Choose a quiz --</option>
                {quizzes.map(quiz => (
                  <option key={quiz.quiz_id} value={quiz.quiz_id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="chart-wrapper">
          {loading ? (
            <p className="message">Loading leaderboard...</p>
          ) : leaderboard.length > 0 ? (
            renderBarChart()
          ) : (
            <p className="message">No leaderboard data yet.</p>
          )}
        </div>
      </div>
    );
  };

  export default GroupLeaderboard;
