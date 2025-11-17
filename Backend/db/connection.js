// Database Connection Pool
const mysql = require('mysql2');
const dbConfig = require('../config/database');

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Get a promise-based connection
const promisePool = pool.promise();

// Test the database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

module.exports = promisePool;
