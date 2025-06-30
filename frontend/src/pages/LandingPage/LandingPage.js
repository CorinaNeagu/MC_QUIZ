import React, { useState } from "react";
import Login from "../../components/Login/Login"
import Register from "../../components/Register/Register"
import "./LandingPage.css";

const LandingPage = () => {
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const toggleForm = () => {
    setIsLoginActive(!isLoginActive);
    setRegistrationSuccess(false); 
  };

  const handleRegisterSuccess = () => {
    setRegistrationSuccess(true);
    setIsLoginActive(true); 
  };

  return (
    <div className="landing-page-container">
      <h2>Choose an option to get started</h2>

      {registrationSuccess && (
        <div className="success-message">
          🎉 You have successfully registered! Please log in.
        </div>
      )}

      <div
        className={`form-container ${
          isLoginActive ? "login-active" : "register-active"
        }`}
      >
        <div className="form-slider">
          <div className="form-panel login-panel">
            <Login />
            <p>
              Don't have an account?{" "}
              <button className="toggle-button" onClick={toggleForm}>
                Register
              </button>
            </p>
          </div>
          <div className="form-panel register-panel">
            <Register onSuccess={handleRegisterSuccess} />
            <p>
              Already have an account?{" "}
              <button className="toggle-button" onClick={toggleForm}>
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default LandingPage;
