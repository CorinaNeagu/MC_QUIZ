import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";import "./HomePage.css"; 
import DropdownMenu from "../../components/DropdownMenu";

const HomePage = () => {
  const [userType, setUserType] = useState(null); // State to store user type
  const navigate = useNavigate(); // Navigate for redirection
  const [loading, setLoading] = useState(true); // Loading state to show a loader while processing

  useEffect(() => {
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!token) {
      navigate("/login"); // Redirect to login if no token found
      return;
    }

    try {
      // Decode the token to extract userType and expiration info
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000; // Expiration time is in seconds, convert to milliseconds

      if (expirationTime < Date.now()) {
        // If token is expired, navigate to login page
        navigate("/login");
      } else {
        // Token is valid, set user type from decoded token
        setUserType(decodedToken.userType);
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/login"); // Redirect to login if the token is invalid
    } finally {
      setLoading(false); // Set loading to false after process completes
    }
  }, [navigate]); // Dependency array includes navigate to ensure re-run on navigation

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator while processing token
  }

  return (
    <div className="homepage-container">
      <h1>Welcome to Your Dashboard</h1>
      <DropdownMenu />

      {userType === "student" ? (
        <div className="student-content">
          <h2>Student Dashboard</h2>
          <p>Welcome, student! Here you can start quizzes, view your progress, and manage your profile.</p>
          <button onClick={() => navigate("/quiz")}>Start Quiz</button>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
        </div>
      ) : userType === "professor" ? (
        <div className="professor-content">
          <h2>Professor Dashboard</h2>
          <p>Welcome, professor! Here you can manage quizzes, view your students' progress, and update your profile.</p>
          <button onClick={() => navigate("/manage-quizzes")}>Manage Quizzes</button>
          <button onClick={() => navigate("/profile")}>Go to Profile</button>
          <button onClick={() => navigate("/create-quiz")}>Create Quiz</button> {/* New Button */}
        </div>
      ) : (
        <div>Loading...</div> // Fallback if userType is not yet determined
      )}
    </div>
  );
};

export default HomePage;
