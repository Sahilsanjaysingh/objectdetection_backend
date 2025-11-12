// ────────────────────────────────
// 🌱 Environment Setup
// ────────────────────────────────
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import Image from "./models/Image.js";

// Load .env file (checks both backend/.env and project root)
const __dirname = path.resolve();
const backendEnv = path.join(__dirname, "backend/.env");
if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
else dotenv.config();

// Mask API key for logs
const key = process.env.GEMINI_API_KEY;
if (key) {
  const masked = key.length > 6 ? `${key.slice(0, 4)}...${key.slice(-2)}` : "*";
  console.log(`🔐 GEMINI_API_KEY loaded: ${masked}`);
} else {
  console.warn("⚠️  GEMINI_API_KEY not set in .env");
}

// ────────────────────────────────
// ⚙️ App Configuration
// ────────────────────────────────
const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bnb_db";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Created uploads folder");
}

// ────────────────────────────────
// 🧠 Middleware
// ────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://yourfrontend.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, UPLOAD_DIR)));

// ────────────────────────────────
// 📦 MongoDB Connection
// ────────────────────────────────
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ────────────────────────────────
// 📂 Route Imports
// ────────────────────────────────
import uploadRouter from "./routes/upload.js";
import imagesRouter from "./routes/images.js";
import settingsRouter from "./routes/settings.js";
import dashboardRouter from "./routes/dashboard.js";
import riskRouter from "./routes/risk.js";
import predictRouter from "./routes/predict.js";

app.use("/api/upload", uploadRouter);
app.use("/api/images", imagesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/risk", riskRouter);
app.use("/api/predict", predictRouter);

// ✅ Load debug routes only in dev
if (NODE_ENV !== "production") {
  import("./routes/debug.js")
    .then((debugModule) => {
      const debugRouter = debugModule.default || debugModule;
      app.use("/api/debug", debugRouter);
      console.log("🧰 Debug routes enabled (development only)");
    })
    .catch(() => console.log("⚙️ No debug route found, continuing..."));
}

// ────────────────────────────────
// 📤 Quick File Upload Endpoint
// ────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  try {
    if ((req.file.mimetype || "").startsWith("image/")) {
      await Image.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      });
    }
  } catch (e) {
    console.error("❌ Failed to save image doc:", e);
  }

  res.json({ url: fileUrl });
});

// ────────────────────────────────
// 🏠 Root Health Route
// ────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "✅ Backend running successfully",
    environment: NODE_ENV,
    database: MONGO_URI.includes("mongodb+srv")
      ? "MongoDB Atlas"
      : "Local MongoDB",
  });
});

// ────────────────────────────────
// 🚀 Start Server
// ────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
});
