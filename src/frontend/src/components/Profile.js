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
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

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
    rating: 1200
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      setProfile(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        bio: response.data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
      await axios.put('/api/users/profile', formData);
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              src={profile.avatar}
            >
              {profile.username[0]}
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
                  sx={{ mt: 2 }}
                >
                  Save Changes
                </Button>
              </form>
            ) : (
              <>
                <Typography variant="h5" gutterBottom>
                  {profile.username}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {profile.bio || 'No bio yet'}
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
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{stats.rating}</Typography>
                  <Typography color="text.secondary">Rating</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Recent Games
            </Typography>
            <List>
              {/* Add recent games list here */}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile; 