const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token (from Google Identity Services).
 * @param {string} idToken - The credential received from the front-end.
 * @returns {Promise<object>} - The decoded payload (email, sub, name, picture, etc.)
 * @throws if verification fails.
 */
async function verifyGoogleIdToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID env var not set on backend.');
  }
  if (!idToken) {
    throw new Error('Missing idToken');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  // payload.sub is the stable Google user ID
  return payload;
}

module.exports = { verifyGoogleIdToken };