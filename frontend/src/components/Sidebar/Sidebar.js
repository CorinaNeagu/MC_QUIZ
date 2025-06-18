import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';  
import './Sidebar.css';

const Sidebar = ({ showBackButton }) => {
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const userType = localStorage.getItem("userType"); 


  const handleGoHome = () => {
    navigate('/home'); 
  };

  const handleStatistics = () => {
    navigate('/stats');
  };

  const handleGroups = () => {
    navigate('/groups');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_id');
      localStorage.removeItem('userType'); 
    navigate('/');
  };

  const handleManageQuizzes = () => {
    navigate("/manage-quizzes");
  };


  return (
    <div className="sidebar-container">
      <div className="sidebar">
        <button className="menu-button">☰</button>
        <div className="sidebar-menu">
          {showBackButton && (
              <button onClick={handleGoHome} className="sidebar-item">
                🏠 Home
              </button>
            )}

          {userType === 'professor' && (
              <button onClick={handleManageQuizzes} className="sidebar-item">
                📌 Manage Quizzes
              </button>
          )}
          
          <button onClick={handleGroups} className="sidebar-item">
          🤝 Groups
          </button>

          <button onClick={handleStatistics} className="sidebar-item">
          📈 Statistics
          </button>

          <button onClick={handleLogoutClick} className="sidebar-item-delete">
          🧧 Logout
          </button>
          

        </div>
      </div>
    </div>
  );
};

export default Sidebar;
