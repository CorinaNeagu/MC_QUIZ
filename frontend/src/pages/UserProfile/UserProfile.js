import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css"; // Import custom CSS for styling

const UserProfile = () => {
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
      navigate("/login"); // Redirect to login if there's no token
    } else {
      // Fetch user profile data from the backend
      fetch("http://localhost:5000/api/user/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
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
              userType: data.userType, // Get userType from the response
            });
          }
        })
        .catch((error) => console.error("Error fetching profile:", error));
    }
  }, [navigate]);

  const formattedDate = new Date(userProfile.created_at).toLocaleDateString();

  return (
    <div className="user-profile-container">
      <h2>User Profile</h2>
      <div className="profile-card">
        <div className="profile-item">
          <strong>Username:</strong>
          <span>{userProfile.username}</span>
        </div>
        <div className="profile-item">
          <strong>Email:</strong>
          <span>{userProfile.email}</span>
        </div>
        <div className="profile-item">
          <strong>Account Created At:</strong>
          <span>{formattedDate}</span>
        </div>
        <div className="profile-item">
          <strong>User Type:</strong>
          <span>{userProfile.userType}</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
