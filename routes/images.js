const express = require('express');
const Image = require('../models/Image');

const router = express.Router();

router.get('/', async (req, res) => {
  const images = await Image.find().sort({ createdAt: -1 }).limit(100);
  res.json(images);
});

router.get('/:id', async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: 'Not found' });
  res.json(image);
});

// update detections for an image (used by frontend after running AI detection)
router.put('/:id', async (req, res) => {
  try {
    const { detections } = req.body || {};
    if (!Array.isArray(detections)) return res.status(400).json({ error: 'detections must be an array' });

    // normalize detections: ensure detectedAt and detector
    const normalized = detections.map(d => ({
      object: d.object,
      confidence: d.confidence,
      bbox: d.bbox,
      detectedAt: d.detectedAt ? new Date(d.detectedAt) : new Date(),
      detector: d.detector || 'yolo',
    }));

    const avgConfidence = normalized.length ? normalized.reduce((s, d) => s + (d.confidence || 0), 0) / normalized.length : 0;

    const updated = await Image.findByIdAndUpdate(req.params.id, { detections: normalized, avgConfidence }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('images.update error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
