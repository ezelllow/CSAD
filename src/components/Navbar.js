import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Link as ScrollLink,scroller } from 'react-scroll'; // Correct alias to avoid conflict
import './Navbar.css';

function Navbar() {
  const location = useLocation(); // Get current page
  const navigate = useNavigate(); // For page navigation

  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const openLogin = () => {
    setShowLogin(true);
    setShowSignUp(false);
  };

  const openSignUp = () => {
    setShowSignUp(true);
    setShowLogin(false);
  };

  const closePopup = () => {
    setShowLogin(false);
    setShowSignUp(false);
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
    if (location.pathname === '/') {
      // If already on Home page, scroll smoothly
      setTimeout(() => {
        scroller.scrollTo(section, {
          smooth: true,
          duration: 800,
        });
      }, 500); // Delay to ensure page loads before scrolling
    } else {
      // If on another page, navigate to home first, then scroll after load
      navigate('/');
      setTimeout(() => {
        scroller.scrollTo(section, {
          smooth: true,
          duration: 800,
        });
      }, 500); // Delay to ensure page loads before scrolling
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

  window.addEventListener('resize', showButton);

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          <Link to='/' className='navbar-logo' onClick={() => handleScrollToSection("hero-section")}>
            <span className='green'>Harvest</span><span className='orange'>Hub</span>
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
          {button && <Button buttonStyle='btn--outline' onClick={openSignUp}>SIGN UP</Button>}
          {button && <Button buttonStyle='btn--outline' onClick={openLogin}>LOGIN</Button>}
        </div>
      </nav>
      {showLogin && (
        <div className="popup" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closePopup}>&times;</span>
            <h2>Login</h2>
            <form>
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
              <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <span onClick={openSignUp} className="popup-link">Sign Up</span></p>
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="popup" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closePopup}>&times;</span>
            <h2>Sign Up</h2>
            <form>
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
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
