import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatbotButton.css';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
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

  // Initialize position on mount
  useEffect(() => {
    const initialX = window.innerWidth - 80; // 60px button + 20px offset
    const initialY = window.innerHeight - 80; // 60px button + 20px offset
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  }, [position.x, position.y]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Calculate drag distance
      const deltaX = newX - position.x;
      const deltaY = newY - position.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      setDragDistance(prev => prev + distance);

      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart.x, dragStart.y, position.x, position.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragDistance(0); // Reset on release
  }, []);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

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
    <div 
      className="chatbot-container"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
    >
      <button 
        className="chatbot-button"
        onMouseDown={handleMouseDown}
        onClick={() => {
          // Only toggle if minimal drag movement
          if (dragDistance < 5) {
            setIsOpen(!isOpen);
          }
          setDragDistance(0);
        }}
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