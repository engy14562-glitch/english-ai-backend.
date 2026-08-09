const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { transcribeAudio } = require('../services/openaiService');
const { getRemainingSeconds, addUsage } = require('../utils/dailyLimit');
const { isPro } = require('../utils/proStatusStore');

const router = express.Router();

// Store uploads in a temp dir, capped size, deleted right after use.
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per utterance
});

// POST /api/speech/transcribe
// multipart/form-data: { audio: <file>, durationSeconds: <number> }
router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const userIsPro = isPro(req.userId);
    const durationSeconds = Math.min(Math.ceil(Number(req.body.durationSeconds) || 5), 60);

    // ---- Server-side Free-tier gate (the real enforcement point) ----
    if (!userIsPro) {
      const remaining = await getRemainingSeconds(req.userId, userIsPro);
      if (remaining <= 0) {
        return res.status(402).json({ error: 'DAILY_LIMIT_REACHED' }); // 402 Payment Required
      }
    }

    const { text } = await transcribeAudio(filePath);

    if (!userIsPro) {
      await addUsage(req.userId, durationSeconds);
    }

    const remainingAfter = await getRemainingSeconds(req.userId, userIsPro);
    res.json({ transcript: text, remainingSeconds: remainingAfter === Infinity ? null : remainingAfter });
  } catch (err) {
    next(err);
  } finally {
    if (filePath) fs.unlink(filePath, () => {}); // always clean up temp audio
  }
});

module.exports = router;
