import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Flag as FlagIcon,
  Handshake as HandshakeIcon,
  Undo as UndoIcon,
  RotateLeft as RotateLeftIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

// Constants for piece values and position evaluation
const PIECE_VALUES = {
  p: 100,  // pawn
  n: 320,  // knight
  b: 330,  // bishop
  r: 500,  // rook
  q: 900,  // queen
  k: 20000 // king
} as const;

const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
] as const;

interface GameBoardProps {
  gameMode?: 'computer' | 'player';
  wager?: number;
  opponent?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  providedGameId?: string;
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameMode: propGameMode,
  wager: propWager,
  opponent: propOpponent,
  difficulty: propDifficulty,
  providedGameId: propGameId 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get game settings from route state or props
  const gameSettings = location.state || {
    gameMode: propGameMode || 'computer',
    wager: propWager || 0,
    difficulty: propDifficulty || 'medium',
    opponent: propOpponent || 'Computer'
  };

  const currentGameId = useRef<string>(gameId || propGameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const { user } = useAuth();
  const userId = user?._id;

  // Game state
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveFrom, setMoveFrom] = useState<string>('');
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, boolean>>({});
  const [moveSquares] = useState<Record<string, boolean>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, boolean>>({});
  const [gameStatus, setGameStatus] = useState<string>('');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [isComputerThinking, setIsComputerThinking] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Game control state
  const [drawOffered, setDrawOffered] = useState<boolean>(false);
  const [showDrawDialog, setShowDrawDialog] = useState<boolean>(false);
  const [showResignDialog, setShowResignDialog] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Add error handling for invalid game state
  useEffect(() => {
    if (!gameSettings.gameMode) {
      console.error('Invalid game settings:', gameSettings);
      navigate('/games');
    }
  }, [gameSettings, navigate]);

  // Rest of the component implementation...
  // Copy the remaining implementation from GameBoard.js
  
  return (
    <Grid container spacing={2} sx={{ height: '100%' }}>
      {/* Copy the JSX from GameBoard.js */}
    </Grid>
  );
};

export default GameBoard; 