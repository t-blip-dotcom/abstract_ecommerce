/**
 * db/pool.js
 * One shared connection pool for the whole app. Every query file
 * imports `pool` from here instead of creating its own connection —
 * pooling reuses open connections instead of opening a new one per
 * request, which is a lot faster under real traffic.
 *
 * pg reads PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD from
 * process.env automatically, so we don't have to pass them by hand.
 */

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
