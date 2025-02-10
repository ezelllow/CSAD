import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './Chat.css';

function Chat({ chatId, isDM, otherUser }) {
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

  // Handle scroll
  const handleScroll = () => {
    setAutoScroll(isNearBottom());
  };

  // Scroll to bottom 
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container && autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = isDM 
      ? database.ref(`directMessages/${chatId}/messages`)
      : database.ref('chats/messages');

    messagesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, message]) => ({
          id,
          ...message
        }));
        setMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => messagesRef.off();
  }, [currentUser, chatId, isDM]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    try {
      const messagesRef = isDM 
        ? database.ref(`directMessages/${chatId}/messages`)
        : database.ref('chats/messages');

      await messagesRef.push({
        content: message,
        senderId: currentUser.uid,
        timestamp: Date.now()
      });

      // Update lastUpdated for DMs
      if (isDM) {
        await database.ref(`directMessages/${chatId}`).update({
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="channels-sidebar">
        <h3>CHANNELS</h3>
        <div className="channel-item active">
          # General
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h3># General</h3>
        </div>
        
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
                  <span className="username">
                    {usersData[msg.senderId]?.username || 'Anonymous'}
                  </span>
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