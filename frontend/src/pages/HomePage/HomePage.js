import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./HomePage.css"; // Add your shared CSS file

const HomePage = () => {
  const [userType, setUserType] = useState(null); // State to store user type
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!token) {
      navigate("/login"); // Redirect to login if there's no token
    } else {
      try {
        // Decode the token to get userType
        const decodedToken = jwtDecode(token);
        setUserType(decodedToken.userType); // Assuming the token contains userType
      } catch (err) {
        console.error("Invalid token:", err);
        navigate("/login"); // Redirect to login if decoding fails
      }
    }
  }, [navigate]);

  if (userType === null) {
    return <div>Loading...</div>; // Show a loading indicator while determining userType
  }

  return (
    <div className="homepage-container">
      <h1>Welcome to Your Dashboard</h1>
      {userType === "student" && (
        <div className="student-content">
          <h2>Student Dashboard</h2>
          <p>Welcome, student! Here you can start quizzes, view your progress, and manage your profile.</p>
          <button onClick={() => navigate("/quiz")}>Start Quiz</button>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      )}
      {userType === "professor" && (
        <div className="professor-content">
          <h2>Professor Dashboard</h2>
          <p>Welcome, professor! Here you can manage quizzes, view your students' progress, and update your profile.</p>
          <button onClick={() => navigate("/manage-quizzes")}>Manage Quizzes</button>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
