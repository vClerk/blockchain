import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  People,
  AccountBalance,
  Payment,
  Agriculture,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import metaMaskContractService from '../services/metamask';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const { account, isConnected, isConnectedToCelo } = useWeb3();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      if (!isConnected || !isConnectedToCelo || !metaMaskContractService.isInitialized()) {
        setLoading(false);
        // Set default stats when contract is not available
        setStats({
          totalFarmers: '0',
          totalSchemes: '0',
          totalPayments: '0',
          totalDistributed: '0.0',
          contractBalance: '0.0'
        });
        return;
      }

      const totalFarmers = await metaMaskContractService.getFarmerCount();
      const totalSchemes = await metaMaskContractService.getSchemeCount();
      
      setStats({
        totalFarmers: totalFarmers.toString(),
        totalSchemes: totalSchemes.toString(),
        totalPayments: '0', // This would need a new contract method
        totalDistributed: '0.0',
        contractBalance: '0.0'
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // Set default stats on error
      setStats({
        totalFarmers: '0',
        totalSchemes: '0',
        totalPayments: '0',
        totalDistributed: '0.0',
        contractBalance: '0.0'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = () => {
    // Clear user session
    localStorage.removeItem('user');
    // Navigate to login page
    navigate('/login');
    // Reload to ensure clean state
    window.location.href = '/login';
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isConnectedToCelo]);

  const StatCard = ({ title, value, icon, color = "primary", subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ActionCard = ({ title, description, buttonText, onClick, icon, color = "primary" }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box sx={{ color: `${color}.main`, mr: 2, fontSize: 30 }}>
            {icon}
          </Box>
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1, mb: 2 }}>
          {description}
        </Typography>
        <Button variant="contained" color={color} onClick={onClick}>
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const getQuickActions = () => {
    switch (user.role) {
      case 'government':
        return [
          {
            title: 'Create Subsidy Scheme',
            description: 'Set up new subsidy programs for farmers',
            buttonText: 'Create Scheme',
            onClick: () => navigate('/create-scheme'),
            icon: <AccountBalance />,
            color: 'primary'
          },
          {
            title: 'Process Payments',
            description: 'Approve and send subsidy payments to farmers',
            buttonText: 'Process Payments',
            onClick: () => navigate('/process-payment'),
            icon: <Payment />,
            color: 'success'
          },
          {
            title: 'View Analytics',
            description: 'Monitor subsidy distribution and performance',
            buttonText: 'View Analytics',
            onClick: () => navigate('/analytics'),
            icon: <TrendingUp />,
            color: 'info'
          }
        ];
      case 'farmer':
        return [
          {
            title: 'Register Profile',
            description: 'Complete your farmer registration',
            buttonText: 'Register',
            onClick: () => navigate('/register-farmer'),
            icon: <Agriculture />,
            color: 'secondary'
          },
          {
            title: 'View My Payments',
            description: 'Check your subsidy payment history',
            buttonText: 'View Payments',
            onClick: () => navigate('/transactions'),
            icon: <Payment />,
            color: 'success'
          }
        ];
      default:
        return [
          {
            title: 'View Transactions',
            description: 'Explore all subsidy transactions for transparency',
            buttonText: 'View Transactions',
            onClick: () => navigate('/transactions'),
            icon: <Visibility />,
            color: 'info'
          },
          {
            title: 'Analytics',
            description: 'View subsidy distribution analytics',
            buttonText: 'View Analytics',
            onClick: () => navigate('/analytics'),
            icon: <TrendingUp />,
            color: 'primary'
          }
        ];
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Welcome Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            Welcome to SmartSubsidy Dashboard
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={handleChangeRole}
          >
            Change Role / Logout
          </Button>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" color="textSecondary">
            Role: 
          </Typography>
          <Chip 
            label={user.role?.toUpperCase()} 
            color={user.role === 'government' ? 'primary' : user.role === 'farmer' ? 'secondary' : 'default'}
          />
          <Typography variant="body2" color="textSecondary">
            {account}
          </Typography>
        </Box>
        {!isConnected && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please connect your MetaMask wallet to access all features.
          </Alert>
        )}
        {isConnected && !isConnectedToCelo && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please switch to Celo network for full functionality.
          </Alert>
        )}
        {isConnected && isConnectedToCelo && !metaMaskContractService.isInitialized() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Smart contract not yet deployed. Deploy the contract to Celo Alfajores to enable blockchain features.
          </Alert>
        )}
      </Box>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Farmers"
              value={stats.totalFarmers}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Schemes"
              value={stats.totalSchemes}
              icon={<AccountBalance />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Payments"
              value={stats.totalPayments}
              icon={<Payment />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Distributed"
              value={`${parseFloat(stats.totalDistributed).toFixed(2)} ETH`}
              icon={<TrendingUp />}
              color="info"
              subtitle={`Balance: ${parseFloat(stats.contractBalance).toFixed(2)} ETH`}
            />
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {getQuickActions().map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <ActionCard {...action} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  MetaMask Connection
                </Typography>
                <Chip 
                  label={isConnected ? "Connected" : "Disconnected"} 
                  color={isConnected ? "success" : "error"} 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Celo Network
                </Typography>
                <Chip 
                  label={isConnectedToCelo ? "Connected" : "Not Connected"} 
                  color={isConnectedToCelo ? "success" : "warning"} 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Smart Contract
                </Typography>
                <Chip 
                  label={metaMaskContractService.isInitialized() ? "Active" : "Not Initialized"} 
                  color={metaMaskContractService.isInitialized() ? "success" : "error"} 
                  size="small" 
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  Last Update
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
