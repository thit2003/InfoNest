// src/index.js

const express = require('express');
const morgan = require('morgan'); // For general request logging
const cors = require('cors');     // For Cross-Origin Resource Sharing
const mongoose = require('mongoose'); // For MongoDB interaction
require('dotenv').config();       // For loading environment variables from .env
const rateLimit = require('express-rate-limit');
const genai = require('@google/generative-ai');

let geminiModel = null;
let geminiConfigured = false;

if (process.env.GEMINI_API_KEY) {
  try {
    const generativeAI = new genai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = generativeAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    geminiConfigured = true;
    console.log("Gemini API configured successfully.");
  } catch (error) {
    console.error("Failed to configure Gemini API:", error);
  }
} else {
  console.warn("GEMINI_API_KEY not found. Gemini integration disabled.");
}

const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  dbName: 'InfoNestDB'
})
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

global.geminiModel = geminiModel;
global.geminiConfigured = geminiConfigured;

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12,             // allow up to 12 feedback posts/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/feedback', feedbackLimiter);

// Use the API routes from api.js
app.use('/api', apiRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'InfoNest API',
    endpoints: ['/api/login (POST)', '/api/register (POST)', '/api/me (GET)', '/api/chat (POST)', '/ping']
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access your frontend at http://localhost:3000 (if React app is running)`);
});

const googleAuthRoutes = require('./routes/googleAuth');

app.use(express.json());

// Mount Google auth route
app.use('/api', googleAuthRoutes);