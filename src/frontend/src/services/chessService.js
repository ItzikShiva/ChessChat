import axios from 'axios';
import { Chess } from 'chess.js';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const chessService = {
  createGame: async (opponentId) => {
    try {
      const response = await axios.post(
        `${API_URL}/games`,
        { opponentId },
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create game' };
    }
  },

  getGame: async (gameId) => {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}`, {
        headers: authService.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game' };
    }
  },

  makeMove: async (gameId, move) => {
    try {
      const response = await axios.post(
        `${API_URL}/games/${gameId}/move`,
        { move },
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to make move' };
    }
  },

  getGameHistory: async (gameId) => {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/history`, {
        headers: authService.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game history' };
    }
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