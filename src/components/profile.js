import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from "react-router-dom";
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import './profile.css';
import defaultProfilePic from './pfp.png'; // Default profile picture

export default function Profile() {
  const [error, setError] = useState("");
  const [username, setUsername] = useState('Loading...');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(defaultProfilePic); // Default profile image
  

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, `Users/${user.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUsername(snapshot.val());
          setProfilePic(userData.profilePic || defaultProfilePic);
        } else {
          setUsername('User');
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  async function handleLogout() {
    setError('');

    try {
      await logout();
      navigate('/');
    } catch {
      setError('Failed to log out');
    }
  }

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <Card.Body>
          <div className="profile-header">
            <img src={profilePic} alt="Profile" className="profile-image" />
            <h2 className="profile-title">{username}</h2>
            <p className="profile-email">{currentUser ? currentUser.email : "Loading..."}</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Link to="/update-profile" className="btn update-profile-btn">
            Update Profile
          </Link>
        </Card.Body>
      </Card>
    </div>
  );
}