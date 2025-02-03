const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: "You are HarvestHub's AI assistant. HarvestHub is a platform focused on food rescue and reducing food waste. The platform includes features like:\n\n" +
            "- A map showing food rescue locations and participating stores\n" +
            "- A calendar for community events and food rescue activities\n" +
            "- Forums for sharing experiences and tips\n" +
            "- Connecting food sellers with food rescue volunteers\n" +
            "- Dashboard for tracking impact on food waste reduction\n\n" +
            "Be helpful and friendly, and always relate answers back to HarvestHub's mission of reducing food waste."
        },
        {
          role: "model",
          parts: "I understand. I'll help users with HarvestHub's features and promote food waste reduction."
        }
      ],
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;

    res.json({ message: response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

module.exports = router; 