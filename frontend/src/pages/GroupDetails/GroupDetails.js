import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ModalGroupDetails from '../../components/Modal/ModalGroupDetails'
import Sidebar from '../../components/Sidebar/Sidebar'
import './GroupDetails.css';

const GroupDetails = () => {
  const { groupId } = useParams();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);

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

  const handleBackToGroups= () => {
    navigate(`/groups`);
  };

  if (loading) return <p>Loading assigned quizzes...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes assigned for this group.</p>;

  return (
    <div className="group-details-page">
      <Sidebar showBackButton />

      <button className = "btn-back" 
                  onClick={handleBackToGroups}>
          ❮❮ Back to Your Groups
          </button>
      <h3>Assigned Quizzes</h3>

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
            <button className = "btn-more" 
                    onClick={() => openModal({ quiz_id, title })}>
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
        {!attemptsLoading && !attemptsError && attempts.length === 0 && (
          <p>No attempts found.</p>
        )}
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
    </div>
  );
};

export default GroupDetails;