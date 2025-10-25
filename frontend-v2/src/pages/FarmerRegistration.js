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
  MenuItem
} from '@mui/material';
import { Agriculture } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';
import { blockchainAPI } from '../services/api';

const FarmerRegistration = () => {
  const navigate = useNavigate();
  const { account, isConnected, isConnectedToCelo } = useWeb3();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    cropType: '',
    farmSize: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const cropTypes = [
    'Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean', 
    'Pulses', 'Vegetables', 'Fruits', 'Spices', 'Other'
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
      const { name, location, cropType, farmSize } = formData;
      
      if (!name || !location || !cropType || !farmSize) {
        throw new Error('Please fill in all required fields');
      }

      // Check MetaMask connection
      if (!isConnected) {
        throw new Error('Please connect your MetaMask wallet first');
      }

      if (!isConnectedToCelo) {
        throw new Error('Please switch to Celo Alfajores network in MetaMask');
      }

      if (!metaMaskContractService.isInitialized()) {
        throw new Error('Contract service not initialized');
      }

      // Register using MetaMask
      const result = await metaMaskContractService.registerFarmer(
        name,
        location,
        cropType,
        parseInt(farmSize)
      );

      console.log('✅ Blockchain registration successful:', result.transactionHash);
      setSuccess(`✅ Farmer registered successfully on Celo blockchain! Transaction hash: ${result.transactionHash}`);
      
      // Sync farmer to backend storage - CRITICAL STEP
      console.log('🔄 Syncing farmer to backend database...');
      try {
        const syncResponse = await blockchainAPI.syncFarmer(account);
        console.log('✅ Farmer synced to database:', syncResponse.data);
        setSuccess(`✅ Registration complete! Your profile has been saved. Redirecting to dashboard...`);
      } catch (syncError) {
        console.error('❌ Failed to sync farmer to database:', syncError);
        setError(`⚠️ Blockchain registration succeeded, but failed to sync to database. Please refresh the farmer dashboard to retry sync. Error: ${syncError.response?.data?.error || syncError.message}`);
        return; // Don't redirect if sync failed
      }
      
      // Clear form
      setFormData({
        name: '',
        location: '',
        cropType: '',
        farmSize: ''
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/farmer-dashboard');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to register farmer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Agriculture sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            Farmer Registration
          </Typography>
        </Box>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Register your profile to receive government subsidies through our transparent blockchain system.
          All transactions are signed securely through MetaMask.
        </Typography>

        {isConnected && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Connected: {account?.substring(0, 6)}...{account?.substring(38)}
          </Alert>
        )}

        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ Please connect your MetaMask wallet to register as a farmer.
          </Alert>
        )}

        {isConnected && !isConnectedToCelo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            ℹ️ Please switch to Celo Alfajores network (Chain ID: 44787) in MetaMask to complete registration.
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Village, District, State"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Primary Crop Type</InputLabel>
                <Select
                  name="cropType"
                  value={formData.cropType}
                  onChange={handleChange}
                  label="Primary Crop Type"
                >
                  {cropTypes.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Farm Size (acres)"
                name="farmSize"
                type="number"
                value={formData.farmSize}
                onChange={handleChange}
                required
                placeholder="Enter farm size in acres"
                inputProps={{ min: 0.1, step: 0.1 }}
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
                  {loading ? 'Registering...' : 'Register with MetaMask'}
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Next Steps:
          </Typography>
          <Typography variant="body2" paragraph>
            1. After registration, your profile will be pending verification
          </Typography>
          <Typography variant="body2" paragraph>
            2. Government officials will verify your details
          </Typography>
          <Typography variant="body2" paragraph>
            3. Once verified, you can receive subsidies for eligible schemes
          </Typography>
          <Typography variant="body2">
            4. All transactions will be recorded on the blockchain for transparency
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default FarmerRegistration;
