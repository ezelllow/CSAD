import React from 'react';
import ChatbotButton from '../ChatbotButton';
import '../HeroSection.css';
import './homePage.css';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="homepage">
      <div className="hero-container">
        <h1>Welcome to <span className="green">Harvest</span><span className="orange">Hub</span></h1>
        <p>Your Food Rescue Journey Starts Here</p>
        <div className="hero-btns">
          <button className="btn" onClick={() => window.location.href='/map'}>
            Find Food Near You
          </button>
          <button className="btn" onClick={() => window.location.href='/calendar'}>
            Join Food Rescue Events
          </button>
        </div>
      </div>
      
      <div className="content-section">
        <div className="section-container">
          <h2>Recent Food Listings</h2>
          <div className="card-grid">
            <div className="food-card">
              <h3>Fresh Bread</h3>
              <p>Available at Local Bakery</p>
              <span className="location">Punggol</span>
            </div>
            <div className="food-card">
              <h3>Vegetables</h3>
              <p>From Community Garden</p>
              <span className="location">Bedok</span>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />

      <section className="homepage-section forums-section">
        <h2>Community Forums</h2>
        <p>Join discussions, share experiences, and connect with other members of our food-saving community.</p>
        <div className="features-grid">
          <div className="feature-card">
            <i className="feature-icon">💬</i>
            <h3>Discussion Threads</h3>
            <p>Engage in meaningful conversations about food waste reduction.</p>
          </div>
          <div className="feature-card">
            <i className="feature-icon">📸</i>
            <h3>Share Stories</h3>
            <p>Share your success stories and inspire others.</p>
          </div>
          <div className="feature-card">
            <i className="feature-icon">👥</i>
            <h3>Community Support</h3>
            <p>Get advice and support from experienced members.</p>
          </div>
        </div>
        <Link to="/forums" className="cta-button">Join the Discussion</Link>
      </section>
    </div>
  );
}

export default HomePage; 