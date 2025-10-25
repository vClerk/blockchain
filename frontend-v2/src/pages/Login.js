import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import { AccountBalance, Person, Agriculture } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    role: '',
    privateKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate login process
      if (!formData.address || !formData.role) {
        throw new Error('Please fill in all required fields');
      }

      const userData = {
        address: formData.address,
        role: formData.role,
        privateKey: formData.privateKey
      };

      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role, address, privateKey = '') => {
    const userData = { address, role, privateKey };
    onLogin(userData);
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to SmartSubsidy
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" align="center" sx={{ mb: 4 }}>
          Transparent, traceable, and instant subsidy payments on blockchain
        </Typography>

        <Grid container spacing={3}>
          {/* Quick Login Options */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Quick Access (Demo)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Government
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Create schemes, verify farmers, process payments
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => quickLogin('government', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')}
                    >
                      Login as Government
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Agriculture sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Farmer
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      View subsidies, track payments, manage profile
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      onClick={() => quickLogin('farmer', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')}
                    >
                      Login as Farmer
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Person sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Public
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      View transactions, explore transparency
                    </Typography>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={() => quickLogin('public', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')}
                    >
                      Login as Public
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Manual Login Form */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Manual Login
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Wallet Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="0x..."
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        label="Role"
                      >
                        <MenuItem value="government">Government</MenuItem>
                        <MenuItem value="farmer">Farmer</MenuItem>
                        <MenuItem value="ngo">NGO</MenuItem>
                        <MenuItem value="public">Public</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Private Key (Optional)"
                      name="privateKey"
                      type="password"
                      value={formData.privateKey}
                      onChange={handleChange}
                      placeholder="For transaction signing"
                      helperText="Required only for government/farmer operations"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Registration Link */}
          <Grid item xs={12}>
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                New farmer? 
                <Button
                  color="primary"
                  onClick={() => navigate('/register-farmer')}
                  sx={{ ml: 1 }}
                >
                  Register Here
                </Button>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Login;
