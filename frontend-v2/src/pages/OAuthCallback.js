import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress, Box, Typography, Alert, Container } from '@mui/material';

const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!token) {
          setError('No token received from OAuth provider');
          setLoading(false);
          return;
        }

        // Decode JWT to get user info (without verification - backend verified it)
        const parts = token.split('.');
        if (parts.length !== 3) {
          setError('Invalid token format');
          setLoading(false);
          return;
        }

        const decoded = JSON.parse(atob(parts[1]));

        // Store token and user info
        localStorage.setItem('auth_token', token);
        
        const userData = {
          address: decoded.email, // Use email as identifier
          email: decoded.email,
          name: decoded.name,
          role: 'public', // Default role for OAuth users
          provider: decoded.provider,
          token: token
        };

        localStorage.setItem('user', JSON.stringify(userData));

        // Call parent handler
        if (onLogin) {
          onLogin(userData);
        }

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(`Processing error: ${err.message}`);
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, onLogin]);

  if (loading) {
    return (
      <Box textAlign="center" sx={{ mt: 8 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Finalizing sign-in...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            <a href="/" style={{ color: 'inherit' }}>
              Go back to login
            </a>
          </Typography>
        </Box>
      </Container>
    );
  }

  return null;
};

export default OAuthCallback;
