import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Celo network configuration
const CELO_MAINNET = {
  chainId: '0xa4ec', // 42220 in hex
  chainName: 'Celo Mainnet',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: ['https://forno.celo.org'],
  blockExplorerUrls: ['https://explorer.celo.org'],
};

const CELO_TESTNET = {
  chainId: '0xaef3', // 44787 in hex
  chainName: 'Celo Alfajores Testnet',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
  blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org'],
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Add or switch to Celo network
  const addCeloNetwork = async (useTestnet = true) => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    const networkConfig = useTestnet ? CELO_TESTNET : CELO_MAINNET;

    try {
      // Try to switch to the network first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError) {
          throw new Error('Failed to add Celo network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Add/switch to Celo network first
      await addCeloNetwork(true); // Use testnet for development

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(Number(network.chainId));

      // Store connection state for persistence
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', accounts[0]);

    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError('');
    
    // Clear connection state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(Number(chainId));
      // Refresh the page when chain changes for simplicity
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Auto-reconnect on page load if previously connected
  useEffect(() => {
    const reconnectWallet = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const savedAddress = localStorage.getItem('walletAddress');

      if (wasConnected === 'true' && savedAddress && isMetaMaskInstalled()) {
        try {
          // Check if MetaMask still has accounts
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });

          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            // Reconnect silently
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setAccount(accounts[0]);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(Number(network.chainId));
            
            console.log('✅ Wallet reconnected:', accounts[0]);
          } else {
            // Clear stale connection
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
          }
        } catch (err) {
          console.error('Failed to reconnect wallet:', err);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAddress');
        }
      }
    };

    reconnectWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get user's role based on their address (simplified logic)
  const getUserRole = () => {
    if (!account) return null;
    
    // You can implement more sophisticated role detection here
    // For now, we'll use a simple mapping or let users choose
    return 'farmer'; // Default role
  };

  // Check if connected to Celo network
  const isConnectedToCelo = () => {
    return chainId === 42220 || chainId === 44787; // Mainnet or testnet
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    isConnected: !!account,
    isConnectedToCelo: isConnectedToCelo(),
    connectWallet,
    disconnectWallet,
    addCeloNetwork,
    getUserRole,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
