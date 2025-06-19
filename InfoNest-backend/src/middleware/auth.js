// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Used to fetch user if needed, but primarily for token validation

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID (or full user object if needed) to the request
    // For now, just attaching the ID is enough if you only need to know *who* it is.
    // If you need full user details for every protected route, you'd fetch them here:
    // req.user = await User.findById(decoded.id);
    req.userId = decoded.id; // Or req.user = user;

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = protect;