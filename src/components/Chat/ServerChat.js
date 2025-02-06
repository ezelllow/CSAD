import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import './ServerChat.css';
import firebase from 'firebase/compat/app';

function ServerChat({ serverId }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesContainerRef = useRef(null);

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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // First get the current user's data to ensure we have the correct username
      const userRef = database.ref(`Users/${currentUser.uid}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();
      
      const messagesRef = database.ref(`Servers/${serverId}/channels/${selectedChannel}/messages`);
      await messagesRef.push({
        content: newMessage.trim(),
        senderId: currentUser.uid,
        // Use the username from user's profile data
        username: userData?.username || currentUser.displayName || 'Anonymous',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        message: newMessage.trim(),
        // Use the same username for senderName
        senderName: userData?.username || currentUser.displayName || 'Anonymous',
        messageType: "text"
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
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
                  {message.senderId === currentUser.uid ? 'You' : message.username}
                </span>
              </div>
              <div className="server-message-content">
                {message.content}
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
        </form>
      </div>
    </div>
  );
}

export default ServerChat; 