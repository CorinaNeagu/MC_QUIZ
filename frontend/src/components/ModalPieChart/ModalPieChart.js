import React from 'react';
import './ModalPieChart.css';

const ModalPieChart = ({ isOpen, onClose, position, selectedCategory, quizzesInCategory }) => {
  if (!isOpen) return null;

  const handleContentClick = (e) => {
    e.stopPropagation(); // Prevent clicks inside modal from bubbling to overlay
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ left: `${position.x + 10}px`, top: `${position.y + 10}px`, position: 'absolute' }}
        onClick={handleContentClick}
      >
        <h2>Quizzes in Category: {selectedCategory}</h2>
        {quizzesInCategory.length > 0 ? (
          <ul>
            {quizzesInCategory.map((quiz) => (
              <li key={quiz.quiz_id}>{quiz.quiz_title}</li>
            ))}
          </ul>
        ) : (
          <p>No quizzes found in this category.</p>
        )}
      </div>
    </div>
  );
};

export default ModalPieChart;
