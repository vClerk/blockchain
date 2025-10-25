const express = require('express');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await blockchainService.getStatistics();
    
    // Calculate additional metrics
    const averageSubsidyPerFarmer = stats.totalFarmers > 0 
      ? (parseFloat(stats.totalDistributed) / parseInt(stats.totalFarmers)).toFixed(4)
      : 0;
    
    const averageSubsidyPerPayment = stats.totalPayments > 0
      ? (parseFloat(stats.totalDistributed) / parseInt(stats.totalPayments)).toFixed(4)
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        averageSubsidyPerFarmer,
        averageSubsidyPerPayment,
        utilizationRate: stats.totalSchemes > 0 
          ? ((parseInt(stats.totalPayments) / parseInt(stats.totalSchemes)) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get monthly payment trends (mock data for demonstration)
router.get('/trends/monthly', (req, res) => {
  const monthlyData = [
    { month: 'Jan', payments: 45, amount: 225 },
    { month: 'Feb', payments: 52, amount: 260 },
    { month: 'Mar', payments: 48, amount: 240 },
    { month: 'Apr', payments: 61, amount: 305 },
    { month: 'May', payments: 55, amount: 275 },
    { month: 'Jun', payments: 67, amount: 335 }
  ];

  res.json({
    success: true,
    data: monthlyData
  });
});

// Get scheme performance (mock data for demonstration)
router.get('/schemes/performance', (req, res) => {
  const schemeData = [
    { 
      name: 'Rice Cultivation Support', 
      totalBeneficiaries: 45, 
      totalAmount: 225,
      utilizationRate: 90 
    },
    { 
      name: 'Organic Farming Initiative', 
      totalBeneficiaries: 32, 
      totalAmount: 240,
      utilizationRate: 64 
    },
    { 
      name: 'Drought Relief Fund', 
      totalBeneficiaries: 28, 
      totalAmount: 140,
      utilizationRate: 56 
    }
  ];

  res.json({
    success: true,
    data: schemeData
  });
});

// Get regional distribution (mock data for demonstration)
router.get('/regional', (req, res) => {
  const regionalData = [
    { region: 'Punjab', farmers: 125, subsidyAmount: 625 },
    { region: 'Haryana', farmers: 98, subsidyAmount: 490 },
    { region: 'Uttar Pradesh', farmers: 156, subsidyAmount: 780 },
    { region: 'Maharashtra', farmers: 89, subsidyAmount: 445 },
    { region: 'Karnataka', farmers: 67, subsidyAmount: 335 }
  ];

  res.json({
    success: true,
    data: regionalData
  });
});

module.exports = router;
