// Load backend/.env if present, then fallback to project root .env
const path = require("path");
const fs = require("fs");
const backendEnv = path.join(__dirname, ".env");
if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
} else {
  require("dotenv").config();
}

// Log whether GEMINI_API_KEY is present (masked)
try {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const masked =
      ("" + key).length > 6
        ? `${key.slice(0, 4)}...${key.slice(-2)}`
        : "*";
    console.log(`GEMINI_API_KEY loaded (masked): ${masked}`);
  } else {
    console.warn(
      "GEMINI_API_KEY not set. Put your key in backend/.env (see backend/.env.example) and restart the server."
    );
  }
} catch (e) {
  // ignore
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const multer = require("multer");
const Image = require('./models/Image');

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// ✅ Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// === CORS setup for local frontend ===
// allow PUT/PATCH so the frontend can update saved image documents (persist detections)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  // include common verbs used by the frontend (GET/POST/PUT/PATCH/OPTIONS)
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, UPLOAD_DIR)));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/bnb_db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

// ✅ Routes
const uploadRouter = require("./routes/upload");
const imagesRouter = require("./routes/images");
const settingsRouter = require("./routes/settings");
const dashboardRouter = require("./routes/dashboard");
const debugRouter = require("./routes/debug");
const riskRouter = require("./routes/risk");
const predictRouter = require("./routes/predict");

app.use("/api/upload", uploadRouter);
app.use("/api/images", imagesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/debug", debugRouter);
app.use("/api/risk", riskRouter);
app.use("/api/predict", predictRouter);

// ✅ QUICK UPLOAD HANDLER (for EmailJS file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// 🔹 POST /api/upload (direct upload)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file uploaded." });

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  // If this is an image, create an Image document so it appears in History.
  // This mirrors the behavior in routes/upload.js which persists only image files.
  (async () => {
    try {
      if ((req.file.mimetype || '').startsWith('image/')) {
        await Image.create({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
        });
      }
    } catch (e) {
      console.error('quick upload create image doc error', e);
    }
  })();

  res.json({ url: fileUrl });
});

// ✅ Root
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend running" });
});

// ✅ Port auto-retry logic
const maxRetries = 10;
let attempts = 0;
let currentPort = Number(PORT);
let serverInstance = null;

function startServer(port) {
  try {
    if (serverInstance && serverInstance.listening) {
      serverInstance.close(() => console.log("Closed previous server instance"));
    }
  } catch (e) {}

  const server = app.listen(port, () => {
    console.log(`✅ Server listening on port ${port}`);
  });
  serverInstance = server;

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, trying next port...`);
      attempts += 1;
      if (attempts > maxRetries) {
        console.error(
          `Unable to bind port after ${maxRetries} attempts. Please free the port or set a different PORT in .env`
        );
        process.exit(1);
      }
      currentPort = port + 1;
      setTimeout(() => startServer(currentPort), 200);
    } else {
      console.error("Server error", err);
      process.exit(1);
    }
  });
}

startServer(currentPort);
