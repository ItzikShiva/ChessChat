const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Game = require('../models/Game');

// Bot personality responses based on game state and difficulty
const BOT_RESPONSES = {
  gameStart: {
    easy: [
      "Hi! I'm a friendly chess bot. Let's have a fun game!",
      "I'm still learning chess, but I'll do my best!",
      "Don't worry, I'll go easy on you 😊"
    ],
    medium: [
      "Ready for a challenging game?",
      "I've been practicing my middle game. Hope you're ready!",
      "This should be an interesting match!"
    ],
    hard: [
      "I calculate millions of positions per second. Good luck.",
      "I've studied all the grandmaster games. Prepare yourself.",
      "Warning: I'm running at maximum difficulty. No mercy."
    ]
  },
  goodMove: [
    "Impressive move!",
    "I didn't see that coming!",
    "Well played!",
    "That's a strong position."
  ],
  badMove: [
    "Are you sure about that move?",
    "I see an opportunity...",
    "Interesting choice...",
    "That might be risky."
  ],
  capture: {
    winning: [
      "Thank you for the piece!",
      "I'll take that!",
      "One piece closer to victory."
    ],
    losing: [
      "Oh no, my piece!",
      "You got me there!",
      "I might have miscalculated..."
    ]
  },
  check: {
    giving: [
      "Check!",
      "Your king is in danger!",
      "Better protect your king!"
    ],
    receiving: [
      "Nice check!",
      "My king feels uncomfortable...",
      "I need to get out of check."
    ]
  },
  gameEnd: {
    winning: [
      "Good game! Better luck next time!",
      "Victory achieved. Want a rematch?",
      "That was a great game!"
    ],
    losing: [
      "Congratulations! You outplayed me!",
      "I learned a lot from this game. Well played!",
      "You're really good at chess!"
    ],
    draw: [
      "A draw! It was a very close game!",
      "Neither of us could gain the advantage. Good game!",
      "Perfectly balanced, as all things should be."
    ]
  }
};

// Get random response from category
function getBotResponse(category, subcategory = null) {
  const responses = subcategory ? BOT_RESPONSES[category][subcategory] : BOT_RESPONSES[category];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Get chat messages for a game
router.get('/:gameId', auth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ gameId: req.params.gameId })
      .populate('sender', 'username')
      .sort('timestamp');
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Send a chat message
router.post('/:gameId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    const message = new ChatMessage({
      gameId: req.params.gameId,
      sender: req.user.id,
      content: req.body.content
    });
    await message.save();

    // If playing against computer, generate bot response
    if (game.isComputerOpponent) {
      const lastMove = game.moves[game.moves.length - 1];
      let botResponse;

      if (!lastMove) {
        // Game start
        botResponse = getBotResponse('gameStart', game.computerDifficulty);
      } else {
        // Analyze game state for contextual response
        const gameState = req.body.gameState; // Frontend should send current game state
        if (gameState.isCheck) {
          botResponse = getBotResponse('check', gameState.isComputerInCheck ? 'receiving' : 'giving');
        } else if (gameState.lastCapture) {
          botResponse = getBotResponse('capture', gameState.computerCaptured ? 'winning' : 'losing');
        } else if (gameState.gameOver) {
          const result = gameState.winner === 'computer' ? 'winning' : 
                        gameState.winner === 'player' ? 'losing' : 'draw';
          botResponse = getBotResponse('gameEnd', result);
        } else {
          // Random response based on move quality
          botResponse = getBotResponse(Math.random() > 0.5 ? 'goodMove' : 'badMove');
        }
      }

      const botMessage = new ChatMessage({
        gameId: req.params.gameId,
        isComputerMessage: true,
        content: botResponse
      });
      await botMessage.save();

      // Return both messages
      res.json([message, botMessage]);
    } else {
      res.json([message]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 