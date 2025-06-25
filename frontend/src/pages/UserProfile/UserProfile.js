import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const UserProfile = ({ embedded = false }) => {
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    created_at: "",
    userType: "",
    profilePic: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token && !embedded) {
      navigate("/");
    } else {
      fetch("http://localhost:5000/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.error) {
            setUserProfile({
              username: data.username,
              email: data.email,
              created_at: data.created_at,
              userType: data.userType,
              profilePic: data.profilePic || ""
            });
          } else {
            console.error("Error fetching profile:", data.error);
          }
        })
        .catch((error) => console.error("Error fetching profile:", error));
    }
  }, [navigate, embedded]);

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file && !allowedTypes.includes(file.type)) {
    console.error("File rejected due to invalid type:", file.type);
    alert("Only JPEG, PNG, GIF, and WEBP image files are allowed!");
    setSelectedFile(null);
    e.target.value = null;
    return;
  }
  if (file && file.size > 5 * 1024 * 1024) {
    console.error("File rejected due to size:", file.size);
    alert("File size must be 5MB or less");
    setSelectedFile(null);
    e.target.value = null;
    return;
  }
  setSelectedFile(file);
  setUploadStatus("");
};

  const handleUpload = () => {
  if (!selectedFile) {
    alert("Please select an image first!");
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    alert("No token found, please login again.");
    navigate("/");
    return;
  }

  const formData = new FormData();
  formData.append("profilePic", selectedFile);

  setUploadStatus("Uploading...");

  axios
    .post("http://localhost:5000/api/user/upload-profile-pic", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      setUploadStatus("Upload successful!");
      alert("File uploaded successfully!");  
    })
    .catch((error) => {
      console.error("Upload failed:", error);
      setUploadStatus("Upload failed, please try again.");
      alert(
        "Upload failed: " +
          (error.response?.data?.error || error.message)
      ); 
    });
};

  const formattedDate = userProfile.created_at
    ? new Date(userProfile.created_at).toLocaleDateString()
    : "";

  return (
    <div className={`user-profile-container ${embedded ? "embedded" : ""}`}>
      {!embedded && <h2>User Profile</h2>}
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
              <td>
                <strong>Username:</strong>
              </td>
              <td>{userProfile.username}</td>
            </tr>
            <tr>
              <td>
                <strong>Email:</strong>
              </td>
              <td>{userProfile.email}</td>
            </tr>
            <tr>
              <td>
                <strong>Account Created At:</strong>
              </td>
              <td>{formattedDate}</td>
            </tr>
            <tr>
              <td>
                <strong>User Type:</strong>
              </td>
              <td>{userProfile.userType}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="file-upload-container">
  <label htmlFor="file-upload" className="file-upload-label">
    📁 Choose Image
  </label>
  <input
    id="file-upload"
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="file-upload-input"
  />
  <div className="file-name" title={selectedFile ? selectedFile.name : "No file chosen"}>
    {selectedFile ? selectedFile.name : "No file chosen"}
  </div>
  <button
    onClick={handleUpload}
    className="upload-button"
    disabled={!selectedFile}
  >
    ⬆️ Upload
  </button>
</div>

    </div>
  );
};

export default UserProfile;
