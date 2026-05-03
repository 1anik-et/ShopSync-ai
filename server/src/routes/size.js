const express = require('express');
const { computeSizeRecommendation } = require('../services/ai');

const router = express.Router();

// POST /api/size/recommend — Get size recommendation
router.post('/recommend', (req, res) => {
  try {
    const { height, weight, gender, retailer, category } = req.body;

    if (!retailer || !category) {
      return res.status(400).json({ error: 'retailer and category are required' });
    }

    const result = computeSizeRecommendation({
      height: parseFloat(height) || 175,
      weight: parseFloat(weight) || 75,
      gender: gender || 'male',
      retailer,
      category,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute size', details: err.message });
  }
});

module.exports = router;
