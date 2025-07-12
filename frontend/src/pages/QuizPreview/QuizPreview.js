import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams  } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

import './QuizPreview.css';

const QuizPreview = () => {
  const location = useLocation();
  const quizId = location.state?.quizId;

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  
  const [quizDetails, setQuizDetails] = useState([]); 
  const [error, setError] = useState(""); 
  const [loading, setLoading] = useState(true); 

  const [deadline, setDeadline] = useState(""); 
  const [showDeadlineSection, setShowDeadlineSection] = useState(false);
  const [assigning, setAssigning] = useState(false); 

  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to view the quiz.");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/quizPreview/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.questions) {
          setQuizDetails(response.data.questions);
        } else {
          setError("No questions found for this quiz.");
        }
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("There was an error fetching quiz details.");
      } finally {
        setLoading(false); 
      }
    };

    fetchQuizDetails();
  }, [quizId]);

    useEffect(() => {
        const fetchGroups = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
              "http://localhost:5000/api/groups/professor-groups",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setGroups(response.data);

            if (!selectedGroupId && response.data.length > 0) {
              setSelectedGroupId(response.data[0].id || response.data[0].group_id);
            }
          } catch (err) {
            console.error("Failed to fetch groups", err);
          }
        };

        fetchGroups();
      }, [selectedGroupId]);

   const assignQuizToGroup = async () => {
      if (!selectedGroupId) {
        alert("Please select a group to assign the quiz.");
        return;
      }
      if (!deadline) {
        alert("Please select a deadline before assigning the quiz.");
        return;
      }

      setAssigning(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:5000/api/groups/assign-quiz",
          {
            quiz_id: quizId,
            group_id: selectedGroupId,
            deadline,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert(res.data.message || "Quiz assigned successfully!");
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to assign quiz.");
      } finally {
        setAssigning(false);
      }
    };


  if (error) return <div>{error}</div>;
  if (loading) return <div>Loading quiz details...</div>;


  return (
    <div className="quiz-preview-container">
                    <Sidebar showBackButton={true} />

      <h2 className = "header">Quiz Preview</h2>
      {quizDetails.length > 0 ? (
        <ul>
          {quizDetails.map((question) => (
            <li key={question.question_id}>
              <pre className="preformatted">{question.question_content}</pre>
              {question.answers && question.answers.length > 0 ? (
                <ul>
                  {question.answers.map((answer) => (
                    <li 
                      key={answer.answer_id}
                      className={answer.is_correct ? 'correct' : 'incorrect'}
                    >
                      <pre className="preformatted">{answer.answer_content}</pre>
                      -  
                      <strong>{answer.is_correct ? " Correct" : " Incorrect"}</strong> - 
                      Score: {answer.is_correct ? answer.score : "0.00"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No answers available for this question.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No questions found for this quiz.</p>
      )}

        <div className="assign-deadline-wrapper">
         <div className="deadline-panel floating">
          <div className="deadline-panel-header">
            <h3>Assign Deadline</h3>
          </div>

          <label className="deadline-info">
            You can assign the quiz now or later.
          </label>

            <label className="deadline-label">
              Select Deadline:
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="deadline-input"
              />
            </label>

            <div className="group-select-wrapper">
              <label htmlFor="group-select">Assign to Group:</label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <option key={group.id || group.group_id} value={group.id || group.group_id}>
                      {group.name || group.group_name || `Group ${group.id || group.group_id}`}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading groups...</option>
                )}
              </select>
            </div>

            <button
              onClick={assignQuizToGroup}
              disabled={assigning}
              className={`assign-btn ${assigning ? "disabled" : ""}`}
            >
              {assigning ? "Assigning..." : "Assign Quiz to Group"}
            </button>
          </div>
        </div>
    </div>
  );
};

export default QuizPreview;
