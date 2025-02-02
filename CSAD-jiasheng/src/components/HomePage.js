import React from 'react';
import ChatbotButton from './ChatbotButton';
import './HeroSection.css';
import './HomePage.css';

function HomePage() {
  return (
    <div>
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
    </div>
  );
}

export default HomePage; 