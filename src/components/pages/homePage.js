import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import './home.css';
import '../HeroSection.css';
import { Link } from 'react-router-dom';
import ChatbotButton from '../ChatbotButton';
import HeroSection from '../HeroSection';
import Cards from '../Cards';
import Slider from '../Slider';

const filterOptions = ["Dover", "Halal", "Spicy"]; // ✅ Multi-select filter options

function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]); // ✅ Multi-select filters
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

      // Sort listings by createdAt date (most recent first)
      allListings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setListings(allListings);
      setLoading(false);
    });

    return () => listingsRef.off();
  }, []);

  // ✅ Multi-Select Filtering Logic
  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilters.length === 0) return matchesSearch; // No filters selected, show all results

    return (
      matchesSearch &&
      selectedFilters.some((filter) => {
        switch (filter) {
          case "Halal":
            return listing.halal === true;
          case "Spicy":
            return listing.spicy === true;
          case "Dover":
            return listing.location?.toLowerCase() === "dover";
          default:
            return false;
        }
      })
    );
  });

  // ✅ Function to toggle filters on/off
  const toggleFilter = (filter) => {
    setSelectedFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter) // Remove filter if already selected
        : [...prevFilters, filter] // Add filter if not selected
    );
  };

  return (
    <div className="menu-container">
      <h1>Food Listings</h1>

      <input
        type="text"
        placeholder="Search listings..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="filter-buttons">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            className={selectedFilters.includes(filter) ? "active" : ""}
            onClick={() => toggleFilter(filter)}
          >
            {filter} {selectedFilters.includes(filter) && "✔"} {/* ✅ Shows checkmark on selected filters */}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading listings...</p>
      ) : filteredListings.length > 0 ? (
        <div className="menu-grid">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="menu-card">
              {listing.imageUrl && (
                <img 
                  src={listing.imageUrl} 
                  alt={listing.title} 
                  className="menu-image"
                />
              )}
              <div className="menu-details">
                <h3>{listing.title}</h3>
                <p>{listing.description || "No description available"}</p>
                <div className="listing-meta">
                  <span className="location">📍 {listing.location || "Unknown"}</span>
                  <span className="expiry">⏰ Expires: {listing.expiryDate ? new Date(listing.expiryDate).toLocaleDateString() : "N/A"}</span>
                  
                  {/* 🔥 Display Halal, Spicy, and Location tags properly */}
                  <div className="tags">
                    {listing.halal && <span className="tag halal">Halal</span>}
                    {listing.spicy && <span className="tag spicy">Spicy</span>}
                    {listing.location?.toLowerCase() === "dover" && <span className="tag location">Dover</span>} {/* ✅ Added location tag */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No listings found</p>
      )}
    </div>
  );
}

export default HomePage;
