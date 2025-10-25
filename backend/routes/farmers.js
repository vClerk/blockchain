const express = require('express');
const router = express.Router();

// These routes would typically handle off-chain farmer data
// For now, they return mock data

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Use blockchain routes for farmer operations'
  });
});

module.exports = router;
