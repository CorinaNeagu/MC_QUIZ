import React, { useState } from "react";
import Login from "../../components/Login/Login"
import Register from "../../components/Register/Register"
import "./LandingPage.css";

const LandingPage = () => {
  const [isLoginActive, setIsLoginActive] = useState(true);

  const toggleForm = () => {
    setIsLoginActive(!isLoginActive);
  };

  return (
    <div className="landing-page-container">
      <h2>Choose an option to get started</h2>
      <div className={`form-container ${isLoginActive ? "login-active" : "register-active"}`}>
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
            <Register />
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
