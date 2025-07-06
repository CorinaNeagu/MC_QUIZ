import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from '../../components/Sidebar/Sidebar';
import './GroupDetails.css';

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

  const handleDeadlineSave = async () => {
  if (!deadlineQuiz) return;

  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `http://localhost:5000/api/user/update-deadline/${deadlineQuiz.quiz_id}`,
      { deadline: deadlineValue },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.status === 200) {
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((q) =>
          q.quiz_id === deadlineQuiz.quiz_id ? { ...q, deadline: deadlineValue } : q
        )
      );
      alert('Deadline updated successfully!');
      closeDeadlineModal();
    }
  } catch (error) {
    console.error("Failed to update deadline:", error);
    alert('Failed to update deadline. Please try again.');
  }
};


  const openModal = async (quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
    setAttempts([]);
    setAttemptsError(null);
    setAttemptsLoading(true);

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
  };

  const openDeadlineModal = (quiz) => {
  setDeadlineQuiz(quiz);
  setDeadlineValue(quiz.deadline ? new Date(quiz.deadline).toISOString().slice(0,16) : '');
  setIsDeadlineModalOpen(true);
};

const closeDeadlineModal = () => {
  setIsDeadlineModalOpen(false);
  setDeadlineQuiz(null);
  setDeadlineValue('');
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
              className = "btn-display-bar">
                Chart 
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

  return (
    <div className="group-details-page">
      <Sidebar showBackButton />

      <button className="btn-back" onClick={handleBackToGroups}>
        ❮❮ Back to Your Groups
      </button>
      <h2>Assigned Quizzes</h2>

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

            <button className="btn-more" onClick={() => openDeadlineModal({ quiz_id, title, deadline })}>
              Update Deadline
            </button>
            

          </li>
        ))}
      </ul>

      <ModalGroupDetails isOpen={isModalOpen} onClose={closeModal} title={selectedQuiz?.title}>
        {attemptsLoading && <p>Loading attempts...</p>}
        {attemptsError && <p className="error-text">{attemptsError}</p>}
        {!attemptsLoading && !attemptsError && attempts.length === 0 && <p>No attempts found.</p>}
        {!attemptsLoading && attempts.length > 0 && (
                <table className="attempts-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Attempted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(({ student_id, username, score, attempted_at }) => (
                      <tr key={student_id}>
                        <td>{username}</td>
                        <td>{score}</td>
                        <td>{new Date(attempted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
        )}
      </ModalGroupDetails>

      {isDeadlineModalOpen && (
        <div className="modal-backdrop" onClick={closeDeadlineModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Deadline for: {deadlineQuiz?.title}</h2>
            </div>
            <div className="modal-content">
              <input
                type="datetime-local"
                className = "datetime"
                value={deadlineValue}
                onChange={e => setDeadlineValue(e.target.value)}
              />
              <div style={{ marginTop: '1rem' }}>
                <button onClick={handleDeadlineSave}>Save Deadline</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
