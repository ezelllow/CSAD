import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './Chat.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [usersData, setUsersData] = useState({});

  // Check if user is near bottom
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  };

  // Handle scroll event
  const handleScroll = () => {
    setAutoScroll(isNearBottom());
  };

  // Scroll to bottom if autoScroll is true
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    const messagesRef = database.ref('Servers/ServerID/channels/ChannelID/messages');
    
    messagesRef.on('value', async (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const messagesList = Object.entries(messagesData).map(([id, message]) => ({
          id,
          ...message
        }));

        // Fetch user data for each unique sender
        const uniqueSenderIds = [...new Set(messagesList.map(msg => msg.senderId))];
        const userPromises = uniqueSenderIds.map(userId => 
          database.ref(`Users/${userId}`).once('value')
        );

        const userSnapshots = await Promise.all(userPromises);
        const userData = {};
        userSnapshots.forEach((snapshot, index) => {
          if (snapshot.exists()) {
            userData[uniqueSenderIds[index]] = snapshot.val();
          }
        });

        setUsersData(userData);
        setMessages(messagesList);
        scrollToBottom();
      }
    });

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      messagesRef.off();
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagesRef = database.ref('Servers/ServerID/channels/ChannelID/messages');
    await messagesRef.push({
      message: newMessage,
      timestamp: Date.now(),
      senderId: currentUser.uid,
      username: usersData[currentUser.uid]?.username || currentUser.displayName || 'Anonymous'
    });

    setNewMessage('');
    setAutoScroll(true);
  };

  return (
    <div className="chat-container">
      <div className="channels-sidebar">
        <h3>Channels</h3>
        <div className="channel-item active">
          # General
        </div>
      </div>

      <div className="chat-main">
        <div 
          className="messages-container" 
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message ${msg.senderId === currentUser?.uid ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <div className="message-user-info">
                  <img 
                    src={usersData[msg.senderId]?.profilePicture || "/pfp.png"} 
                    alt="Profile" 
                    className="message-profile-pic"
                  />
                  <span className="username">{usersData[msg.senderId]?.username || 'Anonymous'}</span>
                </div>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
          <button type="submit" className="send-button">Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat; 