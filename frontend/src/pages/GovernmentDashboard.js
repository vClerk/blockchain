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
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { blockchainAPI } from '../services/api';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';
import {
  Agriculture,
  CheckCircle,
  PendingActions,
  Refresh,
  Sync,
  Dashboard as DashboardIcon,
  People,
  AccountBalance,
  Payment,
  Description,
  Visibility,
  Close,
  Download,
  ToggleOn,
  ToggleOff
} from '@mui/icons-material';

const GovernmentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { account, isConnected, isConnectedToCelo, connectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState(0);
  const [farmers, setFarmers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [togglingScheme, setTogglingScheme] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [farmerDocuments, setFarmerDocuments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load farmers, schemes and stats in parallel
      const [farmersRes, schemesRes, statsRes] = await Promise.all([
        blockchainAPI.getAllFarmers(),
        blockchainAPI.getAllSchemes(),
        blockchainAPI.getStats().catch(() => ({ data: null })) // Don't fail if stats unavailable
      ]);
      
      const farmersData = farmersRes.data?.data || farmersRes.data || [];
      setFarmers(Array.isArray(farmersData) ? farmersData : []);
      
      const schemesData = schemesRes.data?.data || schemesRes.data || [];
      setSchemes(Array.isArray(schemesData) ? schemesData : []);
      
      setStats(statsRes.data?.data || statsRes.data || null);
      
      // Auto-sync if database is empty and blockchain has farmers
      if (farmersData.length === 0 && !sessionStorage.getItem('autoSyncAttempted')) {
        console.log('📊 Database empty - attempting auto-sync...');
        sessionStorage.setItem('autoSyncAttempted', 'true');
        
        setTimeout(async () => {
          try {
            const syncRes = await blockchainAPI.autoSyncFarmers();
            if (syncRes.data.success && syncRes.data.syncedCount > 0) {
              console.log(`✅ Auto-synced ${syncRes.data.syncedCount} farmers`);
              await loadDashboardData(); // Reload all data
            }
          } catch (err) {
            console.log('⚠️ Auto-sync failed:', err.message);
          }
        }, 1000);
      }
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
      console.error('❌ Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFarmer = async (farmerAddress) => {
    try {
      setVerifying(farmerAddress);
      setError('');
      setSuccess('');
      
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

      let result;
      let alreadyVerified = false;
      
      // Verify farmer using MetaMask
      try {
        result = await metaMaskContractService.verifyFarmer(farmerAddress);
      } catch (blockchainError) {
        // Check if farmer is already verified on blockchain
        if (blockchainError.message && blockchainError.message.includes('already verified')) {
          console.log('✅ Farmer already verified on blockchain, updating database...');
          alreadyVerified = true;
          result = { transactionHash: 'Already Verified' };
        } else if (blockchainError.message && (
          blockchainError.message.includes('0xe2517d3f') || 
          blockchainError.message.includes('execution reverted') ||
          blockchainError.message.includes('unknown custom error')
        )) {
          // Access control error - wallet lacks GOVERNMENT_ROLE
          throw new Error(
            `❌ Access Denied: Your wallet does not have GOVERNMENT_ROLE.\n\n` +
            `Only government officials can verify farmers.\n\n` +
            `Your wallet: ${account}\n\n` +
            `Please contact your administrator to grant you GOVERNMENT_ROLE in the smart contract.\n\n` +
            `Technical details: The smart contract requires GOVERNMENT_ROLE to execute verifyFarmer() function.`
          );
        } else {
          throw blockchainError; // Re-throw if it's a different error
        }
      }
      
      // Always sync to backend to update database verification status
      try {
        await blockchainAPI.syncFarmer(farmerAddress);
        console.log('✅ Farmer verification synced to storage');
        
        // Update all documents for this farmer to "Verified" status
        updateFarmerDocumentsStatus(farmerAddress, 'Verified');
        
        if (alreadyVerified) {
          setSuccess(`✅ Farmer ${farmerAddress.substring(0, 6)}...${farmerAddress.substring(38)} was already verified on blockchain. Database updated successfully!`);
        } else {
          setSuccess(`✅ Farmer ${farmerAddress.substring(0, 6)}...${farmerAddress.substring(38)} verified successfully! Transaction: ${result.transactionHash}`);
        }
      } catch (syncError) {
        console.error('⚠️ Failed to sync farmer verification to storage:', syncError);
        if (alreadyVerified) {
          setError(`Farmer is verified on blockchain but failed to update database: ${syncError.message}`);
        } else {
          setSuccess(`✅ Verified on blockchain but failed to sync: ${syncError.message}`);
        }
      }
      
      await loadDashboardData(); // Reload to show updated status
    } catch (err) {
      setError('Failed to verify farmer: ' + (err.message || 'Unknown error'));
      console.error('❌ Error verifying farmer:', err);
    } finally {
      setVerifying(null);
    }
  };

  const handleAutoSync = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');
      
      const response = await blockchainAPI.autoSyncFarmers();
      
      if (response.data.success) {
        const { syncedCount, totalEvents } = response.data;
        
        if (syncedCount > 0) {
          setSuccess(`✅ Successfully synced ${syncedCount} farmer(s) from blockchain!`);
        } else if (totalEvents > 0) {
          setSuccess(`ℹ️ Found ${totalEvents} farmer(s) - all already synced to database.`);
        } else {
          setSuccess('ℹ️ No farmer registration events found on blockchain yet.');
        }
        
        await loadDashboardData(); // Reload all data
      }
    } catch (err) {
      console.error('❌ Error syncing:', err);
      
      // Handle RPC connection errors gracefully
      if (err.response?.status === 503 || err.message?.includes('RPC') || err.message?.includes('backend is currently healthy')) {
        setError('⚠️ Blockchain RPC temporarily unavailable. The Celo Alfajores network may be experiencing issues. Farmers registered via MetaMask will sync automatically. Database shows local records.');
      } else if (err.response?.data?.suggestion) {
        setError(err.response.data.error + '\n\n' + err.response.data.suggestion);
      } else {
        setError('Sync failed: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSchemeStatus = async (schemeId, currentStatus) => {
    try {
      setTogglingScheme(schemeId);
      setError('');
      setSuccess('');
      
      // Check wallet connection
      if (!isConnected) {
        setError('Please connect your MetaMask wallet first');
        return;
      }

      if (!isConnectedToCelo) {
        setError('Please connect to Celo Alfajores network');
        return;
      }

      // Check if MetaMask contract service is initialized
      if (!metaMaskContractService.isInitialized()) {
        setError('Contract service not initialized. Please refresh the page.');
        return;
      }

      const actionWord = currentStatus ? 'deactivate' : 'activate';
      setSuccess(`Toggling scheme status... Please confirm the transaction in MetaMask.`);
      
      // Call smart contract to toggle scheme status
      const result = await metaMaskContractService.toggleSchemeStatus(schemeId);
      
      if (result.success) {
        setSuccess(`✅ Successfully ${actionWord}d scheme! Transaction: ${result.transactionHash}`);
        
        // Reload dashboard data to show updated status
        await loadDashboardData();
      }
    } catch (err) {
      console.error('❌ Error toggling scheme status:', err);
      
      // Handle specific error cases
      if (err.message && err.message.includes('0xe2517d3f')) {
        setError(
          `❌ Access Denied: Your wallet does not have GOVERNMENT_ROLE.\n\n` +
          `Only government officials can toggle scheme status.\n\n` +
          `Your wallet: ${account}\n\n` +
          `Please contact your administrator to grant you GOVERNMENT_ROLE in the smart contract.`
        );
      } else if (err.message && err.message.includes('user rejected')) {
        setError('Transaction was rejected by user');
      } else {
        setError('Failed to toggle scheme status: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setTogglingScheme(null);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const updateFarmerDocumentsStatus = (farmerAddress, newStatus) => {
    try {
      // Try different possible key formats
      const possibleKeys = [
        `documents_${farmerAddress}`,
        `documents_${farmerAddress.toLowerCase()}`,
        `documents_${farmerAddress.toUpperCase()}`
      ];
      
      for (const key of possibleKeys) {
        const storedDocs = localStorage.getItem(key);
        if (storedDocs) {
          try {
            const docs = JSON.parse(storedDocs);
            // Update all documents to new status
            const updatedDocs = docs.map(doc => ({
              ...doc,
              status: newStatus,
              verifiedAt: new Date().toISOString()
            }));
            localStorage.setItem(key, JSON.stringify(updatedDocs));
            console.log(`✅ Updated ${updatedDocs.length} document(s) to status "${newStatus}" for farmer ${farmerAddress}`);
            return true;
          } catch (err) {
            console.error('Error updating documents:', err);
          }
        }
      }
      console.log(`ℹ️ No documents found to update for farmer ${farmerAddress}`);
      return false;
    } catch (err) {
      console.error('Error in updateFarmerDocumentsStatus:', err);
      return false;
    }
  };

  const handleViewDocuments = (farmer) => {
    setSelectedFarmer(farmer);
    
    // Load documents from localStorage for this farmer
    // Try different possible key formats to ensure compatibility
    const possibleKeys = [
      `documents_${farmer.address}`,
      `documents_${farmer.address.toLowerCase()}`,
      `documents_${farmer.address.toUpperCase()}`
    ];
    
    let foundDocs = [];
    for (const key of possibleKeys) {
      const storedDocs = localStorage.getItem(key);
      if (storedDocs) {
        try {
          foundDocs = JSON.parse(storedDocs);
          console.log(`📄 Found ${foundDocs.length} documents for farmer ${farmer.address} using key: ${key}`);
          break;
        } catch (err) {
          console.error('Error parsing documents:', err);
        }
      }
    }
    
    // If farmer is verified, ensure all documents show as verified
    if (farmer.isVerified && foundDocs.length > 0) {
      foundDocs = foundDocs.map(doc => ({
        ...doc,
        status: doc.status === 'Verified' ? doc.status : 'Verified'
      }));
    }
    
    setFarmerDocuments(foundDocs);
    setDocumentsDialogOpen(true);
  };

  const handleCloseDocumentsDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedFarmer(null);
    setFarmerDocuments([]);
  };

  const handleDownloadDocument = (doc) => {
    try {
      // Create a download link for the document
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess(`Document "${doc.fileName}" downloaded successfully!`);
    } catch (err) {
      setError('Failed to download document: ' + err.message);
    }
  };

  const renderOverview = () => (
    <Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Farmers
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {farmers.length}
                  </Typography>
                </Box>
                <Agriculture sx={{ fontSize: 50, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Verified
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {farmers.filter(f => f.isVerified).length}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 50, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {farmers.filter(f => !f.isVerified).length}
                  </Typography>
                </Box>
                <PendingActions sx={{ fontSize: 50, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    On-Chain
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {stats?.totalFarmers || 0}
                  </Typography>
                </Box>
                <DashboardIcon sx={{ fontSize: 50, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Sync />}
            onClick={handleAutoSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from Blockchain'}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
          >
            Refresh Data
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderFarmersTable = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Registered Farmers ({farmers.length})
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {farmers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Agriculture sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Farmers Found
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Click "Sync from Blockchain" to fetch registered farmers
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<Sync />}
              onClick={handleAutoSync}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync from Blockchain'}
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Crop Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Farm Size</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documents</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {farmers.map((farmer, index) => (
                  <TableRow key={farmer.address || index} hover>
                    <TableCell>{farmer.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {farmer.address?.substring(0, 6)}...{farmer.address?.substring(38)}
                      </Typography>
                    </TableCell>
                    <TableCell>{farmer.location}</TableCell>
                    <TableCell>{farmer.cropType}</TableCell>
                    <TableCell>{farmer.farmSize} acres</TableCell>
                    <TableCell>
                      {farmer.isVerified ? (
                        <Chip
                          label="Verified"
                          color="success"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      ) : (
                        <Chip
                          label="Pending"
                          color="warning"
                          size="small"
                          icon={<PendingActions />}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Uploaded Documents">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDocuments(farmer)}
                        >
                          <Description />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {!farmer.isVerified ? (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleVerifyFarmer(farmer.address)}
                          disabled={verifying === farmer.address || !isConnected || !isConnectedToCelo}
                        >
                          {verifying === farmer.address ? 'Verifying...' : 'Verify'}
                        </Button>
                      ) : (
                        <Chip label="Verified" color="success" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderSchemes = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Subsidy Schemes ({schemes.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/create-scheme')}
          >
            Create New Scheme
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {schemes.length === 0 ? (
          <Box textAlign="center" py={4}>
            <AccountBalance sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Schemes Created Yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Create a new subsidy scheme to start distributing funds to farmers
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/create-scheme')}
            >
              Create First Scheme
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scheme ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount (CELO)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Beneficiaries</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expires</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schemes.map((scheme, index) => (
                  <TableRow key={scheme.schemeId || index} hover>
                    <TableCell>{scheme.schemeId}</TableCell>
                    <TableCell>{scheme.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {scheme.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{scheme.amount} CELO</TableCell>
                    <TableCell>
                      {scheme.currentBeneficiaries || 0} / {scheme.maxBeneficiaries || 0}
                    </TableCell>
                    <TableCell>
                      {scheme.isActive ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {scheme.expiryDate ? new Date(parseInt(scheme.expiryDate) * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const contractAddress = process.env.REACT_APP_CELO_TESTNET_CONTRACT_ADDRESS || '0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF';
                            window.open(`https://celo-alfajores.blockscout.com/address/${contractAddress}`, '_blank');
                          }}
                        >
                          View on Chain
                        </Button>
                        <Button
                          size="small"
                          variant={scheme.isActive ? "outlined" : "contained"}
                          color={scheme.isActive ? "error" : "success"}
                          startIcon={scheme.isActive ? <ToggleOff /> : <ToggleOn />}
                          onClick={() => handleToggleSchemeStatus(scheme.schemeId, scheme.isActive)}
                          disabled={togglingScheme === scheme.schemeId}
                        >
                          {togglingScheme === scheme.schemeId 
                            ? 'Processing...' 
                            : scheme.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderPayments = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Subsidy Payments
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/process-payment')}
          >
            Process Payment
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box textAlign="center" py={4}>
          <Payment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="textSecondary">
            Payment management feature coming soon
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Government Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage farmers, schemes, and subsidy payments
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {account && (
              <Chip
                icon={<CheckCircle />}
                label={`${account.substring(0, 6)}...${account.substring(38)}`}
                color="success"
                variant="outlined"
              />
            )}
            {!isConnected && (
              <Button
                variant="contained"
                color="primary"
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Box>

        {!isConnectedToCelo && isConnected && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ⚠️ Please switch to Celo Alfajores Testnet in MetaMask
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Overview" 
              iconPosition="start"
            />
            <Tab 
              icon={<People />} 
              label="Farmers" 
              iconPosition="start"
            />
            <Tab 
              icon={<AccountBalance />} 
              label="Schemes" 
              iconPosition="start"
            />
            <Tab 
              icon={<Payment />} 
              label="Payments" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderOverview()}
              {activeTab === 1 && renderFarmersTable()}
              {activeTab === 2 && renderSchemes()}
              {activeTab === 3 && renderPayments()}
            </>
          )}
        </Box>
      </Paper>

      {/* Documents Dialog */}
      <Dialog
        open={documentsDialogOpen}
        onClose={handleCloseDocumentsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Documents - {selectedFarmer?.name}
            </Typography>
            <IconButton onClick={handleCloseDocumentsDialog} size="small">
              <Close />
            </IconButton>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Wallet: {selectedFarmer?.address}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {farmerDocuments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Description sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Documents Uploaded
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={1}>
                This farmer hasn't uploaded any documents yet.
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                Documents will appear here once the farmer uploads them from their dashboard.
              </Typography>
            </Box>
          ) : (
            <List>
              {farmerDocuments.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Description color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.fileName}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Type: {doc.type}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                        </Typography>
                        <br />
                        <Chip
                          label={doc.status || 'Pending Review'}
                          size="small"
                          color={
                            doc.status === 'Verified' || doc.status === 'Approved'
                              ? 'success'
                              : doc.status === 'Rejected'
                              ? 'error'
                              : 'warning'
                          }
                          sx={{ mt: 0.5 }}
                        />
                        {doc.verifiedAt && (
                          <>
                            <br />
                            <Typography variant="caption" color="textSecondary" component="span">
                              Verified: {new Date(doc.verifiedAt).toLocaleString()}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Document">
                      <IconButton
                        color="primary"
                        onClick={() => window.open(doc.fileData, '_blank')}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Document">
                      <IconButton
                        color="secondary"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentsDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GovernmentDashboard;
