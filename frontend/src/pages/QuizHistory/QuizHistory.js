import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./QuizHistory.css";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";


const QuizHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [latestAttempts, setLatestAttempts] = useState([]);
  const [modalAttempts, setModalAttempts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(""); 
  const [showEvolution, setShowEvolution] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      jwtDecode(token);
      axios
        .get("http://localhost:5000/api/user/history", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const allAttempts = res.data.history || [];
          setAttempts(allAttempts);

          const grouped = {};
          allAttempts
            .sort((a, b) => new Date(b.attempt_time) - new Date(a.attempt_time))
            .forEach((a) => {
              if (!grouped[a.quiz_id]) grouped[a.quiz_id] = a;
            });

          setLatestAttempts(Object.values(grouped));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const openModal = (quizId, quizTitle) => {
    const filtered = attempts
      .filter((a) => a.quiz_id === quizId)
      .sort((a, b) => new Date(b.attempt_time) - new Date(a.attempt_time));
    setModalAttempts(filtered);
    setSelectedQuizTitle(quizTitle);
    setFilterDate(""); 
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const formatDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return "Invalid duration";
    const diff = endDate - startDate;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes} min ${seconds} sec`;
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value; 
    setFilterDate(selectedDate);

    if (!selectedDate) {
      openModal(modalAttempts[0]?.quiz_id, selectedQuizTitle);
      return;
    }

    const filteredByDate = attempts
      .filter((a) => {
        if (a.quiz_id !== modalAttempts[0]?.quiz_id) return false;
        const attemptDate = new Date(a.attempt_time).toISOString().split("T")[0];
        return attemptDate === selectedDate;
      })
      .sort((a, b) => new Date(b.attempt_time) - new Date(a.attempt_time));
    setModalAttempts(filteredByDate);
  };

  if (loading) return <div>Loading quiz history...</div>;

const evolutionData = [...modalAttempts]
  .sort((a, b) => new Date(a.attempt_time) - new Date(b.attempt_time))
  .map(a => ({
    date: new Date(a.attempt_time).toLocaleDateString(),
    grade: a.max_points ? ((a.score / a.max_points) * 100).toFixed(1) : null,
  }));


  
  return (
    <div className="quiz-history-container">
      <Sidebar showBackButton={true} />
      <h2 className = "your-message">📚 Your Quiz History</h2>
      {latestAttempts.length === 0 ? (
        <p>No quiz attempts yet.</p>
      ) : (
        <div className="attempts-grid">
        {latestAttempts.map((attempt) => {

            const attemptsForQuiz = attempts.filter(a => a.quiz_id === attempt.quiz_id);

            return (
            <div
                key={attempt.attempt_id}
                className="attempt-card"
            >
                <h3 className="quiz-title">{attempt.quiz_title}</h3>
                <p><strong>Score:</strong> {attempt.score}</p>
                <p><strong>Grade:</strong> {((attempt.score / attempt.max_points) * 100).toFixed(1)} / 100</p>
                <p><strong>Start:</strong> {new Date(attempt.attempt_time).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(attempt.end_time).toLocaleString()}</p>
                <p><strong>Duration:</strong> {formatDuration(attempt.attempt_time, attempt.end_time)}</p>

                {attemptsForQuiz.length > 1 && (
                <p
                    className="show-all-attempts"
                    onClick={() => openModal(attempt.quiz_id, attempt.quiz_title)}
                >
                    Show all {attemptsForQuiz.length} attempts
                </p>
                )}
            </div>
            );
        })}
</div>

      )}

      {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{selectedQuizTitle} – All Attempts</h3>
                <button 
                  className="btn-evolution"
                  onClick={() => setShowEvolution((prev) => !prev)}>
                  {showEvolution ? "Hide" : "Show Evolution"}
                </button>
              </div>

              {!showEvolution && (
                <input
                  type="date"
                  value={filterDate}
                  onChange={handleDateChange}
                  className="modal-date-picker"
                  placeholder="Filter by date"
                />
              )}

              {showEvolution ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="grade" stroke="#007bff" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ul className="modal-attempts">
                  {modalAttempts.length === 0 ? (
                    <p className="no-match">No attempts match your filter.</p>
                  ) : (
                    modalAttempts.map((a) => (
                      <li key={a.attempt_id} className="modal-attempt-card">
                        <p><strong>Score:</strong> {a.score}</p>
                        <p><strong>Grade:</strong> {((a.score / a.max_points) * 100).toFixed(1)} / 100</p>
                        <p><strong>Start:</strong> {new Date(a.attempt_time).toLocaleString()}</p>
                        <p><strong>End:</strong> {new Date(a.end_time).toLocaleString()}</p>
                        <p>
                          <strong>Duration:</strong> {formatDuration(a.attempt_time, a.end_time)}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default QuizHistory;
