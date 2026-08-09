// ====================================================================
// Local cache of each user's Pro entitlement, kept in sync by the
// RevenueCat webhook (src/routes/subscriptions.js). Checking this
// cache is far faster/cheaper than calling RevenueCat's REST API on
// every single chat/speech/tts request.
//
// Placeholder in-memory Map for local dev — in production, back this
// with the same DB you use for dailyLimit.js (e.g. a `users` table/
// collection with an `isPro` + `proExpiresAt` column), so it survives
// restarts and works across multiple server instances.
// ====================================================================

const proStatus = new Map(); // key: revenueCatAppUserId (== your userId) -> boolean

function setProStatus(userId, isPro) {
  proStatus.set(userId, isPro);
}

function isPro(userId) {
  return proStatus.get(userId) === true;
}

module.exports = { setProStatus, isPro };
