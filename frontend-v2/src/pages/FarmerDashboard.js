import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { blockchainAPI } from '../services/api';
import {
  Agriculture,
  AccountBalance,
  Verified,
  Pending,
  Upload,
  Description,
  Delete,
  CloudUpload
} from '@mui/icons-material';

const FarmerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [newDoc, setNewDoc] = useState({ type: '', file: null, fileName: '' });

  useEffect(() => {
    loadFarmerData();
    // Load saved documents from localStorage
    const saved = localStorage.getItem(`documents_${user?.walletAddress}`);
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
  }, [user]);

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get farmer profile from backend database
      if (user?.walletAddress) {
        try {
          console.log('🔍 Fetching all farmers from database...');
          const farmersResponse = await blockchainAPI.getAllFarmers();
          const allFarmers = farmersResponse.data.data || farmersResponse.data || [];
          
          // Find current user's profile
          const myProfile = allFarmers.find(
            f => f.address.toLowerCase() === user.walletAddress.toLowerCase()
          );
          
          if (myProfile) {
            console.log('✅ Profile found in database:', myProfile);
            setProfile(myProfile);
          } else {
            console.log('⚠️ Profile not found in database, attempting to sync from blockchain...');
            // Try to sync from blockchain
            try {
              const syncResponse = await blockchainAPI.syncFarmer(user.walletAddress);
              if (syncResponse.data.data) {
                setProfile(syncResponse.data.data);
                console.log('✅ Profile synced from blockchain');
              }
            } catch (syncErr) {
              console.log('❌ Sync failed, farmer may not be registered yet:', syncErr.message);
              setError('You are not registered yet. Please complete farmer registration first.');
            }
          }
        } catch (err) {
          console.error('❌ Error fetching farmer profile:', err);
          setError('Failed to load your profile. Please try again or complete registration.');
        }

        // Get payment history
        try {
          const paymentsResponse = await blockchainAPI.getFarmerPayments(user.walletAddress);
          setPayments(paymentsResponse.data || []);
        } catch (err) {
          console.log('No payment history yet:', err.message);
          setPayments([]);
        }
      }
    } catch (err) {
      setError('Failed to load farmer data: ' + err.message);
      console.error('❌ Error loading farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      setNewDoc({ ...newDoc, file, fileName: file.name });
    }
  };

  const handleUploadDocument = () => {
    if (!newDoc.type || !newDoc.file) {
      setError('Please select document type and file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const doc = {
        id: Date.now(),
        type: newDoc.type,
        fileName: newDoc.fileName,
        fileData: e.target.result,
        uploadedAt: new Date().toISOString(),
        status: 'Pending Review'
      };

      const updatedDocs = [...documents, doc];
      setDocuments(updatedDocs);
      localStorage.setItem(`documents_${user?.walletAddress}`, JSON.stringify(updatedDocs));
      
      setSuccess(`${newDoc.type} uploaded successfully!`);
      setNewDoc({ type: '', file: null, fileName: '' });
      setOpenDocDialog(false);
    };
    reader.readAsDataURL(newDoc.file);
  };

  const handleDeleteDocument = (docId) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    setDocuments(updatedDocs);
    localStorage.setItem(`documents_${user?.walletAddress}`, JSON.stringify(updatedDocs));
    setSuccess('Document deleted successfully');
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Farmer Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome, {profile?.name || user?.walletAddress || 'Farmer'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {!profile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You haven't registered yet. <Button color="primary" onClick={() => navigate('/register-farmer')}>Register Now</Button>
        </Alert>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="h5" color={profile?.isVerified ? 'success.main' : 'warning.main'}>
                    {profile?.isVerified ? 'Verified' : 'Pending'}
                  </Typography>
                </Box>
                {profile?.isVerified ? (
                  <Verified sx={{ fontSize: 50, color: 'success.main' }} />
                ) : (
                  <Pending sx={{ fontSize: 50, color: 'warning.main' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary">
                    Farm Size
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {profile?.farmSize || 0} acres
                  </Typography>
                </Box>
                <Agriculture sx={{ fontSize: 50, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary">
                    Total Payments
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {payments.length}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 50, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary">
                    Total Received
                  </Typography>
                  <Typography variant="h5" color="info.main">
                    ${payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 50, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Farmer Profile */}
      {profile && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Profile
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{profile.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Location</Typography>
                <Typography variant="body1">{profile.location}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Crop Type</Typography>
                <Typography variant="body1">{profile.cropType}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Wallet Address</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {profile.address}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              My Documents
            </Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setOpenDocDialog(true)}
            >
              Upload Document
            </Button>
          </Box>

          {documents.length === 0 ? (
            <Alert severity="info">
              No documents uploaded yet. Please upload your Aadhaar Card and Farmer Certificate for verification.
            </Alert>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleDeleteDocument(doc.id)}>
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Description color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.type}
                    secondary={`${doc.fileName} - Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()} - Status: ${doc.status}`}
                  />
                  <Chip 
                    label={doc.status} 
                    color={doc.status === 'Approved' ? 'success' : 'warning'} 
                    size="small"
                    sx={{ mr: 2 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment History
          </Typography>
          {payments.length === 0 ? (
            <Alert severity="info">
              No payments received yet. Wait for government to process subsidy payments.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payment ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scheme</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{payment.schemeId || 'N/A'}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>
                        <Chip label={payment.status || 'Completed'} color="success" size="small" />
                      </TableCell>
                      <TableCell>
                        {payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={openDocDialog} onClose={() => setOpenDocDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              fullWidth
              label="Document Type"
              value={newDoc.type}
              onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="">Select Document Type</option>
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Farmer Certificate">Farmer Certificate</option>
              <option value="Land Records">Land Records</option>
              <option value="Bank Passbook">Bank Passbook</option>
              <option value="Other">Other</option>
            </TextField>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              {newDoc.fileName || 'Choose File (PDF, JPG, PNG - Max 5MB)'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
            </Button>

            {newDoc.fileName && (
              <Alert severity="success" sx={{ mt: 1 }}>
                File selected: {newDoc.fileName}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDocDialog(false);
            setNewDoc({ type: '', file: null, fileName: '' });
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained"
            disabled={!newDoc.type || !newDoc.file}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FarmerDashboard;
