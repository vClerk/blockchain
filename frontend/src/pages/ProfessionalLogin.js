import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  Paper,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  AccountBalanceWallet,
  Security,
  CheckCircle,
  ArrowForward,
  AdminPanelSettings,
  Agriculture,
  Link as LinkIcon,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';

const ProfessionalLogin = ({ onLogin }) => {
  const theme = useTheme();
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

  useEffect(() => {
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const initializeContract = async () => {
      if (isConnected && provider && signer && chainId) {
        try {
          await metaMaskContractService.initialize(provider, signer, chainId);
          const hasGovRole = await metaMaskContractService.hasGovernmentRole(account);
          if (hasGovRole) {
            setUserRole('government');
          }
        } catch (err) {
          console.error('Failed to initialize contract service:', err);
        }
      }
    };

    initializeContract();
  }, [isConnected, provider, signer, chainId, account]);

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    setError('');
    setRole(selectedRole);

    try {
      const userData = {
        address: account,
        role: selectedRole,
        walletAddress: account,
        chainId: chainId,
        network: chainId === 44787 ? 'Celo Alfajores Testnet' : 
                 chainId === 42220 ? 'Celo Mainnet' : 'Unknown'
      };

      onLogin(userData);
      
      // Navigate based on role
      if (selectedRole === 'government') {
        navigate('/government-dashboard');
      } else if (selectedRole === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/dashboard');
      }
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
      await addCeloNetwork(true);
    } catch (err) {
      setError('Failed to switch to Celo network');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkChip = () => {
    if (!chainId) return null;
    
    const isCorrectNetwork = chainId === 44787 || chainId === 42220;
    
    return (
      <Chip
        icon={isCorrectNetwork ? <CheckCircle /> : <Warning />}
        label={chainId === 44787 ? 'Celo Alfajores' : chainId === 42220 ? 'Celo Mainnet' : `Chain ${chainId}`}
        color={isCorrectNetwork ? 'success' : 'warning'}
        size="small"
      />
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          {/* Left Side - Branding */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Agriculture sx={{ fontSize: 50, color: 'primary.main' }} />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SmartSubsidy
                </Typography>
              </Box>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                Secure Blockchain Authentication
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Connect your wallet to access transparent, secure, and efficient agricultural subsidy management
              </Typography>

              {/* Features */}
              <Stack spacing={2} sx={{ mt: 4 }}>
                {[
                  { icon: <Security />, text: 'Blockchain-secured transactions' },
                  { icon: <CheckCircle />, text: 'Transparent fund distribution' },
                  { icon: <AdminPanelSettings />, text: 'Government-verified beneficiaries' },
                ].map((feature, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Stack spacing={3}>
                {/* Header */}
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={700} mb={1}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connect your wallet to continue
                  </Typography>
                </Box>

                {/* Error Messages */}
                {(error || web3Error) && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error || web3Error}
                  </Alert>
                )}

                {!isMetaMaskInstalled && (
                  <Alert 
                    severity="warning" 
                    sx={{ borderRadius: 2 }}
                    action={
                      <Button
                        href="https://metamask.io/download/"
                        target="_blank"
                        size="small"
                        sx={{ ml: 2 }}
                      >
                        Install
                      </Button>
                    }
                  >
                    MetaMask not detected. Please install it to continue.
                  </Alert>
                )}

                <Divider />

                {/* Connection Card */}
                {!isConnected ? (
                  <Card 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <AccountBalanceWallet 
                        sx={{ 
                          fontSize: 60, 
                          color: 'primary.main',
                          opacity: 0.8,
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6" fontWeight={600} mb={1}>
                        Connect Your Wallet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Use MetaMask to securely access the platform
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleConnectWallet}
                        disabled={!isMetaMaskInstalled || isConnecting}
                        startIcon={isConnecting ? <CircularProgress size={20} /> : <LinkIcon />}
                        sx={{ 
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                        }}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                      </Button>
                    </CardContent>
                  </Card>
                ) : !isConnectedToCelo ? (
                  <Card 
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.03),
                      border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Warning sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                      <Typography variant="h6" fontWeight={600} mb={1}>
                        Switch to Celo Network
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Connected: {formatAddress(account)}
                      </Typography>
                      <Box display="flex" justifyContent="center" mb={3}>
                        {getNetworkChip()}
                      </Box>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSwitchToCelo}
                        startIcon={<LinkIcon />}
                        sx={{ 
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                        }}
                      >
                        Switch to Celo Alfajores
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Box>
                    {/* Connected State */}
                    <Card 
                      sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        borderRadius: 3,
                        mb: 3,
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <CheckCircle color="success" />
                          <Typography variant="body2" fontWeight={600}>
                            Wallet Connected
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Address: <strong>{formatAddress(account)}</strong>
                        </Typography>
                        <Box mt={1}>
                          {getNetworkChip()}
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Role Selection */}
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>
                      Select Your Role
                    </Typography>
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        onClick={() => handleRoleSelection('government')}
                        disabled={loading}
                        startIcon={<AdminPanelSettings />}
                        endIcon={<ArrowForward />}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          justifyContent: 'space-between',
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          Government Official
                        </Box>
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        onClick={() => handleRoleSelection('farmer')}
                        disabled={loading}
                        startIcon={<Agriculture />}
                        endIcon={<ArrowForward />}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          justifyContent: 'space-between',
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            bgcolor: alpha(theme.palette.secondary.main, 0.05),
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          Farmer
                        </Box>
                      </Button>
                    </Stack>
                  </Box>
                )}

                <Divider />

                {/* Alternative Options */}
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Don't have a wallet?
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/register-farmer')}
                  >
                    Register as Farmer
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfessionalLogin;
