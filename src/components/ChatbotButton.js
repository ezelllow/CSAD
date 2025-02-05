import React, { useState } from 'react';
import axios from 'axios';
import './ChatbotButton.css';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hi there! I'm your HarvestHub assistant. I can help you with:\n\n" +
        "🌱 Finding food rescue opportunities\n" +
        "🗺️ Navigating our locations and services\n" +
        "💚 Understanding our food waste reduction mission\n" +
        "📝 Using the forums and community features\n" +
        "❓ Any other questions about HarvestHub!\n\n" +
        "What would you like to know?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);
    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: userMessage
      });
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: response.data.message 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: "I apologize, but I'm having trouble right now. Please try again later." 
      }]);
    }

    setIsLoading(false);
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
            <h3>HarvestHub Assistant</h3>
            <p>Ask me anything about reducing food waste! 🌱</p>
          </div>
          
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <span className="typing-indicator">...</span>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading}>
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotButton; 