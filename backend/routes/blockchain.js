const express = require('express');
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');
const database = require('../services/database');
const { ethers } = require('ethers');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validationChains, handleValidationErrors } = require('../middleware/validator');

const router = express.Router();

// Get all farmers from storage (includes both blockchain and local data)
// Optional authentication for better rate limiting
router.get('/farmers', async (req, res) => {
  try {
    let farmers = await database.findAllFarmers();
    
    // If connected to blockchain, try to get event-based farmer list
    try {
      const stats = await blockchainService.getStatistics();
      const totalOnChain = parseInt(stats.totalFarmers);
      
      console.log(`📊 Database farmers: ${farmers.length}, Blockchain farmers: ${totalOnChain}`);
      
      // If database is empty but blockchain has farmers, show a helpful message
      if (farmers.length === 0 && totalOnChain > 0) {
        console.log('⚠️ Database empty but farmers exist on blockchain. Use farmer registration sync or manual sync.');
      }
    } catch (blockchainError) {
      console.log('⚠️ Blockchain read failed, using database data only:', blockchainError.message);
    }
    
    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all schemes from storage
router.get('/schemes', async (req, res) => {
  try {
    const dbSchemes = await database.findAllSchemes();
    
    // Enrich with blockchain data if available
    const enrichedSchemes = await Promise.all(
      dbSchemes.map(async (dbScheme) => {
        try {
          // Get live data from blockchain
          const blockchainScheme = await blockchainService.getScheme(parseInt(dbScheme.schemeId));
          
          // Merge database and blockchain data, with blockchain taking precedence for status
          return {
            ...dbScheme,
            isActive: blockchainScheme.isActive,
            currentBeneficiaries: blockchainScheme.currentBeneficiaries,
            amount: blockchainScheme.amount,
            // Keep database fields that blockchain doesn't have
            transactionHash: dbScheme.transactionHash,
            createdAt: dbScheme.createdAt
          };
        } catch (err) {
          console.log(`⚠️  Could not fetch blockchain data for scheme ${dbScheme.schemeId}:`, err.message);
          // Return database data with assumed active status
          return {
            ...dbScheme,
            isActive: true // Assume active if blockchain not available
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: enrichedSchemes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract statistics
router.get('/stats', async (req, res) => {
  try {
    let blockchainStats = {};
    let storageStats = {};
    
    // Try to get blockchain stats, but don't fail if RPC is down
    try {
      blockchainStats = await blockchainService.getStatistics();
    } catch (blockchainError) {
      console.warn('⚠️ Blockchain stats unavailable:', blockchainError.message);
      // Return 0s for blockchain stats if unavailable
      blockchainStats = {
        totalFarmers: 0,
        totalSchemes: 0,
        totalPayments: 0,
        totalDistributed: '0',
        contractBalance: '0'
      };
    }
    
    // Get database stats (should always work)
    try {
      storageStats = await database.getStats();
    } catch (dbError) {
      console.error('❌ Database stats error:', dbError.message);
    }
    
    res.json({
      success: true,
      data: {
        ...blockchainStats,
        ...storageStats,
        rpcAvailable: Object.keys(blockchainStats).length > 0 && blockchainStats.totalFarmers !== 0
      }
    });
  } catch (error) {
    // Return minimal stats instead of error
    res.json({
      success: true,
      data: {
        totalFarmers: 0,
        totalSchemes: 0,
        totalPayments: 0,
        totalDistributed: '0',
        contractBalance: '0',
        rpcAvailable: false
      }
    });
  }
});

// Get farmer details (combines blockchain and database data)
router.get('/farmer/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Get farmer from database
    const dbFarmer = await database.findFarmerByAddress(address.toLowerCase());
    
    // Try to get blockchain data
    let blockchainFarmer = null;
    try {
      blockchainFarmer = await blockchainService.getFarmer(address);
    } catch (blockchainError) {
      console.log('⚠️ Could not fetch blockchain data:', blockchainError.message);
    }
    
    // Merge data with database taking precedence for verification status
    const mergedFarmer = {
      ...blockchainFarmer,
      ...dbFarmer,
      address: address.toLowerCase(),
      // Show verification status from both sources
      isVerified: dbFarmer?.isVerified || blockchainFarmer?.isVerified || false,
      blockchainVerified: blockchainFarmer?.isVerified || false,
      databaseVerified: dbFarmer?.isVerified || false
    };
    
    res.json({
      success: true,
      data: mergedFarmer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scheme details
router.get('/scheme/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = await blockchainService.getScheme(parseInt(id));
    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment details
router.get('/payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await blockchainService.getPayment(parseInt(id));
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get farmer payment history
router.get('/farmer/:address/payments', async (req, res) => {
  try {
    const { address } = req.params;
    const paymentIds = await blockchainService.getFarmerPayments(address);
    
    // Get detailed payment information
    const payments = await Promise.all(
      paymentIds.map(async (id) => {
        const payment = await blockchainService.getPayment(parseInt(id));
        return { id, ...payment };
      })
    );

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scheme beneficiaries
router.get('/scheme/:id/beneficiaries', async (req, res) => {
  try {
    const { id } = req.params;
    const beneficiaries = await blockchainService.getSchemeBeneficiaries(parseInt(id));
    res.json({
      success: true,
      data: beneficiaries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register farmer (Protected - requires authentication and role verification)
// SECURITY: Changed to accept transaction hash instead of private key
router.post('/register-farmer',
  verifyToken,
  requireRole('government'),
  validationChains.registerFarmer,
  handleValidationErrors,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
      });
    }

    const { name, location, cropType, farmSize, transactionHash, farmerAddress } = req.body;
    
    // Validate Ethereum address format
    if (!ethers.isAddress(farmerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }
    
    let receipt = null;
    let mockMode = false;
    
    // Verify transaction on blockchain
    try {
      receipt = await blockchainService.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
      
      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain'
        });
      }
      
      // Verify transaction is to our contract
      if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Transaction is not for the subsidy contract'
        });
      }
      
    } catch (blockchainError) {
      console.log('⚠️  Blockchain not available, using mock mode:', blockchainError.message);
      mockMode = true;
      // Create mock receipt
      receipt = {
        hash: transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000),
        from: farmerAddress
      };
    }

    // Save to database with sanitized inputs
    const farmer = await database.saveFarmer({
      address: farmerAddress.toLowerCase(),
      name: name.trim(),
      location: location.trim(),
      cropType: cropType.trim(),
      farmSize: parseInt(farmSize),
      registrationTxHash: receipt.hash,
      isVerified: false,
      registeredAt: Math.floor(Date.now() / 1000),
      mockMode: mockMode
    });

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        farmerAddress: farmerAddress,
        farmerId: farmer._id,
        mockMode: mockMode,
        message: mockMode ? 'Registered in mock mode. Deploy contract to enable blockchain features.' : 'Successfully registered on blockchain'
      }
    });
  } catch (error) {
    console.error('❌ Error registering farmer:', error.message);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Failed to register farmer' : error.message
    });
  }
});

// Verify farmer (Protected - requires authentication and government role)
// SECURITY: Changed to accept transaction hash instead of private key
router.post('/verify-farmer',
  verifyToken,
  requireRole('government'),
  validationChains.verifyFarmer,
  handleValidationErrors,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
      });
    }

    const { farmerAddress, transactionHash } = req.body;
    
    // Validate Ethereum address format
    if (!ethers.isAddress(farmerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }
    
    let receipt = null;
    let mockMode = false;
    let alreadyVerified = false;
    
    // Verify transaction on blockchain
    try {
      receipt = await blockchainService.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
      
      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain'
        });
      }
      
      // Verify transaction is to our contract
      if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Transaction is not for the subsidy contract'
        });
      }
      
    } catch (blockchainError) {
      console.log('⚠️  Blockchain not available, using mock mode:', blockchainError.message);
      mockMode = true;
      receipt = {
        hash: transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000)
      };
    }

    // ALWAYS update database verification status
    const existingFarmer = await database.findFarmerByAddress(farmerAddress.toLowerCase());
    if (existingFarmer) {
      await database.saveFarmer({
        ...existingFarmer,
        isVerified: true,
        verifiedAt: Math.floor(Date.now() / 1000)
      });
      console.log(`✅ Database updated: Farmer ${farmerAddress} marked as verified`);
    } else {
      console.warn(`⚠️ Farmer ${farmerAddress} not found in database`);
    }

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mockMode: mockMode,
        message: mockMode 
          ? 'Verified in mock mode. Deploy contract to enable blockchain features.' 
          : 'Successfully verified on blockchain'
      }
    });
  } catch (error) {
    console.error('❌ Error verifying farmer:', error.message);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Failed to verify farmer' : error.message
    });
  }
});

