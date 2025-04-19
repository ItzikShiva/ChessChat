import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Chess } from 'chess.js';
import chessService from '../services/chessService';
import authService from '../services/authService';

const GameBoard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [gameState, setGameState] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState('');
  const [legalMoves, setLegalMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [error, setError] = useState('');
  const gameRef = useRef(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const gameData = await chessService.getGame(gameId);
        const history = await chessService.getGameHistory(gameId);
        setGameState(gameData);
        setMoveHistory(history);
        setGame(new Chess(gameData.fen));
      } catch (err) {
        setError(err.message || 'Failed to load game');
      }
    };

    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  const onSquareClick = (square) => {
    if (gameOver) return;

    const currentUser = authService.getCurrentUser();
    const isCurrentPlayer = gameState?.currentPlayer === currentUser.id;

    if (!isCurrentPlayer) {
      setError("It's not your turn!");
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare('');
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q', // Always promote to queen for simplicity
      };

      try {
        const newGame = new Chess(game.fen());
        const result = newGame.move(move);

        if (result) {
          chessService.makeMove(gameId, move);
          setGame(newGame);
          setSelectedSquare('');
          setLegalMoves([]);
          checkGameStatus(newGame);
        }
      } catch (err) {
        setError('Invalid move');
      }
    } else {
      const moves = chessService.getLegalMoves(game, square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves);
      }
    }
  };

  const checkGameStatus = (chessGame) => {
    if (chessService.isGameOver(chessGame)) {
      setGameOver(true);
      setGameStatus(chessService.getGameStatus(chessGame));
    }
  };

  const getGameStatusMessage = () => {
    if (!gameOver) return null;

    switch (gameStatus) {
      case 'checkmate':
        return 'Checkmate! Game Over';
      case 'draw':
        return 'Game ended in a draw';
      case 'stalemate':
        return 'Stalemate! Game Over';
      case 'threefold-repetition':
        return 'Game ended due to threefold repetition';
      case 'insufficient-material':
        return 'Game ended due to insufficient material';
      default:
        return 'Game Over';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Chessboard
          position={game.fen()}
          onSquareClick={onSquareClick}
          customSquareStyles={{
            ...legalMoves.reduce((a, c) => {
              a[c.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
              return a;
            }, {}),
            [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          }}
        />
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        {gameOver && (
          <Typography variant="h6" sx={{ mt: 2 }}>
            {getGameStatusMessage()}
          </Typography>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 2, width: 300 }}>
        <Typography variant="h6" gutterBottom>
          Move History
        </Typography>
        <List>
          {moveHistory.map((move, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={`${index + 1}. ${move.san}`}
                  secondary={`by ${move.player}`}
                />
              </ListItem>
              {index < moveHistory.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default GameBoard; 