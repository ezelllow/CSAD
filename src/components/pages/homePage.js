import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import './homePage.css';
import '../HeroSection.css';
import { Link } from 'react-router-dom';
import ChatbotButton from '../ChatbotButton';
import HeroSection from '../HeroSection';
import Cards from '../Cards';
import Slider from '../Slider';
import SellerCards from '../SellerCards';

const filterOptions = ["Available", "Halal", "Spicy", "Bedok"];

// Add this helper function at the top of the file, outside the HomePage component
const capitalizeWords = (str) => {
  if (!str) return ''; // Handle undefined/null values
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]); // ✅ Multi-select filters
  const { currentUser } = useAuth();
  const [selectedListing, setSelectedListing] = useState(null); // Add this new state
  const [userLikes, setUserLikes] = useState({});
  const [sellerUsernames, setSellerUsernames] = useState({});

  // Combine the listings and usernames fetching into one useEffect
  useEffect(() => {
    const listingsRef = database.ref('listings');
    let isSubscribed = true; // For cleanup

    const fetchData = async () => {
      try {
        const snapshot = await listingsRef.once('value');
        const allListings = [];
        const newUsernames = {};

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

        // Sort listings by date
        allListings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Fetch usernames for new sellers
        for (const listing of allListings) {
          if (!sellerUsernames[listing.sellerId] && isSubscribed) {
            try {
              const userSnapshot = await database.ref(`Users/${listing.sellerId}/username`).once('value');
              newUsernames[listing.sellerId] = userSnapshot.val() || 'Anonymous';
            } catch (error) {
              console.error('Error fetching username:', error);
              newUsernames[listing.sellerId] = 'Anonymous';
            }
          }
        }

        // Update state only if component is still mounted
        if (isSubscribed) {
          setListings(allListings);
          if (Object.keys(newUsernames).length > 0) {
            setSellerUsernames(prev => ({
              ...prev,
              ...newUsernames
            }));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up real-time listener for updates
    const handleListingUpdate = (snapshot) => {
      if (isSubscribed) {
        fetchData();
      }
    };

    listingsRef.on('value', handleListingUpdate);

    // Cleanup function
    return () => {
      isSubscribed = false;
      listingsRef.off('value', handleListingUpdate);
    };
  }, []); // Empty dependency array since we want this to run once on mount

  // Separate useEffect for user likes with cleanup
  useEffect(() => {
    if (!currentUser) return;

    const userLikesRef = database.ref(`Users/${currentUser.uid}/listingLikes`);
    let isSubscribed = true;
    
    const handleLikesUpdate = (snapshot) => {
      if (isSubscribed) {
        const likes = snapshot.val() || {};
        setUserLikes(likes);
      }
    };

    userLikesRef.on('value', handleLikesUpdate);

    return () => {
      isSubscribed = false;
      userLikesRef.off('value', handleLikesUpdate);
    };
  }, [currentUser]);

  // Update the filtering logic
  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilters.length === 0) return matchesSearch;

    // Check if listing matches ALL selected filters
    return matchesSearch && selectedFilters.every((filter) => {
      switch (filter) {
        case "Halal":
          return listing.halal === true;
        case "Spicy":
          return listing.spicy === true;
        case "Available":
          return listing.status?.toLowerCase() === "available" || !listing.status;
        case "Bedok":
          return listing.location?.toLowerCase() === "bedok";
        default:
          return false;
      }
    });
  });

  // ✅ Function to toggle filters on/off
  const toggleFilter = (filter) => {
    setSelectedFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter) // Remove filter if already selected
        : [...prevFilters, filter] // Add filter if not selected
    );
  };

  // Update the handleLike function
  const handleLike = async (listingId, sellerId, e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert("Please log in to like listings");
      return;
    }
    
    try {
      const userLikesRef = database.ref(`Users/${currentUser.uid}/listingLikes/${listingId}`);
      const listingRef = database.ref(`listings/${sellerId}/items/${listingId}`);
      const sellerStatsRef = database.ref(`Users/${sellerId}/stats/totalLikes`);

      const likeSnapshot = await userLikesRef.once('value');
      const hasLiked = likeSnapshot.val();

      // Update local state immediately for better UX
      setUserLikes(prev => ({
        ...prev,
        [listingId]: !hasLiked
      }));

      if (hasLiked) {
        // Unlike
        await userLikesRef.remove();
        const newLikes = await listingRef.child('likes').transaction(currentLikes => 
          (currentLikes || 0) > 0 ? currentLikes - 1 : 0
        );
        
        // Update selected listing if it exists
        if (selectedListing && selectedListing.id === listingId) {
          setSelectedListing(prev => ({
            ...prev,
            likes: newLikes.snapshot.val()
          }));
        }
        
        await sellerStatsRef.transaction(currentLikes => 
          (currentLikes || 0) > 0 ? currentLikes - 1 : 0
        );
      } else {
        // Like
        await userLikesRef.set(true);
        const newLikes = await listingRef.child('likes').transaction(currentLikes => 
          (currentLikes || 0) + 1
        );
        
        // Update selected listing if it exists
        if (selectedListing && selectedListing.id === listingId) {
          setSelectedListing(prev => ({
            ...prev,
            likes: newLikes.snapshot.val()
          }));
        }
        
        await sellerStatsRef.transaction(currentLikes => 
          (currentLikes || 0) + 1
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  return (
    <div className="menu-container">
      {/* Popup overlay */}
      {selectedListing && (
        <div className="popup-overlay" onClick={() => setSelectedListing(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedListing(null)}>×</button>
            <div className="popup-image-container">
              {selectedListing.imageUrl && (
                <img 
                  src={selectedListing.imageUrl} 
                  alt={selectedListing.title} 
                  className="popup-image"
                />
              )}
            </div>
            <div className="popup-details">
              <h2>{capitalizeWords(selectedListing.title)}</h2>
              <p className="popup-description">{selectedListing.description || "No description available"}</p>
              <div className="popup-meta">
                <div className="popup-info">
                  <span className="location">📍 Location: {capitalizeWords(selectedListing.location) || "Unknown"}</span>
                  <span className="expiry">⏰ Expires: {selectedListing.expiryDate ? new Date(selectedListing.expiryDate).toLocaleDateString() : "N/A"}</span>
                  <span className="quantity">📦 Quantity: {selectedListing.quantity || "N/A"}</span>
                  <span className="ingredients">🥗 Ingredients: {Array.isArray(selectedListing.ingredients) ? 
                    selectedListing.ingredients.join(', ') : capitalizeWords(selectedListing.ingredients) || "Not specified"}</span>
                  <span className="status" data-status={selectedListing.status || "available"}>
                    Status: {selectedListing.status || "Available"}
                  </span>
                  <div className="popup-actions">
                    <span 
                      onClick={(e) => handleLike(selectedListing.id, selectedListing.sellerId, e)}
                      className={`like-button ${userLikes[selectedListing.id] ? 'active' : ''}`}
                    >
                      {userLikes[selectedListing.id] ? '❤️' : '🤍'} {selectedListing.likes || 0}
                    </span>
                  </div>
                </div>
                <div className="popup-tags">
                  {(selectedListing.halal || selectedListing.spicy) ? (
                    <>
                      {selectedListing.halal && <span className="tag halal">Halal</span>}
                      {selectedListing.spicy && <span className="tag spicy">Spicy</span>}
                    </>
                  ) : (
                    // Placeholder tag when no real tags are present
                    <span className="tag placeholder hidden">Placeholder</span>
                  )}
                  <div className="seller-info">
                    <span className='se'>Posted by <i>{sellerUsernames[selectedListing.sellerId]}</i></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="search-section">
        <h1>Food Listings:</h1>
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
              {filter} {selectedFilters.includes(filter) && "✔"} {/* ✅ Shows checkmark on selected filters */}
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
              <div 
                key={listing.id} 
                className="menu-card"
                onClick={() => setSelectedListing(listing)}
              >
                {listing.imageUrl && (
                  <img 
                    src={listing.imageUrl} 
                    alt={listing.title} 
                    className="menu-image"
                  />
                )}
                <div className="menu-details">
                  <h3>{capitalizeWords(listing.title)}</h3>
                  <p>{listing.description || "No description available"}</p>
                  <div className="listing-meta">
                    <div className="listing-info">
                      <span className="location">📍 {capitalizeWords(listing.location) || "Unknown"}</span>
                      <span className="expiry">⏰ Expires: {listing.expiryDate ? new Date(listing.expiryDate).toLocaleDateString() : "N/A"}</span>
                      <span className="quantity">📦 Quantity: {listing.quantity || "N/A"}</span>
                      <span className="ingredients">🥗 Ingredients: {Array.isArray(listing.ingredients) ? 
                        listing.ingredients.join(', ') : listing.ingredients || "Not specified"}</span>
                      <span className="status" data-status={listing.status || "available"}>
                        Status: {capitalizeWords(listing.status) || "Available"}
                      </span>
                      <div className="listing-actions">
                        <span 
                          onClick={(e) => handleLike(listing.id, listing.sellerId, e)}
                          className={`like-button ${userLikes[listing.id] ? 'active' : ''}`}
                        >
                          {userLikes[listing.id] ? '❤️' : '🤍'} {listing.likes || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="tags">
                      {(listing.halal || listing.spicy) ? (
                        <>
                          {listing.halal && <span className="tag halal">Halal</span>}
                          {listing.spicy && <span className="tag spicy">Spicy</span>}
                        </>
                      ) : (
                        // Placeholder tag when no real tags are present
                        <span className="tag placeholder hidden">Placeholder</span>
                      )}
                    </div>
                  </div>
                  <div className="seller-info">
                    <span>Posted by <i>{sellerUsernames[listing.sellerId]}</i></span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No listings found</p>
          )}
        </div>
      </div>
      
      {/* Add the seller cards section */}
      <SellerCards />
    </div>
  );
}

export default HomePage;