// Create subsidy scheme (Protected - requires authentication and government role)
// SECURITY: Changed to accept transaction hash instead of private key
router.post('/create-scheme',
  verifyToken,
  requireRole('government'),
  validationChains.createScheme,
  handleValidationErrors,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
      });
    }

    const { name, description, amount, maxBeneficiaries, expiryDate, transactionHash, creatorAddress, category } = req.body;
    
    // Validate Ethereum address format
    if (!ethers.isAddress(creatorAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }
    
    let receipt = null;
    let mockMode = false;
    let schemeId = null;
    
    // Verify transaction on blockchain
    try {
      receipt = await blockchainService.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
      
      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain'
        });
      }
      
      // Verify transaction is to our contract
      if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Transaction is not for the subsidy contract'
        });
      }
      
      console.log(`📝 Transaction receipt received:`, {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        logsCount: receipt.logs?.length || 0
      });
      
      // Extract scheme ID from SchemeCreated event
      const iface = new ethers.Interface([
        "event SchemeCreated(uint256 indexed schemeId, string name, uint256 amount, address creator)"
      ]);
      
      // Find the SchemeCreated event in the logs
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsed && parsed.name === 'SchemeCreated') {
              schemeId = parsed.args.schemeId.toString();
              console.log(`✅ Extracted scheme ID from blockchain event: ${schemeId}`);
              console.log(`   Scheme Name: ${parsed.args.name}`);
              console.log(`   Amount: ${ethers.formatEther(parsed.args.amount)} CELO`);
              break;
            }
          } catch (e) {
            // Not a SchemeCreated event, continue
          }
        }
      } else {
        console.warn('⚠️  No logs found in receipt');
      }
      
      // Fallback: If no event found, use the totalSchemes counter from stats
      if (!schemeId) {
        console.log('⚠️  Could not extract scheme ID from event, trying stats...');
        try {
          const stats = await blockchainService.getStatistics();
          schemeId = (parseInt(stats.totalSchemes) - 1).toString(); // Latest scheme ID
          console.log(`✅ Using scheme ID from stats: ${schemeId}`);
        } catch (err) {
          console.warn('⚠️  Could not get scheme ID from stats');
          schemeId = Date.now();
        }
      }
    } catch (blockchainError) {
      console.log('⚠️  Blockchain not available, using mock mode:', blockchainError.message);
      mockMode = true;
      receipt = {
        hash: transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000)
      };
      schemeId = Date.now();
    }

    // Save to database with sanitized inputs
    const scheme = await database.saveScheme({
      schemeId,
      name: name.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      maxBeneficiaries: parseInt(maxBeneficiaries),
      currentBeneficiaries: 0,
      expiryDate: parseInt(expiryDate),
      category: (category || 'General').trim(),
      isActive: true,
      createdBy: creatorAddress.toLowerCase(),
      transactionHash: receipt.hash,
      totalDisbursed: 0,
      mockMode: mockMode
    });

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        schemeId: scheme.schemeId,
        mockMode: mockMode,
        message: mockMode ? 'Scheme created in mock mode. Deploy contract to enable blockchain features.' : 'Successfully created on blockchain'
      }
    });
  } catch (error) {
    console.error('❌ Error creating scheme:', error.message);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Failed to create scheme' : error.message
    });
  }
});

