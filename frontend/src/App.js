import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, ThemeProvider, CssBaseline } from '@mui/material';
import { Web3Provider } from './contexts/Web3Context';
import professionalTheme from './theme/professionalTheme';
import ProfessionalLanding from './pages/ProfessionalLanding';
import ProfessionalLogin from './pages/ProfessionalLogin';
import Dashboard from './pages/Dashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';
import MetaMaskLogin from './pages/MetaMaskLogin';
import OAuthLogin from './pages/OAuthLogin';
import OAuthCallback from './pages/OAuthCallback';
import FarmerRegistration from './pages/FarmerRegistration';
import SchemeCreation from './pages/SchemeCreation';
import PaymentProcessing from './pages/PaymentProcessing';
import TransactionHistory from './pages/TransactionHistory';
import Analytics from './pages/Analytics';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={professionalTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route 
            path="/" 
            element={<ProfessionalLanding />} 
          />
          
          <Route 
            path="/login" 
            element={<ProfessionalLogin onLogin={handleLogin} />} 
          />
          
          <Route 
            path="/login-old" 
            element={<MetaMaskLogin onLogin={handleLogin} />} 
          />
        
        <Route 
          path="/oauth-login" 
          element={<OAuthLogin />} 
        />
        
        <Route 
          path="/auth/callback" 
          element={<OAuthCallback onLogin={handleLogin} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/farmer-dashboard" 
          element={user?.role === 'farmer' ? <FarmerDashboard user={user} /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/government-dashboard" 
          element={user?.role === 'government' ? <GovernmentDashboard user={user} /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/register-farmer" 
          element={<FarmerRegistration />} 
        />
        
        <Route 
          path="/create-scheme" 
          element={user?.role === 'government' ? <SchemeCreation /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/process-payment" 
          element={user?.role === 'government' ? <PaymentProcessing /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/transactions" 
          element={user ? <TransactionHistory user={user} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/analytics" 
          element={user ? <Analytics /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
