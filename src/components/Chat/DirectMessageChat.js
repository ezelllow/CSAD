import React, { useState, useEffect, useRef } from 'react';
import { database, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './DirectMessageChat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

function DirectMessageChat({ chatId, otherParticipant }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState(null);
  const messagesContainerRef = useRef(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch messages
  useEffect(() => {
    if (!chatId || !otherParticipant) return;
    
    const messagesRef = database.ref(`directMessages/${chatId}/messages`);
    messagesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data)
          .map(([id, message]) => ({
            id,
            ...message
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
        scrollToBottom();
      }
    });

    return () => messagesRef.off();
  }, [chatId, otherParticipant]);

  // Fetch current user's data
  useEffect(() => {
    if (!currentUser) return;

    const userRef = database.ref(`Users/${currentUser.uid}`);
    userRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentUserData(data);
      }
    });

    return () => userRef.off();
  }, [currentUser]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage,
        senderId: currentUser.uid,
        timestamp: Date.now()
      };

      // Adding a new message
      const messagesRef = database.ref(`directMessages/${chatId}/messages`);
      await messagesRef.push(messageData);

      // Updating chat
      const chatRef = database.ref(`directMessages/${chatId}`);
      await chatRef.update({
        lastMessage: messageData,
        lastUpdated: Date.now()
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`chat_images/${Date.now()}-${file.name}`);
      
      const uploadTask = fileRef.put(file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading image:', error);
        },
        async () => {
          const imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
          
          const messageData = {
            content: '',
            imageUrl: imageUrl,
            senderId: currentUser.uid,
            timestamp: Date.now()
          };

          // Add new message
          const messagesRef = database.ref(`directMessages/${chatId}/messages`);
          await messagesRef.push(messageData);

          // Update chat metadata
          const chatRef = database.ref(`directMessages/${chatId}`);
          await chatRef.update({
            lastMessage: messageData,
            lastUpdated: Date.now()
          });

          setUploadProgress(0);
          setImageUpload(null);
        }
      );
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  };

  return (
    <div className="dm-chat-container">
      <div className="dm-chat-header">
        <div className="dm-chat-user-info">
          <img 
            src={otherParticipant?.profilePicture || '/default-avatar.jpg'} 
            alt={otherParticipant?.username} 
            className="dm-chat-avatar"
          />
          <div className="dm-chat-header-text">
            <span className="dm-chat-username">{otherParticipant?.username}</span>
          </div>
        </div>
      </div>

      <div className="dm-chat-content">
        <div className="dm-chat-messages-container">
          <div className="dm-chat-messages" ref={messagesContainerRef}>
            {messages.map(message => (
              <div 
                key={message.id}
                className={`dm-message ${message.senderId === currentUser.uid ? 'own-message' : ''}`}
              >
                <div className="dm-message-header">
                  <span className="dm-message-username">
                    {message.senderId === currentUser.uid 
                      ? currentUserData?.username 
                      : otherParticipant?.username}
                  </span>
                </div>
                <div className="dm-message-content">
                  {message.content}
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Message attachment" 
                      className="message-image"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                  )}
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
        </div>

        <div className="dm-chat-input-container">
          <form onSubmit={sendMessage} className="dm-chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message @${otherParticipant?.username}`}
              className="dm-chat-input"
              autoFocus
            />
            <div className="chat-input-actions">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                className="upload-image-btn"
                onClick={() => fileInputRef.current.click()}
              >
                <FontAwesomeIcon icon={faImage} />
              </button>
            </div>
          </form>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              Uploading: {Math.round(uploadProgress)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DirectMessageChat; 