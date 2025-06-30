import React, { useState } from 'react';
import './ModalGroupDetails.css';

const ModalStudentsList = ({ isOpen, onClose, groupName = '', students = [] }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!isOpen) return null;

  return (
    <>
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
                    <img
                      src={student.profile_picture
                        ? `http://localhost:5000${student.profile_picture}`
                        : '/default-profile.png'}
                      alt={`${student.username}'s profile`}
                      className="student-profile-pic"
                      onClick={() =>
                        setPreviewImage(
                          student.profile_picture
                            ? `http://localhost:5000${student.profile_picture}`
                            : '/default-profile.png'
                        )
                      }
                    />

                    <div className="student-info">
                      <p className="student-name">{student.username}</p>
                      <p className="student-email">{student.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-students">No students enrolled in this group.</p>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="image-preview-backdrop" onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            alt="Preview"
            className="image-preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ModalStudentsList;
