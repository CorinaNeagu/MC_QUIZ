import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from '../../components/Sidebar/Sidebar';
import './GroupDetails.css';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const exportRefs = useRef({});

  // State
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [groupName, setGroupName] = useState("");

  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState(null);

  const [showChart, setShowChart] = useState(false);

  const [allAttempts, setAllAttempts] = useState({});

  // Fetch quizzes assigned to group
  useEffect(() => {
    if (!groupId) return;

    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `http://localhost:5000/api/group/details/student-assigned-quizzes/${groupId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Fetched quizzes:", data);  // <-- LOG HERE
        setQuizzes(data);
      } catch {
        setError("Failed to load assigned quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [groupId]);

  useEffect(() => {
  if (!groupId) return;

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/groups/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupName(data.group_name || `Group ${groupId}`);
    } catch (error) {
      console.error("Failed to fetch group details", error);
      setGroupName(`Group ${groupId}`); // fallback name
    }
  };

  fetchGroupDetails();
}, [groupId]);


 useEffect(() => {
  if (!quizzes.length) return;

  const fetchAllAttempts = async () => {
    const token = localStorage.getItem("token");
    let attemptsMap = {};

    try {
      for (const quiz of quizzes) {
        const { data } = await axios.get(
          `http://localhost:5000/api/group/details/quiz-attempts/${groupId}/${quiz.quiz_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Fetched attempts for quiz ${quiz.quiz_id}:`, data);  // <-- LOG HERE
        attemptsMap[quiz.quiz_id] = data;
      }
      setAllAttempts(attemptsMap);
    } catch (err) {
      console.error("Failed to fetch all attempts", err);  // <-- LOG ERROR
    }
  };

  fetchAllAttempts();
}, [quizzes, groupId]);



  // Open modal and fetch attempts for selected quiz
  const openModal = async (quiz) => {
  console.log("Opening modal for quiz:", quiz);  // <-- LOG selected quiz

  setSelectedQuiz(quiz);
  setIsModalOpen(true);
  setAttempts([]);
  setAttemptsError(null);
  setAttemptsLoading(true);
  setShowChart(false);

  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(
      `http://localhost:5000/api/group/details/quiz-attempts/${groupId}/${quiz.quiz_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Fetched attempts for selected quiz:", data);  // <-- LOG attempts

    const processedData = data.map(attempt => ({
      ...attempt,
      percentage_score: Number(attempt.percentage_score),
    }));

    setAttempts(processedData);
  } catch (err) {
    console.error("Error loading quiz attempts:", err);  // <-- LOG error
    setAttemptsError("Failed to load quiz attempts");
  } finally {
    setAttemptsLoading(false);
  }
};


  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
    setAttempts([]);
    setAttemptsError(null);
    setShowChart(false);
  };

  // Navigate back to groups list
  const handleBackToGroups = () => navigate(`/groups`);

  // Custom legend for Recharts
  const renderCustomLegend = ({ payload }) => (
    <div style={{ display: 'flex', gap: 20, padding: 10, borderRadius: 6 }}>
      {payload.map((entry) => (
        <div
          key={entry.value}
          style={{
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: entry.color,
              borderRadius: 3,
            }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );

  // Export quizzes and attempts to PDF
  const handleExportPDF = async () => {
    if (!quizzes.length) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const groupTitle = groupName || `Group ${groupId}`;
    const today = new Date().toLocaleDateString();

    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      const ref = exportRefs.current[quiz.quiz_id];

      if (!ref?.current) {
        console.warn(`No ref found for quiz ${quiz.quiz_id}`);
        continue;
      }

      try {
        const canvas = await html2canvas(ref.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        if (!imgData.startsWith("data:image/png")) {
          console.error("Invalid image data generated");
          continue;
        }

        const margin = 10; // 10mm margin on each side
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const usableWidth = pdfWidth - margin * 2; // width inside margins
        const imgHeightWithMargin = (canvas.height * usableWidth) / canvas.width;

        pdf.setFontSize(14);
        pdf.text(groupName, 10, 15);
        pdf.setFontSize(12);
        pdf.text(`Quiz: ${quiz.title}`, 10, 23);
        pdf.text(`Date: ${today}`, 10, 30);

        const topMargin = 35;
        pdf.addImage(imgData, "PNG", margin, topMargin, usableWidth, imgHeightWithMargin);

        if (i < quizzes.length - 1) {
          pdf.addPage();
        }
      } catch (e) {
        console.error("Error generating PDF page for quiz", quiz.quiz_id, e);
      }
    }

    pdf.save(`${groupName}_Quiz_Report.pdf`);
  };

  const handleExportSingleQuizPDF = async ({ quiz_id, title }) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const groupTitle = groupName || `Group ${groupId}`;
  const today = new Date().toLocaleDateString();

  const ref = exportRefs.current[quiz_id];
  if (!ref?.current) {
    console.warn(`No ref found for quiz ${quiz_id}`);
    return;
  }

  try {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const margin = 10; // 10mm margin on each side
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const usableWidth = pdfWidth - margin * 2; // width inside margins
    const imgHeightWithMargin = (canvas.height * usableWidth) / canvas.width;

    pdf.setFontSize(14);
    pdf.text(groupName, 10, 15);
    pdf.setFontSize(12);
    pdf.text(`Quiz: ${title}`, 10, 23);
    pdf.text(`Date: ${today}`, 10, 30);

    const topMargin = 35;
    pdf.addImage(imgData, "PNG", margin, topMargin, usableWidth, imgHeightWithMargin);
    pdf.save(`${groupName}_${title}_Quiz_Report.pdf`);
  } catch (e) {
    console.error("Error generating PDF for quiz", quiz_id, e);
  }
};

  

      if (loading) return <p>Loading assigned quizzes...</p>;
      if (error) return <p className="error-text">{error}</p>;
      if (quizzes.length === 0) return <p>No quizzes assigned for this group.</p>;

      const hasValidScore = attempts.some(
      attempt => typeof attempt.percentage_score === "number" && !isNaN(attempt.percentage_score)
    );

    console.log("Rendering chart with attempts:", attempts);
    console.log("hasValidScore:", hasValidScore);
  return (
    <div className="group-details-page">
      <Sidebar showBackButton />

      <button className="btn-back" onClick={handleBackToGroups}>
        ❮❮ Back to Your Groups
      </button>

      <button className="btn-export-pdf" onClick={handleExportPDF}>
        📄 Export Gradebook
      </button>

      <h2 className="header">Assigned Quizzes</h2>

        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "210mm",
            backgroundColor: "white",
          }}
        >
          {quizzes.map((quiz) => {
            if (!exportRefs.current[quiz.quiz_id]) {
              exportRefs.current[quiz.quiz_id] = React.createRef();
            }
            const ref = exportRefs.current[quiz.quiz_id];
            const quizAttempts = allAttempts[quiz.quiz_id] || [];

            return (
              <div key={quiz.quiz_id} ref={ref}>
                <h2>{quiz.title}</h2>
                <p><strong>Group:</strong> {groupName}</p>

                {quizAttempts.length === 0 ? (
                  <p>No attempts found.</p>
                ) : (
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Score</th>
                        <th>Grade</th>
                        <th>Attempted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizAttempts.map(({ student_id, username, raw_score, percentage_score, attempted_at }) => (
                        <tr key={student_id}>
                          <td>{username}</td>
                          <td>{raw_score}</td>
                          <td>{percentage_score}%</td>
                          <td>{new Date(attempted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

      <ul className="quiz-list assigned-quizzes">
        {quizzes.map(({ quiz_id, title, category_name, subcategory_name, deadline }) => (
          <li key={quiz_id} className="quiz-item quiz-card">
            <h3>{title}</h3>
            <p><strong>Category:</strong> {category_name}</p>
            <p><strong>Subcategory:</strong> {subcategory_name || "No subcategory"}</p>
            <p><strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()}</p>

            <button className="btn-more" onClick={() => openModal({ quiz_id, title })}>
              See more
            </button>

            <button className="btn-export-pdf" onClick={() => handleExportSingleQuizPDF({ quiz_id, title })}>
              📄 Export PDF
            </button>

          </li>
        ))}
      </ul>

      {/* Modal for attempts & chart */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedQuiz?.title}</h2>
              <button
                className="btn-display-bar"
                onClick={() => setShowChart(show => !show)}
              >
                {showChart ? "Hide chart" : "Show chart"}
              </button>
            </div>

            <div className="modal-content">
              {attemptsLoading && <p>Loading attempts...</p>}
              {attemptsError && <p className="error-text">{attemptsError}</p>}
              {!attemptsLoading && !attemptsError && attempts.length === 0 && (
                <p>No attempts found.</p>
              )}

              {!attemptsLoading && attempts.length > 0 && (
                <>
                 {showChart && hasValidScore ? (
                        <div className="chart-container"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "20px 0", 
                        }}>
                        <BarChart
                          width={600}
                          height={300}
                          data={attempts}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="username" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend content={renderCustomLegend} />
                          <Bar dataKey="percentage_score" fill="#007bff" name="Grade (%)" />
                        </BarChart>
                      </div>
                    ) : (
                    <table className="attempts-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>Attempted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map(({ student_id, username, raw_score, percentage_score, attempted_at }) => (
                          <tr key={student_id}>
                            <td>{username}</td>
                            <td>{raw_score}</td>
                            <td>{percentage_score}%</td>
                            <td>{new Date(attempted_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
