const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Game = require('../models/Game');
const User = require('../models/User');

// Create a new game
router.post('/', auth, async (req, res) => {
  try {
    const { isComputerOpponent, computerDifficulty, wager } = req.body;
    
    // Check if user has enough coins
    const user = await User.findById(req.user.id);
    if (user.coins < wager) {
      return res.status(400).json({ msg: 'Insufficient coins' });
    }

    // Create new game
    const game = new Game({
      whitePlayer: req.user.id,
      isComputerOpponent,
      computerDifficulty,
      wager
    });

    // Deduct wager from user
    user.coins -= wager;
    await user.save();

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get user's active games
router.get('/active', auth, async (req, res) => {
  try {
    const games = await Game.find({
      $or: [
        { whitePlayer: req.user.id },
        { blackPlayer: req.user.id }
      ],
      status: 'active'
    }).populate('whitePlayer blackPlayer', 'username');
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Make a move
router.post('/:id/move', auth, async (req, res) => {
  try {
    const { from, to, piece, promotion } = req.body;
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    // Verify it's the user's turn
    const isWhite = game.whitePlayer.toString() === req.user.id;
    const isBlack = game.blackPlayer && game.blackPlayer.toString() === req.user.id;
    if (!isWhite && !isBlack) {
      return res.status(403).json({ msg: 'Not your game' });
    }

    // Add move to history
    game.moves.push({
      from,
      to,
      piece,
      promotion,
      timestamp: Date.now()
    });

    // Update game state
    game.fen = req.body.fen;
    
    // Update game status if game is over
    if (req.body.status) {
      game.status = req.body.status;
      game.endTime = Date.now();
      
      // Handle wager distribution
      if (game.status === 'checkmate' || game.status === 'resigned') {
        const winner = await User.findById(
          game.status === 'resigned' ? 
            (isWhite ? game.blackPlayer : game.whitePlayer) : 
            req.user.id
        );
        winner.coins += game.wager * 2; // Winner gets both wagers
        await winner.save();
      } else if (game.status === 'draw' || game.status === 'stalemate') {
        // Return wagers to both players
        const white = await User.findById(game.whitePlayer);
        const black = game.isComputerOpponent ? null : await User.findById(game.blackPlayer);
        white.coins += game.wager;
        if (black) black.coins += game.wager;
        await white.save();
        if (black) await black.save();
      }
    }

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Offer/accept draw
router.post('/:id/draw', auth, async (req, res) => {
  try {
    const { accepted } = req.body;
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    if (accepted) {
      game.status = 'draw';
      game.endTime = Date.now();
      
      // Return wagers
      const white = await User.findById(game.whitePlayer);
      const black = game.isComputerOpponent ? null : await User.findById(game.blackPlayer);
      white.coins += game.wager;
      if (black) black.coins += game.wager;
      await white.save();
      if (black) await black.save();
    }

    game.drawOffers.push({
      by: req.user.id,
      accepted,
      timestamp: Date.now()
    });

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Resign game
router.post('/:id/resign', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    game.status = 'resigned';
    game.endTime = Date.now();

    // Give wager to opponent
    const winner = await User.findById(
      game.whitePlayer.toString() === req.user.id ? 
        game.blackPlayer : 
        game.whitePlayer
    );
    winner.coins += game.wager * 2;
    await winner.save();

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 