// Pay subsidy (Protected - requires authentication and government role)
// SECURITY: Changed to accept transaction hash instead of private key
router.post('/pay-subsidy',
  verifyToken,
  requireRole('government'),
  validationChains.processPayment,
  handleValidationErrors,
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
      });
    }

    const { schemeId, farmerAddress, remarks, transactionHash } = req.body;
    
    // Validate Ethereum address format
    if (!ethers.isAddress(farmerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }
    
    // Verify transaction on blockchain
    let receipt;
    try {
      receipt = await blockchainService.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
      
      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain'
        });
      }
      
      // Verify transaction is to our contract
      if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Transaction is not for the subsidy contract'
        });
      }
    } catch (error) {
      console.error('❌ Error verifying transaction:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify transaction on blockchain'
      });
    }

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    });
  } catch (error) {
    console.error('❌ Error processing payment:', error.message);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Failed to process payment' : error.message
    });
  }
});

// Deposit funds (Protected - requires authentication and government role)
// SECURITY: Changed to accept transaction hash instead of private key
router.post('/deposit-funds',
  verifyToken,
  requireRole('government'),
  [
    body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be a positive number'),
    body('transactionHash').matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid transaction hash')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
      });
    }

    const { amount, transactionHash } = req.body;
    
    // Verify transaction on blockchain
    let receipt;
    try {
      receipt = await blockchainService.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
      
      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Transaction failed on blockchain'
        });
      }
      
      // Verify transaction is to our contract
      if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Transaction is not for the subsidy contract'
        });
      }
    } catch (error) {
      console.error('❌ Error verifying transaction:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify transaction on blockchain'
      });
    }

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    });
  } catch (error) {
    console.error('❌ Error depositing funds:', error.message);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Failed to deposit funds' : error.message
    });
  }
});

