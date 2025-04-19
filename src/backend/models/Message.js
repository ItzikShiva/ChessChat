const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000 // Reasonable limit for chat messages
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional to support computer messages
  },
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index for efficient querying
messageSchema.index({ gameId: 1, createdAt: -1 });

// Pre-save middleware to ensure gameState is properly handled
messageSchema.pre('save', function(next) {
  if (this.gameState && typeof this.gameState === 'string') {
    try {
      this.gameState = JSON.parse(this.gameState);
    } catch (e) {
      console.error('Error parsing gameState:', e);
    }
  }
  next();
});

// Add method to format message for client
messageSchema.methods.toClientJSON = function() {
  return {
    id: this._id,
    gameId: this.gameId,
    content: this.content,
    sender: this.sender,
    gameState: this.gameState,
    createdAt: this.createdAt
  };
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 