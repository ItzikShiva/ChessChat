require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sql, connectDB } = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB().catch(console.error);

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await sql.query`
      INSERT INTO Users (Username, Email, PasswordHash)
      VALUES (${username}, ${email}, ${hashedPassword});
      SELECT SCOPE_IDENTITY() as Id;
    `;
    
    const userId = result.recordset[0].Id;
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: { id: userId, username, email }
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
    const { email, password } = req.body;
    
    const result = await sql.query`
      SELECT Id, Username, Email, PasswordHash, Coins
      FROM Users
      WHERE Email = ${email}
    `;

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.Id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        coins: user.Coins
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

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

// Test route
app.get('/api/test', authenticateToken, async (req, res) => {
  try {
    const result = await sql.query`
      SELECT Username, Email, Coins
      FROM Users
      WHERE Id = ${req.user.userId}
    `;
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 