import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  AccountBalance,
  Agriculture,
  Security,
  TrendingUp,
  Close as CloseIcon
} from '@mui/icons-material';

const Landing = () => {
  const navigate = useNavigate();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = () => {
    // Simple email login for demo
    localStorage.setItem('user', JSON.stringify({ email, role: 'government' }));
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 50 }} />,
      title: 'Blockchain Security',
      description: 'Immutable records on Celo blockchain ensure transparency and prevent fraud'
    },
    {
      icon: <Agriculture sx={{ fontSize: 50 }} />,
      title: 'Direct to Farmers',
      description: 'Subsidies paid directly to farmers wallets, eliminating intermediaries'
    },
    {
      icon: <AccountBalance sx={{ fontSize: 50 }} />,
      title: 'Government Control',
      description: 'Full visibility and control over subsidy schemes and distributions'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 50 }} />,
      title: 'Real-time Analytics',
      description: 'Track subsidy utilization and impact with comprehensive analytics'
    }
  ];

  const stats = [
    { label: 'Farmers Registered', value: '1,234' },
    { label: 'Total Subsidies', value: '$2.5M' },
    { label: 'Active Schemes', value: '45' },
    { label: 'Transparency', value: '100%' }
  ];

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ pt: 8, pb: 6, textAlign: 'center', color: 'white' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            SmartSubsidy
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Blockchain-Powered Agricultural Subsidy Distribution
          </Typography>
          <Typography variant="body1" sx={{ mb: 5, maxWidth: '800px', mx: 'auto', fontSize: '1.1rem' }}>
            Revolutionizing farmer subsidies with transparent, secure, and efficient blockchain technology.
            Direct payments, zero corruption, complete accountability.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { bgcolor: '#f0f0f0' }
              }}
            >
              Connect Wallet
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setEmailDialogOpen(true)}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Email Login
            </Button>
          </Box>
        </Box>

        {/* Stats Section */}
        <Box sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', py: 2, bgcolor: 'rgba(255,255,255,0.95)' }}>
                  <CardContent>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ color: 'white', mb: 5, fontWeight: 'bold' }}
          >
            Why SmartSubsidy?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.95)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* How It Works */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ color: 'white', mb: 5, fontWeight: 'bold' }}
          >
            How It Works
          </Typography>
          <Grid container spacing={3}>
            {[
              { step: '1', title: 'Register', desc: 'Farmers register with MetaMask wallet' },
              { step: '2', title: 'Verify', desc: 'Government verifies farmer credentials' },
              { step: '3', title: 'Create Scheme', desc: 'Government creates subsidy schemes' },
              { step: '4', title: 'Distribute', desc: 'Direct payments to farmer wallets' }
            ].map((item, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', py: 3, bgcolor: 'rgba(255,255,255,0.95)' }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      {item.step}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
            Ready to Transform Agricultural Subsidies?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: 'white',
              color: '#667eea',
              px: 5,
              py: 2,
              fontSize: '1.2rem',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
          >
            Get Started Now
          </Button>
        </Box>
      </Container>

      {/* Email Login Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Email Login
          <IconButton
            onClick={() => setEmailDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleEmailLogin}
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Landing;
