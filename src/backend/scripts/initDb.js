const sql = require('mssql');
const config = require('../config/database');

async function initializeDatabase() {
    try {
        // Connect to master database to create ChessChat database
        const masterConfig = {
            ...config,
            database: 'master'
        };
        let pool = await sql.connect(masterConfig);
        
        // Create database if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${config.database}')
            BEGIN
                CREATE DATABASE ${config.database}
            END
        `);
        
        // Switch to ChessChat database
        await pool.close();
        pool = await sql.connect(config);
        
        // Create Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
            CREATE TABLE Users (
                UserId INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) UNIQUE NOT NULL,
                Email NVARCHAR(100) UNIQUE NOT NULL,
                PasswordHash NVARCHAR(255) NOT NULL,
                CreatedAt DATETIME DEFAULT GETDATE(),
                LastLogin DATETIME,
                Rating INT DEFAULT 1200,
                Status NVARCHAR(20) DEFAULT 'offline'
            )
        `);
        
        // Create Games table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Games')
            CREATE TABLE Games (
                GameId INT IDENTITY(1,1) PRIMARY KEY,
                WhitePlayerId INT REFERENCES Users(UserId),
                BlackPlayerId INT REFERENCES Users(UserId),
                StartTime DATETIME DEFAULT GETDATE(),
                EndTime DATETIME,
                Result NVARCHAR(10),
                FEN NVARCHAR(MAX),
                PGN NVARCHAR(MAX),
                TimeControl NVARCHAR(20),
                Status NVARCHAR(20) DEFAULT 'active'
            )
        `);
        
        // Create Messages table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
            CREATE TABLE Messages (
                MessageId INT IDENTITY(1,1) PRIMARY KEY,
                SenderId INT REFERENCES Users(UserId),
                GameId INT REFERENCES Games(GameId),
                Content NVARCHAR(MAX),
                SentAt DATETIME DEFAULT GETDATE(),
                IsRead BIT DEFAULT 0
            )
        `);
        
        // Create Friends table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Friends')
            CREATE TABLE Friends (
                FriendshipId INT IDENTITY(1,1) PRIMARY KEY,
                User1Id INT REFERENCES Users(UserId),
                User2Id INT REFERENCES Users(UserId),
                Status NVARCHAR(20) DEFAULT 'pending',
                CreatedAt DATETIME DEFAULT GETDATE(),
                CONSTRAINT UQ_Friendship UNIQUE (User1Id, User2Id)
            )
        `);

        console.log('Database and tables created successfully');
        await pool.close();
        
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 