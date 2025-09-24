// src/routes/api.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const KnowledgeBase = require('../models/KnowledgeBase');
const axios = require('axios');
const { RASA_BASE_URL } = require('../config/rasa');
const Feedback = require('../models/Feedback');
const authRoutes = require('../routes/auth');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

module.exports = app;

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Registration error caught in route:', err);
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
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials (password mismatch)' });
    }

    const token = user.getSignedJwtToken();
    res.json({ success: true, token });

  } catch (err) {
    console.error('Login error caught in route:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GOOGLE AUTH ADD
// @route POST /api/auth/google
router.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, error: 'Missing idToken' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, picture, email_verified } = payload;

    if (!email) return res.status(400).json({ success: false, error: 'No email in Google token' });
    if (email_verified === false)
      return res.status(400).json({ success: false, error: 'Email not verified by Google' });

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ username: normalizedEmail });
      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
          user.provider = 'google';
          if (!user.avatarUrl && picture) user.avatarUrl = picture;
          await user.save();
        }
      } else {
        user = await User.create({
          username: normalizedEmail,
            provider: 'google',
            googleId,
            avatarUrl: picture
        });
      }
    }

    const token = user.getSignedJwtToken();
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        provider: user.provider,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
});

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
    console.error('Error in /api/me route:', err);
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

  // New: configurable intent confidence threshold (defaults to original 0.6)
  const MIN_CONFIDENCE = parseFloat(process.env.INTENT_CONFIDENCE_MIN || '0.6');

  try {
    // --- 1. Get Intent from Rasa ---
    const rasaParseResponse = await axios.post(`${RASA_BASE_URL}/model/parse`, {
      text: message
    });

    const intentName = rasaParseResponse.data.intent.name;
    const confidence = rasaParseResponse.data.intent.confidence;

    console.log(`Rasa detected intent: '${intentName}' with confidence: ${confidence}`);

    // --- 2. Decide Where to Get the Answer ---
    let kbEntry = null;
    if (intentName && confidence > MIN_CONFIDENCE) {
      kbEntry = await KnowledgeBase.findOne({ intent: intentName });

      if (kbEntry) {
        console.log(`Found KB entry for intent '${intentName}'.`);
        botResponse = kbEntry.answer;
      } else {
        console.log(`No KB entry found for '${intentName}'. Attempting to use Gemini if configured.`);
        if (global.geminiConfigured && global.geminiModel) {
          const prompt = `As AI chatbot for Assumption University of Thailand, User query: "${message}". Provide concise, summary answer. Avoid markdown characters in responses.`;
          try {
            const geminiResponse = await global.geminiModel.generateContent(prompt);
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
      // --- LOW CONFIDENCE PATH -> use Gemini instead of static fallback ---
      console.log(`Rasa intent confidence too low for '${intentName}' (confidence=${confidence} < ${MIN_CONFIDENCE}). Trying Gemini fallback.`);
      if (global.geminiConfigured && global.geminiModel) {
        const prompt = `User asked (low intent confidence: ${confidence}): "${message}". Provide the best helpful answer as an AI assistant for Assumption University of Thailand. Avoid Mark Down characters.`;
        try {
          const geminiResponse = await global.geminiModel.generateContent(prompt);
          const responseText = geminiResponse.response.text();
            if (responseText && responseText.trim().length > 0) {
              botResponse = responseText.trim();
              console.log("Gemini answer used (reason=low_confidence).");
            } else {
              console.warn("Gemini returned empty text on low confidence; using generic fallback.");
              botResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
            }
        } catch (geminiError) {
          console.error("Error calling Gemini API on low confidence:", geminiError);
          botResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
        }
      } else {
        botResponse = "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
      }
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

// @route   GET /api/news
// @access  Public
router.get('/news', (req, res) => {
  res.json([
    { title: 'Dummy News Article 1', content: 'This is the content of dummy news article 1.' },
    { title: 'Dummy News Article 2', content: 'This is the content of dummy news article 2.' }
  ]);
});

// @route   GET /api/chat/history
// @access  Private (requires JWT)
router.get('/history', protect, async (req, res) => {
  const userId = req.userId;

  try {
    const history = await ChatHistory.find({ user: userId })
      .sort({ timestamp: 1 })
      .limit(100);

    res.status(200).json({ success: true, count: history.length, data: history });

  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Server error while fetching chat history' });
  }
});

// @route   POST /api/feedback
// @desc    Submit feedback for a bot response (optionally tied to a ChatHistory record)
// @access  Private
router.post('/feedback', protect, async (req, res) => {
  try {
    const userId = req.userId;
    const { historyId, rating, category, comment, meta } = req.body || {};

    if (!rating && !comment) {
      return res.status(400).json({ error: 'Provide at least a rating or a comment.' });
    }

    // Optional: validate rating/category
    const doc = await Feedback.create({
      user: userId,
      history: historyId || undefined,
      rating: rating || 'neutral',
      category: category || '',
      comment: comment || '',
      meta: meta || {},
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('Error creating feedback:', err);
    return res.status(500).json({ error: 'Server error while saving feedback.' });
  }
});

// @route   GET /api/feedback/mine
// @desc    Return feedback submitted by the authenticated user
// @access  Private
router.get('/feedback/mine', protect, async (req, res) => {
  try {
    const userId = req.userId;
    const docs = await Feedback.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    console.error('Error fetching user feedback:', err);
    return res.status(500).json({ error: 'Server error while fetching feedback.' });
  }
});

// @route   GET /api/feedback/summary
// @desc    Rating counts for the authenticated user
// @access  Private
router.get('/feedback/summary', protect, async (req, res) => {
  try {
    const userId = req.userId;
    const pipeline = [
      { $match: { user: new (require('mongoose')).Types.ObjectId(userId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ];
    const agg = await require('mongoose').model('Feedback').aggregate(pipeline);
    const summary = agg.reduce((acc, r) => ({ ...acc, [r._id || 'neutral']: r.count }), {});
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error('Error summarizing feedback:', err);
    res.status(500).json({ error: 'Server error while summarizing feedback.' });
  }
});

module.exports = router;