import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ModalProf.css';

const ModalProf = ({ isOpen, onClose, professorGroups = [], token }) => {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container-prof" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Professor Groups</h2>
        </header>

        <main className="modal-content">
          {professorGroups.length > 0 ? (
            <ul className="professor-list">
              {professorGroups.map((professor, i) => (
                <li key={i} className="professor-item">
                  <img
                    src={
                      professor.profile_picture
                        ? `http://localhost:5000${professor.profile_picture}`
                        : '/default-profile.png'
                    }
                    alt={`${professor.professor_name}'s profile`}
                    className="professor-profile-pic"
                    onClick={() =>
                      setPreviewImage(
                        professor.profile_picture
                          ? `http://localhost:5000${professor.profile_picture}`
                          : '/default-profile.png'
                      )
                    }
                  />
                  <div className="professor-info">
                    <p className="professor-name">{professor.professor_name}</p>
                    <p className="professor-email">{professor.email}</p>

                    {professor.groups?.length ? (
                      <div className="prof-group-list">
                        {professor.groups.map(({ group_id, group_name }) => (
                          <div key={group_id} className="prof-group-item">
                            {group_name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-groups">No groups available</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-professors">No professor groups available.</p>
          )}
        </main>
      </div>

      {previewImage && (
        <div
          className="image-preview-backdrop"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="image-preview"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ModalProf;
