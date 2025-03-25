import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
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
          <button onClick={handleProfileClick} className="sidebar-item">
            Profile
          </button>
          <button onClick={handleLogoutClick} className="sidebar-item">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
