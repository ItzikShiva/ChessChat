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
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  margin-top: 20px;
`;

const Header = styled.header`
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  color: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    navigate('/login');
  };

  return (
    <MainContainer>
      <ChessBackground />
      <Header>
        <HeaderContent>
          <Logo>Chess<span>Chat</span></Logo>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/friends">
                Friends
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
        </HeaderContent>
      </Header>
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