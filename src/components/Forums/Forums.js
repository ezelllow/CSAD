import React from 'react';
import './Forums.css';

export default function Forums() {
  console.log('Forums component rendering');
  
  return (
    <div className="forums-container">
      <div className="forums-sidebar">
        <div className="sidebar-section">
          <h3>Categories</h3>
          <div className="filter-item">
            <span>Food Rescue</span>
          </div>
          <div className="filter-item">
            <span>Recipes & Tips</span>
          </div>
          <div className="filter-item">
            <span>Community Events</span>
          </div>
        </div>
      </div>

      <div className="forums-main">
        <div className="forums-header">
          <div className="forums-tabs">
            <button className="active">Hot</button>
            <button>New</button>
            <button>Top</button>
          </div>
          <button className="create-post-btn">+ Create</button>
        </div>
        
        <div className="posts-grid">
          {/* Sample post card */}
          <div className="post-card">
            <div className="post-content">
              <div className="post-header">
                <span className="post-community">Food Rescue</span>
                <span className="user-flair flair-seller">Seller</span>
              </div>
              <h3>Welcome to HarvestHub Forums!</h3>
              <p>Join our community to discuss food rescue and sustainability.</p>
              <div className="post-footer">
                <div className="post-stats">
                  <span>👍 0</span>
                  <span>💬 0</span>
                </div>
                <span className="post-time">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="forums-right-sidebar">
        <div className="create-section">
          <h3>Start a discussion</h3>
          <button className="create-thread-btn">Start a discussion thread</button>
          <button className="ask-question-btn">Ask a question</button>
          <button className="share-media-btn">Share media</button>
          <button className="share-status-btn">Share a status</button>
        </div>
        <div className="trending-communities">
          <h3>Trending Communities</h3>
          <div className="community-item">
            <img src="/images/food-rescue.png" alt="Food Rescue" />
            <div className="community-info">
              <h4>Food Rescue</h4>
              <p>1.2k members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 