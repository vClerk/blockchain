import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  Paper,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  Agriculture,
  Person,
  AccountBalanceWallet,
  Security,
  Public,
  CheckCircle,
  ArrowForward,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';

const MetaMaskLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error: web3Error,
    isMetaMaskInstalled,
    isConnected,
    isConnectedToCelo,
    connectWallet,
    addCeloNetwork
  } = useWeb3();

  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Clear any existing user session on mount
  useEffect(() => {
    localStorage.removeItem('user');
  }, []);

  // Initialize contract service when connected
  useEffect(() => {
    const initializeContract = async () => {
      if (isConnected && provider && signer && chainId) {
        try {
          await metaMaskContractService.initialize(provider, signer, chainId);
          
          // Check if user has government role
          const hasGovRole = await metaMaskContractService.hasGovernmentRole(account);
          if (hasGovRole) {
            setUserRole('government');
          }
        } catch (err) {
          console.error('Failed to initialize contract service:', err);
          // Don't show error on initial load - contract may not be deployed yet
          // Only show error when user actually tries to interact with contract
        }
      }
    };

    initializeContract();
  }, [isConnected, provider, signer, chainId, account]);

  const handleRoleSelection = async () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = {
        address: account,
        role: role,
        chainId: chainId,
        network: chainId === 44787 ? 'Celo Alfajores Testnet' : 
                 chainId === 42220 ? 'Celo Mainnet' : 'Unknown'
      };

      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to complete login');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSwitchToCelo = async () => {
    try {
      setError('');
      await addCeloNetwork(true); // Use testnet
    } catch (err) {
      setError('Failed to switch to Celo network');
    }
  };

  const getNetworkName = () => {
    switch (chainId) {
      case 44787:
        return 'Celo Alfajores Testnet';
      case 42220:
        return 'Celo Mainnet';
      default:
        return `Network ${chainId}`;
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom align="center">
          SmartSubsidy on Celo
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" align="center" sx={{ mb: 2 }}>
          Connect your MetaMask wallet to access transparent subsidy payments on Celo blockchain
        </Typography>
        
        {/* OAuth Alternative */}
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
          Or{' '}
          <a href="/oauth-login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
            sign in with Google
          </a>
        </Typography>

        {/* Error Messages */}
        {(error || web3Error) && (
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {error || web3Error}
          </Alert>
        )}

        {!isMetaMaskInstalled && (
          <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
            MetaMask is not installed. Please install MetaMask browser extension to continue.
            <Button
              href="https://metamask.io/download/"
              target="_blank"
              variant="contained"
              sx={{ ml: 2 }}
            >
              Install MetaMask
            </Button>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* MetaMask Connection Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalanceWallet sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Wallet Connection
                  </Typography>
                </Box>

                {!isConnected ? (
                  <Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Connect your MetaMask wallet to get started
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectWallet}
                      disabled={!isMetaMaskInstalled || isConnecting}
                      startIcon={<AccountBalanceWallet />}
                      fullWidth
                    >
                      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="body2" fontWeight="medium">
                        Connected Account:
                      </Typography>
                      <Chip
                        label={formatAddress(account)}
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="body2" fontWeight="medium">
                        Network:
                      </Typography>
                      <Chip
                        label={getNetworkName()}
                        color={isConnectedToCelo ? 'success' : 'warning'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    {!isConnectedToCelo && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Please switch to Celo network to use the application.
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleSwitchToCelo}
                          sx={{ ml: 2 }}
                        >
                          Switch to Celo
                        </Button>
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Role Selection */}
          {isConnected && isConnectedToCelo && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Person sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Select Your Role
                    </Typography>
                  </Box>

                  {userRole === 'government' && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Box display="flex" alignItems="center">
                        <Security sx={{ mr: 1 }} />
                        Government role detected for your address
                      </Box>
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: role === 'government' ? 2 : 1,
                          borderColor: role === 'government' ? 'primary.main' : 'grey.300'
                        }}
                        onClick={() => setRole('government')}
                      >
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" gutterBottom>
                            Government
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Create schemes, verify farmers, process payments
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          cursor: 'pointer',
                          border: role === 'farmer' ? 2 : 1,
                          borderColor: role === 'farmer' ? 'secondary.main' : 'grey.300'
                        }}
                        onClick={() => setRole('farmer')}
                      >
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Agriculture sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                          <Typography variant="h6" gutterBottom>
                            Farmer
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Register profile, receive subsidies, track payments
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          cursor: 'pointer',
                          border: role === 'public' ? 2 : 1,
                          borderColor: role === 'public' ? 'info.main' : 'grey.300'
                        }}
                        onClick={() => setRole('public')}
                      >
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Public sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                          <Typography variant="h6" gutterBottom>
                            Public
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            View transactions, explore transparency
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleRoleSelection}
                      disabled={!role || loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Continue to Dashboard'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Celo Network Info */}
          <Grid item xs={12}>
            <Box sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary.main">
                🌍 Why Celo?
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Celo is a carbon-negative, mobile-first blockchain that makes financial dApps and crypto payments accessible to anyone with a mobile phone.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Ultra-low transaction fees (gas fees paid in CELO or cUSD)<br/>
                • Fast transactions (5-second block times)<br/>
                • Mobile-optimized for farmer accessibility<br/>
                • Environmental sustainability focus
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default MetaMaskLogin;
