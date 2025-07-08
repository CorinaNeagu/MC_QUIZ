import React, { useState, useEffect } from 'react';
import axios from "axios";


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
  quiz,
  quizGroups,
  setQuizGroups,
  selectedGroupId,
  setSelectedGroupId,
  selectedGroupDeadline,
  setSelectedGroupDeadline
}) => {

function formatDeadline(deadline) {
  if (!deadline) return '';
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

    const handleGroupChange = (e) => {
    setSelectedGroupId(Number(e.target.value));
  };

  const handleDeadlineChange = (e) => {
    setSelectedGroupDeadline(e.target.value);
  };



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
                    <pre className="preformatted">{question.question_content}</pre>
                    
                    {answersVisible[question.question_id] && answers[question.question_id] && (
                      <div className="answers-container">
                        <h5>Answers:</h5>
                        <ul className="answers-list">
                          {answers[question.question_id].map((a, idx) => (
                            <li key={idx}>
                              <pre className="preformatted">{a.answer_content}</pre>
                              {' '}
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

                    <button
                      onClick={() => toggleAnswersVisibility(question.question_id)}
                      className="btn-fetch-answers"
                    >
                      {answersVisible[question.question_id] ? 'Hide Answers' : 'Fetch Answers'}
                    </button>
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
                <h4>General Settings</h4>

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
                  <label htmlFor="time_limit">Time Limit (minutes):</label>
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

                <div className="row">
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

                
                {quizGroups && quizGroups.length > 0 && (
                  <div className="form-group group-deadline-row">
                    <div className = "row">
                      <div className="column select-column">
                         <h4>Select a group, then modify a deadline</h4>
                        <label htmlFor="groupSelect">Select Group:</label>
                        <select
                          id="groupSelect"
                          value={selectedGroupId || ''}
                          onChange={handleGroupChange}  
                        >
                          {quizGroups.map(group => (
                            <option key={group.group_id} value={group.group_id}>
                              {group.group_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="column deadline-column">
                        <label htmlFor="deadlineInput">Deadline:</label>
                        <input
                          id="deadlineInput"
                          type="datetime-local"
                          value={selectedGroupDeadline}
                          onChange={handleDeadlineChange}
                        />
                      </div>
                    </div>
                </div>
                )}
                <button
                  onClick={() => handleSaveSettings(quiz.quiz_id, selectedGroupId, selectedGroupDeadline)}
                >
                  Save Settings
                </button>

              </div>
            ) : (
              <ul className="settings-list">
                <li><strong>Time Limit:</strong> {selectedQuizSettings.time_limit} minutes</li>
                <li><strong>Deduction Percentage:</strong> {selectedQuizSettings.deduction_percentage}%</li>
                <li><strong>Retake Allowed:</strong> {selectedQuizSettings.retake_allowed ? 'Yes' : 'No'}</li>
                <li><strong>Is Active:</strong> {selectedQuizSettings.is_active ? 'Yes' : 'No'}</li>

                {quizGroups?.length > 0 && (
                  <>
                    <li className="group-deadlines-title">Group Deadlines:</li>
                    <ul className="group-deadlines-list">
                      {quizGroups.map(group => (
                        <li key={group.group_id}>
                          <strong>{group.group_name}:</strong>{" "}
                          {group.deadline ? new Date(group.deadline).toLocaleString() : 'No deadline'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </ul>

            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ModalManageQuiz;
