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
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Initial state values
const INITIAL_FORM_STATE = {
  username: '',
  email: '',
  bio: ''
};

const INITIAL_STATS_STATE = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  rating: 1200
};

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [stats, setStats] = useState(INITIAL_STATS_STATE);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = authService.getAuthHeader();
        if (!headers.Authorization) {
          throw new Error('No authentication token found');
        }

        const [profileRes, statsRes, gamesRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/profile`, { headers }),
          axios.get(`${API_URL}/api/users/stats`, { headers }),
          axios.get(`${API_URL}/api/users/recent-games`, { headers })
        ]);

        setProfile(profileRes.data);
        setStats({
          ...INITIAL_STATS_STATE,
          ...statsRes.data,
          gamesLost: statsRes.data.gamesPlayed - statsRes.data.gamesWon
        });
        setRecentGames(gamesRes.data);
        setFormData({
          username: profileRes.data.username,
          email: profileRes.data.email,
          bio: profileRes.data.bio || ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load profile');
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
    setError(null); // Clear any previous errors when user starts editing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const headers = authService.getAuthHeader();
      
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        formData,
        { headers }
      );

      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ width: 100, height: 100 }}
              src={profile?.avatar}
            >
              {profile?.username?.[0]?.toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="username"
                      label="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="bio"
                      label="Bio"
                      multiline
                      rows={3}
                      value={formData.bio}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                        setFormData({
                          username: profile.username,
                          email: profile.email,
                          bio: profile.bio || ''
                        });
                      }}
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    {profile?.username}
                  </Typography>
                  <Button
                    onClick={() => setIsEditing(true)}
                    startIcon={<EditIcon />}
                  >
                    Edit Profile
                  </Button>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {profile?.email}
                </Typography>
                <Typography>
                  {profile?.bio || 'No bio yet'}
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stats
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmojiEventsIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Games Won"
                  secondary={stats.gamesWon}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <RemoveCircleIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Games Lost"
                  secondary={stats.gamesLost}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <RadioButtonUncheckedIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Total Games"
                  secondary={stats.gamesPlayed}
                />
              </ListItem>
            </List>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                Rating:
              </Typography>
              <Chip 
                label={stats.rating} 
                color={stats.rating >= 1500 ? 'success' : 'primary'}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Games
            </Typography>
            <List>
              {recentGames.map((game, index) => (
                <React.Fragment key={game.id}>
                  <ListItem>
                    <ListItemText
                      primary={`vs ${game.opponent}`}
                      secondary={`${game.result} • ${new Date(game.date).toLocaleDateString()}`}
                    />
                    <Chip 
                      label={game.ratingChange > 0 ? `+${game.ratingChange}` : game.ratingChange}
                      color={game.ratingChange > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </ListItem>
                  {index < recentGames.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentGames.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent games" />
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