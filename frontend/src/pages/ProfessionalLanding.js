import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Speed,
  Verified,
  AccountBalance,
  Agriculture,
  Public,
  BarChart,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProfessionalLanding = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security fontSize="large" />,
      title: 'Blockchain Security',
      description: 'Immutable and transparent transactions secured by Celo blockchain technology',
      color: theme.palette.primary.main,
    },
    {
      icon: <Speed fontSize="large" />,
      title: 'Instant Processing',
      description: 'Real-time subsidy distribution with automated smart contract execution',
      color: theme.palette.secondary.main,
    },
    {
      icon: <Verified fontSize="large" />,
      title: 'Verified Farmers',
      description: 'Government-verified farmer profiles ensuring legitimate beneficiaries',
      color: theme.palette.info.main,
    },
    {
      icon: <BarChart fontSize="large" />,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and reporting for data-driven decisions',
      color: theme.palette.warning.main,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Farmers Registered' },
    { value: '₹50Cr+', label: 'Subsidies Distributed' },
    { value: '99.9%', label: 'Transaction Success' },
    { value: '24/7', label: 'Platform Availability' },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          py: 2,
          zIndex: 1000,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Agriculture sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography
                variant="h5"
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
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForward />}
                sx={{ borderRadius: 2 }}
              >
                Get Started
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 16, pb: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Chip
                label="Powered by Celo Blockchain"
                icon={<Public />}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Smart Agriculture Subsidies
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Transparent, secure, and efficient subsidy distribution system powered by blockchain technology
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                  }}
                >
                  Launch Platform
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register-farmer')}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                  }}
                >
                  Register as Farmer
                </Button>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                height: 400,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalance sx={{ fontSize: 200, color: 'white', opacity: 0.3 }} />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            FEATURES
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
            Why Choose SmartSubsidy
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Modern, secure, and efficient platform for agricultural subsidy management
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 32px ${alpha(feature.color, 0.2)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: alpha(feature.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          py: 10,
          mt: 8,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center" color="white">
            <Typography variant="h2" sx={{ mb: 2, fontWeight: 800 }}>
              Ready to Transform Agriculture?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
              Join thousands of farmers and government officials using SmartSubsidy
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  py: 1.5,
                  px: 5,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.9),
                  },
                }}
                endIcon={<ArrowForward />}
              >
                Get Started Now
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  py: 1.5,
                  px: 5,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: alpha('#ffffff', 0.1),
                  },
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Agriculture sx={{ fontSize: 36 }} />
                <Typography variant="h6" fontWeight={700}>
                  SmartSubsidy
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Revolutionizing agricultural subsidies with blockchain technology
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={4}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Platform
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Features
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Security
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Pricing
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Resources
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Documentation
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      API
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Support
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Company
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      About
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Blog
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Careers
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Legal
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Privacy
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      Terms
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                      License
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2025 SmartSubsidy. All rights reserved. Powered by Celo Blockchain.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ProfessionalLanding;
