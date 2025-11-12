import express from "express";
import Image from "../models/Image.js";

const router = express.Router();

// 🧠 In-memory settings store (you can replace this with MongoDB later)
let settings = {
  detectionThreshold: 0.5,
  notifyEmail: "",
  maxObjects: 10,
  objects: null,
};

/**
 * ⚙️ GET /api/settings
 * Returns global app settings + live object detection counts aggregated from images.
 */
router.get("/", async (req, res) => {
  try {
    // Aggregate counts of each detected object type from stored images
    const counts = await Image.aggregate([
      { $unwind: { path: "$detections", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$detections.object", count: { $sum: 1 } } },
    ]);

    const objectCounts = {};
    (counts || []).forEach((c) => {
      if (c._id) objectCounts[c._id] = c.count;
    });

    res.json({
      ...settings,
      objectCounts,
    });
  } catch (err) {
    console.error("❌ settings.get error:", err);
    res.status(500).json({
      ...settings,
      error: "Failed to load settings or object counts",
    });
  }
});

/**
 * 🧩 PUT /api/settings
 * Updates in-memory settings (used by frontend config panel).
 */
router.put("/", (req, res) => {
  try {
    const body = req.body || {};
    settings = { ...settings, ...body };

    console.log("⚙️ Settings updated:", settings);
    res.json(settings);
  } catch (err) {
    console.error("❌ settings.put error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
