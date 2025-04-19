import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import chessService from '../services/chessService';

const NewGame = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async (opponentId = null) => {
    setLoading(true);
    setError('');

    try {
      const game = await chessService.createGame(opponentId);
      navigate(`/game/${game.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Start a New Game
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleCreateGame()}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Play Random Opponent
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Play with Friends
        </Typography>
        <TextField
          fullWidth
          label="Search Friends"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <List>
          {friends.map((friend) => (
            <React.Fragment key={friend.id}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleCreateGame(friend.id)}>
                  <ListItemText
                    primary={friend.username}
                    secondary={`Rating: ${friend.rating}`}
                  />
                </ListItemButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default NewGame; 