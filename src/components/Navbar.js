import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Link as ScrollLink } from 'react-scroll'; // Import Link from react-scroll
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
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
          <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
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
                onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
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
                onClick={closeMobileMenu}
              >
                Products
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
