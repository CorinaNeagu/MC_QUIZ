import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from '../../components/Sidebar/Sidebar';
import './GroupDetails.css';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GroupDetails = () => {
  const { groupId } = useParams();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');
  const [deadlineQuiz, setDeadlineQuiz] = useState(null);

    const [showChart, setShowChart] = useState(false);


  useEffect(() => {
    if (!groupId) return;

    const fetchAssignedQuizzes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/group/details/student-assigned-quizzes/${groupId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setQuizzes(response.data);
      } catch {
        setError("Failed to load assigned quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedQuizzes();
  }, [groupId]);




  const openModal = async (quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
    setAttempts([]);
    setAttemptsError(null);
    setAttemptsLoading(true);
    setShowChart(false);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/group/details/quiz-attempts/${groupId}/${quiz.quiz_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttempts(response.data);
    } catch {
      setAttemptsError("Failed to load quiz attempts");
    } finally {
      setAttemptsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
    setAttempts([]);
    setAttemptsError(null);
    setShowChart(false);
  };



  const handleBackToGroups = () => {
    navigate(`/groups`);
  };

  const ModalGroupDetails = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              className = "btn-display-bar"
              onClick={() => setShowChart(prev => !prev)}>
                {showChart ? "Hide chart" : "Show chart"}
            </button>
          </div>
          <div className="modal-content">{children}</div>
        </div>
      </div>
    );
  };

  if (loading) return <p>Loading assigned quizzes...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes assigned for this group.</p>;

  const renderCustomLegend = (props) => {
  const { payload } = props; 

  return (
    <div style={{ display: 'flex', gap: 20, padding: 10, borderRadius: 6 }}>
      {payload.map((entry) => (
        <div key={entry.value} style={{ color: 'black', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, backgroundColor: entry.color, borderRadius: 3 }}></div>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

  return (
    <div className="group-details-page">
      <Sidebar showBackButton />

      <button className="btn-back" onClick={handleBackToGroups}>
        ❮❮ Back to Your Groups
      </button>
      <h2 className = "header">Assigned Quizzes</h2>

      <ul className="quiz-list assigned-quizzes">
        {quizzes.map(({ quiz_id, title, category_name, subcategory_name, deadline }) => (
          <li key={quiz_id} className="quiz-item quiz-card">
            <h3>{title}</h3>
            <p>
              <strong>Category:</strong> {category_name}
            </p>
            <p>
              <strong>Subcategory:</strong> {subcategory_name || "No subcategory"}
            </p>
            <p>
              <strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()}
            </p>
            <button className="btn-more" onClick={() => openModal({ quiz_id, title })}>
              See more
            </button>
          </li>
        ))}
      </ul>

      <ModalGroupDetails
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedQuiz?.title}
      >
        {attemptsLoading && <p>Loading attempts...</p>}
        {attemptsError && <p className="error-text">{attemptsError}</p>}
        {!attemptsLoading && !attemptsError && attempts.length === 0 && <p>No attempts found.</p>}

        {!attemptsLoading && attempts.length > 0 && (
          <>
           {showChart ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attempts}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="username" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend content={renderCustomLegend} />
                    <Bar dataKey="percentage_score" fill="#007bff" name="Grade (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <table className="attempts-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Attempted At</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(({ student_id, username, raw_score, percentage_score, attempted_at }) => (
                    <tr key={student_id}>
                      <td>{username}</td>
                      <td>{raw_score}</td>
                      <td>{percentage_score}%</td>
                      <td>{new Date(attempted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </ModalGroupDetails>
    </div>
  );
};

export default GroupDetails;
