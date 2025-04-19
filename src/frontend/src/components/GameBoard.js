import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

// Constants for piece values and position evaluation
const PIECE_VALUES = {
  p: 100,  // pawn
  n: 320,  // knight
  b: 330,  // bishop
  r: 500,  // rook
  q: 900,  // queen
  k: 20000 // king
};

const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

function GameBoard({ gameMode = 'computer', wager = 20, opponent = 'Computer', difficulty = 'medium', providedGameId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { gameId } = useParams();
  const currentGameId = useRef(gameId || providedGameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const { user } = useAuth();
  const userId = user?._id;
  const navigate = useNavigate();

  // Game state
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [gameStatus, setGameStatus] = useState('');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [error, setError] = useState('');

  // Game control state
  const [drawOffered, setDrawOffered] = useState(false);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    socketRef.current = io(BACKEND_URL, {
      query: { gameId: currentGameId.current }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to game socket');
      socketRef.current.emit('join game', currentGameId.current);
    });

    socketRef.current.on('message received', handleMessageReceived);
    socketRef.current.on('game state', handleGameStateUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave game', currentGameId.current);
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Message handlers
  const handleMessageReceived = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleGameStateUpdate = useCallback((newState) => {
    if (newState.fen) {
      setGame(new Chess(newState.fen));
    }
  }, []);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await axios.get(`/api/messages/${currentGameId.current}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading messages:', error);
        // In computer mode, initialize with empty messages array
        if (gameMode === 'computer') {
          setMessages([]);
        }
      }
    };
    loadMessages();
  }, [gameMode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Game logic
  const makeComputerMove = useCallback(() => {
    if (game.isGameOver() || game.turn() === 'w') return;

    setIsComputerThinking(true);
    setTimeout(() => {
      const possibleMoves = game.moves({ verbose: true });
      if (possibleMoves.length === 0) {
        setIsComputerThinking(false);
        return;
      }

      const [bestMove, bestScore] = findBestMove(game, possibleMoves);

      if (bestMove) {
        game.move(bestMove);
        setGame(new Chess(game.fen()));
        addMoveToHistory(bestMove);
        
        emitGameMove(bestMove);
      }
      setIsComputerThinking(false);
    }, 500);
  }, [game]);

  const findBestMove = (game, possibleMoves) => {
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      const score = minimax(newGame, 3, -Infinity, Infinity, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return [bestMove, bestScore];
  };

  const emitGameMove = (move) => {
    // Emit game state update
    socketRef.current?.emit('game state', {
      gameId: currentGameId.current,
      fen: game.fen()
    });

    // Emit computer's move as a chat message
    socketRef.current?.emit('new message', {
      gameId: currentGameId.current,
      content: `Computer moved ${move.from} to ${move.to}`,
      sender: { _id: 'computer', username: 'Computer' }
    });
  };

  // Minimax algorithm with alpha-beta pruning
  const minimax = (board, depth, alpha, beta, maximizingPlayer) => {
    if (depth === 0 || board.isGameOver()) {
      return evaluateBoard(board);
    }

    if (maximizingPlayer) {
      let maxEval = -Infinity;
      const moves = board.moves();
      for (const move of moves) {
        const newBoard = new Chess(board.fen());
        newBoard.move(move);
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      const moves = board.moves();
      for (const move of moves) {
        const newBoard = new Chess(board.fen());
        newBoard.move(move);
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // Board evaluation function
  const evaluateBoard = (board) => {
    let score = 0;
    
    // Material score
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board.get(String.fromCharCode(97 + j) + (8 - i));
        if (piece) {
          const value = PIECE_VALUES[piece.type];
          score += piece.color === 'w' ? value : -value;
          
          // Add positional bonus for pawns
          if (piece.type === 'p') {
            const position = i * 8 + j;
            score += piece.color === 'w' ? PAWN_TABLE[position] : -PAWN_TABLE[63 - position];
          }
        }
      }
    }
    
    return score;
  };

  // Move handlers
  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen for simplicity
      });

      if (move) {
        setGame(new Chess(game.fen()));
        addMoveToHistory(move);

        // Emit move to other players
        socketRef.current?.emit('game state', {
          gameId: currentGameId.current,
          fen: game.fen()
        });

        // Make computer move if in computer mode
        if (gameMode === 'computer') {
          makeComputerMove();
        }

        return true;
      }
    } catch (error) {
      setError('Invalid move');
      return false;
    }
    return false;
  };

  // Add move to history
  const addMoveToHistory = useCallback((move) => {
    setMoveHistory(prev => [...prev, {
      from: move.from,
      to: move.to,
      piece: move.piece,
      san: game.history()[game.history().length - 1],
      fen: game.fen()
    }]);
  }, [game]);

  // Undo last move
  const undoLastMove = useCallback(() => {
    if (moveHistory.length > 0) {
      game.undo();
      if (gameMode === 'computer') {
        game.undo(); // Undo computer's move as well
      }
      setGame(new Chess(game.fen()));
      setMoveHistory(prev => prev.slice(0, -1));
      
      // Emit the undo action
      socketRef.current?.emit('game state', {
        gameId: currentGameId.current,
        fen: game.fen()
      });
    }
  }, [game, gameMode, moveHistory.length]);

  // Flip the board
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Game control handlers
  const handleResign = () => {
    setShowResignDialog(false);
    setGameStatus('resigned');
    navigate('/games');
  };

  const handleDrawOffer = () => {
    if (gameMode === 'computer') {
      const shouldAccept = shouldComputerAcceptDraw(game);
      handleComputerDrawResponse(shouldAccept);
    } else {
      setDrawOffered(true);
      setShowDrawDialog(true);
    }
  };

  const shouldComputerAcceptDraw = (game) => {
    const moveCount = game.moveNumber();
    const materialScore = evaluateBoard(game);
    return moveCount > 30 || Math.abs(materialScore) < 200;
  };

  const handleComputerDrawResponse = (accept) => {
    if (accept) {
      setGameStatus('drawn');
      navigate('/games');
    } else {
      setDrawOffered(false);
    }
  };

  const handleDrawResponse = (accept) => {
    setShowDrawDialog(false);
    if (accept) {
      setGameStatus('drawn');
      navigate('/games');
    } else {
      setDrawOffered(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      gameId: currentGameId.current,
      content: newMessage,
      sender: { _id: userId, username: user.username }
    };

    // Send message through socket
    socketRef.current?.emit('new message', messageData);

    // In computer mode, add message directly to state
    if (gameMode === 'computer') {
      setMessages(prev => [...prev, messageData]);
    }

    setNewMessage('');
  };

  return (
    <Grid container spacing={2} sx={{ p: 2, height: '100vh' }}>
      {/* Chess Board Column */}
      <Grid item xs={12} md={8} lg={8}>
        <Box sx={{ 
          width: '100%',
          aspectRatio: '1/1',
          maxWidth: isMobile ? '100%' : 800,
          margin: '0 auto'
        }}>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
            customBoardStyle={{
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[4]
            }}
          />
        </Box>

        {/* Game Controls - Mobile View */}
        {isMobile && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Controls
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setShowResignDialog(true)}
                  startIcon={<FlagIcon />}
                  color="error"
                >
                  Resign
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleDrawOffer}
                  startIcon={<HandshakeIcon />}
                  disabled={drawOffered}
                >
                  Draw
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={undoLastMove}
                  startIcon={<UndoIcon />}
                  disabled={moveHistory.length === 0 || gameMode !== 'computer'}
                >
                  Undo
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={flipBoard}
                  startIcon={<RotateLeftIcon />}
                >
                  Flip
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Grid>

      {/* Game Controls and Chat Column */}
      <Grid item xs={12} md={4} lg={4}>
        {/* Game Controls - Desktop View */}
        {!isMobile && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Controls
            </Typography>
            <ButtonGroup
              orientation={isTablet ? 'vertical' : 'horizontal'}
              variant="contained"
              fullWidth
              sx={{ mb: 2 }}
            >
              <Button
                onClick={() => setShowResignDialog(true)}
                startIcon={<FlagIcon />}
                color="error"
              >
                Resign
              </Button>
              <Button
                onClick={handleDrawOffer}
                startIcon={<HandshakeIcon />}
                disabled={drawOffered}
              >
                Draw
              </Button>
              <Button
                onClick={undoLastMove}
                startIcon={<UndoIcon />}
                disabled={moveHistory.length === 0 || gameMode !== 'computer'}
              >
                Undo
              </Button>
              <Button
                onClick={flipBoard}
                startIcon={<RotateLeftIcon />}
              >
                Flip
              </Button>
            </ButtonGroup>
          </Paper>
        )}

        {/* Status Messages */}
        {isComputerThinking && (
          <Alert 
            icon={<CircularProgress size={20} />} 
            severity="info"
            sx={{ mb: 2 }}
          >
            Computer is thinking...
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError('')}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Chat Section */}
        <Paper sx={{
          height: isMobile ? 'auto' : 'calc(100vh - 300px)',
          display: 'flex',
          flexDirection: 'column',
          p: 2
        }}>
          <Typography variant="h6" gutterBottom>
            Game Chat
          </Typography>
          
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 2
          }}>
            {messages.map((message, index) => (
              <Box
                key={message._id || index}
                sx={{
                  alignSelf: message.sender._id === userId ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <Paper sx={{
                  p: 1,
                  bgcolor: message.sender._id === userId ? 'primary.main' : 'grey.200',
                  color: message.sender._id === userId ? 'white' : 'text.primary',
                  borderRadius: theme.shape.borderRadius
                }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    {message.sender.username}
                  </Typography>
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>

          <Box 
            component="form" 
            onSubmit={handleSendMessage} 
            sx={{
              display: 'flex',
              gap: 1
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.shape.borderRadius
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
      </Grid>

      {/* Dialogs */}
      <Dialog open={showResignDialog} onClose={() => setShowResignDialog(false)}>
        <DialogTitle>Confirm Resignation</DialogTitle>
        <DialogContent>
          Are you sure you want to resign this game?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResignDialog(false)}>Cancel</Button>
          <Button onClick={handleResign} color="error">
            Resign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDrawDialog} onClose={() => setShowDrawDialog(false)}>
        <DialogTitle>Draw Offer</DialogTitle>
        <DialogContent>
          {drawOffered ? 
            "Your opponent has offered a draw. Do you accept?" :
            "Are you sure you want to offer a draw?"
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDrawResponse(false)}>
            {drawOffered ? "Decline" : "Cancel"}
          </Button>
          <Button onClick={() => handleDrawResponse(true)} color="primary">
            {drawOffered ? "Accept" : "Offer Draw"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default GameBoard; 