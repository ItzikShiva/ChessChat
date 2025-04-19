import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import { createGame } from '../services/chessService';

const NewGame = () => {
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState('10+0');
  const [opponentType, setOpponentType] = useState('human'); // 'human' or 'computer'
  const [computerDifficulty, setComputerDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const gameData = {
        timeControl,
        opponentType,
        ...(opponentType === 'computer' && { computerDifficulty })
      };

      const game = await createGame(gameData);
      navigate(`/game/${game.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          New Game
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Opponent Type</InputLabel>
              <Select
                value={opponentType}
                onChange={(e) => setOpponentType(e.target.value)}
                label="Opponent Type"
              >
                <MenuItem value="human">Human</MenuItem>
                <MenuItem value="computer">Computer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {opponentType === 'computer' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Computer Difficulty</InputLabel>
                <Select
                  value={computerDifficulty}
                  onChange={(e) => setComputerDifficulty(e.target.value)}
                  label="Computer Difficulty"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Time Control</InputLabel>
              <Select
                value={timeControl}
                onChange={(e) => setTimeControl(e.target.value)}
                label="Time Control"
              >
                <MenuItem value="1+0">1 minute</MenuItem>
                <MenuItem value="3+0">3 minutes</MenuItem>
                <MenuItem value="5+0">5 minutes</MenuItem>
                <MenuItem value="10+0">10 minutes</MenuItem>
                <MenuItem value="15+10">15 minutes + 10 seconds increment</MenuItem>
                <MenuItem value="30+0">30 minutes</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartGame}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'Creating Game...' : 'Start Game'}
            </Button>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Typography color="error" align="center">
                {error}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default NewGame; 