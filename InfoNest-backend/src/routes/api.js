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

router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  const userId = req.userId;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  let botResponse = "I'm sorry, I couldn't find an answer for that right now. Please try rephrasing or ask a different question.";

  try {
    // --- 1. Get Intent from Rasa ---
    const rasaParseResponse = await axios.post('http://localhost:5005/model/parse', {
         text: message
    });

    const intentName = rasaParseResponse.data.intent.name;
    const confidence = rasaParseResponse.data.intent.confidence;

    console.log(`Rasa detected intent: '${intentName}' with confidence: ${confidence}`);

    // --- 2. Decide Where to Get the Answer ---
    let kbEntry = null;
    if (intentName && confidence > 0.6) {
        kbEntry = await KnowledgeBase.findOne({ intent: intentName });

        if (kbEntry) {
            console.log(`Found KB entry for intent '${intentName}'.`);
            botResponse = kbEntry.answer;
        } else {
            // --- 3. DELEGATE TO GEMINI API IF INTENT NOT IN KB ---
            console.log(`No KB entry found for '${intentName}'. Attempting to use Gemini if configured.`);

            // Access the globally configured model
            if (global.geminiConfigured && global.geminiModel) {
                const prompt = `As an AI assistant for Assumption University, answer the following user query: "${message}". Provide a brief summary. Do not exceed 80 tokens.`;

                try {
                    const maxTokensFromEnv = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '80', 10);
                    console.log(`Using maxOutputTokens: ${maxTokensFromEnv}`);

                    const geminiResponse = await global.geminiModel.generateContent(prompt, {
                        generationConfig: {
                            maxOutputTokens: maxTokensFromEnv,
                            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
                        }
                    });
                    const responseText = geminiResponse.response.text();
                    botResponse = responseText;
                    console.log(`Gemini API Response: ${botResponse}`);
                } catch (geminiError) {
                    console.error("Error calling Gemini API:", geminiError);
                    botResponse = "Sorry, I encountered an error trying to get AI-generated information. Please try again later.";
                }
            } else {
                botResponse = `I understood your intent as '${intentName}', but I don't have a specific answer in my knowledge base, and the AI assistant is not configured.`;
            }
        }
    } else {
        console.log(`Rasa intent confidence too low for '${intentName}'. Falling back.`);
        botResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
    }

    // --- Save to History ---
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
    console.error('Error in /api/chat endpoint:', err.message);
    if (err.response) {
        console.error('Rasa Server Error Response:', err.response.status, err.response.data);
        res.status(err.response.status || 500).json({ error: `Failed to communicate with Rasa. Status: ${err.response.status}` });
    } else if (err.code === 'ECONNREFUSED') {
        res.status(500).json({ error: 'Chatbot engine (Rasa) is not running or accessible. Please start it.' });
    } else {
        console.error('General Server Error during chat processing:', err.stack);
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