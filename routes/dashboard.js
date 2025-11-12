import express from "express";
import Image from "../models/Image.js";
import * as metrics from "../metrics.js";

const router = express.Router();

/**
 * 📊 GET /api/dashboard
 * Returns key metrics about image uploads and model performance.
 */
router.get("/", async (req, res) => {
  try {
    // Total number of images
    const totalImages = await Image.countDocuments();

    // 10 most recent uploads
    const recent = await Image.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Average confidence across all detections (if stored)
    const avgConfidenceAgg = await Image.aggregate([
      { $match: { avgConfidence: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$avgConfidence" } } },
    ]);
    const avgConfidence =
      avgConfidenceAgg.length > 0 ? avgConfidenceAgg[0].avg : 0;

    // Fetch last response time from metrics util (if available)
    const responseTime =
      typeof metrics.getLastResponseTime === "function"
        ? metrics.getLastResponseTime()
        : null;

    res.json({
      totalImages,
      recent,
      avgConfidence,
      responseTime,
    });
  } catch (err) {
    console.error("❌ Dashboard route error:", err);
    res.status(500).json({ error: "Dashboard error" });
  }
});

export default router;
