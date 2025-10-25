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
  Divider
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
  Payment
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
        } else {
          throw blockchainError; // Re-throw if it's a different error
        }
      }
      
      // Always sync to backend to update database verification status
      try {
        await blockchainAPI.syncFarmer(farmerAddress);
        console.log('✅ Farmer verification synced to storage');
        
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/register-farmer')}
          >
            Add New Farmer
          </Button>
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
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const contractAddress = process.env.REACT_APP_CELO_TESTNET_CONTRACT_ADDRESS || '0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF';
                          window.open(`https://alfajores.celoscan.io/address/${contractAddress}`, '_blank');
                        }}
                      >
                        View on Chain
                      </Button>
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
    </Container>
  );
};

export default GovernmentDashboard;
