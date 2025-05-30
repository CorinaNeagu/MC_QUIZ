import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import ModalGroupDetails from '../../components/Modal/ModalGroupDetails'
import Sidebar from '../../components/Sidebar/Sidebar'

const GroupDetails = () => {
  const { groupId } = useParams();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const url = `http://localhost:5000/api/group/details/student-assigned-quizzes/${groupId}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load assigned quizzes");
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
      const url = `http://localhost:5000/api/group/details/quiz-attempts/${groupId}/${quiz.quiz_id}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttempts(response.data);
      setAttemptsLoading(false);
    } catch (err) {
      setAttemptsError("Failed to load quiz attempts");
      setAttemptsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
    setAttempts([]);
    setAttemptsError(null);
  };

  if (loading) return <p>Loading assigned quizzes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes assigned for this group.</p>;

  return (
    <div>
      <h3>Assigned Quizzes</h3>

       <Sidebar showBackButton={true} />
      <ul>
        {quizzes.map(({ quiz_id, title, category_name, subcategory_name, deadline }) => (
          <li key={quiz_id} style={{ marginBottom: "1em" }}>
            <strong>{title}</strong> <em>({category_name} - {subcategory_name || 'No subcategory'})</em>
            <br />
            Deadline: {new Date(deadline).toLocaleDateString()}
            <br />
            <button onClick={() => openModal({ quiz_id, title })}>See more</button>
          </li>
        ))}
      </ul>

      <ModalGroupDetails isOpen={isModalOpen} onClose={closeModal} title={selectedQuiz?.title}>
        {attemptsLoading && <p>Loading attempts...</p>}
        {attemptsError && <p style={{ color: "red" }}>{attemptsError}</p>}
        {!attemptsLoading && !attemptsError && attempts.length === 0 && <p>No attempts found.</p>}
        {!attemptsLoading && attempts.length > 0 && (
          <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
