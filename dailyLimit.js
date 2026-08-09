// ====================================================================
// Server-side source of truth for the Free-tier's 5-minutes/day limit.
// The client-side timer (sessionProvider in the Flutter app) is only
// a UX preview — it can be bypassed by a modified client, so every
// STT/chat call MUST be checked and incremented here too.
//
// This in-memory Map is a placeholder for local development only.
// In production, replace with Redis (INCR + EXPIRE at UTC midnight)
// or a Postgres/Firestore row keyed by (userId, date) — the shape of
// getUsage/addUsage below is designed to make that swap a drop-in.
// ====================================================================

const usage = new Map(); // key: `${userId}:${yyyy-mm-dd}` -> seconds used

const DAILY_LIMIT_SECONDS = parseInt(process.env.FREE_TIER_DAILY_SECONDS || '300', 10);

function todayKey(userId) {
  const today = new Date().toISOString().slice(0, 10); // UTC date
  return `${userId}:${today}`;
}

async function getRemainingSeconds(userId, isPro) {
  if (isPro) return Infinity;
  const used = usage.get(todayKey(userId)) || 0;
  return Math.max(DAILY_LIMIT_SECONDS - used, 0);
}

async function addUsage(userId, secondsUsed) {
  const key = todayKey(userId);
  const current = usage.get(key) || 0;
  usage.set(key, current + secondsUsed);
}

module.exports = { getRemainingSeconds, addUsage, DAILY_LIMIT_SECONDS };
