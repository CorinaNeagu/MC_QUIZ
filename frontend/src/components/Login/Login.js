import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("student"); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userType,
        }),
      });
  
      const data = await response.json();
      console.log("Login response:", data); 
  
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", data.userType);
        localStorage.setItem("user_id", data.userType === "student" ? data.student_id : data.professor_id);
  
        console.log("Authenticated User Type:", data.userType);
        console.log("Authenticated User ID:", data.userType === "student" ? data.student_id : data.professor_id);
  
        navigate("/home");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login">
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email:</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password:</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-userType">User Type:</label>
            <select
              id="login-userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>
          <div className="form-group">
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
