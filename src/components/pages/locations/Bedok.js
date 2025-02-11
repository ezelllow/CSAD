import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { database, auth } from '../../../firebase';
import { ref, get, push, onValue } from 'firebase/database';
import './Bedok.css';
import '../../HeroSection.css';
import { Link } from 'react-router-dom';

const filterOptions = ["Halal", "Spicy"];

function BedokFridge() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('Anonymous');
  const user = auth.currentUser;
  const { currentUser } = useAuth();

  useEffect(() => {
    if (user) {
      const userRef = ref(database, `Users/${user.uid}/username`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setUsername(snapshot.val());
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const chatRef = ref(database, 'chats/chat_room_1/messages');
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const listingsRef = ref(database, 'listings');
    const unsubscribe = onValue(listingsRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn("No data found in Firebase for 'listings'");
        setListings([]);
        setLoading(false);
        return;
      }

      const allListings = [];
      snapshot.forEach((sellerSnapshot) => {
        const sellerId = sellerSnapshot.key;
        const items = sellerSnapshot.child('items').val();

        if (items) {
          Object.entries(items).forEach(([itemId, itemData]) => {
            if (itemData.location?.toLowerCase() === "bedok") {
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

      console.log("Fetched Bedok Listings:", allListings);
      setListings(allListings);
      setLoading(false);
    }, (error) => {
      console.error("Firebase read error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = () => {
    if (message.trim() !== '' && user) {
      const chatRef = ref(database, 'chats/chat_room_1/messages');
      const newMessage = {
        senderId: user.uid,
        username,
        message,
        timestamp: Date.now(),
      };

      push(chatRef, newMessage);
      setMessage('');
    }
  };

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
    <div className="bedok-container">
      <div className="livestream-section">
        <iframe
          src="https://www.youtube.com/embed/SjfFkP7wqt4?autoplay=1&controls=0&mute=1&modestbranding=1&disablekb=1&fs=0&showinfo=0&rel=0"
          title="Fridge Livestream"
          className="livestream"
          allowFullScreen
        ></iframe>
      </div>

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

      <div className="content-wrapper">
        <div className={`food-list-section ${showChat ? 'with-chat' : ''}`}>
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
                      <div className="tags">
                        {listing.halal && <span className="tag halal">Halal</span>}
                        {listing.spicy && <span className="tag spicy">Spicy</span>}
                        <span className={`tag status-${listing.status?.toLowerCase() || "available"}`}>
                          {listing.status || 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No food items available in Bedok</p>
          )}
        </div>

        {showChat && (
          <div className="chat-section">
            <h2>Community Chat</h2>
            <div className="chat-box">
              {messages.map((msg, index) => (
                <p key={index} className="chat-message"><strong>{msg.username}:</strong> {msg.message}</p>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input-field"
              />
              <button onClick={sendMessage} className="chat-send-button">Send</button>
            </div>
          </div>
        )}
      </div>

      <button className="chat-toggle-button" onClick={() => setShowChat(!showChat)}>
        {showChat ? 'Close Chat' : 'Open Chat'}
      </button>
    </div>
  );
}

export default BedokFridge;
