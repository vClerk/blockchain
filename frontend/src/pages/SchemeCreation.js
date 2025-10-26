import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { AccountBalance, CalendarToday, People, AttachMoney } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';
import { blockchainAPI } from '../services/api';

const SchemeCreation = () => {
  const navigate = useNavigate();
  const { account, isConnected, isConnectedToCelo } = useWeb3();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    maxBeneficiaries: '',
    expiryDate: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Crop Support',
    'Irrigation',
    'Seeds & Fertilizers',
    'Equipment Purchase',
    'Organic Farming',
    'Crop Insurance',
    'Disaster Relief',
    'Technology Adoption',
    'Training & Development',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check MetaMask connection
      if (!isConnected) {
        throw new Error('Please connect your MetaMask wallet');
      }

      if (!isConnectedToCelo) {
        throw new Error('Please switch to Celo Alfajores network in MetaMask');
      }

      if (!metaMaskContractService.isInitialized()) {
        throw new Error('Contract service not initialized');
      }

      const expiryTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
      
      // Create scheme using MetaMask
      const result = await metaMaskContractService.createSubsidyScheme(
        formData.name,
        formData.description,
        parseFloat(formData.amount),
        parseInt(formData.maxBeneficiaries),
        expiryTimestamp
      );
      
      setSuccess(`✅ Scheme created successfully on Celo blockchain! Transaction hash: ${result.transactionHash}`);
      
      console.log('📋 Full transaction result:', result);
      
      // Extract schemeId from the result (now returned by metamask service)
      let schemeId = result.schemeId;
      
      if (schemeId) {
        console.log('✅ Scheme ID from transaction:', schemeId);
      } else {
        // Fallback: try to extract from receipt logs if not provided
        console.warn('⚠️ Scheme ID not in result, trying to extract from logs...');
        
        if (result.receipt && result.receipt.logs && result.receipt.logs.length > 0) {
          const schemeLog = result.receipt.logs.find(log => log.topics && log.topics.length > 1);
          if (schemeLog && schemeLog.topics && schemeLog.topics.length > 1) {
            // SchemeId is the first indexed parameter in topics[1]
            schemeId = parseInt(schemeLog.topics[1], 16);
            console.log('📌 Extracted schemeId from logs:', schemeId);
          }
        }
        
        // Last resort: use timestamp (this should rarely happen now)
        if (!schemeId && schemeId !== 0) {
          console.error('❌ Could not extract schemeId from transaction!');
          throw new Error('Failed to get scheme ID from blockchain. Please try again.');
        }
      }
      
      // Save scheme to database with all details
      try {
        console.log(`🔄 Syncing scheme ${schemeId} to database...`);
        
        // Wait a moment for blockchain to update
        console.log('⏳ Waiting for blockchain confirmation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try blockchain sync first (with retry)
        let syncSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`📡 Sync attempt ${attempt}/3...`);
            await blockchainAPI.syncScheme(schemeId);
            console.log(`✅ Scheme ${schemeId} synced from blockchain`);
            syncSuccess = true;
            break;
          } catch (blockchainSyncError) {
            console.warn(`⚠️ Sync attempt ${attempt} failed:`, blockchainSyncError.message);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
        
        // If all sync attempts failed, try manual save
        if (!syncSuccess) {
          console.warn('⚠️ All blockchain sync attempts failed, trying manual save...');
          
          // Manual save to database
          const schemeData = {
            schemeId: schemeId,
            name: formData.name,
            description: formData.description,
            amount: parseFloat(formData.amount),
            maxBeneficiaries: parseInt(formData.maxBeneficiaries),
            currentBeneficiaries: 0,
            isActive: true, // Set as active since we just created it
            creator: account,
            expiryDate: expiryTimestamp,
            transactionHash: result.transactionHash
          };
          
          await blockchainAPI.saveScheme(schemeData);
          console.log(`✅ Scheme ${schemeId} manually saved to database with isActive=true`);
        }
      } catch (syncError) {
        console.error('❌ Failed to sync scheme to storage:', syncError);
        setError(`Scheme created on blockchain but failed to save to database: ${syncError.message}`);
        return;
      }
      
      setSuccess(`✅ Scheme created and saved successfully! Transaction: ${result.transactionHash.substring(0, 10)}...`);
      
      // Clear form
      setFormData({
        name: '',
        description: '',
        amount: '',
        maxBeneficiaries: '',
        expiryDate: '',
        category: ''
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/government-dashboard');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Failed to create scheme');
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            Create Subsidy Scheme
          </Typography>
        </Box>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Create a new subsidy scheme to support farmers with transparent blockchain-based payments.
          All transactions are signed securely through MetaMask.
        </Typography>

        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ Please connect your MetaMask wallet to create schemes.
          </Alert>
        )}

        {isConnected && !isConnectedToCelo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            ℹ️ Please switch to Celo Alfajores network (Chain ID: 44787) in MetaMask.
          </Alert>
        )}

        {isConnected && isConnectedToCelo && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Connected: {account?.substring(0, 6)}...{account?.substring(38)} on Celo Alfajores
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scheme Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Rice Cultivation Support 2024"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={3}
                placeholder="Detailed description of the subsidy scheme, eligibility criteria, and objectives"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subsidy Amount per Farmer"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                      ETH
                    </InputAdornment>
                  ),
                }}
                placeholder="5.0"
                inputProps={{ min: 0.1, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Beneficiaries"
                name="maxBeneficiaries"
                type="number"
                value={formData.maxBeneficiaries}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <People />
                    </InputAdornment>
                  ),
                }}
                placeholder="100"
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: today }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !isConnected || !isConnectedToCelo}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Creating Scheme...' : 'Create Scheme with MetaMask'}
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/government-dashboard')}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Calculation Summary */}
        {formData.amount && formData.maxBeneficiaries && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Scheme Summary:
            </Typography>
            <Typography variant="body2" paragraph>
              Total Budget Required: {(parseFloat(formData.amount || 0) * parseInt(formData.maxBeneficiaries || 0)).toFixed(2)} ETH
            </Typography>
            <Typography variant="body2" paragraph>
              Per Farmer: {formData.amount} ETH
            </Typography>
            <Typography variant="body2">
              Maximum Beneficiaries: {formData.maxBeneficiaries} farmers
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SchemeCreation;
