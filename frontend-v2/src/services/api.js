import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create axios instance
const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Methods
export const blockchainAPI = {
  // Health check
  healthCheck: () => apiService.get('/health'),

  // Statistics
  getStats: () => apiService.get('/blockchain/stats'),

  // Farmers
  getAllFarmers: () => apiService.get('/blockchain/farmers'),
  getFarmer: (address) => apiService.get(`/blockchain/farmers/${address}`),
  registerFarmer: (farmerData) => apiService.post('/blockchain/farmers/register', farmerData),
  syncFarmer: (address) => apiService.post('/blockchain/farmers/sync', { address }),
  autoSyncFarmers: () => apiService.post('/blockchain/auto-sync-farmers'),

  // Schemes
  getAllSchemes: () => apiService.get('/blockchain/schemes'),
  createScheme: (schemeData) => apiService.post('/blockchain/schemes/create', schemeData),
  syncScheme: (schemeId) => apiService.post('/blockchain/schemes/sync', { schemeId }),
  saveScheme: (schemeData) => apiService.post('/blockchain/schemes/save', schemeData),
  deleteScheme: (schemeId) => apiService.delete(`/blockchain/schemes/${schemeId}`),

  // Payments
  processPayment: (paymentData) => apiService.post('/blockchain/payments/process', paymentData)
};

// Analytics API (placeholder for future implementation)
export const analyticsAPI = {
  getOverview: () => apiService.get('/analytics/overview'),
  getFarmerStats: () => apiService.get('/analytics/farmers'),
  getSchemeStats: () => apiService.get('/analytics/schemes'),
  getPaymentTrends: () => apiService.get('/analytics/payments')
};

export default apiService;
