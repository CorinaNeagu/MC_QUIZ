import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';  // Import useLocation hook
import './Sidebar.css';

const Sidebar = ({ showBackButton }) => {
  const navigate = useNavigate(); // Navigate hook
  const location = useLocation(); // Get the current route

  const handleProfileClick = () => {
    navigate('/profile');
  };

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
    navigate('/');
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

          <button onClick={handleProfileClick} className="sidebar-item">
          🪪 Profile
          </button>
          <button onClick={handleGroups} className="sidebar-item">
          🤝 Groups
          </button>
          <button onClick={handleStatistics} className="sidebar-item">
          📈 Statistics
          </button>
          <button onClick={handleLogoutClick} className="sidebar-item">
          🧧 Logout
          </button>
          

        </div>
      </div>
    </div>
  );
};

export default Sidebar;
