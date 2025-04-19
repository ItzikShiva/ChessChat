import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from '../contexts/AuthContext';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <SportsEsportsIcon /> ChessChat
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              color="inherit"
              component={Link}
              to="/games"
              startIcon={<SportsEsportsIcon />}
            >
              Play
            </Button>
            
            <Button
              color="inherit"
              component={Link}
              to="/store"
              startIcon={<StorefrontIcon />}
            >
              Store
            </Button>

            <Button
              color="inherit"
              component={Link}
              to="/tournaments"
              startIcon={<EmojiEventsIcon />}
            >
              Tournaments
            </Button>

            <IconButton
              color="inherit"
              component={Link}
              to="/profile"
              sx={{ ml: 1 }}
            >
              <AccountCircleIcon />
            </IconButton>

            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 