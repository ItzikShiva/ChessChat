const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in get profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Error in update profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('gamesPlayed gamesWon coins');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      coins: user.coins,
      winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed * 100).toFixed(1) : 0
    });
  } catch (err) {
    console.error('Error in get stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user stats after game
router.put('/stats', auth, async (req, res) => {
  try {
    const { won, coinsChange } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.gamesPlayed += 1;
    if (won) user.gamesWon += 1;
    user.coins += coinsChange;

    await user.save();
    res.json({
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      coins: user.coins
    });
  } catch (err) {
    console.error('Error in update stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 