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
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Payment, Send, CheckCircle, AccountBalanceWallet } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';
import { ethers } from 'ethers';

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const { account, isConnected, isConnectedToCelo } = useWeb3();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    schemeId: '',
    farmerAddress: '',
    remarks: ''
  });
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [schemeDetails, setSchemeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const steps = ['Enter Details', 'Verify Information', 'Process Payment'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const loadFarmerDetails = async () => {
    if (!formData.farmerAddress) return;
    
    try {
      // Load farmer details from blockchain using MetaMask
      if (!metaMaskContractService.isInitialized()) {
        throw new Error('MetaMask contract service not initialized');
      }

      const farmer = await metaMaskContractService.getFarmer(formData.farmerAddress);
      setFarmerDetails(farmer);
    } catch (err) {
      console.error('Failed to load farmer details:', err);
      setError('Failed to load farmer details: ' + err.message);
    }
  };

  const loadSchemeDetails = async () => {
    if (!formData.schemeId) return;
    
    try {
      // Load scheme details from blockchain using MetaMask
      if (!metaMaskContractService.isInitialized()) {
        throw new Error('MetaMask contract service not initialized');
      }

      const scheme = await metaMaskContractService.getScheme(parseInt(formData.schemeId));
      setSchemeDetails(scheme);
    } catch (err) {
      console.error('Failed to load scheme details:', err);
      setError('Failed to load scheme details: ' + err.message);
    }
  };

  const handleNext = async () => {
    setError('');
    
    if (activeStep === 0) {
      // Load details for verification
      await loadFarmerDetails();
      await loadSchemeDetails();
      setActiveStep(1);
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
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
        throw new Error('Contract service not initialized. Please refresh the page.');
      }

      // Validate farmer is verified
      if (!farmerDetails?.isVerified) {
        throw new Error('Farmer must be verified before receiving payment');
      }

      // Validate scheme is active
      if (!schemeDetails?.isActive) {
        throw new Error('Scheme is not active');
      }

      console.log('Processing payment with MetaMask...');
      console.log('Scheme ID:', formData.schemeId);
      console.log('Farmer Address:', formData.farmerAddress);
      console.log('Remarks:', formData.remarks || 'No remarks');

      // Process payment using MetaMask (user will sign the transaction)
      const result = await metaMaskContractService.paySubsidy(
        parseInt(formData.schemeId),
        formData.farmerAddress,
        formData.remarks || 'Subsidy payment'
      );
      
      setSuccess(`✅ Payment processed successfully!\n\nTransaction Hash: ${result.transactionHash}\nBlock Number: ${result.blockNumber}\n\nAmount: ${schemeDetails.amount} CELO sent to ${formData.farmerAddress}`);
      
      // Reset form after successful payment
      setTimeout(() => {
        setActiveStep(0);
        setFormData({
          schemeId: '',
          farmerAddress: '',
          remarks: ''
        });
        setFarmerDetails(null);
        setSchemeDetails(null);
      }, 5000);

    } catch (err) {
      console.error('Payment error:', err);
      let errorMessage = err.message || 'Failed to process payment';
      
      // Provide helpful error messages
      if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient CELO in contract or your wallet for gas fees';
      } else if (errorMessage.includes('already received')) {
        errorMessage = 'Farmer has already received payment from this scheme';
      } else if (errorMessage.includes('Scheme beneficiary limit reached')) {
        errorMessage = 'This scheme has reached its maximum number of beneficiaries';
      } else if (errorMessage.includes('Scheme expired')) {
        errorMessage = 'This scheme has expired';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Wallet Connection Status */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: isConnected && isConnectedToCelo ? 'success.50' : 'warning.50' }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AccountBalanceWallet sx={{ mr: 2, fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6">
                        {isConnected ? '✅ Wallet Connected' : '⚠️ Wallet Not Connected'}
                      </Typography>
                      {isConnected && (
                        <>
                          <Typography variant="body2">
                            Address: {account}
                          </Typography>
                          <Typography variant="body2" color={isConnectedToCelo ? 'success.main' : 'error.main'}>
                            Network: {isConnectedToCelo ? '✅ Celo Alfajores' : '❌ Wrong Network'}
                          </Typography>
                        </>
                      )}
                      {!isConnected && (
                        <Typography variant="body2" color="error">
                          Please connect your MetaMask wallet to continue
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scheme ID"
                name="schemeId"
                type="number"
                value={formData.schemeId}
                onChange={handleChange}
                required
                placeholder="1"
                helperText="Enter the subsidy scheme ID"
                disabled={!isConnected || !isConnectedToCelo}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Farmer Wallet Address"
                name="farmerAddress"
                value={formData.farmerAddress}
                onChange={handleChange}
                required
                placeholder="0x..."
                helperText="Verified farmer's wallet address"
                disabled={!isConnected || !isConnectedToCelo}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Payment description or notes..."
                helperText="Optional remarks for the payment"
                disabled={!isConnected || !isConnectedToCelo}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>🔐 Secure Payment Process:</strong><br/>
                  • No private keys required - payments are signed directly in MetaMask<br/>
                  • You will be prompted to sign the transaction<br/>
                  • Make sure you have enough CELO for gas fees<br/>
                  • The contract must have sufficient balance to pay the farmer
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            {/* Farmer Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Farmer Details
                  </Typography>
                  {farmerDetails ? (
                    <>
                      <Typography variant="body2" paragraph>
                        <strong>Name:</strong> {farmerDetails.name || 'Not registered'}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Location:</strong> {farmerDetails.location || 'N/A'}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Crop Type:</strong> {farmerDetails.cropType || 'N/A'}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Farm Size:</strong> {farmerDetails.farmSize || 'N/A'} acres
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Verified:</strong> {farmerDetails.isVerified ? '✅ Yes' : '❌ No'}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Total Received:</strong> {farmerDetails.totalSubsidyReceived || '0'} CELO
                      </Typography>
                      <Typography variant="body2" color={farmerDetails.isVerified ? 'success.main' : 'error.main'}>
                        {farmerDetails.isVerified ? '✅ Verified - Eligible for payment' : '❌ Not verified - Cannot receive payment'}
                      </Typography>
                    </>
                  ) : (
                    <Typography color="error">
                      Failed to load farmer details
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Scheme Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Scheme Details
                  </Typography>
                  {schemeDetails ? (
                    <>
                      <Typography variant="body2" paragraph>
                        <strong>Name:</strong> {schemeDetails.name}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Amount:</strong> {schemeDetails.amount} CELO
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Beneficiaries:</strong> {schemeDetails.currentBeneficiaries}/{schemeDetails.maxBeneficiaries}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Active:</strong> {schemeDetails.isActive ? '✅ Yes' : '❌ No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Expires:</strong> {new Date(parseInt(schemeDetails.expiryDate) * 1000).toLocaleDateString()}
                      </Typography>
                    </>
                  ) : (
                    <Typography color="error">
                      Failed to load scheme details
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Payment Summary */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Summary
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Amount to Transfer:</strong> {schemeDetails?.amount || '0'} CELO
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>From Contract to:</strong> {formData.farmerAddress}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This payment will be processed immediately and recorded on the blockchain for transparency.
                    You will need to sign the transaction in MetaMask.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ready to Process Payment
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Click the button below to send {schemeDetails?.amount || '0'} CELO to the farmer.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Payment Details:</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              • Scheme: {schemeDetails?.name}<br/>
              • Farmer: {farmerDetails?.name}<br/>
              • Amount: {schemeDetails?.amount} CELO<br/>
              • Remarks: {formData.remarks || 'No remarks'}
            </Typography>
            <Typography variant="body2" color="warning.main">
              ⚠️ This action cannot be undone. Please verify all details are correct.
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ mt: 2 }}>
              💡 You will be prompted to sign the transaction in MetaMask.
            </Typography>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Payment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            Process Subsidy Payment
          </Typography>
        </Box>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Send subsidy payments directly to verified farmers through the blockchain.
        </Typography>

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

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
          
          <Box>
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!formData.schemeId || !formData.farmerAddress || !isConnected || !isConnectedToCelo}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={loading || !isConnected || !isConnectedToCelo}
                startIcon={<Send />}
              >
                {loading ? 'Processing...' : 'Process Payment'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentProcessing;
