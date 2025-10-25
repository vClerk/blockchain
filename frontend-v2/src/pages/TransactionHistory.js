import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { History, Search, TrendingUp, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { blockchainAPI } from '../services/api';

const TransactionHistory = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load general stats
      const statsResponse = await blockchainAPI.getStats();
      setStats(statsResponse.data.data);

      // Load all transactions from backend
      const txResponse = await blockchainAPI.getAllTransactions();
      setTransactions(txResponse.data.data || []);
      
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transaction history: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateMockTransactions = () => {
    const mockTransactions = [];
    const farmers = [
      { name: 'John Doe', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { name: 'Jane Smith', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
      { name: 'Robert Wilson', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
      { name: 'Alice Johnson', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' },
    ];

    const schemes = [
      'Rice Cultivation Support',
      'Organic Farming Initiative',
      'Drought Relief Fund',
      'Equipment Purchase Scheme'
    ];

    for (let i = 1; i <= 20; i++) {
      const farmer = farmers[Math.floor(Math.random() * farmers.length)];
      const scheme = schemes[Math.floor(Math.random() * schemes.length)];
      const amount = (Math.random() * 10 + 1).toFixed(2);
      const timestamp = Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

      mockTransactions.push({
        id: i,
        farmer: farmer.address,
        farmerName: farmer.name,
        schemeId: Math.floor(Math.random() * 4) + 1,
        schemeName: scheme,
        amount: amount,
        timestamp: timestamp.toString().slice(0, -3), // Convert to seconds
        approver: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        remarks: `Payment for ${scheme.toLowerCase()}`,
        isCompleted: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      });
    }

    return mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.farmer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <History sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            Transaction History
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Total Transactions
                </Typography>
                <Typography variant="h4" color="primary">
                  {stats.totalPayments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Total Distributed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {parseFloat(stats.totalDistributed).toFixed(2)} ETH
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Active Farmers
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {stats.totalFarmers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Contract Balance
                </Typography>
                <Typography variant="h4" color="info.main">
                  {parseFloat(stats.contractBalance).toFixed(2)} ETH
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by farmer name, scheme, or address..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={loadData}
                startIcon={<TrendingUp />}
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          
          {filteredTransactions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No transactions found
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Farmer</TableCell>
                    <TableCell>Scheme</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.slice(0, 20).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {tx.farmerName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatAddress(tx.farmer)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {tx.schemeName || `Scheme #${tx.schemeId}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {tx.schemeId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {tx.amount} ETH
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.isCompleted ? 'Completed' : 'Pending'}
                          color={tx.isCompleted ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {formatAddress(tx.txHash || '0x...')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Transparency Note */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'info.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="info.main">
          🔍 Complete Transparency
        </Typography>
        <Typography variant="body2" color="textSecondary">
          All transactions are recorded on the blockchain and are publicly verifiable. 
          Each payment includes timestamp, amount, beneficiary details, and approval information 
          to ensure complete transparency in subsidy distribution.
        </Typography>
      </Box>
    </Container>
  );
};

export default TransactionHistory;
