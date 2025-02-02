import React, { useState } from 'react'; // ✅ Combine imports correctly
import './Footer.css';
import ContactForm from './contactForm';

function Footer() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className='footer-container'>
      <div className="footer-links">
        <div className="footer-link-items">
          <div className="contact-us-container" id='contact-us-section'>
              <h2>Buissness Enquires</h2>
              <button className="send-email-button" onClick={() => setShowForm(true)}>
                Contact Us
              </button>
          </div>
        </div>
      </div>

      {/* Modal Popup for Contact Form */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowForm(false)}>&times;</span>
            <ContactForm setShowForm={setShowForm} />
          </div>
        </div>
      )}
      <div className='footer-links'>
        <div className='footer-link-wrapper'>
          <div className='footer-link-items'>
            <h2>About Us</h2>
            <a href='/sign-up'>How it works</a>
            <a href='/'>Testimonials</a>
            <a href='/'>Careers</a>
            <a href='/'>Investors</a>
            <a href='/'>Terms of Service</a>
          </div>
          <div className='footer-link-items'>
            <h2>Contact Us</h2>
            <a href='/'>Contact</a>
            <a href='/'>Support</a>
            <a href='/'>Destinations</a>
            <a href='/'>Sponsorships</a>
          </div>
        </div>
        <div className='footer-link-wrapper'>
          <div className='footer-link-items'>
            <h2>Videos</h2>
            <a href='/'>Submit Video</a>
            <a href='/'>Ambassadors</a>
            <a href='/'>Agency</a>
            <a href='/'>Influencer</a>
          </div>
          <div className='footer-link-items'>
            <h2>Social Media</h2>
            <a href='https://www.instagram.com/klimbmen' target='_blank' rel='noopener noreferrer'>Instagram</a>
            <a href='https://www.facebook.com/ezell' target='_blank' rel='noopener noreferrer'>Facebook</a>
            <a href='https://www.youtube.com/mrbeast' target='_blank' rel='noopener noreferrer'>Youtube</a>
            <a href='https://www.twitter.com/elonmusk' target='_blank' rel='noopener noreferrer'>Twitter</a>
          </div>
        </div>
      </div>
      <section className='social-media'>
        <div className='social-media-wrap'>
          <div className='footer-logo'>
            <a href='/' className='social-logo'>
              <span className='green'>Harvest</span>
              <span className='orange'>Hub</span>
              <img
                src='/images/harvest.png'
                alt='HarvestHub Logo'
                className='navbar-logo-image'
                style={{ height: '100px', width: 'auto' }}
              />
            </a>
          </div>
          <small className='website-rights'>HarvestHub © 2025</small>
          <div className='social-icons'>
            {/* Facebook */}
            <a
              className='social-icon-link facebook'
              href='https://www.facebook.com/ezell'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Facebook'
            >
              <i className='fab fa-facebook-f' />
            </a>
            {/* Instagram */}
            <a
              className='social-icon-link instagram'
              href='https://www.instagram.com/klimbmen'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Instagram'
            >
              <i className='fab fa-instagram' />
            </a>
            {/* YouTube */}
            <a
              className='social-icon-link youtube'
              href='https://www.youtube.com/mrbeast'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='YouTube'
            >
              <i className='fab fa-youtube' />
            </a>
            {/* Twitter */}
            <a
              className='social-icon-link twitter'
              href='https://www.twitter.com/elonmusk'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Twitter'
            >
              <i className='fab fa-twitter' />
            </a>
            {/* LinkedIn */}
            <a
              className='social-icon-link linkedin'
              href='https://www.linkedin.com/'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='LinkedIn'
            >
              <i className='fab fa-linkedin' />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Footer;
