import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState(""); // For the username input field
  const [email, setEmail] = useState(""); // For the email input field
  const [password, setPassword] = useState(""); // For the password input field
  const [userType, setUserType] = useState("student"); // Default user type is 'student'
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          userType, // Sending the user type (student or professor) to the backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} registered successfully!`);

        // After successful registration, redirect to login page or home page.
        navigate("/login"); // Or you could navigate to the homepage directly.
      } else {
        alert(data.message); // Show the error message returned from the backend
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("There was an error during registration. Please try again.");
    }
  };

  return (
    <div>
      <h2>Register as a {userType.charAt(0).toUpperCase() + userType.slice(1)}</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>User Type: </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            required
          >
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </div>
        <div>
          <button type="submit">Register</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
