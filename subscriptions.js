const express = require('express');
const { setProStatus } = require('../utils/proStatusStore');

const router = express.Router();

// Events that mean "user currently has active Pro access".
const ACTIVE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
// Events that mean "Pro access just ended".
const INACTIVE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE']);

// POST /webhooks/revenuecat
// NOTE: this route is registered BEFORE the auth middleware in server.js
// (RevenueCat's servers, not the app, call this — there's no Firebase
// token to check). Instead we verify RevenueCat's own shared secret.
router.post('/', express.json(), (req, res) => {
  const authHeader = req.headers.authorization || '';
  const providedSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (providedSecret !== process.env.REVENUECAT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret.' });
  }

  const event = req.body?.event;
  if (!event) return res.status(400).json({ error: 'Malformed payload.' });

  // app_user_id is the id you passed to Purchases.logIn() in Flutter —
  // set it to the same Firebase uid used everywhere else in this backend.
  const userId = event.app_user_id;
  const type = event.type;

  if (userId && ACTIVE_EVENTS.has(type)) {
    setProStatus(userId, true);
  } else if (userId && INACTIVE_EVENTS.has(type)) {
    setProStatus(userId, false);
  }

  // TODO: persist this to your real DB (not just the in-memory store)
  // and log the raw event for auditing/support/refund investigations.

  res.status(200).json({ received: true });
});

module.exports = router;
