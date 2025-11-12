const express = require('express');
const router = express.Router();
const Image = require('../models/Image');

// In-memory settings store for demo purposes. Replace with DB storage if needed.
let settings = {
  detectionThreshold: 0.5,
  notifyEmail: '',
  maxObjects: 10,
  objects: null,
};

// GET /api/settings - returns settings plus live object counts aggregated from stored images
router.get('/', async (req, res) => {
  try {
    // aggregate counts of each detected object across images
    const counts = await Image.aggregate([
      { $unwind: { path: '$detections', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$detections.object', count: { $sum: 1 } } },
    ]);

    const objCounts = {};
    (counts || []).forEach(c => { if (c._id) objCounts[c._id] = c.count });

    res.json({ ...settings, objectCounts: objCounts });
  } catch (err) {
    console.error('settings.get error', err);
    res.json(settings);
  }
});

router.put('/', (req, res) => {
  const body = req.body || {};
  settings = { ...settings, ...body };
  res.json(settings);
});

module.exports = router;
