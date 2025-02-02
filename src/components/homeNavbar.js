import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase'; // Import Firebase auth and database
import { ref, get } from 'firebase/database'; // Import database functions
import './homeNavbar.css';

function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState(''); // State to store username
  const [role, setRole] = useState(''); // State to store user role
  const profileRef = useRef(null); // Reference for dropdown
  const navigate = useNavigate();

  /*useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, `Users/${user.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val()); // Set username from database
        } else {
          setUsername('User'); // Fallback username
        }
      }
    };

    fetchUsername();
  }, []); */

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, `Users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUsername(userData.username || 'User');
          setRole(userData.role || 'User'); // Default role as 'user'
        }
      }
    };

    fetchUserData();
  }, []);

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/'); // Redirect to home or login page after logout
    } catch (error) {
      console.error("Logout Error: ", error.message);
    }
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
                <Link to="/profile" className="profile-dropdown-item">View Profile</Link>
                <Link to="/settings" className="profile-dropdown-item">Settings</Link>
                <button className="profile-dropdown-item logout-button" onClick={handleLogout}>Logout</button>
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
            <li className='nav-item'>
              <Link to={role === 'Seller' ? "/bannoun" : "/uannouncements"} className="nav-links">
                Announcements
              </Link>
            </li>
            <li className='nav-item'><Link to="/calendar" className="nav-links">Calendar</Link></li>
            <li className='nav-item'><Link to="/socials" className="nav-links">Socials</Link></li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;