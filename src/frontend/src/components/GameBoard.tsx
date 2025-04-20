import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess, Move, Square, Color, PieceSymbol } from 'chess.js';
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
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Divider
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

interface GameMove extends Move {
  san: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  flags: string;
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

  // Function to evaluate board position
  const evaluatePosition = useCallback((board: Chess) => {
    let score = 0;
    const pieces = board.board();
    
    pieces.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const pieceValue = PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES];
          const positionValue = piece.type === 'p' ? PAWN_TABLE[i * 8 + j] : 0;
          score += piece.color === 'w' ? (pieceValue + positionValue) : -(pieceValue + positionValue);
        }
      });
    });
    
    return score;
  }, []);

  // Function to make computer move
  const makeComputerMove = useCallback(async () => {
    if (!game || game.isGameOver() || game.turn() !== 'b') return;

    setIsComputerThinking(true);
    
    // Simulate thinking time based on difficulty
    const thinkingTime: Record<string, number> = {
      easy: 500,
      medium: 1000,
      hard: 2000
    };

    await new Promise(resolve => setTimeout(resolve, thinkingTime[gameSettings.difficulty || 'medium']));

    try {
      const moves = game.moves({ verbose: true }) as GameMove[];
      let bestScore = -Infinity;
      let bestMove: GameMove | null = null;

      // Simple minimax for computer moves
      moves.forEach(move => {
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const score = -evaluatePosition(testGame);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      });

      if (bestMove) {
        const newGame = new Chess(game.fen());
        newGame.move(bestMove);
        setGame(newGame);
        setMoveHistory(prev => [...prev, bestMove!.san]);
      } else {
        // If no best move found, make a random legal move
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const newGame = new Chess(game.fen());
        newGame.move(randomMove);
        setGame(newGame);
        setMoveHistory(prev => [...prev, randomMove.san]);
      }
    } catch (err) {
      console.error('Error making computer move:', err);
      setError('Failed to make computer move');
    }

    setIsComputerThinking(false);
  }, [game, gameSettings.difficulty, evaluatePosition]);

  // Function to handle piece movement
  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to queen for simplicity
      });

      if (move === null) return false;

      setGame(new Chess(game.fen()));
      setMoveHistory(prev => [...prev, move.san]);

      // Make computer move if in computer mode
      if (gameSettings.gameMode === 'computer' && !game.isGameOver()) {
        makeComputerMove();
      }

      return true;
    } catch (err) {
      console.error('Error making move:', err);
      setError('Failed to make move');
      return false;
    }
  }, [game, gameSettings.gameMode, makeComputerMove]);

  // Function to handle square right click (for highlights)
  const onSquareRightClick = useCallback((square: string) => {
    setRightClickedSquares(prev => ({
      ...prev,
      [square]: !prev[square]
    }));
  }, []);

  // Function to handle square click
  const onSquareClick = useCallback((square: Square) => {
    if (moveFrom === square) {
      setMoveFrom('');
      setOptionSquares({});
      return;
    }

    // Show possible moves if it's the player's turn
    if (!moveFrom) {
      const moves = game.moves({
        square,
        verbose: true
      }) as GameMove[];

      if (moves.length === 0) return;

      const newSquares: Record<string, boolean> = {};
      moves.forEach(move => {
        newSquares[move.to] = true;
      });

      setOptionSquares(newSquares);
      setMoveFrom(square);
      return;
    }

    // Try to make the move
    try {
      const move = game.move({
        from: moveFrom as Square,
        to: square,
        promotion: 'q' // always promote to queen for simplicity
      });

      if (move === null) {
        setMoveFrom('');
        setOptionSquares({});
        return;
      }

      setGame(new Chess(game.fen()));
      setMoveHistory(prev => [...prev, move.san]);
      setMoveFrom('');
      setOptionSquares({});

      // Make computer move if in computer mode
      if (gameSettings.gameMode === 'computer' && !game.isGameOver()) {
        makeComputerMove();
      }
    } catch (err) {
      console.error('Invalid move:', err);
      setMoveFrom('');
      setOptionSquares({});
    }
  }, [moveFrom, game, gameSettings.gameMode, makeComputerMove]);

  // Effect to initialize socket connection
  useEffect(() => {
    if (gameSettings.gameMode === 'player') {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        query: {
          gameId: currentGameId.current,
          userId
        }
      });

      socketRef.current.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [gameSettings.gameMode, userId]);

  // Function to send chat message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post('/api/messages', {
        gameId: currentGameId.current,
        content: newMessage,
        gameState: game.fen()
      });

      if (socketRef.current) {
        socketRef.current.emit('message', response.data);
      }

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  return (
    <Grid container spacing={2} sx={{ height: '100%', p: 2 }}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Game Board */}
      <Grid item xs={12} md={8}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              customSquareStyles={{
                ...moveSquares,
                ...optionSquares,
                ...rightClickedSquares
              }}
              boardOrientation={boardOrientation}
            />
            {isComputerThinking && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  p: 2,
                  borderRadius: 1
                }}
              >
                <CircularProgress />
                <Typography>Thinking...</Typography>
              </Box>
            )}
          </Box>

          {/* Game Controls */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <ButtonGroup variant="contained">
              <Button
                onClick={() => setShowResignDialog(true)}
                startIcon={<FlagIcon />}
              >
                Resign
              </Button>
              <Button
                onClick={() => setShowDrawDialog(true)}
                startIcon={<HandshakeIcon />}
              >
                Offer Draw
              </Button>
              <Button
                onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                startIcon={<RotateLeftIcon />}
              >
                Flip Board
              </Button>
            </ButtonGroup>
          </Box>
        </Paper>
      </Grid>

      {/* Game Info and Chat */}
      <Grid item xs={12} md={4}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Game Info
          </Typography>
          <Typography>
            Mode: {gameSettings.gameMode}
          </Typography>
          <Typography>
            Opponent: {gameSettings.opponent}
          </Typography>
          <Typography>
            Wager: {gameSettings.wager} coins
          </Typography>
          {gameSettings.difficulty && (
            <Typography>
              Difficulty: {gameSettings.difficulty}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Move History
          </Typography>
          <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '200px' }}>
            {moveHistory.map((move, index) => (
              <ListItem key={index}>
                <ListItemText>
                  {Math.floor(index / 2) + 1}. {move}
                </ListItemText>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Chat
          </Typography>
          <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '200px' }}>
            {messages.map((message) => (
              <ListItem key={message._id}>
                <ListItemText
                  primary={message.sender?.username || 'Anonymous'}
                  secondary={message.content}
                />
              </ListItem>
            ))}
            <div ref={chatEndRef} />
          </List>
          <Box sx={{ display: 'flex', mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
            />
            <IconButton onClick={sendMessage} color="primary">
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Grid>

      {/* Dialogs */}
      <Dialog open={showResignDialog} onClose={() => setShowResignDialog(false)}>
        <DialogTitle>Resign Game</DialogTitle>
        <DialogContent>
          Are you sure you want to resign this game?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResignDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              // Handle resignation
              setShowResignDialog(false);
              setGameStatus('resigned');
            }}
            color="error"
          >
            Resign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDrawDialog} onClose={() => setShowDrawDialog(false)}>
        <DialogTitle>Offer Draw</DialogTitle>
        <DialogContent>
          {drawOffered ? 
            'Waiting for opponent to respond...' :
            'Are you sure you want to offer a draw?'
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDrawDialog(false)}>Cancel</Button>
          {!drawOffered && (
            <Button
              onClick={() => {
                setDrawOffered(true);
                // Handle draw offer
              }}
              color="primary"
            >
              Offer Draw
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default GameBoard; 