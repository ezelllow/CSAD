import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from "react-router-dom";
import { auth, database, storage } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { getDownloadURL, uploadBytesResumable, ref as storageRef } from "firebase/storage";
import './profile.css';
import defaultProfilePic from './add.jpg'; // Default profile image

export default function Profile() {
  const [error, setError] = useState("");
  const [username, setUsername] = useState('Loading...');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null); // State for image preview

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, `Users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUsername(userData.username || "User");
          setProfilePic(userData.profilePicture || defaultProfilePic);
        }
      }
    };

    fetchUserData();
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

  // Open modal when clicking profile picture
  const handleProfilePictureClick = () => {
    setShowModal(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
  
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Set the preview URL
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload new profile picture to Firebase Storage
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file before uploading.");
      return;
    }

    try {
      const imageRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}`);
      const uploadTask = uploadBytesResumable(imageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          alert("Error uploading image: " + error.message);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setProfilePic(downloadUrl); // Update the profile picture instantly

          // Update the database with the new profile picture URL
          const userRef = ref(database, `Users/${auth.currentUser.uid}`);
          await update(userRef, { profilePicture: downloadUrl });

          setShowModal(false); // Close the modal after updating
          alert("Profile picture updated successfully!");
        }
      );
    } catch (error) {
      alert("Failed to upload image: " + error.message);
    }
  };

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <Card.Body>
          <div className="profile-header">
            {/* Clickable Profile Picture to Open Modal */}
            <img 
              src={profilePic} 
              alt="Profile" 
              className={profilePic === defaultProfilePic ? "default-profile-icon clickable" : "profile-image clickable"} 
              onClick={handleProfilePictureClick}
            />
            <h2 className="profile-title">{username}</h2>
            <p className="profile-email">{currentUser ? currentUser.email : "Loading..."}</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Link to="/update-profile" className="btn update-profile-btn">
            Update Profile
          </Link>
        </Card.Body>
      </Card>

      {/* Centered Modal for Updating Profile Picture */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-content-container">
            <Form.Group>
              <Form.Label>Select a new profile picture</Form.Label>
              <Form.Control type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
            </Form.Group>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpload}>Upload</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
