const express = require('express');
const { synthesizeSpeech } = require('../services/elevenLabsService');

const router = express.Router();

// POST /api/tts/speak
// body: { text: string }
// returns: audio/mpeg binary
router.post('/speak', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required.' });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: 'text too long for a single TTS call.' });
    }

    const audioBuffer = await synthesizeSpeech(text);
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
