import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";  


const LandingPage = () => {
  const navigate = useNavigate();

  const handleRegisterRedirect = () => {
    console.log("Register button clicked!");
    navigate("/register");
  };

  const handleLoginRedirect = () => {
    navigate("/login"); // Navigate to the Login page
  };

  return (
    <div className="landing-page-container">
      <h1>Welcome to the Quiz Platform</h1>
      <p>Select an option to get started</p>
      
      <div className="landing-page-buttons">
        <button onClick={handleRegisterRedirect}>
          Register
        </button>
        <button onClick={handleLoginRedirect}>
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
