import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../firebase';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const user = auth.currentUser;

  // Fetch messages from Firebase Realtime Database
  useEffect(() => {
    const chatRef = database.ref('chats/chat_room_1/messages');

    chatRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.values(data);
        setMessages(messagesArray);
      }
    });

    return () => chatRef.off();
  }, []);

  // Function to send message
  const sendMessage = () => {
    if (message.trim() !== '' && user) {
      const chatRef = database.ref('chats/chat_room_1/messages');
      const newMessage = {
        senderId: user.uid,
        username: user.displayName || 'Anonymous',
        message,
        timestamp: Date.now(),
      };

      chatRef.push(newMessage);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Chat Room</h2>
      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid gray' }}>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
