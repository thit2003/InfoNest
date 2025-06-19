// src/models/ChatHistory.js

const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // This links to your User model
    required: true
  },
  userMessage: {
    type: String,
    required: true,
    trim: true
  },
  botResponse: {
    type: String,
    required: true // Bot response is also stored
  },
  timestamp: {
    type: Date,
    default: Date.now // Automatically sets the time of the message
  }
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);