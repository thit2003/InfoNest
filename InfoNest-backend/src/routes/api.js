// src/routes/api.js (updated imports at the top)

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const KnowledgeBase = require('../models/KnowledgeBase'); // <-- ADD/VERIFY THIS LINE
const axios = require('axios'); // <-- ADD/VERIFY THIS LINE

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

// src/routes/api.js (modified /api/chat route)

// ... (your /register, /login, /me routes are above)

// @desc    Send a message to the chatbot (and save to history)
// @route   POST /api/chat
// @access  Private (requires JWT)
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  const userId = req.userId;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  let botResponse = "I'm sorry, I couldn't find an answer for that right now. Please try rephrasing or ask a different question."; // Default fallback

  try {
    const rasaParseResponse = await axios.post('http://localhost:5005/model/parse', {
         text: message
    });

    const intentName = rasaParseResponse.data.intent.name;
    const confidence = rasaParseResponse.data.intent.confidence;
    const entities = rasaParseResponse.data.entities;

    // --- NEW DEBUGGING LOGS: Precise string inspection ---
    console.log(`[DEBUG] Rasa detected intent: '${intentName}' (length: ${intentName.length})`);
    console.log(`[DEBUG] ASCII codes of intentName: ${Array.from(intentName).map(char => char.charCodeAt(0)).join(',')}`);
    console.log(`[DEBUG] Attempting to find KnowledgeBase entry for intent: '${intentName}'`);
    // --- END NEW DEBUGGING LOGS ---


    if (intentName && confidence > 0.6) {
        // *** Line where the query happens ***
        const kbEntry = await KnowledgeBase.findOne({ intent: intentName });

        // --- NEW DEBUGGING LOGS ---
        console.log(`[DEBUG] KnowledgeBase.findOne() result:`, kbEntry ? 'Found document' : 'No document found');

        if (kbEntry) {
            console.log(`[DEBUG] Found KB entry intent: '${kbEntry.intent}' (length: ${kbEntry.intent.length})`);
            console.log(`[DEBUG] KB entry intent ASCII codes: ${Array.from(kbEntry.intent).map(char => char.charCodeAt(0)).join(',')}`);
            console.log(`[DEBUG] KB entry answer: '${kbEntry.answer}'`);
        } else {
            // If findOne fails, let's try to find *any* document and log its intent
            console.log('[DEBUG] findOne failed. Attempting to list all intents from KB for comparison...');
            const allKbEntries = await KnowledgeBase.find({}).select('intent -_id'); // Fetch all intents
            if (allKbEntries.length > 0) {
                console.log(`[DEBUG] All KB intents found:`);
                allKbEntries.forEach((entry, index) => {
                    console.log(`  [DEBUG]   ${index}: '${entry.intent}' (length: ${entry.intent.length})`);
                    console.log(`  [DEBUG]      ASCII codes: ${Array.from(entry.intent).map(char => char.charCodeAt(0)).join(',')}`);
                });
            } else {
                console.log('[DEBUG] No documents found in KnowledgeBase collection at all.');
            }
        }
        // --- END NEW DEBUGGING LOGS ---

        if (kbEntry) {
            botResponse = kbEntry.answer;
        } else {
            botResponse = `I understood your intent as '${intentName}', but I don't have a specific answer for that in my current knowledge base.`;
        }
    }

    const newChat = new ChatHistory({
      user: userId,
      userMessage: message,
      botResponse: botResponse,
    });

    await newChat.save();

    res.status(200).json({
      userMessage: message,
      botResponse: botResponse,
      historyId: newChat._id
    });

  } catch (err) {
    console.error('Error in /api/chat endpoint:', err);
    if (err.response) {
        console.error('Rasa Server Error Response:', err.response.status, err.response.data);
        res.status(500).json({ error: 'Failed to communicate with Rasa or process NLP response.' });
    } else if (err.code === 'ECONNREFUSED') {
        res.status(500).json({ error: 'Chatbot engine (Rasa) is not running or accessible. Please start it.' });
    } else {
        res.status(500).json({ error: 'Server error while processing chat.' });
    }
  }
});

// ... (your /history and /news routes below)

module.exports = router;
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