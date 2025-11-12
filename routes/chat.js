const express = require('express');
const router = express.Router();

// Chat route deprecated/removed. If this file is still present it should not be mounted.
// Respond with 410 Gone for safety if accidentally mounted.
router.all('*', (_req, res) => {
  res.status(410).json({ ok: false, error: 'Chat API removed from this deployment' });
});

module.exports = router;
