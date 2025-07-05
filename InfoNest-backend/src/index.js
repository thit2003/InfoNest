// src/index.js

const express = require('express');
const morgan = require('morgan'); // For general request logging
const cors = require('cors');     // For Cross-Origin Resource Sharing
const mongoose = require('mongoose'); // For MongoDB interaction
require('dotenv').config();       // For loading environment variables from .env

const apiRoutes = require('./routes/api'); // Import your API routes

const app = express();

// Middleware
app.use(morgan('dev')); // Log HTTP requests to the console (e.g., GET /ping 200)
app.use(cors());        // Enable CORS for frontend communication
app.use(express.json()); // Parse incoming JSON request bodies

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  dbName: 'InfoNestDB' // Ensure this matches your MongoDB Atlas database name
})
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use the API routes from api.js
app.use('/api', apiRoutes);

// Simple test route (e.g., http://localhost:8000/ping)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Handle 404 Not Found (if no route matches). This middleware must be placed LAST,
// after all other routes and middleware that handle valid requests.
app.use((req, res, next) => {
    // Log the 404 for debugging purposes
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Not Found' });
});

// Central error handling middleware. This must be the very last app.use() call,
// after all routes and other middleware. It catches errors passed via next(err).
app.use((err, req, res, next) => {
    // Log the full error stack for debugging on the server side
    console.error('Unhandled server error:', err.stack || err.message);

    // Send a generic 500 Internal Server Error response to the client
    // In a production environment, you might hide the 'err.stack' for security.
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected server error occurred.',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack // Show stack trace only in development
    });
});


// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access your frontend at http://localhost:3000 (if React app is running)`);
});