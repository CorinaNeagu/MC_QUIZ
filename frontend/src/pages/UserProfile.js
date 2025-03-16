import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div>
      <h3>User Profile</h3>
      <p>Username: {userProfile.username}</p>
      <p>Email: {userProfile.email}</p>
      <p>Account Created At: {formattedDate}</p>
      <p>User Type: {userProfile.userType}</p> {/* Display userType */}
    </div>
  );
};

export default UserProfile;
