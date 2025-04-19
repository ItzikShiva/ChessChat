require('dotenv').config();

const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true, // For development only
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function connectDB() {
    try {
        console.log('Attempting to connect to SQL Server...');
        console.log('Server:', config.server);
        console.log('Database:', config.database);
        
        await sql.connect(config);
        console.log('Connected to SQL Server successfully');
        
        // Test the connection
        const result = await sql.query('SELECT @@VERSION as version');
        console.log('SQL Server Version:', result.recordset[0].version);
    } catch (err) {
        console.error('Database Connection Error:', err);
        throw err;
    }
}

module.exports = {
    sql,
    connectDB
}; 