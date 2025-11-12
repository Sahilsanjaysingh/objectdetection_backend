import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import Image from "../models/Image.js";
import * as metrics from "../metrics.js";

const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// 🧩 Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Created uploads directory for predict route");
}

// ⚙️ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

/**
 * 🧠 POST /api/predict
 * 1️⃣ Accepts an image file
 * 2️⃣ Sends it to your Hugging Face YOLO model
 * 3️⃣ Stores prediction in MongoDB
 * 4️⃣ Returns structured results
 */
router.post("/", upload.single("file"), async (req, res) => {
  const start = Date.now();

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // 🧠 Forward image to your YOLO Hugging Face model
    const hfEndpoint = "https://lodusahil-yolospacedetectionmodel.hf.space/predict";
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    console.log("📤 Sending image to YOLO model...");

    const response = await fetch(hfEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("❌ YOLO model request failed:", response.statusText);
      return res.status(500).json({ error: "YOLO model API call failed" });
    }

    const predictions = await response.json();

    // 📈 Calculate average confidence (if YOLO provides confidence values)
    let avgConfidence = 0;
    if (Array.isArray(predictions) && predictions.length > 0) {
      avgConfidence =
        predictions.reduce((sum, d) => sum + (d.confidence || 0), 0) /
        predictions.length;
    }

    // 🧾 Store in DB only if it's an image
    let doc = null;
    if ((req.file.mimetype || "").startsWith("image/")) {
      doc = await Image.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: imageUrl,
        detections: predictions,
        avgConfidence,
      });
    }

    // 🧠 Update response time metric
    const took = Date.now() - start;
    try {
      metrics.setLastResponseTime?.(took);
    } catch {
      console.log("⚙️ Metrics not configured");
    }

    // 🧹 Delete uploaded file after sending to YOLO
    fs.unlink(filePath, () => {});

    console.log("✅ Prediction complete in", took, "ms");

    res.json({
      success: true,
      url: imageUrl,
      predictions,
      avgConfidence,
      saved: !!doc,
    });
  } catch (err) {
    console.error("❌ Prediction route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
