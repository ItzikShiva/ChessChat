import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import { createGlobalStyle } from 'styled-components';

// Components
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import GameBoard from './components/GameBoard';
import Chat from './components/Chat';
import Friends from './components/Friends';
import Profile from './components/Profile';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          color: '#ffffff'
        }
      }
    }
  }
});

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #121212 !important;
    color: #ffffff;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <GlobalStyle />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/game/:gameId" element={<GameBoard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 