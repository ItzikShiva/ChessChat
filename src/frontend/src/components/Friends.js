import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Tabs,
  Tab,
  Divider,
  TextField,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

function Friends() {
  const [activeTab, setActiveTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('/api/friends/requests');
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/users/search?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setLoading(false);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await axios.post('/api/friends/requests', { userId });
      setSearchResults(searchResults.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/requests/${requestId}/accept`);
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.post(`/api/friends/requests/${requestId}/reject`);
      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Friends" />
          <Tab label="Friend Requests" />
        </Tabs>

        {activeTab === 0 ? (
          <List>
            {friends.map((friend) => (
              <React.Fragment key={friend.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{friend.username[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend.username}
                    secondary={friend.status || 'Online'}
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    component="a"
                    href={`/chat/${friend.id}`}
                  >
                    Message
                  </Button>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <List>
            {friendRequests.map((request) => (
              <React.Fragment key={request.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{request.sender.username[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.sender.username}
                    secondary="Sent you a friend request"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Reject
                    </Button>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {searchResults.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>
          <List>
            {searchResults.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{user.username[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} />
                  <IconButton
                    color="primary"
                    onClick={() => handleSendFriendRequest(user.id)}
                  >
                    <AddIcon />
                  </IconButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

export default Friends; 