import React from 'react';
import styled from 'styled-components';
import ChessBackground from './ChessBackground';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainContainer = styled.div`
  min-height: 100vh;
  position: relative;
  font-family: 'Roboto', sans-serif;
  background-color: #121212;
  color: #ffffff;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
`;

const StyledAppBar = styled(AppBar)`
  background-color: #1e1e1e !important;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  span {
    color: #ffd700;
  }
`;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <MainContainer>
      <ChessBackground />
      <StyledAppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 'bold'
            }}
          >
            ChessChat
          </Typography>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/game/new">
                New Game
              </Button>
              <Button color="inherit" component={RouterLink} to="/chat">
                Chat
              </Button>
              <Button color="inherit" component={RouterLink} to="/profile">
                Profile
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </StyledAppBar>
      <ContentContainer>
        {children}
      </ContentContainer>
      <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} ChessChat. All rights reserved.
        </Typography>
      </Box>
    </MainContainer>
  );
};

export default Layout; 