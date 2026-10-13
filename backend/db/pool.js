

const { Pool } = require('pg');

const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {

  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
