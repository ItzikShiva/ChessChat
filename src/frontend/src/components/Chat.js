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
  Button,
  Grid,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

function Chat() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    joinChat,
    leaveChat,
    setUnreadCount
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [currentChat, setCurrentChat] = useState(gameId || null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to chat socket');
      if (currentChat) {
        socketRef.current.emit('join chat', currentChat);
      }
    });

    socketRef.current.on('message received', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('typing', ({ userId, username, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(username);
        } else {
          newSet.delete(username);
        }
        return newSet;
      });
    });

    return () => {
      if (socketRef.current) {
        if (currentChat) {
          socketRef.current.emit('leave chat', currentChat);
        }
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (currentChat) {
      joinChat(currentChat);
      setUnreadCount(0);
    }
    return () => {
      if (currentChat) {
        leaveChat(currentChat);
      }
    };
  }, [currentChat, joinChat, leaveChat, setUnreadCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    const messageData = {
      content: newMessage,
      sender: {
        _id: user._id,
        username: user.username
      },
      chatId: currentChat,
      timestamp: new Date().toISOString()
    };

    socketRef.current?.emit('new message', messageData);
    setNewMessage('');
    stopTyping(currentChat);
  };

  const handleTyping = () => {
    if (!currentChat) return;

    startTyping(currentChat);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentChat);
    }, 3000);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          {gameId ? 'Game Chat' : 'Global Chat'}
        </Typography>

        <List sx={{ 
          flex: 1, 
          overflow: 'auto', 
          mb: 2,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555'
            }
          }
        }}>
          {messages.map((message, index) => (
            <React.Fragment key={message._id || index}>
              <ListItem alignItems="flex-start" sx={{
                justifyContent: message.sender._id === user._id ? 'flex-end' : 'flex-start'
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: message.sender._id === user._id ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  maxWidth: '80%'
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: message.sender._id === user._id ? 'primary.main' : 'secondary.main' }}>
                      {message.sender.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{
                    bgcolor: message.sender._id === user._id ? 'primary.main' : 'grey.200',
                    color: message.sender._id === user._id ? 'white' : 'text.primary',
                    p: 2,
                    borderRadius: 2,
                    position: 'relative'
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {message.sender.username}
                    </Typography>
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: 'block',
                      mt: 0.5,
                      color: message.sender._id === user._id ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
              {index < messages.length - 1 && (
                <Divider variant="inset" component="li" sx={{ my: 1 }} />
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>

        {typingUsers.size > 0 && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mb: 1, fontStyle: 'italic' }}
          >
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </Typography>
        )}

        <Box 
          component="form" 
          onSubmit={handleSendMessage} 
          sx={{ 
            display: 'flex', 
            gap: 1,
            mt: 'auto'
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px'
              }
            }}
          />
          <IconButton 
            type="submit" 
            color="primary"
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}

export default Chat; 