import React, { useState } from 'react';
import './ModalGroupDetails.css';

const ModalGroupDetails = ({ isOpen, onClose, professorGroups, onGroupClick, onJoinByCode }) => {
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleGroupClick = (group) => {
    if (onGroupClick) {
      onGroupClick(group);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim() && onJoinByCode) {
      onJoinByCode(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={handleContentClick}>
        <header className="modal-header">
          <h2>Professors and Their Groups</h2>
        </header>
        <main className="modal-content">
          

          {/* Professors and groups */}
          {professorGroups.professors && professorGroups.professors.length > 0 ? (
            <ul className="professors-list">
              {professorGroups.professors.map((professor) => (
                <li key={professor.professor_id} className="professor-item">
                  <h3>{professor.professor_name}</h3>
                  {professor.groups.length > 0 ? (
                    <ul className="groups-list">
                      {professor.groups.map((group) => (
                        <li
                          key={group.group_id}
                          onClick={() => handleGroupClick(group)}
                          style={{ cursor: 'pointer', color: '#007bff' }}
                          title="Click to join this group"
                        >
                          {group.group_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No groups assigned</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No professors found.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ModalGroupDetails;
