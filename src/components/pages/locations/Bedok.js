import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../firebase';
import { ref, get, push, onValue } from 'firebase/database';
import './Bedok.css';

const BedokFridge = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('Anonymous');
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const userRef = ref(database, `Users/${user.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val());
        }
      }
    };

    fetchUsername();
  }, [user]);

  useEffect(() => {
    const chatRef = ref(database, 'chats/chat_room_1/messages');

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });

    return () => unsubscribe(); // ✅ Correctly unsubscribes Firebase listener
  }, []);

  // ✅ Fetch only "Bedok" listings from Firebase (Fixed unsubscribe issue)
  useEffect(() => {
    const listingsRef = ref(database, 'listings');

    const unsubscribe = onValue(listingsRef, (snapshot) => {
      const allListings = [];

      snapshot.forEach((sellerSnapshot) => {
        const sellerId = sellerSnapshot.key;
        const items = sellerSnapshot.child('items').val();

        if (items) {
          Object.entries(items).forEach(([itemId, itemData]) => {
            if (itemData.location?.toLowerCase() === "bedok") { // ✅ Filter for Bedok
              allListings.push({
                id: itemId,
                sellerId,
                ...itemData
              });
            }
          });
        }
      });

      // Sort listings by createdAt date (most recent first)
      allListings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setListings(allListings);
      setLoading(false);
    });

    return () => unsubscribe(); // ✅ Correctly removes Firebase listener
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

  return (
    <div className="bedok-container">
      <div className="livestream-section">
        <iframe
          src="https://www.youtube.com/embed/20sA-bYT5fY?autoplay=1&controls=0&mute=1&modestbranding=1&disablekb=1&fs=0&showinfo=0&rel=0"
          title="Fridge Livestream"
          className="livestream"
          allowFullScreen
        ></iframe>
      </div>

      <div className="content-wrapper">
        <div className={`food-list-section ${showChat ? 'with-chat' : ''}`}>
          <h2>Bedok Food Listings</h2>

          {loading ? (
            <p>Loading food items...</p>
          ) : listings.length > 0 ? (
            <div className="menu-grid">
              {listings.map((listing) => (
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
                      
                      {/* 🔥 Display Halal, Spicy, and Status tags properly */}
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

      {/* Floating chat button */}
      <button className="chat-toggle-button" onClick={() => setShowChat(!showChat)}>
        {showChat ? 'Close Chat' : 'Open Chat'}
      </button>
    </div>
  );
};

export default BedokFridge;
