import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [tempSelectedQuizId, setTempSelectedQuizId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!showAssignModal) {
      setTempSelectedQuizId('');
      setDeadline('');
    }
  }, [showAssignModal, setDeadline]);

const handleAssign = () => {
  if (!tempSelectedQuizId) {
    alert('Please select a quiz.');
    return;
  }
  if (!deadline) {
    alert('Please provide a deadline.');
    return;
  }
  setSelectedQuizId(tempSelectedQuizId);
  handleAssignQuiz(modalGroupId, tempSelectedQuizId, deadline);
  closeAssignModal();
};



  return (
    showAssignModal && (
      <div className="modal-backdrop" onClick={closeAssignModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Assign Quiz to Group</h2>

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
              <label htmlFor="quiz-select">Select a quiz</label>
              <select
                id="quiz-select"
                value={tempSelectedQuizId}
                onChange={(e) => setTempSelectedQuizId(e.target.value)}
              >
                <option value="">-- Select a quiz --</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.quiz_id} value={quiz.quiz_id}>
                    {quiz.title} - {quiz.category_name} - {quiz.subcategory_name || 'No Subcategory'}
                  </option>
                ))}
              </select>

              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <button className="btn-modal" onClick={handleAssign}>Assign</button>
              <button className="btn-modal" onClick={() => navigate('/manage-quizzes')}>
                Go to Manage Quizzes
              </button>
            </div>
          ) : (
            <div className="create-quiz">
              <button
                onClick={() => navigate('/create-quiz')}
              >
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
