import React from 'react';
import './ModalGroupDetails.css';

const ModalGroupDetails = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  // Prevent modal content clicks from closing the modal
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={handleContentClick}>
        <header className="modal-header">
          <h2>{title}</h2>
        </header>
        <main className="modal-content">{children}</main>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
};

export default ModalGroupDetails;
