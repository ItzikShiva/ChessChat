const sql = require('mssql');

const config = {
    server: '127.0.0.1\\SQLEXPRESS',  // Try IP address
    database: 'master',  // Connect to master first
    options: {
        trustServerCertificate: true,
        trustedConnection: true,
        encrypt: false
    }
};

async function testConnection() {
    try {
        console.log('Connecting to SQL Server...');
        let pool = await sql.connect(config);
        console.log('Connected successfully!');

        // Create Chess database
        console.log('Creating Chess database...');
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Chess')
            BEGIN
                CREATE DATABASE Chess;
                PRINT 'Chess database created successfully';
            END
        `);

        // Switch to Chess database
        await pool.close();
        config.database = 'Chess';
        pool = await sql.connect(config);

        // Create tables
        console.log('Creating tables...');
        await pool.query(`
            -- Users table
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
            CREATE TABLE Users (
                UserId INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) UNIQUE NOT NULL,
                Email NVARCHAR(100) UNIQUE NOT NULL,
                Password NVARCHAR(255) NOT NULL,
                Rating INT DEFAULT 1200,
                CreatedAt DATETIME DEFAULT GETDATE()
            );

            -- Games table
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Games')
            CREATE TABLE Games (
                GameId INT IDENTITY(1,1) PRIMARY KEY,
                WhitePlayerId INT REFERENCES Users(UserId),
                BlackPlayerId INT REFERENCES Users(UserId),
                Result NVARCHAR(10),
                Moves NVARCHAR(MAX),
                StartTime DATETIME DEFAULT GETDATE(),
                EndTime DATETIME
            );

            -- Chat Messages table
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
            CREATE TABLE Messages (
                MessageId INT IDENTITY(1,1) PRIMARY KEY,
                GameId INT REFERENCES Games(GameId),
                UserId INT REFERENCES Users(UserId),
                Message NVARCHAR(500),
                SentAt DATETIME DEFAULT GETDATE()
            );
        `);

        console.log('Tables created successfully!');

        // Create a test user
        console.log('Creating test user...');
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'test@chess.com')
            INSERT INTO Users (Username, Email, Password, Rating)
            VALUES ('TestUser', 'test@chess.com', 'test123', 1200);
        `);

        console.log('Test user created!');

        // Verify everything
        const result = await pool.query`
            SELECT 
                (SELECT COUNT(*) FROM Users) as UserCount,
                (SELECT COUNT(*) FROM Games) as GameCount,
                (SELECT COUNT(*) FROM Messages) as MessageCount;
        `;

        console.log('\nDatabase Status:');
        console.log('Users:', result.recordset[0].UserCount);
        console.log('Games:', result.recordset[0].GameCount);
        console.log('Messages:', result.recordset[0].MessageCount);

        await pool.close();
        console.log('\nAll done! Database is ready to use.');
    } catch (err) {
        console.error('Database Error:', err);
    }
}

testConnection(); 