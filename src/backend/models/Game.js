const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  whitePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blackPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isComputerOpponent: {
    type: Boolean,
    default: false
  },
  computerDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: function() { return this.isComputerOpponent; }
  },
  wager: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'checkmate', 'draw', 'stalemate', 'resigned'],
    default: 'active'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fen: {
    type: String,
    required: true,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  moves: [{
    from: String,
    to: String,
    piece: String,
    promotion: String,
    timestamp: { type: Date, default: Date.now }
  }],
  drawOffers: [{
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now },
    accepted: Boolean
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date
}, {
  timestamps: true
}); 