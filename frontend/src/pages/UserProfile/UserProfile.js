import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";
import Sidebar from "../../components/Sidebar/Sidebar";


const UserProfile = () => {
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    created_at: "",
    userType: "",
  });

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
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
              userType: data.userType,
            });
          }
        })
        .catch((error) => console.error("Error fetching profile:", error));
    }
  }, [navigate]);

  const formattedDate = new Date(userProfile.created_at).toLocaleDateString();

  return (
    <div className="user-profile-container">
       <Sidebar showBackButton={true} /> 
      <div className="profile-header">
        <h2>User Profile</h2>
      </div>
      {/* User Details Table */}
      <div className="profile-table">
        <table>
          <thead>
            <tr>
              <th>Detail</th>
              <th>Information</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Username:</strong></td>
              <td>{userProfile.username}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>{userProfile.email}</td>
            </tr>
            <tr>
              <td><strong>Account Created At:</strong></td>
              <td>{formattedDate}</td>
            </tr>
            <tr>
              <td><strong>User Type:</strong></td>
              <td>{userProfile.userType}</td>
            </tr>
          </tbody>
        </table>
      </div>     
    </div>
  );

};

export default UserProfile;
