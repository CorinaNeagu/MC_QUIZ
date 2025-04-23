import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfManageQuizzes.css';
import Sidebar from "../../components/Sidebar/Sidebar";

// Modal Component (inline for now, feel free to extract it)
const Modal = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const ProfManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answersVisible, setAnswersVisible] = useState({});
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizSettings, setQuizSettings] = useState({});
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [selectedQuizSettings, setSelectedQuizSettings] = useState({});
  const [editSettingsQuizId, setEditSettingsQuizId] = useState(null);
  const [editableSettings, setEditableSettings] = useState({});
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [questionScrollIndex, setQuestionScrollIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in to view your quizzes.");
      setLoading(false);
      return;
    }

    axios
      .get("http://localhost:5000/api/user/professor/quizzes", {
        headers: { "Authorization": `Bearer ${token}` },
      })
      .then((response) => {
        setQuizzes(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load quizzes.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      const token = localStorage.getItem("token");
      axios
        .get(`http://localhost:5000/api/user/professor/questions/${selectedQuizId}`, {
          headers: { "Authorization": `Bearer ${token}` },
        })
        .then((response) => {
          setQuestions(response.data);
        })
        .catch((error) => {
          console.error("Error fetching professor's questions:", error);
        });
    }
  }, [selectedQuizId]);

  const fetchAnswers = (questionId) => {
    axios
      .get(`http://localhost:5000/api/answers/${questionId}`)
      .then((response) => {
        if (response.data && Array.isArray(response.data.answers)) {
          setAnswers((prev) => ({
            ...prev,
            [questionId]: response.data.answers,
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching answers:", error);
      });
  };

  const toggleAnswersVisibility = (questionId) => {
    const alreadyFetched = answers[questionId];

    if (!alreadyFetched) {
      fetchAnswers(questionId);
    }

    setAnswersVisible((prevState) => ({
      ...prevState,
      [questionId]: !prevState[questionId], 
    }));
  };

  const handleQuizClick = (quizId) => {
    setSelectedQuizId(quizId);
    setShowInspectModal(true);
  };

  const handleSeeDetails = async (quizId) => {
    if (activeQuizId === quizId) {
      setActiveQuizId(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/user/settings/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedQuizSettings((prev) => ({
        ...prev,
        [quizId]: response.data
      }));
      setActiveQuizId(quizId);
    } catch (error) {
      console.error("Failed to fetch quiz settings:", error);
    }
  };

  const handleToggleEdit = (quizId) => {
    if (editSettingsQuizId === quizId) {
      handleSaveSettings(quizId);
    } else {
      const settings = selectedQuizSettings[quizId];
      setEditableSettings({
        title: quizzes.find(q => q.quiz_id === quizId)?.title || '',
        time_limit: settings.time_limit,
        deduction_percentage: settings.deduction_percentage,
        retake_allowed: settings.retake_allowed,
        is_active: settings.is_active,
      });
      setEditSettingsQuizId(quizId);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSaveSettings = async (quizId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const updateResponse = await axios.put(
        `http://localhost:5000/api/user/update-quiz-settings/${quizId}`,
        editableSettings,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (updateResponse.status === 200) {
        setSelectedQuizSettings((prev) => ({
          ...prev,
          [quizId]: {
            ...prev[quizId],
            ...editableSettings,
          },
        }));

        setQuizzes((prev) =>
          prev.map((q) => (q.quiz_id === quizId ? { ...q, title: editableSettings.title } : q))
        );

        setEditSettingsQuizId(null);
        alert('Quiz settings updated successfully!');
      }
    } catch (err) {
      console.error('Error updating quiz settings:', err);
      alert('Error while saving settings. Please try again later.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/user/delete-quiz/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setQuizzes((prevQuizzes) => prevQuizzes.filter((quiz) => quiz.quiz_id !== quizId));
          alert(response.data.message);
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('An error occurred while deleting the quiz.');
      }
    }
  };


  const handleScrollLeft = () => {
    setQuestionScrollIndex((prev) => Math.max(prev - 1, 0));
  };
  
  const handleScrollRight = () => {
    setQuestionScrollIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="manage-quizzes-container">
      <Sidebar showBackButton={true} />

      <div className="scrollable-content">
        <h2>Your Quizzes</h2>

        {quizzes.length === 0 ? (
          <p>You have not created any quizzes yet.</p>
        ) : (
          <div className="quiz-list">
            {quizzes.map((quiz) => (
              <div key={quiz.quiz_id} className="quiz-card">
                <h4>{quiz.title}</h4>
                <p>Category: {quiz.category_name}</p>

                <button onClick={() => handleQuizClick(quiz.quiz_id)} className="btn-inspect">
                  Inspect Quiz
                </button>

                <button onClick={() => handleSeeDetails(quiz.quiz_id)} className="btn-see-details">
                  {activeQuizId === quiz.quiz_id ? "Hide Details" : "See Details"}
                </button>

                <button onClick={() => handleDeleteQuiz(quiz.quiz_id)} className="btn-delete-quiz">
                  Delete Quiz
                </button>

                {activeQuizId === quiz.quiz_id && selectedQuizSettings[quiz.quiz_id] && (
                  <div className="quiz-settings">
                    <h5>Quiz Settings:</h5>

                    {editSettingsQuizId === quiz.quiz_id ? (
                      <div className="settings-form">
                        <label>
                          Title:
                          <input type="text" name="title" value={editableSettings.title} onChange={handleSettingChange} />
                        </label>

                        <label>
                          Time Limit:
                          <input type="number" name="time_limit" value={editableSettings.time_limit} onChange={handleSettingChange} />
                        </label>

                        <label>
                          Deduction Percentage:
                          <input type="number" name="deduction_percentage" value={editableSettings.deduction_percentage} onChange={handleSettingChange} />
                        </label>

                        <label>
                          Retake Allowed:
                          <input type="checkbox" name="retake_allowed" checked={editableSettings.retake_allowed} onChange={handleSettingChange} />
                        </label>

                        <label>
                          Is Active:
                          <input type="checkbox" name="is_active" checked={editableSettings.is_active} onChange={handleSettingChange} />
                        </label>
                      </div>
                    ) : (
                      <ul>
                        <li><strong>Title:</strong> {quiz.title}</li>
                        <li><strong>Time Limit:</strong> {selectedQuizSettings[quiz.quiz_id].time_limit} minutes</li>
                        <li><strong>Deduction Percentage:</strong> {selectedQuizSettings[quiz.quiz_id].deduction_percentage}%</li>
                        <li><strong>Retake Allowed:</strong> {selectedQuizSettings[quiz.quiz_id].retake_allowed ? "Yes" : "No"}</li>
                        <li><strong>Is Active:</strong> {selectedQuizSettings[quiz.quiz_id].is_active ? "Yes" : "No"}</li>
                      </ul>
                    )}

                    <button onClick={() => handleToggleEdit(quiz.quiz_id)} className="btn-edit-settings">
                      {editSettingsQuizId === quiz.quiz_id ? "Save Settings" : "Change Settings"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal for inspecting questions */}
<Modal show={showInspectModal} onClose={() => setShowInspectModal(false)}>
  {/* Modal Content */}
    <button className="modal-close" onClick={() => setShowInspectModal(false)}>×</button>
  <h3>Questions for Quiz: {selectedQuizId}</h3>

  {questions.length === 0 ? (
    <p>No questions found.</p>
  ) : (
    <div className="modal-questions-wrapper">
      {questions.map((question) => (
        <div key={question.question_id} className="question-card">
          <h4>{question.question_content}</h4>
          <button
            onClick={() => toggleAnswersVisibility(question.question_id)}
            className="btn-fetch-answers"
          >
            {answersVisible[question.question_id] ? "Hide Answers" : "Fetch Answers"}
          </button>

          {answersVisible[question.question_id] && answers[question.question_id] && (
            <div className="answers-container">
              <h5>Answers:</h5>
              <ul className="answers-list">
                {answers[question.question_id].map((a, idx) => (
                  <li key={idx}>
                    {a.answer_content}{' '}
                    {a.is_correct ? (
                      <span className="correct-tag">(Correct)</span>
                    ) : (
                      <span className="incorrect-tag">(Incorrect)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</Modal>

      </div>
    </div>
  );
};

export default ProfManageQuizzes;
