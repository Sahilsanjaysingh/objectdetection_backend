const express = require('express');
const multer = require('multer');
const path = require('path');
const Image = require('../models/Image');

const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  const start = Date.now();
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // allow optional detections JSON field
    let detections = [];
    if (req.body && req.body.detections) {
      try {
        detections = typeof req.body.detections === 'string' ? JSON.parse(req.body.detections) : req.body.detections;
      } catch (e) {
        // ignore parse errors
      }
    }

    let avgConfidence = 0;
    if (Array.isArray(detections) && detections.length > 0) {
      avgConfidence = detections.reduce((s, d) => s + (d.confidence || 0), 0) / detections.length;
    }

    // Only persist image files to the DB. Skip creating Image documents for non-image uploads
    // (e.g., exported CSVs or attachments) to avoid cluttering the History listing.
    let doc = null;
    if ((req.file.mimetype || '').startsWith('image/')) {
      doc = await Image.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
        detections,
        avgConfidence,
      });
    }
    const took = Date.now() - start;
    // lazily require metrics to avoid circular issues
    try { require('../metrics').setLastResponseTime(took); } catch (e) { /* ignore */ }

  // respond with either the created doc or the basic file URL so clients can show previews/downloads
  res.json(doc || { url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
