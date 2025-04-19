require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/messages', messagesRouter);

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password // will be hashed by the pre-save middleware
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Protected route middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = decoded.user;
    next();
  });
};

// Test route
app.get('/api/test', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password'); // Exclude password from the response
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      gamesPlayed: user.gamesPlayed || 0,
      gamesWon: user.gamesWon || 0,
      gamesLost: (user.gamesPlayed || 0) - (user.gamesWon || 0),
      coins: user.coins || 1000
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add endpoint for recent games
app.get('/api/users/recent-games', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // TODO: Replace with actual game history once implemented
    // This is temporary mock data
    const recentGames = [
      {
        id: '1',
        opponent: 'Player1',
        result: 'win',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        wager: 100,
        profit: 95 // 5% fee on wagers
      },
      {
        id: '2',
        opponent: 'Player2',
        result: 'loss',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        wager: 50,
        profit: -50
      },
      {
        id: '3',
        opponent: 'Computer (Hard)',
        result: 'win',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        wager: 25,
        profit: 23 // 5% fee on wagers
      }
    ];
    
    res.json(recentGames);
  } catch (error) {
    console.error('Recent games error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only update fields that were provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join game', (gameId) => {
    if (!gameId) {
      console.error('No gameId provided for join game event');
      return;
    }
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on('leave game', (gameId) => {
    if (!gameId) {
      console.error('No gameId provided for leave game event');
      return;
    }
    socket.leave(gameId);
    console.log(`User ${socket.id} left game ${gameId}`);
  });

  socket.on('new message', async (data) => {
    try {
      console.log('Received new message:', data);
      
      // Validate required fields
      if (!data?.gameId || !data?.content) {
        throw new Error('Missing required message fields');
      }

      // Create message document
      const messageData = {
        gameId: data.gameId,
        content: data.content,
        sender: data.sender,
        gameState: data.gameState
      };

      const message = new Message(messageData);
      
      // Save to database and populate sender
      const savedMessage = await message.save();
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'username')
        .lean();

      console.log('Saved and populated message:', populatedMessage);
      
      // Broadcast to room
      io.to(data.gameId).emit('message received', populatedMessage);
    } catch (err) {
      console.error('Error handling new message:', err);
      socket.emit('message error', { 
        message: 'Error saving message',
        details: err.message 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 