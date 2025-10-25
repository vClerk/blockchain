// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  CONTRACT_ADDRESS: '0x043F679987b6B0c749FBC79B8e56AC8Ed03bc7cF',
  CHAIN_ID: 44787, // Celo Alfajores Testnet
  CHAIN_ID_HEX: '0xaef3',
  CHAIN_NAME: 'Celo Alfajores Testnet',
  RPC_URL: 'https://alfajores-forno.celo-testnet.org',
  BLOCK_EXPLORER_URL: 'https://alfajores.celoscan.io',
  CURRENCY: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18
  }
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'SmartSubsidy',
  VERSION: '2.0.0',
  DESCRIPTION: 'Blockchain-powered agricultural subsidy distribution'
};

// User Roles
export const USER_ROLES = {
  GOVERNMENT: 'government',
  FARMER: 'farmer'
};

// Scheme Categories
export const SCHEME_CATEGORIES = [
  'Seeds',
  'Fertilizers',
  'Equipment',
  'Irrigation',
  'Insurance',
  'Training',
  'Marketing',
  'Other'
];
