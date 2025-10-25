import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for blockchain calls
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const blockchainAPI = {
  // Statistics
  getStats: () => api.get('/blockchain/stats'),
  
  // Farmer operations
  getAllFarmers: () => api.get('/blockchain/farmers'),
  getFarmer: (address) => api.get(`/blockchain/farmer/${address}`),
  getFarmerPayments: (address) => api.get(`/blockchain/farmer/${address}/payments`),
  registerFarmer: (data) => api.post('/blockchain/register-farmer', data),
  verifyFarmer: (data) => api.post('/blockchain/verify-farmer', data),
  
  // Scheme operations
  getAllSchemes: () => api.get('/blockchain/schemes'),
  getScheme: (id) => api.get(`/blockchain/scheme/${id}`),
  getSchemeBeneficiaries: (id) => api.get(`/blockchain/scheme/${id}/beneficiaries`),
  createScheme: (data) => api.post('/blockchain/create-scheme', data),
  saveScheme: (data) => api.post('/blockchain/save-scheme', data),
  
  // Payment operations
  getPayment: (id) => api.get(`/blockchain/payment/${id}`),
  paySubsidy: (data) => api.post('/blockchain/pay-subsidy', data),
  
  // Transactions
  getAllTransactions: () => api.get('/blockchain/transactions'),
  
  // Sync blockchain to storage
  syncFarmer: (address) => api.post(`/blockchain/sync-farmer/${address}`),
  syncScheme: (id) => api.post(`/blockchain/sync-scheme/${id}`),
  autoSyncFarmers: () => api.post('/blockchain/auto-sync-farmers'),
  syncAllFarmers: () => api.post('/blockchain/sync-all-farmers'),
  
  // Utility
  depositFunds: (data) => api.post('/blockchain/deposit-funds', data),
  getTransaction: (hash) => api.get(`/blockchain/transaction/${hash}`),
  getBlockNumber: () => api.get('/blockchain/block-number'),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMonthlyTrends: () => api.get('/analytics/trends/monthly'),
  getSchemePerformance: () => api.get('/analytics/schemes/performance'),
  getRegionalData: () => api.get('/analytics/regional'),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export default api;
