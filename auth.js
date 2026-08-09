const admin = require('firebase-admin');

// ====================================================================
// Verifies the Firebase ID token the Flutter app attaches as:
//   Authorization: Bearer <idToken>
// This is the core security boundary: every downstream route trusts
// req.userId, which can ONLY be set by a token Firebase itself signed.
// Swap this for your own auth provider if you're not using Firebase —
// the important part is that identity is verified server-side, never
// trusted from a client-supplied user_id field.
// ====================================================================

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired auth token.' });
  }
};
