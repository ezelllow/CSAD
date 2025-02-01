import React, { useState, useEffect } from 'react';
import { database, auth } from '../../../firebase';
import { ref, get, push, onValue, off } from 'firebase/database';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('Anonymous');
  const user = auth.currentUser;

  // Fetch user's username from Firebase Realtime Database
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const userRef = ref(database, `Users/${user.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val()); // Store username from database
        }
      }
    };

    fetchUsername();
  }, [user]);

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
        username,
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
