// src/index.js

const express = require('express');
const morgan = require('morgan'); // For general request logging
const cors = require('cors');     // For Cross-Origin Resource Sharing
const mongoose = require('mongoose'); // For MongoDB interaction
require('dotenv').config();       // For loading environment variables from .env

const genai = require('@google/generative-ai');

let geminiModel = null;
let geminiConfigured = false;

if (process.env.GEMINI_API_KEY) {
  try {
    // The configuration is done by instantiating the client with the API key
    const generativeAI = new genai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = generativeAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // Or your chosen model
    geminiConfigured = true;
    console.log("Gemini API configured successfully.");
  } catch (error) {
    console.error("Failed to configure Gemini API:", error);
  }
} else {
  console.warn("GEMINI_API_KEY not found. Gemini integration disabled.");
}
// --- End Correct Gemini Initialization ---

const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// MongoDB Connection (This part is now working!)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  dbName: 'InfoNestDB'
})
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));


// --- Make Gemini objects globally accessible for api.js ---
// It's generally better to pass these via dependency injection or module exports,
// but for a quick setup, global variables can work.
global.geminiModel = geminiModel;
global.geminiConfigured = geminiConfigured;
// --- End global access setup ---


// Use the API routes from api.js
app.use('/api', apiRoutes);

// Simple test route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ... (your error handling middleware and app.listen) ...

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access your frontend at http://localhost:3000 (if React app is running)`);
});