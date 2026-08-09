const axios = require('axios');

// ====================================================================
// Direct query fallback (v1 REST API) — used sparingly, e.g. right
// after a user logs in on a new device, to reconcile Pro status
// before the next webhook event arrives. The webhook (subscriptions
// route) is the primary, low-latency source of truth day-to-day.
// ====================================================================
async function fetchSubscriberStatus(appUserId) {
  const response = await axios.get(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_API_KEY}` },
    }
  );
  const entitlements = response.data?.subscriber?.entitlements || {};
  return Boolean(entitlements.pro && entitlements.pro.expires_date !== null
    ? new Date(entitlements.pro.expires_date) > new Date()
    : entitlements.pro);
}

module.exports = { fetchSubscriberStatus };
