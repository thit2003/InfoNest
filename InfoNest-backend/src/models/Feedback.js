// src/models/Feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    history: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatHistory',
      required: false,
      index: true,
    },
    rating: {
      type: String,
      enum: ['up', 'down', 'neutral'],
      default: 'neutral',
    },
    category: {
      type: String,
      enum: ['incorrect', 'incomplete', 'offensive', 'bug', 'other', ''],
      default: '',
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    meta: {
      clientVersion: String,
      browser: String,
      os: String,
    },
  },
  { timestamps: true }
);

// Optional: ensure only one feedback per user per history item
FeedbackSchema.index({ user: 1, history: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);