import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar
} from '@mui/material';
import {
  AccountBalance,
  Person,
  ExitToApp,
  Dashboard as DashboardIcon,
  Analytics,
  History,
  Home
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const handleGoHome = () => {
    // Clear user session when going home
    localStorage.removeItem('user');
    navigate('/login');
    handleClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'government':
        return 'primary';
      case 'farmer':
        return 'secondary';
      case 'ngo':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="home"
          sx={{ mr: 1 }}
          onClick={handleGoHome}
        >
          <AccountBalance />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={handleGoHome}
        >
          SmartSubsidy
        </Typography>

        {user ? (
          <>
            <Chip
              label={user.role?.toUpperCase()}
              color={getRoleColor(user.role)}
              size="small"
              sx={{ mr: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleGoHome}>
                  <Home sx={{ mr: 1 }} />
                  Home
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                  <DashboardIcon sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/transactions')}>
                  <History sx={{ mr: 1 }} />
                  Transactions
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/analytics')}>
                  <Analytics sx={{ mr: 1 }} />
                  Analytics
                </MenuItem>
                <MenuItem onClick={onLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Button color="inherit" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
