const User = require('../models/User');
const { verifyGoogleIdToken } = require('../utils/googleVerify');

// Optionally import chat initialization if you have a function, e.g.:
// const { initChatForNewUser } = require('../services/chatInit');

async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Missing idToken' });
    }

    const payload = await verifyGoogleIdToken(idToken);
    const {
      sub: googleId,
      email,
      picture,
      name,
      email_verified
    } = payload;

    if (!email) {
      return res.status(400).json({ success: false, error: 'No email in Google profile' });
    }

    // Optional: enforce verified emails only
    if (email_verified === false) {
      return res.status(400).json({ success: false, error: 'Email not verified by Google' });
    }

    // Normalize
    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ googleId });
    if (!user) {
      // Try linking by existing username/email (assuming username stores email for local accounts)
      user = await User.findOne({ username: normalizedEmail });
      if (user && !user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      } else if (!user) {
        // Create new Google user
        user = await User.create({
          username: normalizedEmail,
            provider: 'google',
            googleId,
            avatarUrl: picture
        });
        // If chat initialization logic exists, call it here:
        // await initChatForNewUser(user._id);
      }
    }

    const token = user.getSignedJwtToken();
    res.json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
}

module.exports = { googleLogin };