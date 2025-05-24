import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from "../../components/Sidebar/Sidebar";
import Modal from '../../components/Modal/Modal'; // Import Modal component

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
  const [modalMode, setModalMode] = useState('choose'); // 'choose' or 'create'
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);

  // Fetch user type and groups based on it (professor or student)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decoding JWT to access user info
      setUserType(decodedToken.userType);
    }

    fetchGroups();  // Load groups based on user type
  }, [userType]);

   useEffect(() => {
    if (userType === 'professor') {
      fetchQuizzes();  // Fetch quizzes only for professors
    }
  }, [userType]);

   const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/user/professor/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data);  // Set quizzes data
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
      setJoinError('Invalid group code or error joining the group.');
      console.error('Error joining group:', err);
    }
  };

  const handleDisplayStudents = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/groups/group-members/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupMembers(res.data);
      setSelectedGroupId(groupId);
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

  const openAssignModal = (groupId) => {
    setModalGroupId(groupId);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setSelectedQuizId(null);
    setDeadline('');
    setShowAssignModal(false);
    setModalGroupId(null);
  };

  const handleAssignQuiz = async () => {
  if (!modalGroupId || !selectedQuizId || !deadline) {
    alert("Please select a quiz and provide a deadline before assigning.");
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
      console.error('Error assigning quiz:', err);
      alert('Failed to assign quiz.');
    }
  }
};


  const handleTakeQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  // Generate group code
  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-char random code
  };

  return (
    <div className="groups-page">
      <Sidebar showBackButton={true} />

      {userType === 'professor' && (
        <>
          <div className="create-group">
            <input
              type="text"
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button onClick={handleCreateGroup}>Create Group</button>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}

          <div className="group-cards">
            {groups.length === 0 ? (
              <p>No groups available.</p>
            ) : (
              groups.map((group) => (
                <div key={group.group_id} className="group-card">
                  <h3>{group.group_name}</h3>
                  <p>Group Code: <code>{group.group_code}</code></p>
                  <button onClick={() => handleDisplayStudents(group.group_id)}>Display Students</button>
                  <button onClick={() => openAssignModal(group.group_id)}>Assign Quiz</button>

                  {selectedGroupId === group.group_id && (
                    <>
                      {groupMembers.length > 0 ? (
                        <ul>
                          {groupMembers.map((student) => (
                            <li key={student.student_id}>
                              {student.username} — {student.email}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No students in this group yet.</p>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {userType === 'student' && (
        <>
          <div className="join-group">
            <input
              type="text"
              placeholder="Enter group code"
              value={groupCodeToJoin}
              onChange={(e) => setGroupCodeToJoin(e.target.value)}
            />
            <button onClick={handleJoinGroup}>Join Group</button>
          </div>

          <div className="group-cards">
            {groups.length === 0 ? (
              <p>You are not a part of any group yet.</p>
            ) : (
              groups.map((group) => (
                <div key={group.group_id} className="group-card">
                  <h3>{group.group_name}</h3>
                  <p>Group Code: {group.group_code}</p>
                  <button onClick={() => fetchAssignedQuizzes(group.group_id)}>View Assigned Quizzes</button>
                </div>
              ))
            )}
          </div>

         <h2>Assigned Quizzes</h2>
          {assignedQuizzes.length === 0 ? (
            <p>You have not been assigned any quizzes yet.</p>
          ) : (
            <div className="assigned-quizzes">
              {assignedQuizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="quiz-card">
                  <h3>{quiz.title}</h3>
                  <p><strong>Category:</strong> {quiz.category_name}</p>
                  <p><strong>Subcategory:</strong> {quiz.subcategory_name || 'No Subcategory'}</p>
                  <p><strong>Deadline:</strong> {quiz.deadline ? new Date(quiz.deadline).toLocaleString() : 'No Deadline'}</p>
                  <button onClick={() => handleTakeQuiz(quiz.quiz_id)}>Take Quiz</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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
    </div>
  );
};

export default Groups;
