/**
 * server.js
 * Entry point. Loads config, sets up security middleware, connects
 * to both databases, mounts every route file, and starts listening.
 * Run `npm run dev` (auto-restarts on changes) or `npm start`.
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const pool = require('./db/pool');
const { connectMongo } = require('./db/mongo');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./config/rateLimiters');

const app = express();

// ---------------------------------------------------------
// Security & parsing middleware — order matters here.
// ---------------------------------------------------------

app.use(helmet()); // sets a bunch of protective HTTP headers (X-Frame-Options, etc.)

app.use(cors({
  origin: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  credentials: true // required so the browser will send/receive the auth cookie
}));

app.use(express.json({ limit: '1mb' })); // caps request body size — basic DoS protection
app.use(cookieParser());
app.use(apiLimiter);

// Serve uploaded product/brand photos. Only ever reads files multer
// already validated and saved — never anything user-path-controlled.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------

app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/brands', require('./routes/brands.routes'));
app.use('/api/suppliers', require('./routes/suppliers.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// 404 for anything under /api that didn't match a route above.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use(errorHandler);

// ---------------------------------------------------------
// Startup
// ---------------------------------------------------------

async function start() {
  // Fail fast and loudly if either database isn't reachable, rather
  // than starting a server that will error on the first real request.
  await pool.query('SELECT 1');
  console.log('Connected to PostgreSQL');

  await connectMongo();

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
