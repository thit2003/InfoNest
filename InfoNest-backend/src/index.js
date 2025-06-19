// src/index.js (Cleaned version)

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(morgan('dev')); // Keep morgan for general request logging
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000
})
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));


// Use the API routes from api.js
app.use('/api', apiRoutes);

// Simple test route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Handle 404 Not Found (if no route matches)
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

// Central error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(err.status || 500).json({ error: 'Server error' });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open your browser at http://localhost:${PORT}/ping`);
});