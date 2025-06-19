// src/routes/api.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const protect = require('../middleware/auth'); // Import the authentication middleware
const ChatHistory = require('../models/ChatHistory'); // Import the ChatHistory model


// @desc    Register a new user
// @route   POST /api/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body; // Destructure username and password from request body

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create a new user instance
    const newUser = new User({ username, password });
    // Save the new user to the database (password will be hashed by pre-save hook in User model)
    await newUser.save();

    // Respond with success message
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    // Log the full error for debugging on the server side
    console.error('Registration error caught in route:', err);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// @desc    Authenticate user and get token
// @route   POST /api/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // Destructure username and password from request body

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find the user by username and include the password for comparison
    const user = await User.findOne({ username }).select('+password'); // Explicitly select password

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Send success response with the token
    res.json({ success: true, token });

  } catch (err) {
    // Log the full error for debugging on the server side
    console.error('Login error caught in route:', err);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Server error during login' });
  }
});


// @desc    Get current logged in user details (example of a protected route)
// @route   GET /api/me
// @access  Private (requires JWT)
router.get('/me', protect, async (req, res) => {
  try {
    // req.userId is set by the 'protect' middleware
    // Find user by ID and exclude the password field from the response
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Respond with user details
    res.status(200).json({
        success: true,
        data: {
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
  } catch (err) {
    console.error('Error in /api/me route:', err);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
});


// @desc    Send a message to the chatbot (and save to history)
// @route   POST /api/chat
// @access  Private (requires JWT)
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body; // User's message
  const userId = req.userId; // Get user ID from the 'protect' middleware

  // Basic validation
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // --- PLACEHOLDER FOR NLP ENGINE INTEGRATION ---
    // In later steps, 'botResponse' will come from your Rasa/Dialogflow interaction.
    // For now, it's a simple echo.
    let botResponse = `I received your message: "${message}". Thanks for asking! (Placeholder)`;
    // --- END PLACEHOLDER ---

    // Create a new chat history entry
    const newChat = new ChatHistory({
      user: userId,
      userMessage: message,
      botResponse: botResponse,
      timestamp: new Date() // Explicitly set timestamp, though default is also Date.now
    });

    // Save the chat exchange to the database
    await newChat.save();

    // Respond to the client with the bot's response
    res.status(200).json({
      userMessage: message,
      botResponse: botResponse,
      historyId: newChat._id // Useful for client-side tracking
    });

  } catch (err) {
    // Log the full error for debugging on the server side
    console.error('Error in /api/chat endpoint:', err);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Server error while processing chat' });
  }
});


// @desc    Get user's chat history
// @route   GET /api/chat/history
// @access  Private (requires JWT)
router.get('/history', protect, async (req, res) => {
  const userId = req.userId; // Get user ID from the 'protect' middleware

  try {
    // Find all chat history entries for the logged-in user
    // Populate 'user' field if you want to include user details in the history response
    const history = await ChatHistory.find({ user: userId })
                                    .sort({ timestamp: 1 }) // Sort by oldest message first
                                    .limit(50); // Limit to last 50 messages to prevent too much data

    // Respond with the chat history
    res.status(200).json({ success: true, count: history.length, data: history });

  } catch (err) {
    // Log the full error for debugging on the server side
    console.error('Error fetching chat history:', err);
    // Send a generic error response to the client
    res.status(500).json({ error: 'Server error while fetching chat history' });
  }
});


// Export the router to be used in index.js
module.exports = router;