// Get transaction receipt
router.get('/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const receipt = await blockchainService.getTransactionReceipt(hash);
    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current block number
router.get('/block-number', async (req, res) => {
  try {
    const blockNumber = await blockchainService.getBlockNumber();
    res.json({
      success: true,
      data: { blockNumber }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all transactions (for public view)
router.get('/transactions', async (req, res) => {
  try {
    // Get farmers and schemes from database
    const farmers = await database.findAllFarmers();
    const schemes = await database.findAllSchemes();
    const payments = await database.findAllPayments();
    
    // Build transaction list from farmers and schemes
    const transactions = [];
    
    // Add farmer registrations
    farmers.forEach(farmer => {
      transactions.push({
        id: `farmer-${farmer.address}`,
        type: 'registration',
        timestamp: new Date(farmer.registeredAt).getTime() / 1000,
        address: farmer.address,
        name: farmer.name,
        location: farmer.location,
        isVerified: farmer.isVerified,
        txHash: farmer.registrationTxHash || 'N/A'
      });
    });
    
    // Add scheme creations
    schemes.forEach(scheme => {
      transactions.push({
        id: `scheme-${scheme._id}`,
        type: 'scheme',
        timestamp: new Date(scheme.createdAt).getTime() / 1000,
        schemeName: scheme.name,
        amount: scheme.amount,
        maxBeneficiaries: scheme.maxBeneficiaries,
        txHash: scheme.transactionHash || 'N/A'
      });
    });
    
    // Add payments
    payments.forEach(payment => {
      transactions.push({
        id: `payment-${payment._id}`,
        type: 'payment',
        timestamp: new Date(payment.timestamp).getTime() / 1000,
        farmer: payment.farmerAddress,
        farmerName: payment.farmerName,
        scheme: payment.schemeId,
        schemeName: payment.schemeName,
        amount: payment.amount,
        approver: payment.approver,
        remarks: payment.remarks,
        txHash: payment.transactionHash || 'N/A'
      });
    });
    
    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('❌ Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync blockchain data to storage (read from blockchain and save locally)
router.post('/sync-farmer/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log(`🔄 Syncing farmer ${address} from blockchain to database...`);
    
    // Read farmer data from blockchain
    const farmerData = await blockchainService.getFarmer(address);
    
    if (!farmerData || !farmerData.isActive) {
      console.log(`❌ Farmer ${address} not found or inactive on blockchain`);
      return res.status(404).json({
        success: false,
        error: 'Farmer not found on blockchain or is inactive'
      });
    }
    
    // Check if already in database
    const existing = await database.findFarmerByAddress(address.toLowerCase());
    
    let farmer;
    if (existing) {
      // Update existing farmer with blockchain data (especially verification status)
      console.log(`📝 Updating existing farmer ${address} with blockchain data...`);
      farmer = await database.saveFarmer({
        ...existing,
        name: farmerData.name || existing.name,
        location: farmerData.location || existing.location,
        cropType: farmerData.cropType || existing.cropType,
        farmSize: parseInt(farmerData.farmSize) || existing.farmSize,
        isVerified: farmerData.isVerified, // Always update verification from blockchain
        registeredAt: parseInt(farmerData.registrationDate) || existing.registeredAt
      });
      console.log(`✅ Farmer ${address} updated in database. Verified: ${farmerData.isVerified}`);
    } else {
      // Create new farmer record
      console.log(`➕ Creating new farmer record for ${address}...`);
      farmer = await database.saveFarmer({
        address: address.toLowerCase(),
        name: farmerData.name,
        location: farmerData.location,
        cropType: farmerData.cropType,
        farmSize: parseInt(farmerData.farmSize),
        isVerified: farmerData.isVerified,
        registeredAt: parseInt(farmerData.registrationDate),
        registrationTxHash: 'synced-from-blockchain'
      });
      console.log(`✅ Farmer ${address} successfully synced to database`);
    }
    
    res.json({
      success: true,
      data: farmer,
      message: 'Farmer synced from blockchain successfully'
    });
  } catch (error) {
    console.error('❌ Error syncing farmer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync farmer'
    });
  }
});

// Sync scheme data
router.post('/sync-scheme/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Syncing scheme ${id} from blockchain...`);
    
    // Read scheme from blockchain first
    const schemeData = await blockchainService.getScheme(parseInt(id));
    
    // Validate that we got real data from blockchain
    if (!schemeData || !schemeData.name || schemeData.name.trim() === '') {
      throw new Error('Invalid scheme data from blockchain - name is empty or missing');
    }
    
    if (!schemeData.amount || parseFloat(schemeData.amount) <= 0) {
      throw new Error('Invalid scheme data from blockchain - amount is zero or missing');
    }
    
    // Check if already in database
    const existing = await database.findSchemeById(parseInt(id));
    
    let scheme;
    if (existing) {
      // Update existing scheme with blockchain data (especially isActive status)
      console.log(`📝 Updating existing scheme ${id} with blockchain data...`);
      scheme = await database.saveScheme({
        ...existing,
        name: schemeData.name || existing.name,
        description: schemeData.description || existing.description,
        amount: parseFloat(schemeData.amount) || existing.amount,
        maxBeneficiaries: parseInt(schemeData.maxBeneficiaries) || existing.maxBeneficiaries,
        currentBeneficiaries: parseInt(schemeData.currentBeneficiaries) || existing.currentBeneficiaries,
        isActive: schemeData.isActive, // Always update from blockchain
        creator: schemeData.creator || existing.creator,
        expiryDate: parseInt(schemeData.expiryDate) || existing.expiryDate
      });
      console.log(`✅ Scheme ${id} updated. Active: ${schemeData.isActive}`);
    } else {
      // Create new scheme record
      console.log(`➕ Creating new scheme record for ${id}...`);
      scheme = await database.saveScheme({
          schemeId: parseInt(id),
        name: schemeData.name,
        description: schemeData.description,
        amount: parseFloat(schemeData.amount),
        maxBeneficiaries: parseInt(schemeData.maxBeneficiaries),
        currentBeneficiaries: parseInt(schemeData.currentBeneficiaries),
        isActive: schemeData.isActive,
        creator: schemeData.creator,
        expiryDate: parseInt(schemeData.expiryDate),
        transactionHash: 'synced-from-blockchain'
      });
      console.log(`✅ Scheme ${id} synced from blockchain`);
    }
    
    res.json({
      success: true,
      data: scheme,
      message: 'Scheme synced from blockchain'
    });
  } catch (error) {
    console.error('❌ Error syncing scheme:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual scheme save (for when schemeId is extracted but RPC is down)
router.post('/save-scheme', async (req, res) => {
  try {
    const { schemeId, name, description, amount, maxBeneficiaries, expiryDate, creator, transactionHash } = req.body;
    
    if (!schemeId || !name || !description || !amount || !maxBeneficiaries) {
      return res.status(400).json({
        success: false,
        error: 'Missing required scheme fields'
      });
    }
    
    // Check if already in database
    const existing = await database.findSchemeById(parseInt(schemeId));
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: 'Scheme already in database'
      });
    }
    
    // Save to database
    const scheme = await database.saveScheme({
      schemeId: parseInt(schemeId),
      name,
      description,
      amount: parseFloat(amount),
      maxBeneficiaries: parseInt(maxBeneficiaries),
      currentBeneficiaries: 0,
      isActive: true,
      creator: creator || 'unknown',
      expiryDate: parseInt(expiryDate),
      transactionHash: transactionHash || 'manual-entry'
    });
    
    console.log(`✅ Scheme ${schemeId} manually saved to database`);
    
    res.json({
      success: true,
      data: scheme,
      message: 'Scheme saved to database'
    });
  } catch (error) {
    console.error('❌ Error saving scheme:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync all farmers from blockchain to database
router.post('/sync-all-farmers', async (req, res) => {
  try {
    console.log('🔄 Starting bulk farmer sync from blockchain...');
    
    // Get total farmers from blockchain
    const stats = await blockchainService.getStatistics();
    const totalFarmers = parseInt(stats.totalFarmers);
    
    console.log(`📊 Found ${totalFarmers} farmers on blockchain`);
    
    if (totalFarmers === 0) {
      return res.json({
        success: true,
        message: 'No farmers found on blockchain',
        synced: 0
      });
    }
    
    // Get all farmer addresses from blockchain events or iterate through farmers
    // For now, we'll use a workaround - get farmers from FarmerRegistered events
    const syncedFarmers = [];
    const errors = [];
    
    // Try to get farmers from blockchain contract
    // Note: This assumes your contract has a way to enumerate farmers
    // If not, we'll need farmer addresses from the frontend
    
    try {
      // Attempt to get farmer list from contract
      // This is a placeholder - adjust based on your contract's actual method
      for (let i = 0; i < totalFarmers; i++) {
        try {
          // If your contract has getFarmerByIndex or similar
          // const farmer = await blockchainService.getFarmerByIndex(i);
          // For now, skip this as we need addresses
          console.log(`⚠️ Cannot enumerate farmers - addresses needed`);
          break;
        } catch (err) {
          errors.push(`Farmer index ${i}: ${err.message}`);
        }
      }
    } catch (enumError) {
      console.log('⚠️ Blockchain enumeration not available');
    }
    
    res.json({
      success: true,
      message: `Sync initiated. Found ${totalFarmers} farmers on blockchain. Use /sync-farmer/:address for individual sync.`,
      totalOnChain: totalFarmers,
      synced: syncedFarmers.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Error bulk syncing farmers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk sync farmers'
    });
  }
});

// Auto-sync all farmers from blockchain events to database
router.post('/auto-sync-farmers', async (req, res) => {
  try {
    console.log('🔄 Starting auto-sync of all farmers from blockchain...');
    
    const syncedFarmers = [];
    const errors = [];
    
    // Get farmer registration events from blockchain
    try {
      const contract = blockchainService.contract;
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      // Get FarmerRegistered events
      const filter = contract.filters.FarmerRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log(`📊 Found ${events.length} farmer registration events on blockchain`);
      
      for (const event of events) {
        try {
          const farmerAddress = event.args[0]; // farmer address
          const farmerName = event.args[1]; // name
          
          console.log(`🔄 Syncing farmer: ${farmerName} (${farmerAddress})`);
          
          // Check if already in database
          const existing = await database.findFarmerByAddress(farmerAddress);
          if (existing) {
            console.log(`   ⏭️  Already in database, skipping`);
            continue;
          }
          
          // Get full farmer data from blockchain
          const farmerData = await blockchainService.getFarmer(farmerAddress);
          
          if (!farmerData.isActive) {
            console.log(`   ⚠️  Farmer inactive, skipping`);
            continue;
          }
          
          // Save to database
          await database.saveFarmer({
            address: farmerAddress,
            name: farmerData.name,
            location: farmerData.location,
            cropType: farmerData.cropType,
            farmSize: parseInt(farmerData.farmSize),
            isVerified: farmerData.isVerified,
            registeredAt: parseInt(farmerData.registrationDate),
            registrationTxHash: event.transactionHash
          });
          
          syncedFarmers.push({
            address: farmerAddress,
            name: farmerData.name
          });
          
          console.log(`   ✅ Synced successfully`);
        } catch (syncError) {
          console.error(`   ❌ Error syncing farmer:`, syncError.message);
          errors.push({
            address: event.args[0],
            error: syncError.message
          });
        }
      }
      
      res.json({
        success: true,
        message: `Auto-sync completed. Synced ${syncedFarmers.length} farmers.`,
        totalEvents: events.length,
        synced: syncedFarmers,
        syncedCount: syncedFarmers.length,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (eventError) {
      console.error('❌ Error fetching blockchain events:', eventError);
      
      // If RPC is down, suggest manual registration
      res.status(503).json({
        success: false,
        error: `Blockchain RPC connection failed: ${eventError.message}`,
        suggestion: 'The Celo Alfajores RPC endpoint may be temporarily unavailable. Please try again later or use manual farmer registration.',
        rpcEndpoint: process.env.BLOCKCHAIN_NETWORK
      });
    }
    
  } catch (error) {
    console.error('❌ Error in auto-sync:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-sync farmers'
    });
  }
});

// Manual sync endpoint - add farmers to database without blockchain verification
router.post('/manual-add-farmer', async (req, res) => {
  try {
    const { address, name, location, cropType, farmSize } = req.body;
    
    // Validation
    if (!address || !name || !location || !cropType || !farmSize) {
      return res.status(400).json({
        success: false,
        error: 'All farmer fields are required'
      });
    }
    
    // Check if already exists
    const existing = await database.findFarmerByAddress(address);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Farmer already exists in database'
      });
    }
    
    // Save to database
    await database.saveFarmer({
      address,
      name,
      location,
      cropType,
      farmSize: parseInt(farmSize),
      isVerified: false,
      registeredAt: Date.now(),
      registrationTxHash: 'manual-entry'
    });
    
    res.json({
      success: true,
      message: 'Farmer added to database successfully',
      farmer: { address, name }
    });
  } catch (error) {
    console.error('❌ Error in manual add:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete scheme from database (for testing/cleanup)
router.delete('/scheme/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if scheme exists
    const existing = await database.findSchemeById(parseInt(id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found'
      });
    }
    
    // Delete from database
    await database.deleteScheme(parseInt(id));
    
    console.log(`✅ Scheme ${id} deleted from database`);
    
    res.json({
      success: true,
      message: `Scheme ${id} deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting scheme:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
