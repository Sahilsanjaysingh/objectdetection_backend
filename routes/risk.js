const express = require('express');
const Image = require('../models/Image');
const router = express.Router();

/**
 * Calculates a risk score based on a formula using detection confidence levels.
 * This function runs locally and does not use any external APIs.
 * @param {Array} detections - The array of objects detected in the image.
 * @returns {Object} A prediction object with the calculated score and details.
 */
function calculateRiskByConfidence(detections = []) {
  if (!detections || detections.length === 0) {
    return {
      score: 0,
      category: 'Very Low',
      explanation: 'No objects were detected to analyze.',
      actions: []
    };
  }

  // --- The Formula ---
  
  // 1. Calculate the average confidence of all detected items.
  const numberOfDetections = detections.length;
  const sumOfConfidence = detections.reduce((total, det) => {
    // Ensure confidence is a number, default to 0 if not present
    const confidence = typeof det.confidence === 'number' ? det.confidence : 0;
    return total + confidence;
  }, 0);
  const averageConfidence = sumOfConfidence / numberOfDetections;

  // 2. The base score is inversely proportional to the average confidence.
  // High confidence -> Low score. Low confidence -> High score.
  let score = (1 - averageConfidence) * 100;

  // 3. Add a small penalty for each low-confidence item (< 60%).
  const lowConfidenceItems = detections.filter(det => (det.confidence || 0) < 0.6).length;
  score += lowConfidenceItems * 10; // Add 10 points for each uncertain item.

  // 4. Cap the score at 100.
  score = Math.min(score, 100);
  score = Math.round(score);

  // 5. Determine the category based on the final score.
  let category;
  if (score >= 75) category = 'Critical';
  else if (score >= 50) category = 'High';
  else if (score >= 25) category = 'Medium';
  else category = 'Low';

  const explanation = `Calculated risk score of ${score} based on ${numberOfDetections} detections with an average confidence of ${Math.round(averageConfidence * 100)}%.`;
  const actions = [{
    title: 'Review Detections',
    description: 'Manually verify the detected objects, especially those with low confidence scores.'
  }];

  return {
    score,
    category,
    explanation,
    actions
  };
}

// Main route that the frontend calls
router.post('/evaluate', async (req, res) => {
  try {
    const { imageId } = req.body;
    if (!imageId) return res.status(400).json({ error: 'imageId is required.' });

    const image = await Image.findById(imageId).lean();
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    // Call our new local formula-based function
    const result = calculateRiskByConfidence(image.detections || []);
    
    const finalResult = {
      ...result,
      evaluatedAt: new Date()
    };

    await Image.findByIdAndUpdate(imageId, { $set: { risk: finalResult } });
    
    return res.json({ result: finalResult });

  } catch (err)
 {
    console.error('Evaluation pipeline failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;