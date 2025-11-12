import express from "express";

const router = express.Router();

/**
 * ⚙️ GET /api/settings/env
 * Returns whether GEMINI_API_KEY is loaded, with a masked preview.
 */
router.get("/env", (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.json({ gemini: false });
    }

    const masked =
      key.length > 6 ? `${key.slice(0, 4)}...${key.slice(-2)}` : "***";

    res.json({
      gemini: true,
      key: masked,
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    console.error("❌ Settings route error:", err);
    res.status(500).json({ error: "Failed to fetch environment settings" });
  }
});

export default router;
