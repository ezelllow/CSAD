import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './DirectMessageChat.css';

function DirectMessageChat({ chatId, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !chatId || !otherUser) return;

    const messagesRef = database.ref(`directMessages/${chatId}/messages`);
    messagesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data)
          .map(([id, message]) => ({
            id,
            ...message,
            isOwn: message.senderId === currentUser.uid
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
        scrollToBottom();
      }
    });

    return () => messagesRef.off();
  }, [currentUser, chatId, otherUser]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage,
        senderId: currentUser.uid,
        timestamp: Date.now()
      };

      const messagesRef = database.ref(`directMessages/${chatId}/messages`);
      await messagesRef.push(messageData);

      await database.ref(`directMessages/${chatId}`).update({
        lastMessage: {
          content: newMessage,
          timestamp: Date.now(),
          senderId: currentUser.uid
        },
        lastUpdated: Date.now()
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="dm-chat-container">
      <div className="dm-chat-header">
        <img 
          src={otherUser?.profilePicture || "/pfp.png"} 
          alt={otherUser?.username} 
          className="dm-chat-avatar"
        />
        <div className="dm-chat-user-info">
          <span className="dm-chat-username">{otherUser?.username}</span>
          <span className="dm-chat-status">{otherUser?.role || 'User'}</span>
        </div>
      </div>

      <div className="dm-chat-messages" ref={messagesContainerRef}>
        {messages.map(message => (
          <div 
            key={message.id}
            className={`dm-message ${message.isOwn ? 'own-message' : ''}`}
          >
            <div className="dm-message-header">
              <span className="dm-message-username">
                {message.isOwn ? 'You' : otherUser?.username}
              </span>
            </div>
            <div className="dm-message-content">
              {message.content}
            </div>
            <div className="dm-message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="dm-chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message @${otherUser?.username}`}
          className="dm-chat-input"
          autoFocus
        />
      </form>
    </div>
  );
}

export default DirectMessageChat; 