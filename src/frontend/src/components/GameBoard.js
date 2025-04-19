import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';
import { makeMove, getGame } from '../services/chessService';
import computerPlayerService from '../services/computerPlayerService';

const GameBoard = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const gameRef = useRef(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setIsLoading(true);
        const gameData = await getGame(gameId);
        setGame(gameData);
        gameRef.current = gameData;
        
        if (gameData.fen) {
          chess.load(gameData.fen);
          setChess(new Chess(gameData.fen));
        }

        // If it's a computer game and it's the computer's turn
        if (gameData.opponentType === 'computer' && 
            gameData.currentPlayer === 'black' && 
            !chess.isGameOver()) {
          makeComputerMove();
        }
      } catch (err) {
        setError(err.message || 'Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  const makeComputerMove = async () => {
    if (!gameRef.current || gameRef.current.opponentType !== 'computer') return;

    setIsComputerThinking(true);
    try {
      // Set the computer difficulty
      computerPlayerService.setDifficulty(gameRef.current.computerDifficulty);
      
      // Get the computer's move
      const computerMove = computerPlayerService.makeMove(chess.fen());
      
      if (computerMove) {
        // Make the move on the board
        chess.move({
          from: computerMove.from,
          to: computerMove.to,
          promotion: computerMove.promotion
        });
        setChess(new Chess(chess.fen()));

        // Update the game state on the server
        await makeMove(gameId, {
          from: computerMove.from,
          to: computerMove.to,
          promotion: computerMove.promotion
        });
      }
    } catch (err) {
      setError('Computer move failed: ' + err.message);
    } finally {
      setIsComputerThinking(false);
    }
  };

  const onDrop = async (sourceSquare, targetSquare) => {
    try {
      // Don't allow moves if it's a computer game and it's not the player's turn
      if (gameRef.current?.opponentType === 'computer' && 
          gameRef.current?.currentPlayer === 'black') {
        return false;
      }

      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move === null) return false;

      setChess(new Chess(chess.fen()));

      // Update the game state on the server
      await makeMove(gameId, {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      // If it's a computer game, make the computer move after a short delay
      if (gameRef.current?.opponentType === 'computer' && 
          !chess.isGameOver()) {
        setTimeout(makeComputerMove, 500);
      }

      return true;
    } catch (err) {
      setError(err.message || 'Move failed');
      return false;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Chessboard
                position={chess.fen()}
                onPieceDrop={onDrop}
                boardWidth={600}
              />
              {isComputerThinking && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Game Info
            </Typography>
            <Typography>
              Status: {chess.isGameOver() ? 'Game Over' : 'In Progress'}
            </Typography>
            <Typography>
              Current Turn: {chess.turn() === 'w' ? 'White' : 'Black'}
            </Typography>
            {game?.opponentType === 'computer' && (
              <Typography>
                Difficulty: {game.computerDifficulty}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameBoard; 