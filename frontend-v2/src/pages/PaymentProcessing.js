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
import { Payment, Send, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { blockchainAPI } from '../services/api';

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    schemeId: '',
    farmerAddress: '',
    remarks: '',
    privateKey: ''
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
      const response = await blockchainAPI.getFarmer(formData.farmerAddress);
      setFarmerDetails(response.data.data);
    } catch (err) {
      setError('Failed to load farmer details');
    }
  };

  const loadSchemeDetails = async () => {
    if (!formData.schemeId) return;
    
    try {
      const response = await blockchainAPI.getScheme(parseInt(formData.schemeId));
      setSchemeDetails(response.data.data);
    } catch (err) {
      setError('Failed to load scheme details');
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
      if (!formData.privateKey) {
        throw new Error('Private key is required to process payment');
      }

      const paymentData = {
        schemeId: parseInt(formData.schemeId),
        farmerAddress: formData.farmerAddress,
        remarks: formData.remarks,
        privateKey: formData.privateKey
      };

      const response = await blockchainAPI.paySubsidy(paymentData);
      
      setSuccess(`Payment processed successfully! Transaction hash: ${response.data.data.transactionHash}`);
      setActiveStep(0);
      
      // Clear form
      setFormData({
        schemeId: '',
        farmerAddress: '',
        remarks: '',
        privateKey: ''
      });
      setFarmerDetails(null);
      setSchemeDetails(null);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Private Key"
                name="privateKey"
                type="password"
                value={formData.privateKey}
                onChange={handleChange}
                required
                placeholder="Your private key for signing the transaction"
                helperText="Required to authorize the payment"
              />
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
                      <Typography variant="body2">
                        <strong>Total Received:</strong> {farmerDetails.totalSubsidyReceived} ETH
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
                        <strong>Amount:</strong> {schemeDetails.amount} ETH
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Beneficiaries:</strong> {schemeDetails.currentBeneficiaries}/{schemeDetails.maxBeneficiaries}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Active:</strong> {schemeDetails.isActive ? '✅ Yes' : '❌ No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Expires:</strong> {new Date(schemeDetails.expiryDate * 1000).toLocaleDateString()}
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
                    <strong>Amount to Transfer:</strong> {schemeDetails?.amount || '0'} ETH
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This payment will be processed immediately and recorded on the blockchain for transparency.
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
              Click the button below to send {schemeDetails?.amount || '0'} ETH to the farmer.
            </Typography>
            <Typography variant="body2" color="warning.main">
              This action cannot be undone. Please verify all details are correct.
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
                disabled={!formData.schemeId || !formData.farmerAddress}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={loading}
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
