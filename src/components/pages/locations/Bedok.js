import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../firebase';
import { ref, get, push, onValue } from 'firebase/database';
import './Bedok.css';

const BedokFridge = () => {
  const [foodItems, setFoodItems] = useState([
    { id: 1, name: "Milk", expiry: "2025-02-10" },
    { id: 2, name: "Eggs", expiry: "2025-02-15" },
    { id: 3, name: "Bread", expiry: "2025-02-12" },
  ]);
  const [showChat, setShowChat] = useState(false); // Toggle chat visibility
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

    onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });
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
          <h2>Available Food Items</h2>
          <ul>
            {foodItems.map((item) => (
              <li key={item.id} className="food-item">{item.name} (Exp: {item.expiry})</li>
            ))}
          </ul>
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
