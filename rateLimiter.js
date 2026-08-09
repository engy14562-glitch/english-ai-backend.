const rateLimit = require('express-rate-limit');

// ====================================================================
// Two layers of throttling:
// 1. userRateLimiter — general abuse/bot protection, keyed by verified
//    Firebase uid (not IP, since mobile IPs are shared/NATed).
// 2. sttRateLimiter — tighter limit on the most expensive route
//    (audio upload + Whisper), since this is the easiest one to abuse
//    for cost draining even from a legitimate account.
//
// This is a *secondary* defense. The primary Free-tier enforcement is
// the server-side daily-seconds check in src/utils/dailyLimit.js —
// rate limiting alone can't stop someone from burning their 5 minutes
// in one rapid burst, only from hammering the endpoint.
// ====================================================================

const keyByUser = (req) => req.userId || req.ip;

const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 requests/minute/user across chat+tts+speech combined
  keyGenerator: keyByUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const sttRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 audio uploads/minute/user
  keyGenerator: keyByUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many audio requests. Please slow down.' },
});

module.exports = { userRateLimiter, sttRateLimiter };
