import express from "express";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

const router = express.Router();

// Configure Multer for file uploads
const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

/**
 * 📤 POST /api/upload
 * Uploads an image and sends it to the YOLO Hugging Face API for detection.
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    // Build FormData to send to Hugging Face YOLO model
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    // Your Hugging Face Flask API endpoint (replace with your actual Space URL)
    const hfEndpoint = "https://lodusahil-yolospacedetectionmodel.hf.space/predict";

    // Send file to your deployed YOLO model
    const response = await fetch(hfEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("❌ YOLO API call failed:", response.statusText);
      return res.status(500).json({ error: "YOLO API call failed" });
    }

    const predictions = await response.json();

    // Cleanup local uploaded file after processing
    fs.unlink(req.file.path, () => {});

    // Send YOLO response back to frontend
    res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error("❌ Upload route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
