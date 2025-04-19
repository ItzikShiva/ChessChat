import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import chatService from '../services/chatService';
import authService from '../services/authService';

const Chat = () => {
  const { gameId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    chatService.connect();

    const handleMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    const handleTyping = ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(username);
        } else {
          newSet.delete(username);
        }
        return newSet;
      });
    };

    const messageUnsubscribe = chatService.onMessage(handleMessage);
    const typingUnsubscribe = chatService.onTyping(handleTyping);

    if (gameId) {
      chatService.joinGameChat(gameId);
    }

    return () => {
      messageUnsubscribe();
      typingUnsubscribe();
      if (gameId) {
        chatService.leaveGameChat(gameId);
      }
      chatService.disconnect();
    };
  }, [gameId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      chatService.sendMessage({
        content: newMessage,
        gameId,
        timestamp: new Date().toISOString(),
      });
      setNewMessage('');
      chatService.stopTyping();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleTyping = () => {
    chatService.startTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      chatService.stopTyping();
    }, 3000);
  };

  const currentUser = authService.getCurrentUser();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Chat
        </Typography>
        <List sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>{message.sender.username[0].toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={message.sender.username}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>

        {typingUsers.size > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </Typography>
        )}

        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            error={!!error}
            helperText={error}
          />
          <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat; 