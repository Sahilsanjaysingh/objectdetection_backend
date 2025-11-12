const express = require('express');
const router = express.Router();

// Dev-only endpoint to set GEMINI_API_KEY at runtime. DO NOT enable in production.
router.post('/set-key', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden in production' });
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key is required' });
  process.env.GEMINI_API_KEY = key;
  const masked = ('' + key).length > 6 ? `${key.slice(0,4)}...${key.slice(-2)}` : '***';
  console.log('GEMINI_API_KEY set at runtime (masked):', masked);
  return res.json({ ok: true, masked });
});

module.exports = router;
