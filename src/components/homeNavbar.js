import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ref, get } from 'firebase/database';
import './homeNavbar.css';

function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('');
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        const userRef = ref(database, `Users/${currentUser.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val());
        } else {
          setUsername('User');
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  // Function to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>

          {/* Profile Section (Left Side) */}
          <div className="profile-section" ref={profileRef} onClick={toggleProfile}>
            <img 
              src="./pfp.png" 
              alt="Profile" 
              className="profile-icon" 
            />
            <span className="profile-name">{username}</span>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="profile-dropdown">
                <Link to="/dashboard" className="profile-dropdown-item">View Profile</Link>
                <Link to="/settings" className="profile-dropdown-item">Settings</Link>
                <button onClick={handleLogout} className="profile-dropdown-item">Logout</button>
              </div>
            )}
          </div>

          <Link to='/homePage' className='navbar-logo'>
            <span className='green'>Harvest</span><span className='orange'>Hub</span>
            <img 
              src='/images/harvest.png' 
              alt='HarvestHub Logo' 
              className='navbar-logo-image' 
              style={{ height: '100px', width: 'auto' }} 
            />
          </Link>

          <ul className="nav-menu">
            <li className='nav-item'><Link to="/map" className="nav-links">Map</Link></li>
            <li className='nav-item'><Link to="/announcements" className="nav-links">Announcements</Link></li>
            <li className='nav-item'><Link to="/calendar" className="nav-links">Calendar</Link></li>
            <li className='nav-item'><Link to="/socials" className="nav-links">Socials</Link></li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
