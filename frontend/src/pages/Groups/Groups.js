import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Groups.css";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [userType, setUserType] = useState('');
  const [groupCodeToJoin, setGroupCodeToJoin] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch groups based on user type (professor or student)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decoding JWT to access user info
      setUserType(decodedToken.userType);
    }

    console.log("User Type from JWT:", userType);  // Log userType to check if it's set correctly
    fetchGroups();  // Load groups based on user type
  }, [userType]);



  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Only fetch groups if the user is a professor
      if (userType === 'professor') {
        const res = await axios.get('http://localhost:5000/api/groups/professor-groups', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Groups fetched for professor:", res.data);  // Log groups fetched for professor
        setGroups(res.data);  // Update the groups state with the data
      } else if (userType === 'student') {
            // Fetch groups for student
            const res = await axios.get('http://localhost:5000/api/groups/student-groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);  // Update the groups state with the data
      }
    } catch (err) {
      setError('Failed to load groups.');
      console.error("Error loading groups:", err);
    }
  };

  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-char random code
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
      console.error("Error creating group:", err);  // Log the error if group creation fails
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
      fetchGroups(); // Optionally refresh the group list
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setJoinError('You have already joined this group.');
        console.warn('Student already in group — handled gracefully.');
      } else if (err.response && err.response.status === 404) {
        setJoinError('Group not found.');
      } else {
        setJoinError('Invalid group code or error joining the group.');
        console.error('Unexpected join group error:', err);
      }
    }
  };

  const handleDisplayStudents = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/groups/group-members/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Group Members:", res.data);  // Log group members for the selected group
      setSelectedGroupId(groupId);
      setGroupMembers(res.data);
    } catch (err) {
      console.error("Error fetching group members:", err);
      setGroupMembers([]);
    }
  };

  useEffect(() => {
    console.log("Groups state:", groups);  // Log groups state to check if it's populated
  }, [groups]);

 return (
  <div className="groups-page">
    <Sidebar showBackButton={true} />

    {userType === 'professor' ? (
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

        <div className="group-list">
          {groups.length === 0 ? (
            <p>No groups available.</p>
          ) : (
            <ul>
              {groups.map((group) => (
                <li key={group.group_id}>
                  <strong>{group.group_name}</strong> — Code: <code>{group.group_code}</code>
                  <button onClick={() => handleDisplayStudents(group.group_id)}>
                    Display Students
                  </button>
                  {selectedGroupId === group.group_id && groupMembers.length > 0 && (
                    <ul>
                      {groupMembers.map((student) => (
                        <li key={student.student_id}>
                          {student.username} — {student.email}
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedGroupId === group.group_id && groupMembers.length === 0 && (
                    <p>No students in this group yet.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    ) : (
      <>
        {userType === 'student' && (
                <div className="join-group">
                    <input
                        type="text"
                        placeholder="Enter group code"
                        value={groupCodeToJoin}
                        onChange={(e) => setGroupCodeToJoin(e.target.value)}
                    />
                    <button onClick={handleJoinGroup}>Join Group</button>
                </div>
         )} 

          <div className="group-cards">
            {groups.length === 0 ? (
              <p>You are not a part of any group yet.</p>
            ) : (
              groups.map((group) => (
                <div key={group.group_id} className="group-card">
                  <h3>{group.group_name}</h3>
                  <p>Group Code: {group.group_code}</p>
                </div>
              ))
            )}
          </div>
       

        

       
      </>
    )}
  </div>
);
};

export default Groups;
