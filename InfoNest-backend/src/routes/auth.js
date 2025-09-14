const express = require('express');
const jwt = require('jsonwebtoken');  // assuming you use JWT already
const { verifyGoogleIdToken } = require('../utils/googleVerify');
const User = require('../models/User'); // adjust path to your User model

const router = express.Router();

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken required' });
    }

    const payload = await verifyGoogleIdToken(idToken);
    // payload fields: payload.email, payload.name, payload.picture, payload.sub (Google user ID)

    if (!payload.email_verified) {
      return res.status(401).json({ success: false, error: 'Email not verified by Google.' });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        username: payload.email.split('@')[0], // or some collision-safe logic
        googleId: payload.sub,
        avatarUrl: payload.picture
      });
    } else {
      // Optionally update avatar or name if you want
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    }

    // Issue your app token (adjust secret & payload as needed)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({
      success: false,
      error: err.message || 'Invalid Google token'
    });
  }
});

module.exports = router;