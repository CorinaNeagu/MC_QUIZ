import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Modal.css';  

const Modal = ({
  showAssignModal,
  closeAssignModal,
  modalGroupId,
  setSelectedQuizId,
  selectedQuizId,
  deadline,
  setDeadline,
  setModalMode,
  modalMode,
  quizzes,
  handleAssignQuiz
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1])); 
        const userType = decodedToken.userType;

        if (userType !== 'professor') {
          console.log('User is not a professor, skipping quiz fetch');
          return; // Don't fetch quizzes if the user is not a professor
        }

        // Fetch quizzes if the user is a professor
        const res = await axios.get('http://localhost:5000/api/user/professor/quizzes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        quizzes = res.data; 
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      }
    };

    if (modalMode === 'choose') {
      fetchQuizzes(); 
    }
  }, [modalMode]);

  return (
    showAssignModal && (
      <div className="modal-backdrop" onClick={closeAssignModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Assign Quiz to Group</h2>
          <p>Group ID: {modalGroupId}</p>

          <div className="modal-tabs">
            <button
              className={modalMode === 'choose' ? 'active' : ''}
              onClick={() => setModalMode('choose')}
            >
              Choose Existing
            </button>
            <button
              className={modalMode === 'create' ? 'active' : ''}
              onClick={() => setModalMode('create')}
            >
              Create New
            </button>
          </div>

          {modalMode === 'choose' ? (
            <div className="choose-quiz">
              <label>Select a quiz</label>
              <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
                <option value="">Select a quiz</option>
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <option key={quiz.quiz_id} value={quiz.quiz_id}>
                      {quiz.title} - {quiz.category_name} - {quiz.subcategory_name || 'No Subcategory'}
                    </option>
                  ))
                ) : (
                  <option disabled>No quizzes available</option>
                )}
              </select>

              <label>Deadline (optional)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <button className = "btn-modal" onClick={handleAssignQuiz}>Assign</button>
              <button className = "btn-modal" onClick={() => navigate('/manage-quizzes')}>Go to Manage Quizzes</button>
            </div>
          ) : (
            <div className="create-quiz">
              <button onClick={() => navigate('/create-quiz', 
                { state: { assignToGroupId: modalGroupId } })}>
                Go to Create Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Modal;
