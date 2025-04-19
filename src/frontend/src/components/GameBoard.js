import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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

function GameBoard({ gameMode = 'computer', wager = 20, opponent = 'Computer', difficulty = 'medium', gameId }) {
  const { user } = useAuth();
  const userId = user?._id;
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [gameStatus, setGameStatus] = useState('');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [drawOffered, setDrawOffered] = useState(false);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Generate a unique gameId if not provided
  const currentGameId = useRef(gameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Add chess piece values and position evaluation tables
  const PIECE_VALUES = {
    p: 100,  // pawn
    n: 320,  // knight
    b: 330,  // bishop
    r: 500,  // rook
    q: 900,  // queen
    k: 20000 // king
  };

  // Simplified piece-square tables for positional evaluation
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

  // Add move to history
  const addMoveToHistory = (move) => {
    setMoveHistory(prev => [...prev, move]);
  };

  // Undo last move
  const undoLastMove = () => {
    if (moveHistory.length > 0) {
      game.undo();
      if (gameMode === 'computer') {
        game.undo(); // Undo computer's move too
      }
      setGame(new Chess(game.fen()));
      setMoveHistory(prev => prev.slice(0, -2));
    }
  };

  // Flip board
  const flipBoard = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Handle draw offer
  const handleDrawOffer = () => {
    if (gameMode === 'computer') {
      // Simple draw acceptance logic for computer
      const moveCount = game.moveNumber();
      const materialScore = evaluateBoard(game);
      const shouldAccept = moveCount > 30 || Math.abs(materialScore) < 200;
      
      if (shouldAccept) {
        setGameStatus('Game ended in draw by agreement');
        setTimeout(() => navigate('/games'), 2000);
      } else {
        setGameStatus('Computer declined draw offer');
      }
    } else {
      setDrawOffered(true);
      setShowDrawDialog(true);
    }
  };

  // Handle draw response
  const handleDrawResponse = (accepted) => {
    setShowDrawDialog(false);
    if (accepted) {
      setGameStatus('Game ended in draw by agreement');
      setTimeout(() => navigate('/games'), 2000);
    }
    setDrawOffered(false);
  };

  // Handle resign
  const handleResign = () => {
    setShowResignDialog(true);
  };

  const confirmResign = () => {
    setShowResignDialog(false);
    setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} resigned`);
    setTimeout(() => navigate('/games'), 2000);
  };

  // Effect to check game status after each move
  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
      } else if (game.isDraw()) {
        setGameStatus('Game ended in draw');
      } else if (game.isStalemate()) {
        setGameStatus('Game ended in stalemate');
      } else if (game.isThreefoldRepetition()) {
        setGameStatus('Game ended - threefold repetition');
      } else if (game.isInsufficientMaterial()) {
        setGameStatus('Game ended - insufficient material');
      }
    } else if (game.isCheck()) {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  }, [game]);

  // Initialize WebSocket connection
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('Connecting to socket server at:', SOCKET_URL, 'for game:', currentGameId.current);

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { 
        gameId: currentGameId.current,
        userId: userId
      }
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully with ID:', socketRef.current.id);
      socketRef.current.emit('join game', currentGameId.current);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    });
    
    // Message handlers
    socketRef.current.on('message received', (message) => {
      console.log('Received message:', message);
      if (message && message.content) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    socketRef.current.on('message error', (error) => {
      console.error('Message error:', error);
    });

    // Load existing messages
    const loadMessages = async () => {
      try {
        console.log('Loading messages for game:', currentGameId.current);
        const response = await axios.get(`${SOCKET_URL}/api/messages/${currentGameId.current}`);
        console.log('Loaded messages:', response.data);
        if (response.data && Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };
    loadMessages();

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.emit('leave game', currentGameId.current);
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current?.connected) {
      console.log('Cannot send message:', !newMessage.trim() ? 'empty message' : 'socket not connected');
      return;
    }

    try {
      const gameState = {
        isCheck: game.isCheck(),
        isComputerInCheck: game.turn() === 'b' && game.isCheck(),
        lastCapture: moveHistory.length > 0 && moveHistory[moveHistory.length - 1].includes('x'),
        computerCaptured: moveHistory.length > 0 && moveHistory[moveHistory.length - 1].includes('x') && game.turn() === 'w',
        gameOver: game.isGameOver(),
        winner: game.isGameOver() ? 
          (game.turn() === 'w' ? 'computer' : 'player') : 
          (game.isDraw() ? 'draw' : null),
        fen: game.fen()
      };

      const messageData = {
        gameId: currentGameId.current,
        content: newMessage,
        gameState,
        sender: userId
      };

      console.log('Sending message:', messageData);
      socketRef.current.emit('new message', messageData);
      
      // Optimistically add message to state
      setMessages(prev => [...prev, {
        _id: Date.now(),
        content: newMessage,
        gameState,
        sender: {
          _id: userId,
          username: user?.username || 'You'
        },
        createdAt: new Date().toISOString()
      }]);
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true
    });
    if (moves.length === 0) {
      return;
    }

    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(255,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%'
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };
    setOptionSquares(newSquares);
  }

  function onSquareClick(square) {
    setRightClickedSquares({});

    // from square
    if (!moveFrom) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
      return;
    }

    // to square
    if (moveFrom) {
      const moves = game.moves({
        moveFrom,
        verbose: true
      });
      const foundMove = moves.find(
        (m) => m.from === moveFrom && m.to === square
      );

      if (!foundMove) {
        // invalid move
        setMoveFrom('');
        setOptionSquares({});
        return;
      }

      // valid move
      const move = {
        from: moveFrom,
        to: square,
        promotion: 'q' // always promote to queen for simplicity
      };

      game.move(move);
      setGame(new Chess(game.fen()));
      setMoveFrom('');
      setOptionSquares({});
      setMoveHistory(prev => [...prev, move.san]);

      // Check for game end conditions
      if (game.isGameOver()) {
        handleGameOver();
      } else if (gameMode === 'computer') {
        // If playing against computer, make computer move
        setTimeout(makeComputerMove, 300);
      }
    }
  }

  function onSquareRightClick(square) {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] &&
        rightClickedSquares[square].backgroundColor === colour
          ? undefined
          : { backgroundColor: colour }
    });
  }

  function evaluateBoard(board) {
    let score = 0;
    
    // Material and position evaluation
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board.get(String.fromCharCode(97 + j) + (8 - i));
        if (piece) {
          // Basic material score
          const materialValue = PIECE_VALUES[piece.type.toLowerCase()] || 0;
          score += piece.color === 'w' ? materialValue : -materialValue;
          
          // Position score for pawns
          if (piece.type.toLowerCase() === 'p') {
            const positionIndex = piece.color === 'w' ? (i * 8 + j) : ((7-i) * 8 + j);
            score += piece.color === 'w' ? PAWN_TABLE[positionIndex] : -PAWN_TABLE[positionIndex];
          }
        }
      }
    }
    return score;
  }

  function minimax(board, depth, alpha, beta, maximizingPlayer) {
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
  }

  function makeComputerMove() {
    const moves = game.moves();
    if (moves.length > 0) {
      let bestMove = null;
      let bestEval = -Infinity;
      
      // Adjust depth based on difficulty
      const depth = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 3 : 4);
      
      for (const move of moves) {
        const newBoard = new Chess(game.fen());
        newBoard.move(move);
        const evaluation = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
        if (evaluation > bestEval) {
          bestEval = evaluation;
          bestMove = move;
        }
      }
      
      if (bestMove) {
        game.move(bestMove);
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, bestMove]);
      }
    }
  }

  // Handle game over
  const handleGameOver = () => {
    const gameState = {
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      isStalemate: game.isStalemate(),
      isThreefoldRepetition: game.isThreefoldRepetition(),
      isInsufficientMaterial: game.isInsufficientMaterial()
    };

    let result;
    if (gameState.isCheckmate) {
      result = game.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
    } else if (gameState.isDraw) {
      result = 'Game ended in draw';
    } else if (gameState.isStalemate) {
      result = 'Game ended in stalemate';
    } else if (gameState.isThreefoldRepetition) {
      result = 'Game ended - threefold repetition';
    } else if (gameState.isInsufficientMaterial) {
      result = 'Game ended - insufficient material';
    }

    setGameStatus(result);
    setTimeout(() => navigate('/games'), 2000);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: { xs: 1, sm: 2 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            {gameStatus && (
              <Alert 
                severity={
                  gameStatus.includes('wins') || gameStatus.includes('resigned') ? 'success' : 
                  gameStatus.includes('check') ? 'warning' : 
                  gameStatus.includes('draw') ? 'info' : 'info'
                }
                sx={{ mb: 2 }}
                variant="filled"
              >
                {gameStatus}
              </Alert>
            )}
            <Box 
              sx={{ 
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                '& > div': {
                  width: '100% !important',
                  height: '100% !important'
                }
              }}
            >
              <Chessboard
                position={game.fen()}
                onSquareClick={onSquareClick}
                onSquareRightClick={onSquareRightClick}
                customSquareStyles={{
                  ...moveSquares,
                  ...optionSquares,
                  ...rightClickedSquares
                }}
                boardWidth={600}
                animationDuration={200}
                arePiecesDraggable={false}
                boardOrientation={boardOrientation}
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  onClick={undoLastMove}
                  disabled={moveHistory.length === 0 || game.isGameOver()}
                  startIcon={<UndoIcon />}
                >
                  Undo
                </Button>
                <Button 
                  onClick={flipBoard}
                  startIcon={<RotateLeftIcon />}
                >
                  Flip Board
                </Button>
                <Button
                  onClick={handleDrawOffer}
                  disabled={drawOffered || game.isGameOver()}
                  startIcon={<HandshakeIcon />}
                >
                  Offer Draw
                </Button>
                <Button
                  onClick={handleResign}
                  disabled={game.isGameOver()}
                  color="error"
                  startIcon={<FlagIcon />}
                >
                  Resign
                </Button>
              </ButtonGroup>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  position: { xs: 'sticky', md: 'static' },
                  top: { xs: '16px', md: 'auto' },
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 3
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Game Info
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography variant="subtitle2" color="text.secondary">Mode</Typography>}
                      secondary={
                        <Typography variant="body1" color="text.primary">
                          {gameMode === 'computer' ? `vs Computer (${difficulty})` : 'vs Player'}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography variant="subtitle2" color="text.secondary">Status</Typography>}
                      secondary={
                        <Typography variant="body1" color="text.primary">
                          {gameStatus}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography variant="subtitle2" color="text.secondary">Wager</Typography>}
                      secondary={
                        <Typography variant="body1" color="text.primary">
                          {wager} coins
                        </Typography>
                      }
                    />
                  </ListItem>
                  {opponent && (
                    <ListItem>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" color="text.secondary">Opponent</Typography>}
                        secondary={
                          <Typography variant="body1" color="text.primary">
                            {opponent}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
                <Divider sx={{ my: 2 }} />
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 3,
                  height: '400px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
                  Chat
                </Typography>
                
                <Box 
                  sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    px: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'action.hover',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'primary.main',
                      borderRadius: '4px',
                    },
                  }}
                >
                  {messages.map((msg, i) => (
                    <Box
                      key={msg._id || i}
                      sx={{
                        p: 1.5,
                        bgcolor: msg.sender?._id === userId ? 'primary.main' : 'grey.800',
                        color: 'white',
                        borderRadius: 2,
                        maxWidth: '80%',
                        alignSelf: msg.sender?._id === userId ? 'flex-end' : 'flex-start',
                        wordBreak: 'break-word',
                        boxShadow: 1,
                        position: 'relative',
                        '&::after': msg.sender?._id === userId ? {
                          content: '""',
                          position: 'absolute',
                          right: '-6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent',
                          borderLeft: `6px solid ${msg.sender?._id === userId ? '#1976d2' : '#424242'}`
                        } : {
                          content: '""',
                          position: 'absolute',
                          left: '-6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent',
                          borderRight: `6px solid ${msg.sender?._id === userId ? '#1976d2' : '#424242'}`
                        }
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.8, 
                          display: 'block', 
                          mb: 0.5,
                          fontWeight: 'medium',
                          color: msg.sender?._id === userId ? 'primary.light' : 'grey.300'
                        }}
                      >
                        {msg.sender?.username || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2">{msg.content}</Typography>
                    </Box>
                  ))}
                  <div ref={chatEndRef} />
                </Box>

                <Box 
                  component="form" 
                  onSubmit={handleSendMessage} 
                  sx={{ 
                    display: 'flex', 
                    gap: 1,
                    mt: 'auto',
                    position: 'relative',
                    bgcolor: 'background.paper',
                    pt: 1
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'grey.900',
                        '&:hover': {
                          bgcolor: 'grey.800'
                        },
                        '& fieldset': {
                          borderColor: 'grey.700'
                        },
                        '&:hover fieldset': {
                          borderColor: 'grey.600'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'text.primary'
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
          </Grid>
        </Grid>

        {/* Draw Offer Dialog */}
        <Dialog open={showDrawDialog} onClose={() => setShowDrawDialog(false)}>
          <DialogTitle>Draw Offer</DialogTitle>
          <DialogContent>
            Your opponent has offered a draw. Do you accept?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleDrawResponse(false)} color="error">
              Decline
            </Button>
            <Button onClick={() => handleDrawResponse(true)} color="primary" variant="contained">
              Accept Draw
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resign Confirmation Dialog */}
        <Dialog open={showResignDialog} onClose={() => setShowResignDialog(false)}>
          <DialogTitle>Confirm Resignation</DialogTitle>
          <DialogContent>
            Are you sure you want to resign the game?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResign} color="error" variant="contained">
              Resign
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
}

export default GameBoard; 