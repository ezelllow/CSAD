import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { database } from '../../../firebase';
import { ref, get, push, onValue } from 'firebase/database'; // ✅ Ensure `onValue` is imported
import './Bedok.css';
import '../../HeroSection.css';
import { Link } from 'react-router-dom';

const filterOptions = ["Halal", "Spicy"]; // ✅ Filter options for Bedok

function BedokFridge() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const listingsRef = ref(database, 'listings');

    const unsubscribe = onValue(listingsRef, (snapshot) => {
      if (!snapshot.exists()) {  // ✅ Prevent accessing undefined data
        console.warn("No data found in Firebase for 'listings'");
        setListings([]); // Ensure state is updated safely
        setLoading(false);
        return;
      }

      const allListings = [];
      snapshot.forEach((sellerSnapshot) => {
        const sellerId = sellerSnapshot.key;
        const items = sellerSnapshot.child('items').val();

        if (items) {
          Object.entries(items).forEach(([itemId, itemData]) => {
            if (itemData.location?.toLowerCase() === "bedok") { // ✅ Only filter Bedok
              allListings.push({
                id: itemId,
                sellerId,
                ...itemData
              });
            }
          });
        }
      });

      allListings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      console.log("Fetched Bedok Listings:", allListings); // ✅ Debugging log
      setListings(allListings);
      setLoading(false);
    }, (error) => {
      console.error("Firebase read error:", error); // ✅ Catch any Firebase errors
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilters.length === 0) return matchesSearch; 

    return (
      matchesSearch &&
      selectedFilters.some((filter) => {
        switch (filter) {
          case "Halal":
            return listing.halal === true;
          case "Spicy":
            return listing.spicy === true;
          default:
            return false;
        }
      })
    );
  });

  const toggleFilter = (filter) => {
    setSelectedFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter)
        : [...prevFilters, filter]
    );
  };

  return (
    <div className="menu-container">
      <div className="search-section">
        <h1>Bedok Food Listings</h1>
        <input
          type="text"
          placeholder="Search food items..."
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
              {filter} {selectedFilters.includes(filter) && "✔"}
            </button>
          ))}
        </div>
      </div>
      
      <div className="menu-grid-container">
        <div className="menu-grid">
          {loading ? (
            <p>Loading listings...</p>
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
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
                    <div className="listing-info">
                      <span className="location">📍 {listing.location || "Unknown"}</span>
                      <span className="expiry">⏰ Expires: {listing.expiryDate ? new Date(listing.expiryDate).toLocaleDateString() : "N/A"}</span>
                      <span className="quantity">📦 Quantity: {listing.quantity || "N/A"}</span>
                      <span className="ingredients">🥗 Ingredients: {listing.ingredients || "Not specified"}</span>
                      <span className="status" data-status={listing.status || "available"}>
                        Status: {listing.status || "Available"}
                      </span>
                    </div>
                    
                    <div className="tags">
                      {listing.halal && <span className="tag halal">Halal</span>}
                      {listing.spicy && <span className="tag spicy">Spicy</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No listings found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BedokFridge;
