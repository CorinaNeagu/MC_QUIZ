import React from 'react';
import './ModalGroupDetails.css';

const ModalGroupDetails = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleContentClick = (e) => {
    e.stopPropagation();  
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={handleContentClick}>
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ModalGroupDetails;
