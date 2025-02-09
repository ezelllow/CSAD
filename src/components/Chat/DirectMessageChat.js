import React, { useState, useEffect, useRef } from 'react';
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  update, 
  off 
} from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import './DirectMessageChat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { storage } from '../../firebase';

function DirectMessageChat({ dmId, otherUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesContainerRef = useRef(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch chat partner's data
  useEffect(() => {
    if (!dmId) return;

    const db = getDatabase();
    const participantsRef = ref(db, `directMessages/${dmId}/participants`);
    
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val();
      if (participants) {
        const partner = Object.values(participants).find(p => p.id !== currentUser.uid);
        setChatPartner(partner);
      }
    });

    return () => off(participantsRef);
  }, [dmId, currentUser]);

  // Fetch messages
  useEffect(() => {
    if (!dmId) return;

    const db = getDatabase();
    const messagesRef = ref(db, `directMessages/${dmId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val() || {};
      const messagesArray = Object.entries(messagesData)
        .map(([id, message]) => ({
          id,
          ...message
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(messagesArray);
      scrollToBottom();
    });

    return () => off(messagesRef);
  }, [dmId]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const db = getDatabase();
      const messageData = {
        content: newMessage,
        senderId: currentUser.uid,
        timestamp: Date.now()
      };

      // Add new message
      const messagesRef = ref(db, `directMessages/${dmId}/messages`);
      await push(messagesRef, messageData);

      // Update chat metadata
      const chatRef = ref(db, `directMessages/${dmId}`);
      await update(chatRef, {
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
          
          const db = getDatabase();
          const messageData = {
            content: '',
            imageUrl: imageUrl,
            senderId: currentUser.uid,
            timestamp: Date.now()
          };

          // Add new message
          const messagesRef = ref(db, `directMessages/${dmId}/messages`);
          await push(messagesRef, messageData);

          // Update chat metadata
          const chatRef = ref(db, `directMessages/${dmId}`);
          await update(chatRef, {
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
        <img 
          src={chatPartner?.profilePicture || "/pfp.png"} 
          alt={chatPartner?.username} 
          className="dm-chat-avatar"
        />
        <div className="dm-chat-user-info">
          <span className="dm-chat-username">{chatPartner?.username}</span>
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
                    {message.senderId === currentUser.uid ? 'You' : chatPartner?.username}
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
              placeholder={`Message @${chatPartner?.username || 'User'}`}
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