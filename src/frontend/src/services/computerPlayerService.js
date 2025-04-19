import { Chess } from 'chess.js';

class ComputerPlayerService {
  constructor() {
    this.chess = new Chess();
    this.difficulty = 'medium'; // easy, medium, hard
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  // Evaluate the board position (simple material count)
  evaluatePosition() {
    const pieceValues = {
      p: -1, n: -3, b: -3, r: -5, q: -9, k: 0,
      P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0
    };

    let score = 0;
    for (let i = 0; i < 64; i++) {
      const piece = this.chess.board()[Math.floor(i / 8)][i % 8];
      if (piece) {
        score += pieceValues[piece.type] * (piece.color === 'w' ? 1 : -1);
      }
    }
    return score;
  }

  // Get all possible moves for the current position
  getAllMoves() {
    return this.chess.moves({ verbose: true });
  }

  // Simple minimax algorithm with alpha-beta pruning
  minimax(depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) {
      return this.evaluatePosition();
    }

    const moves = this.getAllMoves();
    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, false);
        this.chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, true);
        this.chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Get the best move based on difficulty
  getBestMove() {
    const moves = this.getAllMoves();
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestEval = -Infinity;
    const depth = this.difficulty === 'easy' ? 2 : this.difficulty === 'medium' ? 3 : 4;

    for (const move of moves) {
      this.chess.move(move);
      const evaluation = this.minimax(depth, -Infinity, Infinity, false);
      this.chess.undo();

      if (evaluation > bestEval) {
        bestEval = evaluation;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Make a computer move
  makeMove(fen) {
    this.chess.load(fen);
    const bestMove = this.getBestMove();
    if (bestMove) {
      this.chess.move(bestMove);
      return {
        from: bestMove.from,
        to: bestMove.to,
        promotion: bestMove.promotion,
        fen: this.chess.fen()
      };
    }
    return null;
  }
}

export default new ComputerPlayerService(); 