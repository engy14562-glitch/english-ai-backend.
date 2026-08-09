
const express = require('express');
const { generateReply } = require('../services/openaiService');

const router = express.Router();

// POST /api/chat/reply
// body: { level, scenarioTitle, history: [{role, content}], userMessage }
router.post('/reply', async (req, res, next) => {
  try {
    const { level, scenarioTitle, history, userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required.' });
    }
    if (userMessage.length > 1000) {
      return res.status(400).json({ error: 'userMessage too long.' });
    }

    const result = await generateReply({
      level,
      scenarioTitle: scenarioTitle || null,
      history: Array.isArray(history) ? history : [],
      userMessage,
    });

    res.json(result); // { reply_text, correction, suggested_replies }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
