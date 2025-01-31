import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './homeNavbar.css';

function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null); // Reference for dropdown

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
            <span className="profile-name">Ezell</span>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="profile-dropdown">
                <Link to="/dashboard" className="profile-dropdown-item">View Profile</Link>
                <Link to="/settings" className="profile-dropdown-item">Settings</Link>
                <Link to="/logout" className="profile-dropdown-item">Logout</Link>
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
