import express from "express";
import Image from "../models/Image.js";

const router = express.Router();

/**
 * 🧠 Calculates a risk score based on average detection confidence.
 * This is a local formula — no external API calls.
 * @param {Array} detections - The array of detected objects in an image.
 * @returns {Object} Risk analysis result with score, category, explanation, and actions.
 */
function calculateRiskByConfidence(detections = []) {
  if (!detections || detections.length === 0) {
    return {
      score: 0,
      category: "Very Low",
      explanation: "No objects were detected to analyze.",
      actions: [],
    };
  }

  // 1️⃣ Average confidence of detections
  const numberOfDetections = detections.length;
  const sumOfConfidence = detections.reduce((total, det) => {
    const confidence =
      typeof det.confidence === "number" ? det.confidence : 0;
    return total + confidence;
  }, 0);
  const averageConfidence = sumOfConfidence / numberOfDetections;

  // 2️⃣ Base score: inversely proportional to average confidence
  let score = (1 - averageConfidence) * 100;

  // 3️⃣ Add penalty for low-confidence detections (< 60%)
  const lowConfidenceItems = detections.filter(
    (det) => (det.confidence || 0) < 0.6
  ).length;
  score += lowConfidenceItems * 10;

  // 4️⃣ Cap score at 100
  score = Math.min(score, 100);
  score = Math.round(score);

  // 5️⃣ Categorize risk
  let category;
  if (score >= 75) category = "Critical";
  else if (score >= 50) category = "High";
  else if (score >= 25) category = "Medium";
  else category = "Low";

  // 6️⃣ Build response
  const explanation = `Calculated risk score of ${score} based on ${numberOfDetections} detections with an average confidence of ${Math.round(
    averageConfidence * 100
  )}%.`;
  const actions = [
    {
      title: "Review Detections",
      description:
        "Manually verify the detected objects, especially those with low confidence scores.",
    },
  ];

  return { score, category, explanation, actions };
}

/**
 * 🧩 POST /api/risk/evaluate
 * Evaluates an image’s detections and calculates a risk score.
 */
router.post("/evaluate", async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId) {
      return res.status(400).json({ error: "imageId is required." });
    }

    const image = await Image.findById(imageId).lean();
    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }

    // Run local risk calculation
    const result = calculateRiskByConfidence(image.detections || []);

    const finalResult = {
      ...result,
      evaluatedAt: new Date(),
    };

    // Save risk back to MongoDB
    await Image.findByIdAndUpdate(imageId, {
      $set: { risk: finalResult },
    });

    res.json({ result: finalResult });
  } catch (err) {
    console.error("❌ Evaluation pipeline failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
