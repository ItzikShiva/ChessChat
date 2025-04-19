import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('message', (data) => {
        setMessages(prev => ({
          ...prev,
          [data.chatId]: [...(prev[data.chatId] || []), data]
        }));
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('typing', (data) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.chatId]: data.userId
        }));
      });

      newSocket.on('stopTyping', (data) => {
        setTypingUsers(prev => {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[data.chatId];
          return newTypingUsers;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  const sendMessage = (chatId, message) => {
    if (socket) {
      socket.emit('message', { chatId, message });
    }
  };

  const startTyping = (chatId) => {
    if (socket) {
      socket.emit('typing', { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket) {
      socket.emit('stopTyping', { chatId });
    }
  };

  const joinChat = (chatId) => {
    if (socket) {
      socket.emit('joinChat', { chatId });
    }
  };

  const leaveChat = (chatId) => {
    if (socket) {
      socket.emit('leaveChat', { chatId });
    }
  };

  const value = {
    socket,
    messages,
    typingUsers,
    unreadCount,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinChat,
    leaveChat,
    setUnreadCount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
