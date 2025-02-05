const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { message } = req.body;

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: "You are HarvestHub's AI assistant, focused on food waste reduction and food rescue."
        }
      ]
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;

    res.json({ message: response.text() });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
});

module.exports = router; 