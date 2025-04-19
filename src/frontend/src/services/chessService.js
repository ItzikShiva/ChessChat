import axios from 'axios';
import { Chess } from 'chess.js';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const chessService = {
  createGame: async (gameData) => {
    const response = await axios.post(`${API_URL}/games`, gameData);
    return response.data;
  },

  getGame: async (gameId) => {
    const response = await axios.get(`${API_URL}/games/${gameId}`);
    return response.data;
  },

  makeMove: async (gameId, move) => {
    const response = await axios.post(`${API_URL}/games/${gameId}/move`, move);
    return response.data;
  },

  getGameHistory: async (gameId) => {
    const response = await axios.get(`${API_URL}/games/${gameId}/history`);
    return response.data;
  },

  // Local game state management
  initializeGame: (fen = null) => {
    return new Chess(fen);
  },

  getLegalMoves: (game, square) => {
    return game.moves({ square, verbose: true });
  },

  isGameOver: (game) => {
    return game.isGameOver();
  },

  getGameStatus: (game) => {
    if (game.isCheckmate()) return 'checkmate';
    if (game.isDraw()) return 'draw';
    if (game.isStalemate()) return 'stalemate';
    if (game.isThreefoldRepetition()) return 'threefold-repetition';
    if (game.isInsufficientMaterial()) return 'insufficient-material';
    return 'in-progress';
  },
};

export default chessService; 