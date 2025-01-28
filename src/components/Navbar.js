import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Link as ScrollLink,scroller } from 'react-scroll'; // Correct alias to avoid conflict
import './Navbar.css';

function Navbar() {
  const location = useLocation(); // Get current page
  const navigate = useNavigate(); // For page navigation

  const handleScrollToSection = (section) => {
    if (location.pathname === '/') {
      // If already on Home page, scroll smoothly
      scroller.scrollTo(section, {
        smooth: true,
        duration: 800,
      });
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
          {button && <Button buttonStyle='btn--outline'>SIGN UP</Button>}
          {button && <Button buttonStyle='btn--outline'>LOGIN</Button>}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
