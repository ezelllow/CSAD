import React from 'react';
import ChatbotButton from '../ChatbotButton';
import HeroSection from '../HeroSection';
import Cards from '../Cards';
import Slider from '../Slider';
import '../HeroSection.css';
import './homePage.css';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';

function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const listingsRef = database.ref('listings');
    
    listingsRef.on('value', (snapshot) => {
      const allListings = [];
      
      snapshot.forEach((sellerSnapshot) => {
        const sellerId = sellerSnapshot.key;
        const items = sellerSnapshot.child('items').val();
        
        if (items) {
          Object.entries(items).forEach(([itemId, itemData]) => {
            allListings.push({
              id: itemId,
              sellerId,
              ...itemData
            });
          });
        }
      });

      // Sort by creation date
      allListings.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setListings(allListings);
      setLoading(false);
    });

    return () => listingsRef.off();
  }, []);

  return (
    <div className="homepage">

      {/* Food Listings Section */}
      <div className="content-section">
        <div className="section-container">
          <h2>Recent Food Listings</h2>
          {loading ? (
            <p>Loading listings...</p>
          ) : listings.length > 0 ? (
            <div className="card-grid">
              {listings.map((listing) => (
                <div className="food-card" key={listing.id}>
                  {listing.imageUrl && (
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.title}
                      className="food-image"
                    />
                  )}
                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>
                  <div className="listing-meta">
                    <span className="location">📍 {listing.location}</span>
                    <span className="expiry">⏰ Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span>
                    <span className={status ${listing.status}}>
                      {listing.status || 'available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No listings available</p>
          )}
        </div>
      </div>
      <ChatbotButton />
    </div>
    
  );
}

export default HomePage;