import React from 'react';
import { Routes as RouterRoutes, Route, Navigate, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Games from './components/Games';
import GameBoard from './components/GameBoard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Wrapper component to pass URL parameters to GameBoard
const GameBoardWrapper: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  return <GameBoard gameMode="player" providedGameId={gameId} />;
};

const Routes: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <RouterRoutes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <Games />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GameBoardWrapper />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/games" replace />} />
          <Route path="*" element={<Navigate to="/games" replace />} />
        </RouterRoutes>
      </Box>
    </Box>
  );
};

export default Routes; 