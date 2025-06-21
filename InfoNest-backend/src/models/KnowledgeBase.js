// src/models/KnowledgeBase.js

const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  intent: {
    type: String,
    required: true,
    unique: true, // Each intent should be unique
    trim: true
  },
  questionExamples: { // Examples of how users might ask this question
    type: [String], // Array of strings
    default: []
  },
  answer: { // The actual answer the bot will provide
    type: String,
    required: true,
    trim: true
  },
  entities: { // Optional: which entities are relevant for this intent (e.g., course name)
    type: [String],
    default: []
  },
  tags: { // Optional: for categorization (e.g., 'admissions', 'academics')
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// --- CRITICAL FIX: Ensure you export the Mongoose model correctly ---
module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);