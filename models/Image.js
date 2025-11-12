const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
  object: { type: String },
  confidence: { type: Number },
  bbox: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  detectedAt: { type: Date, default: Date.now },
  detector: { type: String },
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  url: { type: String },
  detections: { type: [DetectionSchema], default: [] },
  avgConfidence: { type: Number, default: 0 },
  risk: {
    score: { type: Number, default: 0 },
    category: { type: String, default: 'Low' },
    factors: { type: [String], default: [] },
    actions: { type: [Object], default: [] },
    explanation: { type: String },
    evaluatedAt: { type: Date }
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', ImageSchema);
