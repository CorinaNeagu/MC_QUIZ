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

  // TEMP states for input and selection
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [tempSelectedQuiz, setTempSelectedQuiz] = useState(null);

  const navigate = useNavigate();

  // Reset temp state when modal closes
  useEffect(() => {
    if (!showAssignModal) {
      setTempSearchTerm('');
      setTempSelectedQuiz(null);
    }
  }, [showAssignModal]);

  // Update temp input and temp selection on input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setTempSearchTerm(val);

    const selected = quizzes.find(q => q.title === val);
    setTempSelectedQuiz(selected || null);
  };

  // Commit temp selection and call assign handler
  const handleAssign = () => {
    if (tempSelectedQuiz) {
      setSelectedQuizId(tempSelectedQuiz.quiz_id);  // commit selection here
    }
    handleAssignQuiz();
    closeAssignModal();
  };

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
              <input
                list="quiz-options"
                placeholder="Type or select a quiz"
                value={tempSearchTerm}
                onChange={handleInputChange}
              />

              <datalist id="quiz-options">
                {quizzes.map((quiz) => (
                  <option key={quiz.quiz_id} value={quiz.title}>
                    {quiz.title} - {quiz.category_name} - {quiz.subcategory_name || 'No Subcategory'}
                  </option>
                ))}
              </datalist>

              <label>Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <button className="btn-modal" onClick={handleAssign}>Assign</button>
              <button className="btn-modal" onClick={() => navigate('/manage-quizzes')}>Go to Manage Quizzes</button>
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
