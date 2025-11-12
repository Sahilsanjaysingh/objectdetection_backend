const express = require('express');
const Image = require('../models/Image');
const router = express.Router();

// GET /api/dashboard - return basic metrics
router.get('/', async (req, res) => {
  try {
    const totalImages = await Image.countDocuments();
    const recent = await Image.find().sort({ createdAt: -1 }).limit(10).lean();
    const avgConfidence = await Image.aggregate([
      { $match: { avgConfidence: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$avgConfidence' } } }
    ]);

    const metrics = require('../metrics');
    res.json({
      totalImages,
      recent,
      avgConfidence: avgConfidence && avgConfidence[0] ? avgConfidence[0].avg : 0,
      responseTime: metrics.getLastResponseTime() || null,
    });
  } catch (err) {
    console.error('Dashboard error', err);
    res.status(500).json({ error: 'Dashboard error' });
  }
});

module.exports = router;
