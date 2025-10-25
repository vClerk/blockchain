import React from 'react';
import { Container, Box, Typography, Button, Divider, Paper, Grid } from '@mui/material';
import { Google as GoogleIcon, Security, Lock } from '@mui/icons-material';

const OAuthLogin = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const googleOAuthUrl = `${apiUrl}/oauth/google`;

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Lock sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            SmartSubsidy OAuth Login
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Sign in securely with your Google account
          </Typography>
        </Box>

        {/* OAuth Login Paper */}
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<GoogleIcon />}
            href={googleOAuthUrl}
            sx={{
              bgcolor: '#1f2937',
              '&:hover': { bgcolor: '#111827' },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 2 }}>TEST</Divider>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            href={`${apiUrl}/oauth/google/demo`}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              color: 'success.main',
              borderColor: 'success.main',
              '&:hover': {
                borderColor: 'success.dark',
                bgcolor: 'rgba(76, 175, 80, 0.1)'
              }
            }}
          >
            ✓ Demo Login (Testing)
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            href="/login"
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Use MetaMask Wallet
          </Button>
        </Paper>

        {/* Security Info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 2, width: '100%' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            🔒 Security Features
          </Typography>
          <Typography variant="body2" color="textSecondary" component="div">
            ✓ JWT token-based authentication<br/>
            ✓ Secure OAuth 2.0 flow<br/>
            ✓ HttpOnly cookies<br/>
            ✓ Session encryption
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Security sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                OAuth 2.0
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Industry standard security
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <GoogleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Google Sign-In
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Quick & secure login
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default OAuthLogin;
