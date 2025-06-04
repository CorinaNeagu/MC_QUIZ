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
        // Store the token and user_id in localStorage
        localStorage.setItem("token", data.token); // Store the JWT token
        localStorage.setItem("userType", data.userType); // Store the userType ('student' or 'professor')
        localStorage.setItem("user_id", data.userType === "student" ? data.student_id : data.professor_id); // Store the user_id
  
        // Log the user type and user id
        console.log("Authenticated User Type:", data.userType);
        console.log("Authenticated User ID:", data.userType === "student" ? data.student_id : data.professor_id);
  
        // Redirect to the homepage
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
      <div className = "login">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="userType">User Type:</label>
          <select
            id="userType"
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
