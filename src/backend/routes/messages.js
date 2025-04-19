const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get messages for a game
router.get('/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const messages = await Message.find({ gameId })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('sender', 'username')
            .lean();

        res.json(messages.reverse());
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
});

// Post a new message
router.post('/', async (req, res) => {
    try {
        const { gameId, content, gameState, sender } = req.body;
        
        if (!gameId || !content || !gameState) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const message = new Message({
            gameId,
            content,
            gameState,
            sender
        });

        const savedMessage = await message.save();
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'username')
            .lean();

        res.json(populatedMessage);
    } catch (err) {
        console.error('Error creating message:', err);
        res.status(500).json({ message: 'Error creating message', error: err.message });
    }
});

module.exports = router; 