const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/db.config');

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rating: { type: Number, default: 1200 },
    coins: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Game Schema
const gameSchema = new mongoose.Schema({
    whitePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blackPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    result: { type: String, enum: ['white', 'black', 'draw', 'ongoing'] },
    moves: [String],
    startTime: { type: Date, default: Date.now },
    endTime: Date
});

// Message Schema
const messageSchema = new mongoose.Schema({
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Message = mongoose.model('Message', messageSchema);

async function testConnection() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!');

        // Create test user
        const testUser = new User({
            username: 'testplayer',
            email: 'test@chesschat.com',
            password: 'test123',  // In production, this should be hashed
            rating: 1200,
            coins: 500
        });

        try {
            await testUser.save();
            console.log('Test user created successfully:');
            console.log('Username:', testUser.username);
            console.log('Password:', 'test123');
            console.log('Coins:', testUser.coins);
            console.log('Rating:', testUser.rating);
        } catch (err) {
            if (err.code === 11000) {
                console.log('Test user already exists, updating coins...');
                await User.findOneAndUpdate(
                    { username: 'testplayer' },
                    { coins: 500 },
                    { new: true }
                );
                const updatedUser = await User.findOne({ username: 'testplayer' });
                console.log('Updated test user:');
                console.log('Username:', updatedUser.username);
                console.log('Password:', 'test123');
                console.log('Coins:', updatedUser.coins);
                console.log('Rating:', updatedUser.rating);
            } else {
                throw err;
            }
        }

        // Get database stats
        const users = await User.countDocuments();
        const games = await Game.countDocuments();
        const messages = await Message.countDocuments();

        console.log('\nDatabase Status:');
        console.log('Users:', users);
        console.log('Games:', games);
        console.log('Messages:', messages);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (err) {
        console.error('MongoDB Error:', err);
    }
}

testConnection(); 