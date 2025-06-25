import React from 'react';
import './ModalGroupDetails.css';

const ModalStudentsList = ({ isOpen, onClose, groupName = '', students = [] }) => {
  if (!isOpen) return null;

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{groupName ? `Students in ${groupName}` : 'Group Students'}</h2>
        </div>
        <div className="modal-content">
          {students && students.length > 0 ? (
            <ul className="student-list">
              {students.map((student) => (
                <li key={student.student_id} className="student-item">
                  <p className="student-name">{student.username}</p>
                  <p className="student-email">{student.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-students">No students enrolled in this group.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalStudentsList;
