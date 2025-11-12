const express = require('express');
const router = express.Router();

router.get('/env', (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ gemini: false });
  const masked = ('' + key).length > 6 ? `${key.slice(0,4)}...${key.slice(-2)}` : '***';
  return res.json({ gemini: true, key: masked });
});

module.exports = router;
