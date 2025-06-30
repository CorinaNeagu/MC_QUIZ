import React from 'react';
import './ModalManageQuiz.css'; 

const ModalManageQuiz = ({
  showInspectModal,
  onCloseInspect,
  selectedQuizId,
  questions,
  answers,
  answersVisible,
  toggleAnswersVisibility,
  inspectQuiz,   

  showSettingsModal,
  onCloseSettings,
  selectedQuizSettings,
  editableSettings,
  handleSettingChange,
  handleToggleEdit,
  handleSaveSettings,
  quiz
}) => {
  return (
    <>
      {showInspectModal && (
        <div className="modal-backdrop" onClick={onCloseInspect}>
          <div 
            className="modal-content modal-content-inspect" 
            onClick={(e) => e.stopPropagation()}>
            <h3>Questions for Quiz: {inspectQuiz?.title}</h3>

            {questions.length === 0 ? (
              <p>No questions found.</p>
            ) : (
              <div className="modal-questions-wrapper">
                {questions.map((question) => (
                  <div key={question.question_id} className="question-card">
                    <h4>{question.question_content}</h4>
                    <button
                      onClick={() => toggleAnswersVisibility(question.question_id)}
                      className="btn-fetch-answers"
                    >
                      {answersVisible[question.question_id] ? 'Hide Answers' : 'Fetch Answers'}
                    </button>

                    {answersVisible[question.question_id] && answers[question.question_id] && (
                      <div className="answers-container">
                        <h5>Answers:</h5>
                        <ul className="answers-list">
                          {answers[question.question_id].map((a, idx) => (
                            <li key={idx}>
                              {a.answer_content}{' '}
                              {a.is_correct ? (
                                <span className="correct-tag">✅</span>
                              ) : (
                                <span className="incorrect-tag">❌</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div
            className={`modal-backdrop ${editableSettings ? 'settings-centered' : ''}`}
            onClick={onCloseSettings}
        >
            <div className="modal-content-edit" onClick={(e) => e.stopPropagation()}>
            <h3>Settings for Quiz: {quiz?.title}</h3>

            {editableSettings ? (
                <div className="settings-form">
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                    type="text"
                    name="title"
                    id="title"
                    value={editableSettings.title}
                    onChange={handleSettingChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="time_limit">Time Limit:</label>
                    <input
                    type="number"
                    name="time_limit"
                    id="time_limit"
                    value={editableSettings.time_limit}
                    onChange={handleSettingChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="deduction_percentage">Deduction Percentage:</label>
                    <input
                    type="number"
                    name="deduction_percentage"
                    id="deduction_percentage"
                    value={editableSettings.deduction_percentage}
                    onChange={handleSettingChange}
                    />
                </div>

                <div className = "row">
                <div className="form-group checkbox-group">
                    <label>
                    <input
                        type="checkbox"
                        name="retake_allowed"
                        checked={editableSettings.retake_allowed}
                        onChange={handleSettingChange}
                    />
                    Retake Allowed
                    </label>
                </div>

                <div className="form-group checkbox-group">
                    <label>
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={editableSettings.is_active}
                        onChange={handleSettingChange}
                    />
                    Is Active
                    </label>
                </div>
                </div>

                <button onClick={() => handleSaveSettings(quiz.quiz_id)}>
                    Save Settings
                </button>
                </div>
            ) : (
                <ul>
                <li><strong>Time Limit:</strong> {selectedQuizSettings.time_limit} minutes</li>
                <li><strong>Deduction %:</strong> {selectedQuizSettings.deduction_percentage}%</li>
                <li><strong>Retake Allowed:</strong> {selectedQuizSettings.retake_allowed ? 'Yes' : 'No'}</li>
                <li><strong>Is Active:</strong> {selectedQuizSettings.is_active ? 'Yes' : 'No'}</li>
                </ul>
            )}
            </div>
        </div>
        )}

    </>
  );
};

export default ModalManageQuiz;
