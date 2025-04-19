import { io } from 'socket.io-client';
import authService from './authService';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';

class ChatService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Set();
    this.typingHandlers = new Set();
    this.userHandlers = new Set();
  }

  connect() {
    if (this.socket) return;

    const token = authService.getCurrentUser()?.token;
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupEventListeners() {
    this.socket.on('message', (message) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on('typing', (data) => {
      this.typingHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('userStatus', (data) => {
      this.userHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  sendMessage(message) {
    if (!this.socket) return;
    this.socket.emit('message', message);
  }

  startTyping() {
    if (!this.socket) return;
    this.socket.emit('typing', { isTyping: true });
  }

  stopTyping() {
    if (!this.socket) return;
    this.socket.emit('typing', { isTyping: false });
  }

  joinGameChat(gameId) {
    if (!this.socket) return;
    this.socket.emit('joinGame', { gameId });
  }

  leaveGameChat(gameId) {
    if (!this.socket) return;
    this.socket.emit('leaveGame', { gameId });
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler) {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onUserStatus(handler) {
    this.userHandlers.add(handler);
    return () => this.userHandlers.delete(handler);
  }
}

export default new ChatService(); 