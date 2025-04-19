import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Update API URL to handle both development and production
const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: ''
  });
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    balance: 1200
  });
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        console.log('Environment:', process.env.NODE_ENV);
        console.log('API URL:', API_URL);
        console.log('Token:', token);
        console.log('Headers:', headers);

        const [profileRes, statsRes, gamesRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/profile`, { headers }),
          axios.get(`${API_URL}/api/users/stats`, { headers }),
          axios.get(`${API_URL}/api/users/recent-games`, { headers })
        ]);

        console.log('Profile response:', profileRes.data);
        console.log('Stats response:', statsRes.data);
        console.log('Recent games response:', gamesRes.data);

        setProfile(profileRes.data);
        setStats(statsRes.data);
        setRecentGames(gamesRes.data);
        setFormData({
          username: profileRes.data.username,
          email: profileRes.data.email,
          bio: profileRes.data.bio || ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        formData,
        { headers }
      );
      
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  const getGameIcon = (result) => {
    switch (result) {
      case 'win':
        return <EmojiEventsIcon sx={{ color: 'success.main' }} />;
      case 'loss':
        return <RemoveCircleIcon sx={{ color: 'error.main' }} />;
      default:
        return <RadioButtonUncheckedIcon sx={{ color: 'info.main' }} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
            >
              {profile?.username?.[0]?.toUpperCase()}
            </Avatar>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  margin="normal"
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  sx={{ mt: 2, mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{ mt: 2 }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <>
                <Typography variant="h5" gutterBottom>
                  {profile?.username}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {profile?.email}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {profile?.bio || 'No bio yet'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{stats.gamesPlayed}</Typography>
                  <Typography color="text.secondary">Games Played</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{stats.gamesWon}</Typography>
                  <Typography color="text.secondary">Games Won</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{stats.gamesLost}</Typography>
                  <Typography color="text.secondary">Games Lost</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h4">{stats.balance}</Typography>
                  <Typography>Chess Coins</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Recent Games
            </Typography>
            <List>
              {recentGames.map((game) => (
                <ListItem key={game.id}>
                  <ListItemIcon>
                    {getGameIcon(game.result)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`vs ${game.opponent}`}
                    secondary={
                      <>
                        {formatDate(game.date)}
                        <Typography component="span" sx={{ ml: 2 }}>
                          Wager: {game.wager} coins
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={`${game.profit >= 0 ? '+' : ''}${game.profit}`}
                    color={game.profit > 0 ? 'success' : game.profit < 0 ? 'error' : 'default'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              ))}
              {recentGames.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No games played yet"
                    secondary="Start playing to see your game history!"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile; 