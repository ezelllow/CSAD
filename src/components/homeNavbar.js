import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';



function Navbar() {
    const navigate = useNavigate(); // For navigation
  
    const [click, setClick] = useState(false);
  
    const closeMobileMenu = () => setClick(false);

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          <Link to='/homePage' className='navbar-logo'>
            <span className='green'>Harvest</span><span className='orange'>Hub</span>
            <img 
              src='/images/harvest.png' 
              alt='HarvestHub Logo' 
              className='navbar-logo-image' 
              style={{ height: '100px', width: 'auto' }} // Adjust size as needed
            />
          </Link>
          <div className='menu-icon' >
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link 
                to="/map" // ID of the HeroSection
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={closeMobileMenu}
              >
                Map
              </Link >
            </li>
            <li className='nav-item'>
              <Link
                to="cards-section" // ID of the Cards section
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={closeMobileMenu}
              >
                App
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to="slider-section" // ID of the Slider section
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={closeMobileMenu}
              >
                App
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to="contact-us-section" // ID of the HeroSection
                smooth={true}
                duration={500}
                className="nav-links"
                onClick={closeMobileMenu}
              >
                App
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
