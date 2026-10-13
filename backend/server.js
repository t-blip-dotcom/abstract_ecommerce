
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const pool = require('./db/pool');
const { connectMongo } = require('./db/mongo');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false 
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const isLocalDevOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin))) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Link created Routes

app.use('/api/auth', require('./routes/auth.routes'));
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


app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use(errorHandler);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error(`PostgreSQL connection failed (host: ${process.env.PGHOST}, port: ${process.env.PGPORT}). Check PGHOST in .env and that Postgres is running and accepting connections.`);
    throw err;
  }

  try {
    await connectMongo();
  } catch (err) {
    console.error('MongoDB connection failed. Check MONGODB_URI in .env and that MongoDB is running and reachable from here.');
    throw err;
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});