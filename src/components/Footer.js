import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Footer.css';
import ContactForm from './contactForm';

function Footer() {
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  // Don't render footer on the socials page
  if (location.pathname === '/socials') {
    return null;
  }

  return (
    <footer className="footer" id='contact-us-section'>
      <div className="business-enquiries">
        <h2>Business Enquiries</h2>
        <button className="contact-button" onClick={() => setShowForm(true)}>
          Contact Us
        </button>
      </div>

      <div className="footer-content">
        <div className="footer-section">
          <h3>About Us</h3>
          <ul>
            <li>How it works</li>
            <li>Testimonials</li>
            <li>Careers</li>
            <li>Investors</li>
            <li>Terms of Service</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul>
            <li>Contact</li>
            <li>Support</li>
            <li>Destinations</li>
            <li>Sponsorships</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Videos</h3>
          <ul>
            <li>Submit Video</li>
            <li>Ambassadors</li>
            <li>Agency</li>
            <li>Influencer</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Social Media</h3>
          <ul>
            <li>Instagram</li>
            <li>Facebook</li>
            <li>Youtube</li>
            <li>Twitter</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-logo">
          <span className="green">Harvest</span>
          <span className="orange">Hub</span>
          <img src="/images/harvest.png" alt="HarvestHub Logo" />
        </div>
        <p>HarvestHub © 2025</p>
        <div className="social-icons">
          <i className="fab fa-facebook"></i>
          <i className="fab fa-instagram"></i>
          <i className="fab fa-youtube"></i>
          <i className="fab fa-twitter"></i>
          <i className="fab fa-linkedin"></i>
        </div>
      </div>

      {showForm && <ContactForm onClose={() => setShowForm(false)} />}
    </footer>
  );
}

export default Footer;
