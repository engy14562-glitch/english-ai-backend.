require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authMiddleware = require('./src/middleware/auth');
const { userRateLimiter, sttRateLimiter } = require('./src/middleware/rateLimiter');

const speechRoutes = require('./src/routes/speech');
const chatRoutes = require('./src/routes/chat');
const ttsRoutes = require('./src/routes/tts');
const subscriptionRoutes = require('./src/routes/subscriptions');

const app = express();

// ---- Global hardening ----
app.use(helmet());
app.use(cors({ origin: false })); // mobile app doesn't need browser CORS; lock this down explicitly
app.disable('x-powered-by');

// RevenueCat webhook needs the raw body for its own reasons in some setups;
// keep JSON parsing scoped after that route registers its own parser if needed.
app.use(express.json({ limit: '1mb' }));

// ---- Public route (no user auth — verified via RevenueCat's own secret) ----
app.use('/webhooks/revenuecat', subscriptionRoutes);

// ---- Health check ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---- Everything below requires a verified, logged-in app user ----
app.use(authMiddleware);
app.use(userRateLimiter); // general per-user request throttling

app.use('/api/speech', sttRateLimiter, speechRoutes); // STT is the most expensive/abusable route
app.use('/api/chat', chatRoutes);
app.use('/api/tts', ttsRoutes);

// ---- Central error handler (never leak internals/stack traces) ----
app.use((err, req, res, next) => {
  console.error(err); // TODO: send to real logging (Sentry, CloudWatch, etc.)
  res.status(err.status || 500).json({
    error: 'Something went wrong. Please try again.',
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`AI English Partner backend running on :${PORT}`));
