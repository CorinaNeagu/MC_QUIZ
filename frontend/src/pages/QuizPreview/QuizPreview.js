import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

import './QuizPreview.css';

const QuizPreview = () => {
  const location = useLocation();
  const { quizId, assignToGroupId } = location.state; // Get quizId from the state passed via navigate
  const navigate = useNavigate(); // Initialize useNavigate

  const [quizDetails, setQuizDetails] = useState([]); // Store quiz details
  const [error, setError] = useState(""); // Error state
  const [loading, setLoading] = useState(true); // Loading state

  const [deadline, setDeadline] = useState(""); // New deadline state
  const [showDeadlineSection, setShowDeadlineSection] = useState(false);
  const [assigning, setAssigning] = useState(false); // Loading state for assign

  useEffect(() => {
    // Fetch the quiz details (questions and answers)
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

        // Ensure that response data contains questions
        if (response.data && response.data.questions) {
          setQuizDetails(response.data.questions); // Set quiz questions and answers
        } else {
          setError("No questions found for this quiz.");
        }
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError("There was an error fetching quiz details.");
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchQuizDetails();
  }, [quizId]);

   const assignQuizToGroup = async () => {
    if (!assignToGroupId) {
      alert("No group selected to assign the quiz.");
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
          group_id: assignToGroupId,
          deadline,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  // If there is an error, display it
  if (error) return <div>{error}</div>;

  // Show loading state while the data is being fetched
  if (loading) return <div>Loading quiz details...</div>;


  return (
    <div className="quiz-preview-container">
                    <Sidebar showBackButton={true} />

      <h2>Quiz Preview</h2>
      {quizDetails.length > 0 ? (
        <ul>
          {quizDetails.map((question) => (
            <li key={question.question_id}>
              <h3>{question.question_content}</h3>
              {question.answers && question.answers.length > 0 ? (
                <ul>
                  {question.answers.map((answer) => (
                    <li 
                      key={answer.answer_id}
                      className={answer.is_correct ? 'correct' : 'incorrect'}
                    >
                      {answer.answer_content} - 
                      <strong>{answer.is_correct ? "Correct" : "Incorrect"}</strong> - 
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
  <button
    onClick={() => setShowDeadlineSection((prev) => !prev)}
    className="toggle-deadline-btn"
  >
    {showDeadlineSection ? "Hide Deadline Section" : "Assign Deadline Now"}
  </button>

  {showDeadlineSection && (
    <div className="deadline-card">
      <label className="deadline-info">
        You can assign the quiz now or later.
      </label>

      <label className="deadline-label">
        Select Deadline:{" "}
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="deadline-input"
        />
      </label>

      <button
        onClick={assignQuizToGroup}
        disabled={assigning}
        className={`assign-btn ${assigning ? "disabled" : ""}`}
      >
        {assigning ? "Assigning..." : "Assign Quiz to Group"}
      </button>
    </div>
  )}
</div>


    </div>
  );
};

export default QuizPreview;
