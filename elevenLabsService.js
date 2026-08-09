const axios = require('axios');

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

/**
 * Synthesizes speech from text via ElevenLabs and returns raw audio bytes.
 * @param {string} text
 * @returns {Promise<Buffer>} mp3 audio buffer
 */
async function synthesizeSpeech(text) {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      text,
      model_id: 'eleven_turbo_v2', // low-latency model, good fit for conversational turns
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'arraybuffer',
    }
  );
  return Buffer.from(response.data);
}

module.exports = { synthesizeSpeech };
