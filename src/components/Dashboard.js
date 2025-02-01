import React, { useState, useEffect } from 'react'
import { Card, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from "react-router-dom"
import { database } from '../firebase';
import { ref, get } from 'firebase/database';


export default function Dashboard() {
  const [error, setError] = useState("")
  const [username, setUsername] = useState('Loading...');
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()


  // Fetch username from Firebase Realtime Database
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        const userRef = ref(database, `Users/${currentUser.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val()); // Store username
        } else {
          setUsername('No Username Set'); // Fallback if no username found
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  async function handleLogout(){
    setError('')

    try {
      await logout()
      navigate('/')
    } catch {
      setError('Failed to log out')
    }
  }
  return (
    <>
      <Card>
        <Card.Body>
          <h2 className='text-center mb-4'>Profile</h2>
          {error && <Alert variant="danger">{error}</Alert> }
          <strong>Username: </strong> {username} <br />
          <strong>Email: </strong> {currentUser ? currentUser.email : "Loading..."}
          <Link to="/update-profile" className="btn btn-primary w-100 mt-3">
            Update Profile
          </Link>
        </Card.Body>
      </Card>
      <div className='w-100 text-center mt-2'>
          <Button variant="link" onClick={handleLogout}>Log Out</Button>
      </div>
    </>
  )
}
