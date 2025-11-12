import express from "express";

const router = express.Router();

/**
 * 🔧 Development-only route to set GEMINI_API_KEY dynamically.
 * DO NOT use this in production — it's auto-disabled when NODE_ENV=production.
 */
router.post("/set-key", (req, res) => {
  // ✅ Block access in production
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Forbidden in production" });
  }

  // ✅ Parse key
  const { key } = req.body || {};
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Valid 'key' is required" });
  }

  // ✅ Set key in process memory
  process.env.GEMINI_API_KEY = key;

  // ✅ Mask before logging
  const masked =
    key.length > 6 ? `${key.slice(0, 4)}...${key.slice(-2)}` : "***";
  console.log(`🧠 GEMINI_API_KEY set at runtime (masked): ${masked}`);

  return res.json({ ok: true, masked });
});

export default router;
