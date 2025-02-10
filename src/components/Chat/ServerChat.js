import React, { useState, useEffect, useRef } from 'react';
import { database, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './ServerChat.css';
import firebase from 'firebase/compat/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

function ServerChat({ serverId }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesContainerRef = useRef(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    if (!currentUser || !serverId) return;

    const channelsRef = database.ref(`Servers/${serverId}/channels`);
    channelsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const channelsList = Object.entries(data).map(([id, channel]) => ({
          id,
          ...channel
        }));
        setChannels(channelsList);
      }
    });

    return () => channelsRef.off();
  }, [currentUser, serverId]);

  useEffect(() => {
    if (!currentUser || !serverId || !selectedChannel) return;

    const messagesRef = database.ref(`Servers/${serverId}/channels/${selectedChannel}/messages`);
    
    messagesRef
      .orderByChild('timestamp')
      .on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesList = Object.entries(data)
            .map(([id, message]) => ({
              id,
              ...message,
              content: message.content || message.message || '',
              username: message.username || message.senderName || message.senderId,
              timestamp: message.timestamp || Date.now()
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messagesList);
          scrollToBottom();
        }
      });

    return () => messagesRef.off();
  }, [currentUser, serverId, selectedChannel]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
    
      const userRef = database.ref(`Users/${currentUser.uid}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();
      
      const messagesRef = database.ref(`Servers/${serverId}/channels/${selectedChannel}/messages`);
      await messagesRef.push({
        content: newMessage.trim(),
        senderId: currentUser.uid,
        username: userData?.username || currentUser.displayName || 'Anonymous',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        message: newMessage.trim(),
        senderName: userData?.username || currentUser.displayName || 'Anonymous',
        messageType: "text"
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const storageRef = storage.ref();
      // Store all images in chat_images folder
      const fileRef = storageRef.child(`chat_images/${Date.now()}-${file.name}`);
      
      // Upload the file with progress monitoring
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
          // Get the download URL
          const imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
          
          // Send message with image
          const messagesRef = database.ref(`Servers/${serverId}/channels/${selectedChannel}/messages`);
          const userRef = database.ref(`Users/${currentUser.uid}`);
          const userSnapshot = await userRef.once('value');
          const userData = userSnapshot.val();

          await messagesRef.push({
            content: '',
            imageUrl: imageUrl,
            senderId: currentUser.uid,
            username: userData?.username || currentUser.displayName || 'Anonymous',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            messageType: "image"
          });

          setUploadProgress(0);
          setImageUpload(null);
        }
      );
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageUpload(file);
        handleImageUpload(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  return (
    <div className="server-chat-container">
      <div className="channels-sidebar">
        <div className="channels-header">
          <h3>CHANNELS</h3>
        </div>
        <div className="channels-list">
          {channels.map(channel => (
            <div 
              key={channel.id}
              className={`channel-item ${selectedChannel === channel.id ? 'active' : ''}`}
              onClick={() => setSelectedChannel(channel.id)}
            >
              <span className="channel-hash">#</span>
              <span className="channel-name">{channel.name || channel.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="server-chat-main">
        <div className="server-chat-header">
          <h3># {selectedChannel}</h3>
        </div>

        <div className="server-chat-messages" ref={messagesContainerRef}>
          {messages.map(message => (
            <div 
              key={message.id}
              className={`server-message ${message.senderId === currentUser.uid ? 'own-message' : ''}`}
            >
              <div className="server-message-header">
                <span className="server-message-username">
                  {message.senderId === currentUser.uid 
                    ? currentUserData?.username 
                    : message.username}
                </span>
              </div>
              <div className="server-message-content">
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
              <div className="server-message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="server-chat-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${selectedChannel}`}
            className="server-chat-input"
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
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              Uploading: {Math.round(uploadProgress)}%
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ServerChat; 