import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

type GameMode = 'computer' | 'player' | 'tournament';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameSettings {
  mode: GameMode;
  wager: number;
  difficulty?: Difficulty;
}

function Games() {
  const navigate = useNavigate();
  const [openWagerDialog, setOpenWagerDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [wagerAmount, setWagerAmount] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const handlePlayClick = (mode: GameMode) => {
    setSelectedMode(mode);
    setOpenWagerDialog(true);
  };

  const handleStartGame = () => {
    const amount = parseInt(wagerAmount) || 0;
    
    if (!selectedMode) return;

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (selectedMode) {
      case 'computer':
        navigate(`/game/${gameId}`, {
          state: {
            gameMode: 'computer',
            wager: amount,
            difficulty,
            opponent: `Computer (${difficulty})`
          }
        });
        break;
      case 'player':
        navigate(`/game/${gameId}`, {
          state: {
            gameMode: 'player',
            wager: amount
          }
        });
        break;
      case 'tournament':
        navigate('/tournaments');
        break;
    }
    
    setOpenWagerDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Play Chess
      </Typography>

      <Grid container spacing={3}>
        {/* Play vs Computer */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ComputerIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Play vs Computer
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Practice your skills against our AI with different difficulty levels
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handlePlayClick('computer')}
              >
                Play Now
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Play vs Player */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Play vs Player
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Challenge other players and bet your chess coins
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handlePlayClick('player')}
              >
                Find Match
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Tournaments */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEventsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Tournaments
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Join tournaments to win big prizes and climb the leaderboard
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handlePlayClick('tournament')}
              >
                Browse Tournaments
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Wager Dialog */}
      <Dialog open={openWagerDialog} onClose={() => setOpenWagerDialog(false)}>
        <DialogTitle>Game Settings</DialogTitle>
        <DialogContent>
          {selectedMode === 'computer' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          )}
          <TextField
            autoFocus
            margin="normal"
            label="Wager Amount (Chess Coins)"
            type="number"
            fullWidth
            value={wagerAmount}
            onChange={(e) => setWagerAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWagerDialog(false)}>Cancel</Button>
          <Button onClick={handleStartGame} variant="contained">
            Start Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Games; 