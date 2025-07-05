// src/routes/api.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const KnowledgeBase = require('../models/KnowledgeBase');
const axios = require('axios');


// @desc    Register a new user
// @route   POST /api/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // --- REMOVE/COMMENT OUT DEBUG LOGS FOR REGISTRATION ---
    // console.log(`[REGISTER DEBUG] Registering username: '${username}'`);
    // console.log(`[REGISTER DEBUG] Password received (before hashing): '${password}' (Length: ${password.length})`);
    // --- END DEBUG LOGS ---

    const newUser = new User({ username, password });
    await newUser.save();

    // --- REMOVE/COMMENT OUT DEBUG LOGS ---
    // console.log(`[REGISTER DEBUG] User saved to DB. Hashed password: ${newUser.password}`);
    // --- END DEBUG LOGS ---

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Registration error caught in route:', err); // Keep this for actual errors
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// @desc    Authenticate user and get token
// @route   POST /api/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // --- REMOVE/COMMENT OUT DEBUG LOGS FOR LOGIN ---
    // console.log(`[LOGIN DEBUG] Attempting login for username: '${username}'`);
    // console.log(`[LOGIN DEBUG] Password received: '${password}' (Length: ${password.length})`);
    // console.log(`[LOGIN DEBUG] ASCII codes of password: ${Array.from(password).map(char => char.charCodeAt(0)).join(',')}`);
    // --- END DEBUG LOGS ---

    const user = await User.findOne({ username }).select('+password');

    // --- REMOVE/COMMENT OUT DEBUG LOGS ---
    // console.log(`[LOGIN DEBUG] User found in DB:`, user ? user.username : 'None');
    // if (user) {
    //     console.log(`[LOGIN DEBUG] Hashed password from DB: ${user.password}`);
    //     console.log(`[LOGIN DEBUG] Attempting to compare passwords...`);
    // }
    // --- END DEBUG LOGS ---

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }

    const isMatch = await user.comparePassword(password);

    // --- REMOVE/COMMENT OUT DEBUG LOGS ---
    // console.log(`[LOGIN DEBUG] Password comparison result (isMatch): ${isMatch}`);
    // --- END DEBUG LOGS ---

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials (password mismatch)' });
    }

    const token = user.getSignedJwtToken();
    res.json({ success: true, token });

  } catch (err) {
    console.error('Login error caught in route:', err); // Keep this for actual errors
    res.status(500).json({ error: 'Server error during login.' });
  }
});


// @desc    Get current logged in user details (example of a protected route)
// @route   GET /api/me
// @access  Private (requires JWT)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
        success: true,
        data: {
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
  } catch (err) {
    console.error('Error in /api/me route:', err); // Keep this for actual errors
    res.status(500).json({ error: 'Server error fetching user data' });
  }
});


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

    // --- REMOVE/COMMENT OUT DEBUG LOGS FOR CHAT ---
    // console.log(`[DEBUG] Rasa detected intent: '${intentName}' (length: ${intentName.length})`);
    // console.log(`[DEBUG] ASCII codes of intentName: ${Array.from(intentName).map(char => char.charCodeAt(0)).join(',')}`);
    // console.log(`[DEBUG] Attempting to find KnowledgeBase entry for intent: '${intentName}'`);
    // --- END DEBUG LOGS ---

    if (intentName && confidence > 0.6) {
        const kbEntry = await KnowledgeBase.findOne({ intent: intentName });

        // --- REMOVE/COMMENT OUT DEBUG LOGS ---
        // console.log(`[DEBUG] KnowledgeBase.findOne() result:`, kbEntry ? 'Found document' : 'No document found');
        // if (kbEntry) {
        //     console.log(`[DEBUG] Found KB entry:`, kbEntry);
        //     console.log(`[DEBUG] KB entry intent: '${kbEntry.intent}'`);
        //     console.log(`[DEBUG] KB entry answer: '${kbEntry.answer}'`);
        // } else {
        //     // If findOne fails, let's try to find *any* document and log its intent
        //     console.log('[DEBUG] findOne failed. Attempting to list all intents from KB for comparison...');
        //     const allKbEntries = await KnowledgeBase.find({}).select('intent -_id'); // Fetch all intents
        //     if (allKbEntries.length > 0) {
        //         console.log(`[DEBUG] All KB intents found:`);
        //         allKbEntries.forEach((entry, index) => {
        //             console.log(`  [DEBUG]   ${index}: '${entry.intent}' (length: ${entry.intent.length})`);
        //             console.log(`  [DEBUG]      ASCII codes: ${Array.from(entry.intent).map(char => char.charCodeAt(0)).join(',')}`);
        //         });
        //     } else {
        //         console.log('[DEBUG] No documents found in KnowledgeBase collection at all.');
        //     }
        // }
        // --- END DEBUG LOGS ---

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
    console.error('Error in /api/chat endpoint:', err); // Keep this for actual errors
    if (err.response) {
        console.error('Rasa Server Error Response:', err.response.status, err.response.data); // Keep this for Rasa errors
        res.status(500).json({ error: 'Failed to communicate with Rasa or process NLP response.' });
    } else if (err.code === 'ECONNREFUSED') {
        res.status(500).json({ error: 'Chatbot engine (Rasa) is not running or accessible. Please start it.' });
    } else {
        res.status(500).json({ error: 'Server error while processing chat.' });
    }
  }
});


// @desc    Example endpoint to fetch news (dummy data for now)
// @route   GET /api/news
// @access  Public (can be made private if needed)
router.get('/news', (req, res) => {
  res.json([
    { title: 'Dummy News Article 1', content: 'This is the content of dummy news article 1.' },
    { title: 'Dummy News Article 2', content: 'This is the content of dummy news article 2.' }
  ]);
});


// @desc    Get user's chat history
// @route   GET /api/chat/history
// @access  Private (requires JWT)
router.get('/history', protect, async (req, res) => {
  const userId = req.userId;

  try {
    const history = await ChatHistory.find({ user: userId })
                                    .sort({ timestamp: 1 })
                                    .limit(50);

    res.status(200).json({ success: true, count: history.length, data: history });

  } catch (err) {
    console.error('Error fetching chat history:', err); // Keep this for actual errors
    res.status(500).json({ error: 'Server error while fetching chat history' });
  }
});


module.exports = router;