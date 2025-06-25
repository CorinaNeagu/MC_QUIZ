import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode }  from "jwt-decode";
import axios from "axios";
import "./HomePage.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import UserProfile from "../UserProfile/UserProfile";

const HomePage = () => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showProfile, setShowProfile] = useState(false);
  
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);

  const [showMenuId, setShowMenuId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [filterText, setFilterText] = useState("");
  const [sortOrder, setSortOrder] = useState("date-asc");

  const [isPicExpanded, setIsPicExpanded] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    created_at: "",
    userType: "",
    profilePic: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        navigate("/");
      } else {
        setUserType(decodedToken.userType);

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
                profilePic: data.profilePic || ""
              });
            }
          })
          .catch((error) => console.error("Error fetching profile:", error));
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const togglePicExpand = () => {
  setIsPicExpanded((prev) => !prev);
};

  const formattedDate = new Date(userProfile.created_at).toLocaleDateString();

  useEffect(() => {
    if (loading || userType !== "student") return;

    const token = localStorage.getItem("token");
    if (!token) return;


  axios
    .get(`http://localhost:5000/api/user/deadlines`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("Deadlines data:", response.data);
      setDeadlines(response.data.deadlines || []);
      setDeadlinesLoading(false);
    })
    .catch((error) => {
      console.error("Failed to fetch deadlines:", error);
      setDeadlinesLoading(false);
    });
}, [loading, userType]);

const toggleMenu = (assignmentId) => {
  if (openMenuId === assignmentId) {
    setOpenMenuId(null);
  } else {
    setOpenMenuId(assignmentId);
  }
};

const handleGoToQuiz = (quizId) => {
   if (!quizId) {
    alert("Quiz ID is missing!");
    return;
  }
  navigate(`/quiz/${quizId}`);
  setOpenMenuId(null); 
};


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
        <h2 className="welcome-message">
          {userProfile.profilePic ? (
            <img
              src={`http://localhost:5000${userProfile.profilePic}`}
              alt={`${userProfile.username}'s profile`}
              className="profile-icon-inline"
              onClick={togglePicExpand}
              title="Click to expand"
            />
          ) : (
            <div
              className="profile-icon-placeholder-inline"
              onClick={togglePicExpand}
              title="Click to expand"
            >
              {userProfile.username
                ? userProfile.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "?"}
            </div>
          )}
          👋 Welcome, {userProfile.username}!
        </h2>

        <button
          className="btn-profile"
          onClick={() => setShowProfile((prev) => !prev)}
        >
          {showProfile ? "✘ Hide Profile" : "🔎 Show Profile"}
        </button>

        <div className="button-grid">
          <button onClick={() => setShowDeadlines((prev) => !prev)}>
            {showDeadlines ? "Hide your deadlines" : "See your deadlines"}
          </button>
          <button onClick={() => navigate("/history")}>Your History</button>
        </div>

        {showDeadlines && (
          <div className="upcoming-deadlines">
            <h2>My Upcoming Deadlines</h2>

            <div className="filter-sort-controls">
              <div className="input-icon-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter deadlines by title..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="deadline-filter-input"
                />
              </div>

              <div className="sort">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="deadline-sort-select"
                >
                  <option value="date-asc">Due Date ↑</option>
                  <option value="date-desc">Due Date ↓</option>
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                </select>
              </div>
            </div>

            {deadlinesLoading ? (
              <p>Loading deadlines...</p>
            ) : deadlines.length === 0 ? (
              <p>No upcoming deadlines.</p>
            ) : (
              <div className="deadline-cards">
                {deadlines
                  .filter((deadline) =>
                    deadline.title.toLowerCase().includes(filterText.toLowerCase())
                  )
                  .sort((a, b) => {
                    switch (sortOrder) {
                      case "date-asc":
                        return new Date(a.deadline) - new Date(b.deadline);
                      case "date-desc":
                        return new Date(b.deadline) - new Date(a.deadline);
                      case "title-asc":
                        return a.title.localeCompare(b.title);
                      case "title-desc":
                        return b.title.localeCompare(a.title);
                      default:
                        return 0;
                    }
                  })
                  .map((deadline) => (
                    <div key={deadline.assignment_id} className="deadline-card">
  <div className="deadline-header-menu-container flex justify-between items-center">
    
    {/* Left: Title and optional badge */}
    <div className="deadline-header">
      <div className="deadline-title font-semibold text-lg">{deadline.title}</div>

      {deadline.taken && !deadline.allowRetake ? (
        <div className="taken-badge-row mt-1">
          <span className="taken-badge text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
            Cannot be retaken
          </span>
        </div>
      ) : null}
    </div>

    {/* Right: Menu button and dropdown */}
    <div className="menu-container">
  <button
    className="btn-menu text-xl px-2"
    onClick={() => toggleMenu(deadline.assignment_id)}
    aria-label="Open menu"
  >
    ⋮
  </button>

  {openMenuId === deadline.assignment_id && (
    <div className="menu-dropdown">
      <button
        className="start-quiz-btn"
        onClick={() => handleGoToQuiz(deadline.quiz_id)}
        disabled={!deadline.allowRetake && deadline.taken}
      >
        Go to Quiz
      </button>
    </div>
  )}
</div>

  </div>

  <div className="deadline-date text-sm text-gray-500 mt-2">
    Due on {new Date(deadline.deadline).toLocaleDateString()}
  </div>
</div>



                  ))}
              </div>
            )}
          </div>
        )}

    {showProfile && <UserProfile embedded={true} />}
      </div>
    ) : userType === "professor" ? (
      <div className="professor-content">
        <h2 className="welcome-message">
          {userProfile.profilePic ? (
            <img
              src={`http://localhost:5000${userProfile.profilePic}`}
              alt={`${userProfile.username}'s profile`}
              className="profile-icon-inline"
              onClick={togglePicExpand}
              title="Click to expand"
            />
          ) : (
            <div
              className="profile-icon-placeholder-inline"
              onClick={togglePicExpand}
              title="Click to expand"
            >
              {userProfile.username
                ? userProfile.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "?"}
            </div>
          )}
          👋 Welcome, {userProfile.username}!
        </h2>
        <button
          className="btn-profile"
          onClick={() => setShowProfile((prev) => !prev)}
        >
          {showProfile ? "✘ Hide Profile" : "🔎 Show Profile"}
        </button>

        <div className="button-grid">
          <button onClick={() => navigate("/groups")}>Display Groups</button>
          <button onClick={() => navigate("/create-quiz")}>Create Quiz</button>
        </div>

        {showProfile && <UserProfile embedded={true} />}

      </div>
    ) : (
      <div>Loading...</div>
    )}

    {isPicExpanded && userProfile.profilePic && (
  <div className="profile-pic-modal" onClick={togglePicExpand}>
    <img
      src={`http://localhost:5000${userProfile.profilePic}`}
      alt={`${userProfile.username}'s profile enlarged`}
      className="profile-pic-expanded"
    />
  </div>
)}
  </div>
);
}

export default HomePage;
