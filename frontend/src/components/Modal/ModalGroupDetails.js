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
        <header className="modal-header">
          <h2>Students in Group: {groupName}</h2>
        </header>
        <main className="modal-content">
          {students && students.length > 0 ? (
            <ul>
              {students.map((student) => (
                <li key={student.student_id}>
                  {student.username} — {student.email}
                </li>
              ))}
            </ul>
          ) : (
            <p>No students enrolled in this group.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ModalStudentsList;
