import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

function Chat() {
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
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
    if (newMessage.trim() && currentChat) {
      sendMessage(currentChat, newMessage);
      setNewMessage('');
      stopTyping(currentChat);
    }
  };

  const handleTyping = () => {
    if (currentChat) {
      startTyping(currentChat);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentChat);
      }, 3000);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Chat List */}
      <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Chats
        </Typography>
        <List>
          {/* Add chat list items here */}
        </List>
      </Paper>

      {/* Chat Messages */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentChat ? (
          <>
            <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <List>
                {messages[currentChat]?.map((message, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <Avatar sx={{ mr: 2 }}>{message.sender.username[0]}</Avatar>
                      <ListItemText
                        primary={message.sender.username}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {message.content}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
              </List>
              {typingUsers[currentChat] && (
                <Typography variant="caption" color="text.secondary">
                  Someone is typing...
                </Typography>
              )}
            </Paper>
            <Paper
              component="form"
              onSubmit={handleSendMessage}
              sx={{ p: 2, display: 'flex', alignItems: 'center' }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleTyping}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={!newMessage.trim()}
              >
                <SendIcon />
              </IconButton>
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Chat; 