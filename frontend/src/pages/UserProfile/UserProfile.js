import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // You can use axios to make API requests
import "./UserProfile.css";

const UserProfile = () => {
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    created_at: "",
    userType: "",
  });

  const [questions, setQuestions] = useState([]); // State to store the questions
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

      // Fetch questions added by the professor
      axios
        .get("http://localhost:5000/api/user/professor/questions", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })
        .then((response) => {
          setQuestions(response.data); // Set the questions in state
        })
        .catch((error) => {
          console.error("Error fetching professor's questions:", error);
        });
    }
  }, [navigate]);

  const formattedDate = new Date(userProfile.created_at).toLocaleDateString();

  return (
    <div className="user-profile-container">
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

      {/* Display professor's questions */}
      <div className="questions-list">
        <h3>My Questions</h3>
        {questions.length === 0 ? (
          <p>No questions found.</p>
        ) : (
          questions.map((question, index) => (
            <div key={index} className="question-item">
              <p><strong>Question:</strong> {question.question_content}</p>
              <p><strong>Category:</strong> {question.category_id}</p>
              <p><strong>Multiple Choice:</strong> {question.is_multiple_choice ? 'Yes' : 'No'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserProfile;
