import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import './homeNavbar.css';

function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [profilePicture, setProfilePicture] = useState('./pfp.png'); // Default Profile Picture
  const profileRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, `Users/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUsername(userData.username || 'User');
            setRole(userData.role || 'user');
            if (userData.profilePicture) {
              setProfilePicture(userData.profilePicture); // Set profile pic if exists
            }
          }
        }).catch((error) => {
          console.error("Error fetching user data:", error);
        });
      }
    };

    fetchUserData();
  }, []);

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

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
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          {/* Profile Section */}
          <div className="profile-section" ref={profileRef} onClick={toggleProfile}>
            <img 
              src={profilePicture} 
              alt="Profile" 
              className="profile-icon" 
            />
            <span className="profile-name">{username}</span>
            {profileOpen && (
              <div className="profile-dropdown">
                <Link to="/profile" className="profile-dropdown-item">View Profile</Link>
                {(role === 'Seller') && (
                  <Link to="/seller-dashboard" className="profile-dropdown-item">
                    Seller Dashboard
                  </Link>
                )}
                <button className="profile-dropdown-item logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Logo */}
          <Link to='/homePage' className='navbar-logo'>
            <span className='green'>Harvest</span>
            <span className='orange'>Hub</span>
            <img 
              src='/images/harvest.png' 
              alt='HarvestHub Logo' 
              className='navbar-logo-image'
            />
          </Link>

          {/* Navigation Menu */}
          <ul className="nav-menu">
            <li className='nav-item'>
              <Link to="/map" className="nav-links">Map</Link>
            </li>
            <li className='nav-item'>
              <Link 
                to={role === 'Seller' ? "/bannoun" : "/uannouncements"} 
                className="nav-links"
              >
                Announcements
              </Link>
            </li>
            <li className='nav-item'>
              <Link to="/calendar" className="nav-links">Calendar</Link>
            </li>
            <li className='nav-item'>
              <Link to="/forums" className="nav-links">Forums</Link>
            </li>
            <li className='nav-item'>
              <Link to="/socials" className="nav-links">Socials</Link>
            </li>
            {role === 'Seller' && (
              <li className='nav-item'>
                <Link to="/seller-dashboard" className="nav-links">Dashboard</Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
      
      {/* Add placeholders for spacing */}
      <div className="nav-placeholder"></div>
    </>
  );
}

export default Navbar;
