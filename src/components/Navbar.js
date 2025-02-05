import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './Navbar.css';
import { Button } from './Button';
import { Link as ScrollLink,scroller } from 'react-scroll'; // Correct alias to avoid conflict
import { database } from '../firebase';
import { set, ref } from "firebase/database";  //new


function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('User');  // Default role is User


  // Handle the role selection change
  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };


  const openLogin = () => {
    setShowLogin(true);
    setShowSignUp(false);
    setIsResettingPassword(false);
    setError('');
  };

  const openSignUp = () => {
    setShowSignUp(true);
    setShowLogin(false);
    setIsResettingPassword(false);
    setError('');
  };

  const closePopup = () => {
    setShowLogin(false);
    setShowSignUp(false);
    setIsResettingPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);


  const handleScrollToSection = (section) => {
    if (location.pathname !== '/') {
      navigate('/');
      scroller.scrollTo(section, { smooth: true, duration: 800 });
    } 
  };

  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  };

  useEffect(() => {
    showButton();
  }, []);

  //window.addEventListener('resize', showButton);
  useEffect(() => {
    const handleResize = () => showButton();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      closePopup();
      navigate('/homePage');  // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);  //new
      const user = userCredential.user; //new
       // Save username to Realtime Database
       await set(ref(database, "Users/" + user.uid), {
        email: email,
        role: role, // Store the selected role here
        username: username
      });

      alert('Account created successfully!');
      closePopup();
      navigate('/homePage');  // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset your password');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Check your inbox.');
      closePopup();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="green">Harvest</span><span className="orange">Hub</span>
          <img 
              src='/images/harvest.png' 
              alt='HarvestHub Logo' 
              className='navbar-logo-image' 
              style={{ height: '100px', width: 'auto' }} // Adjust size as needed
            />
        </Link>

        <div className='menu-icon' onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <ScrollLink
                to="hero-section" // ID of the HeroSection
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={() => handleScrollToSection("hero-section")}
              >
                Home
              </ScrollLink>
            </li>
            <li className='nav-item'>
              <ScrollLink
                to="cards-section" // ID of the Cards section
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={() => handleScrollToSection("cards-section")}
              >
                Community
              </ScrollLink>
            </li>
            <li className='nav-item'>
              <ScrollLink
                to="slider-section" // ID of the Slider section
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={() => handleScrollToSection("slider-section")}
              >
                App
              </ScrollLink>
            </li>
            <li className='nav-item'>
              <ScrollLink
                to="contact-us-section" // ID of the HeroSection
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={() => handleScrollToSection("contact-us-section")}
              >
                Contact Us
              </ScrollLink>
            </li>
            <li>
              <Link
                to='/sign-up'
                className='nav-links-mobile'
                id='signup'
                onClick={closeMobileMenu}
              >
                Sign Up
              </Link>
            </li>
            <li>
              <Link
                to='/sign-up'
                className='nav-links-mobile'
                onClick={closeMobileMenu} 
              >
                Login
              </Link>
            </li>
          </ul>
          {button && !isResettingPassword && <Button buttonStyle='btn--outline' onClick={openSignUp}>SIGN UP</Button>}
          {button && !isResettingPassword && <Button buttonStyle='btn--outline' onClick={openLogin}>LOGIN</Button>}
      </div>  
    </nav>

        {showLogin && (
          <div className="popup" onClick={closePopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              {!isResettingPassword &&<h2>Login</h2>}
              {error && <p className="error">{error}</p>}
              <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {!isResettingPassword && (
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              )}
              {!isResettingPassword && <button type="submit">Login</button>}
              </form>
            {!isResettingPassword ? (
              <p><span onClick={() => setIsResettingPassword(true)} className="popup-link">Forgot Password?</span></p>
            ) : (
              <button onClick={handlePasswordReset} className="reset-button">Reset Password</button>
            )}
            {!isResettingPassword && <p>Don't have an account? <span onClick={openSignUp} className="popup-link">Sign Up</span></p>}
          </div>
        </div>
      )}

        {showSignUp && (
          <div className="popup" onClick={closePopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <h2>Sign Up</h2>
              {error && <p className="error">{error}</p>}
              <form onSubmit={handleSignUp}>
                <input type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required/>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                {/* Add Role selection */}
                <label>Select Role:</label>
                <select value={role} onChange={handleRoleChange} required>
                  <option value="User">User</option>
                  <option value="Seller">Seller</option>
                </select>
                <button type="submit">Sign Up</button>
              </form>
              <p>Already have an account? <span onClick={openLogin} className="popup-link">Login</span></p>
            </div>
          </div>
        )}

    </>  
      
  );
}

export default Navbar;