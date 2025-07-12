import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from "../../components/Sidebar/Sidebar";
import Modal from '../../components/Modal/Modal'; 
import ModalStud from "../../components/Modal/ModalStud"
import ModalProf from '../../components/Modal/ModalProf';
import { ErrorMessage, SuccessMessage } from '../../components/Message/Message';

import "./Groups.css";

const Groups = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [userType, setUserType] = useState('');
  const [groupCodeToJoin, setGroupCodeToJoin] = useState('');

  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalGroupId, setModalGroupId] = useState(null);
  const [modalMode, setModalMode] = useState('choose'); 
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [activeGroupForQuizzes, setActiveGroupForQuizzes] = React.useState(null);

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [professorGroups, setProfessorGroups] = useState([]);
  const [showProfessorModal, setShowProfessorModal] = useState(false);

  const [isProfessorsModalOpen, setProfessorsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); 
      setUserType(decodedToken.userType);
    }

    fetchGroups();  
  }, [userType]);

   useEffect(() => {
    if (userType === 'professor') {
      fetchQuizzes(); 
    }
  }, [userType]);


  useEffect(() => {
  const token = localStorage.getItem('token');
  console.log('Token:', token);

  if (!activeGroupForQuizzes || !token) {
    return; 
  }

  setLoading(true);
  axios.get(`http://localhost:5000/api/takeQuiz/student-assigned-quizzes/${activeGroupForQuizzes}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then(response => {
    setAssignedQuizzes(response.data);
    setLoading(false);
  })
  .catch(err => {
    setError('Failed to load quizzes');
    setLoading(false);
    console.error(err);
  });

}, [activeGroupForQuizzes]);

   const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/user/professor/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data); 
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const fetchGroups = async () => {
    const token = localStorage.getItem('token');

    try {
      if (userType === 'professor') {
        const res = await axios.get('http://localhost:5000/api/groups/professor-groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(res.data);
      } else if (userType === 'student') {
        const res = await axios.get('http://localhost:5000/api/groups/student-groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(res.data);
      }
    } catch (err) {
      setError('Failed to load groups.');
      console.error("Error loading groups:", err);
    }
  };

  const handleCreateGroup = async () => {
  setError('');
  setSuccess('');

  if (!newGroupName.trim()) {
    setError('Group name cannot be empty.');
    return;
  }

  const duplicate = groups.some(
    (group) => group.group_name.toLowerCase() === newGroupName.trim().toLowerCase()
  );
  if (duplicate) {
    setError('A group with this name already exists. Please choose a different name.');
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const groupCode = generateGroupCode();

    const res = await axios.post('http://localhost:5000/api/groups/create-group', {
      group_name: newGroupName,
      group_code: groupCode,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setSuccess(`Group "${newGroupName}" created with code: ${groupCode}`);
    setNewGroupName('');
    fetchGroups();
  } catch (err) {
    setError('Error creating group. Try a different name.');
    console.error("Error creating group:", err);
  }
};


  const handleJoinGroup = async () => {
  setJoinError('');
  setJoinSuccess('');

  if (!groupCodeToJoin.trim()) {
    setJoinError('Group code cannot be empty.');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post('http://localhost:5000/api/groups/join-group', {
      group_code: groupCodeToJoin,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setJoinSuccess('Successfully joined the group!');
    setGroupCodeToJoin('');
    fetchGroups();
  } catch (err) {
    if (err.response && err.response.status === 404) {
      setJoinError('No such group code exists.');
    } else if (err.response && err.response.status === 400) {
      setJoinError(err.response.data.error || 'You have already joined this group.');
    } else if (err.response && err.response.status === 403) {
      setJoinError(err.response.data.error || 'Only students can join groups.');
    } else {
      setJoinError('An unexpected error occurred.');
    }

    console.log('Join group error:', err.response?.data?.error || err.message);
  }
};

  const handleDisplayStudents = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/groups/group-members/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSelectedGroupId(groupId);
      setGroupMembers(res.data);
      setIsModalOpen(true);

    } catch (err) {
      setGroupMembers([]);
      console.error("Error fetching group members:", err);
    }
  };

  const fetchAssignedQuizzes = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/groups/student-assigned-quizzes/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedQuizzes(res.data);
    } catch (err) {
      setAssignedQuizzes([]);
      console.error('Error fetching assigned quizzes:', err);
    }
  };

  const openAssignModal = async (groupId) => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`http://localhost:5000/api/groups/group-members/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.length === 0) {
      alert('Cannot assign a quiz to a group with no members.');
      return;
    }

    await fetchAssignedQuizzes(groupId); 

    setModalGroupId(groupId);
    setShowAssignModal(true);
  } catch (err) {
    console.error("Error checking group members before assigning quiz:", err);
    alert('Failed to verify group members. Please try again.');
  }
};


  const closeAssignModal = () => {
    setSelectedQuizId('');
    setDeadline('');
    setShowAssignModal(false);
    setModalGroupId(null);
  };

  const handleAssignQuiz = async () => {
  if (!modalGroupId || !selectedQuizId || !deadline) {
    alert("Please select a quiz and provide a deadline before assigning.");
    return;
  }

   const isAlreadyAssigned = assignedQuizzes.some(
    (quiz) => quiz.quiz_id === selectedQuizId
  );

  if (isAlreadyAssigned) {
    alert('This quiz has already been assigned to this group.');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.post(
      'http://localhost:5000/api/groups/assign-quiz',
      {
        quiz_id: selectedQuizId,
        group_id: modalGroupId,
        deadline, 
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert('Quiz assigned successfully.');
    closeAssignModal(); 
  } catch (err) {
    if (
      err.response &&
      err.response.status === 400 &&
      err.response.data.message.includes('already')
    ) {
      alert('This quiz has already been assigned to this group.');
    } else {
      alert('Failed to assign quiz.');
    }
  }
};


  const handleTakeQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const generateGroupCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase(); 
  };

    const handleGroupDetails = async (groupId) => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/groups/student-assigned-quizzes/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.length === 0) {
          alert('This group has not been assigned any quizzes yet.');
        } else {
          navigate(`/groups/${groupId}/details`);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          alert('This group has not been assigned any quizzes yet.');
        } else {
          console.error('Error fetching assigned quizzes for group details:', err);
          alert('Failed to load quizzes for this group.');
        }
      }
    };

    const handleViewAssignedQuizzes = (groupId) => {
  if (activeGroupForQuizzes === groupId) {
    setActiveGroupForQuizzes(null);
    setAssignedQuizzes([]); 
  } else {
    fetchAssignedQuizzes(groupId);
    setActiveGroupForQuizzes(groupId);
  }
};

   const handleDeleteGroup = async (groupId) => {
    if (!groupId) {
      alert('No group selected for deletion.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/groups/delete-group/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        alert('Group deleted successfully.');
        setSelectedGroupId(null);
        setGroupMembers([]);
        fetchGroups();
      } catch (err) {
        console.error('Error deleting group:', err);
        alert('Failed to delete group. Please try again.');
      }
    };

  const handleDisplayProfessors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/groups/professors-with-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessorGroups(res.data.professors);
      setProfessorsModalOpen(true);
    } catch (err) {
      console.error("Error fetching professor groups:", err);
      alert("Failed to load professors and their groups.");
    }
  };

    useEffect(() => {
      if (error || success) {
        const timer = setTimeout(() => {
          setError(null);
          setSuccess('');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [error, success]);

    useEffect(() => {
      if (joinError || joinSuccess) {
        const timer = setTimeout(() => {
          setJoinError('');
          setJoinSuccess('');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [joinError, joinSuccess]);

    const token = localStorage.getItem('token');
  return (
  <div className="groups-page">
    <Sidebar showBackButton={true} />
    
    {userType === 'professor' && (
      <>
        <div className="join-group">
          <div className="input-row">
          <input
            type="text"
            className = "input-group-name"
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button 
            className = "btn-create-group" 
            onClick={handleCreateGroup}>
              Create Group
          </button>
          </div>
        </div>
          
          <div className="message-container">
                {error && <ErrorMessage message={error} />}
                {success && <SuccessMessage message={success} />}
          </div>

        <div className="group-cards">
          {groups.length === 0 ? (
            <p>No groups available.</p>
          ) : (
            groups.map((group) => (
              <div key={group.group_id} className="group-card">
                <h3>{group.group_name}</h3>
                <p>
                  Group Code: <code>{group.group_code}</code>
                </p>
                <button className = "btn-display-students"
                        onClick={() => handleDisplayStudents(group.group_id)}>
                  Display Students
                </button>
                <button className="btn-assign-quiz"
                        onClick={() => openAssignModal(group.group_id)}>
                  Assign Quiz
                </button>
                <button className = "btn-group-details"
                        onClick={() => handleGroupDetails(group.group_id)}>
                  Group Quizzes
                </button>
                <button className = "btn-delete"
                  onClick={() => handleDeleteGroup(group.group_id)}
                >
                  Delete Group
                </button>
              </div>
            ))
          )}
        </div>
      </>
    )}

    {userType === 'student' && (
      
      <>
        <div className="join-group">
          <div className="input-row">
            <input
              type="text"
              className = "input-join-group"
              placeholder="Enter group code"
              value={groupCodeToJoin}
              onChange={(e) => setGroupCodeToJoin(e.target.value)}
            />
            <button 
              className = "btn-join-group"
              onClick={handleJoinGroup}>Join Group
            </button>
          </div>
          
          <button className="btn-display-professors" onClick={handleDisplayProfessors}>
            Display Professors & Groups
          </button>
        </div>

        <div className="message-container">
                  {joinError && <ErrorMessage message={joinError} />}
                  {joinSuccess && <SuccessMessage message={joinSuccess} />}
        </div>
      

  
        <div className="group-cards">
          {groups.length === 0 ? (
            <p>You are not a part of any group yet.</p>
          ) : (
            groups.map((group) => (
              <div key={group.group_id} className="group-card">
                <h3>{group.group_name}</h3>
                <p>Group Professor: {group.professor_username}</p>
                <button
                  className={`view-assigned ${activeGroupForQuizzes === group.group_id ? 'active' : ''}`}
                  onClick={() => handleViewAssignedQuizzes(group.group_id)}
                >
                  View Assigned Quizzes 
                </button>

              </div>
            ))
          )}
        </div>

        {activeGroupForQuizzes && (
          <>
            <h2>Assigned Quizzes</h2>
            {assignedQuizzes.length === 0 ? (
              <p>You have not been assigned any quizzes yet for this group.</p>
            ) : (
              <div className="assigned-quizzes">
                {assignedQuizzes.map((quiz) => (
                   

                  <div key={quiz.quiz_id} className="quiz-card">
                    <h3>{quiz.title}</h3>
                    <p>
                      <strong>Category:</strong> {quiz.category_name}
                    </p>
                    <p>
                      <strong>Subcategory:</strong>{' '}
                      {quiz.subcategory_name || 'No Subcategory'}
                    </p>
                    <p>
                      <strong>Deadline:</strong>{' '}
                      {quiz.deadline
                        ? new Date(quiz.deadline).toLocaleString()
                        : 'No Deadline'}
                    </p>
                    <button
                      onClick={() => handleTakeQuiz(quiz.quiz_id)}
                      disabled={
                        (quiz.deadline && new Date(quiz.deadline) < new Date()) || 
                        (quiz.alreadyTaken && !quiz.retake_allowed)
                      }
                      className={`btn-take-quiz ${
                        (quiz.deadline && new Date(quiz.deadline) < new Date()) ||
                        (quiz.alreadyTaken && !quiz.retake_allowed)
                          ? 'disabled'
                          : ''
                      }`}
                    >                     
                  {quiz.deadline && new Date(quiz.deadline) < new Date()
                    ? 'Deadline Passed'
                    : quiz.alreadyTaken && !quiz.retake_allowed
                    ? 'Quiz Already Taken'
                    : 'Take Quiz'}
                </button>

                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
      </>
    )}

      <ModalProf
        isOpen={isProfessorsModalOpen}
        onClose={() => setProfessorsModalOpen(false)}
        professorGroups={professorGroups}
         token={token}
      />


    <Modal
      showAssignModal={showAssignModal}
      closeAssignModal={closeAssignModal}
      modalGroupId={modalGroupId}
      setSelectedQuizId={setSelectedQuizId}
      selectedQuizId={selectedQuizId}
      deadline={deadline}
      setDeadline={setDeadline}
      setModalMode={setModalMode}
      modalMode={modalMode}
      quizzes={quizzes}
      handleAssignQuiz={handleAssignQuiz}
    />

    <ModalStud
      isOpen={selectedGroupId !== null}
      onClose={() => {
        setSelectedGroupId(null);
        setGroupMembers([]);
      }}
      students={groupMembers}
    />
  </div>


);



};

export default Groups;
