import express from "express";
import Image from "../models/Image.js";

const router = express.Router();

/**
 * 📸 GET /api/images
 * Returns the 100 most recent image documents.
 */
router.get("/", async (req, res) => {
  try {
    const images = await Image.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(images);
  } catch (err) {
    console.error("❌ Error fetching images:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

/**
 * 🖼️ GET /api/images/:id
 * Returns a single image document by ID.
 */
router.get("/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: "Not found" });
    res.json(image);
  } catch (err) {
    console.error("❌ Error fetching image:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * 🧠 PUT /api/images/:id
 * Updates detections for an image (used after running AI detection).
 */
router.put("/:id", async (req, res) => {
  try {
    const { detections } = req.body || {};

    if (!Array.isArray(detections)) {
      return res.status(400).json({ error: "detections must be an array" });
    }

    // Normalize detections
    const normalized = detections.map((d) => ({
      object: d.object,
      confidence: d.confidence,
      bbox: d.bbox,
      detectedAt: d.detectedAt ? new Date(d.detectedAt) : new Date(),
      detector: d.detector || "yolo",
    }));

    const avgConfidence = normalized.length
      ? normalized.reduce((sum, d) => sum + (d.confidence || 0), 0) /
        normalized.length
      : 0;

    const updated = await Image.findByIdAndUpdate(
      req.params.id,
      { detections: normalized, avgConfidence },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ images.update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
