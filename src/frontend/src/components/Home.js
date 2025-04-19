import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to ChessChat
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Play chess, chat with friends, and improve your game
        </Typography>
        {!user && (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/register"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              component={RouterLink}
              to="/login"
            >
              Login
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Play Chess
            </Typography>
            <Typography paragraph>
              Challenge your friends to a game of chess. Our intuitive interface makes it easy to play and learn.
            </Typography>
            {user && (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/game/new"
              >
                Start New Game
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Real-time Chat
            </Typography>
            <Typography paragraph>
              Chat with your opponents during games or join our community chat rooms to discuss strategies and make new friends.
            </Typography>
            {user && (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/chat"
              >
                Join Chat
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Track Progress
            </Typography>
            <Typography paragraph>
              Monitor your performance, view game history, and track your rating as you improve your chess skills.
            </Typography>
            {user && (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/profile"
              >
                View Profile
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Home; 