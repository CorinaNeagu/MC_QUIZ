import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./HomePage.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import UserProfile from "../UserProfile/UserProfile";


const HomePage = () => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    created_at: "",
    userType: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        navigate("/login");
      } else {
        setUserType(decodedToken.userType);

        // Fetch user profile data
        fetch("http://localhost:5000/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.error) {
              console.error("Error fetching profile:", data.error);
            } else {
              setUserProfile({
                username: data.username,
                email: data.email,
                created_at: data.created_at,
                userType: data.userType,
              });
            }
          })
          .catch((error) => console.error("Error fetching profile:", error));
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const formattedDate = new Date(userProfile.created_at).toLocaleDateString();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        
        <Sidebar />
      </div>

      {userType === "student" ? (
        <div className="student-content">
          <h2 className="welcome-message"> 👋 Welcome, {userProfile.username}! </h2>

          <button onClick={() => setShowProfile((prev) => !prev)}>
            {showProfile ? "Hide Profile" : "Show Profile"}
          </button>
          {showProfile && <UserProfile embedded={true} />}
        </div>
      ) : userType === "professor" ? (
        <div className="professor-content">
          <h2>Professor Dashboard</h2>
          <p className="welcome-message"> 👋 Welcome, {userProfile.username}!</p>

          <div className="button-grid">
            <button onClick={() => navigate("/manage-quizzes")}>Manage Quizzes</button>
            <button onClick={() => navigate("/groups")}>Display Groups</button>
            
          </div>

          <button onClick={() => setShowProfile((prev) => !prev)}>
            {showProfile ? "Hide Profile" : "Show Profile"}
          </button>
          {showProfile && <UserProfile embedded={true} />}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default HomePage;
