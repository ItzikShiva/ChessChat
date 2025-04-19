import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import paymentService from '../services/paymentService';

const TournamentList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    entryFee: 0,
    maxPlayers: 8,
    startTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentsData, balanceData] = await Promise.all([
        tournamentService.getTournaments(),
        paymentService.getBalance()
      ]);
      setTournaments(tournamentsData);
      setBalance(balanceData.chessCoins);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      await tournamentService.createTournament(newTournament);
      setOpenCreateDialog(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create tournament');
    }
  };

  const handleRegister = async (tournamentId, entryFee) => {
    try {
      if (balance < entryFee) {
        setError('Insufficient balance');
        return;
      }
      await tournamentService.registerForTournament(tournamentId);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to register for tournament');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tournaments</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Balance: {balance} Chess Coins
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Tournament
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {tournaments.map((tournament) => (
          <Grid item xs={12} md={6} lg={4} key={tournament.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {tournament.name}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={tournament.status}
                    color={getStatusColor(tournament.status)}
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${tournament.currentPlayers}/${tournament.maxPlayers} players`}
                    color="info"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Entry Fee: {tournament.entryFee} Chess Coins
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prize Pool: {tournament.prizePool} Chess Coins
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starts: {formatDate(tournament.startTime)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  View Details
                </Button>
                {tournament.status === 'pending' && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleRegister(tournament.id, tournament.entryFee)}
                    disabled={balance < tournament.entryFee}
                  >
                    Register
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Tournament</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tournament Name"
            fullWidth
            value={newTournament.name}
            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Entry Fee (Chess Coins)"
            type="number"
            fullWidth
            value={newTournament.entryFee}
            onChange={(e) => setNewTournament({ ...newTournament, entryFee: parseInt(e.target.value) })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Max Players</InputLabel>
            <Select
              value={newTournament.maxPlayers}
              onChange={(e) => setNewTournament({ ...newTournament, maxPlayers: e.target.value })}
            >
              <MenuItem value={8}>8 Players</MenuItem>
              <MenuItem value={16}>16 Players</MenuItem>
              <MenuItem value={32}>32 Players</MenuItem>
              <MenuItem value={64}>64 Players</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Start Time"
            type="datetime-local"
            fullWidth
            value={newTournament.startTime}
            onChange={(e) => setNewTournament({ ...newTournament, startTime: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTournament} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList; 