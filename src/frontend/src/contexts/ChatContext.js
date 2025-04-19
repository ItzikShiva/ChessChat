import React, { createContext, useContext, useState, useEffect } from 'react';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChats, setActiveChats] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    chatService.connect();

    const handleConnection = () => {
      setIsConnected(true);
    };

    const handleDisconnection = () => {
      setIsConnected(false);
    };

    chatService.socket?.on('connect', handleConnection);
    chatService.socket?.on('disconnect', handleDisconnection);

    return () => {
      chatService.socket?.off('connect', handleConnection);
      chatService.socket?.off('disconnect', handleDisconnection);
      chatService.disconnect();
    };
  }, []);

  const joinChat = (chatId) => {
    setActiveChats((prev) => new Set([...prev, chatId]));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const leaveChat = (chatId) => {
    setActiveChats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(chatId);
      return newSet;
    });
  };

  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  const value = {
    unreadCount,
    activeChats,
    isConnected,
    joinChat,
    leaveChat,
    incrementUnreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 