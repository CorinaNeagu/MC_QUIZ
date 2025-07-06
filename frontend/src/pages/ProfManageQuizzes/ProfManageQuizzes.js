import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfManageQuizzes.css';
import Sidebar from "../../components/Sidebar/Sidebar";
import ModalManageQuiz from '../../components/Modal/ModalManageQuiz';

const ProfManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [answersVisible, setAnswersVisible] = useState({});
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [selectedQuizSettings, setSelectedQuizSettings] = useState({});
  const [editSettingsQuizId, setEditSettingsQuizId] = useState(null);
  const [editableSettings, setEditableSettings] = useState({});
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [quizGroups, setQuizGroups] = useState([]);

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
        console.log("Quizzes Data:", response.data);  // <-- Log the quiz data here
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

  const fetchQuizGroups = async (quizId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`http://localhost:5000/api/user/quiz-groups/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setQuizGroups(response.data);
  } catch (err) {
    console.error("Error fetching quiz groups:", err);
  }
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

    // Fetch quiz settings
    const settingsResponse = await axios.get(`http://localhost:5000/api/user/settings/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Fetch group deadlines
    const groupsResponse = await axios.get(`http://localhost:5000/api/user/quiz-groups/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setSelectedQuizSettings((prev) => ({
      ...prev,
      [quizId]: settingsResponse.data,
    }));

    setEditableSettings({
      title: quizzes.find(q => q.quiz_id === quizId)?.title || '',
      time_limit: settingsResponse.data.time_limit,
      deduction_percentage: settingsResponse.data.deduction_percentage,
      retake_allowed: settingsResponse.data.retake_allowed,
      is_active: settingsResponse.data.is_active,
      selectedGroupId: '',        
      groupDeadline: ''  
      
    });

    setQuizGroups(groupsResponse.data); 

    setEditSettingsQuizId(quizId);
    setActiveQuizId(quizId);
  } catch (error) {
    console.error("Failed to fetch quiz settings or groups:", error);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="manage-quizzes-container">
      <Sidebar showBackButton={true} />

      <div className="scrollable-content">
        <h2 className = "header-quiz"> 📝 Your Quizzes</h2>

        {quizzes.length === 0 ? (
          <p>You have not created any quizzes yet.</p>
        ) : (
          <div className="quiz-list">
            {quizzes.map((quiz) => (
              <div key={quiz.quiz_id} className="quiz-card">
                <h4>{quiz.title}</h4>
                <p>Category: {quiz.category_name}</p>
                <p>Subcategory: {quiz.subcategory_name}</p>

                <button onClick={() => handleQuizClick(quiz.quiz_id)} className="btn-inspect">
                  Inspect Quiz
                </button>

                <button onClick={() => handleSeeDetails(quiz.quiz_id)} className="btn-see-details">
                  {activeQuizId === quiz.quiz_id ? "Hide Details" : "Edit Details"}
                </button>

                <button onClick={() => handleDeleteQuiz(quiz.quiz_id)} className="btn-delete-quiz">
                  Delete Quiz
                </button>
              </div>
            ))}
          </div>
        )}

      <ModalManageQuiz
        showInspectModal={showInspectModal}
        onCloseInspect={() => setShowInspectModal(false)}
        selectedQuizId={selectedQuizId}
        questions={questions}
        answers={answers}
        answersVisible={answersVisible}
        toggleAnswersVisibility={toggleAnswersVisibility}
        inspectQuiz={quizzes.find(q => q.quiz_id === selectedQuizId)} 

        showSettingsModal={activeQuizId !== null}
        onCloseSettings={() => setActiveQuizId(null)}
        selectedQuizSettings={selectedQuizSettings[activeQuizId] || {}}
        editableSettings={editSettingsQuizId === activeQuizId ? editableSettings : null}
        handleSettingChange={handleSettingChange}
        handleToggleEdit={handleToggleEdit}
        handleSaveSettings={handleSaveSettings}
        quiz={quizzes.find((q) => q.quiz_id === activeQuizId)}
        quizGroups={quizGroups}
        setQuizGroups={setQuizGroups}
      />
      </div>
    </div>
  );
};

export default ProfManageQuizzes;
