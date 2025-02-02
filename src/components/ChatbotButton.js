import React, { useState } from 'react';
import './ChatbotButton.css';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! I'm HarvestBot 🌱 I can help you navigate HarvestHub and explain how we're working to reduce food waste. What would you like to know?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);

    // Simple response system
    const responses = {
      'hello': 'Hi there! How can I help you today?',
      'what is harvesthub': 'HarvestHub is a platform that connects food businesses with excess food to people who can use it, helping reduce food waste! 🌱',
      'how does it work': 'Food businesses can post their surplus food on our platform, and users can claim these items through our app. We also organize food rescue events! 🍽️',
      'help': 'I can tell you about:\n- How HarvestHub works\n- Our mission\n- Food rescue events\n- Using the app\nWhat would you like to know?'
    };

    const userInput = inputMessage.toLowerCase();
    let botResponse = "I'm not sure about that. Try asking about 'What is HarvestHub' or 'How does it work'?";
    
    Object.entries(responses).forEach(([key, value]) => {
      if (userInput.includes(key)) {
        botResponse = value;
      }
    });

    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
    }, 500);

    setInputMessage('');
  };

  return (
    <div className="chatbot-container">
      <button 
        className="chatbot-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
        <span className="pulse"></span>
      </button>

      {isOpen && (
        <div className="chatbot-overlay">
          <div className="chat-header">
            <h3>HarvestBot</h3>
            <p>Ask me anything about HarvestHub! 🌱</p>
          </div>
          
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                {message.content}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotButton; 