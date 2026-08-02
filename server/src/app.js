'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { PORT, CLIENT_URL, NODE_ENV } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();


// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ─── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'capacitor://localhost',   // Android Capacitor app (some versions)
  'https://localhost',       // Android Capacitor app (newer versions)
  'http://localhost',        // iOS Capacitor app
  'http://localhost:5173',   // Vite dev server
  CLIENT_URL,                // Any extra origin from env (e.g. web domain)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true, // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── HTTP Logging ──────────────────────────────────────────────────────────
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/schedule', require('./routes/schedule.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/modules', require('./routes/module.routes'));
app.use('/api/focus', require('./routes/focus.routes'));
app.use('/api/goals', require('./routes/goal.routes'));
app.use('/api/profile', require('./routes/profile.routes'));

// ─── 404 + Error Handlers ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${PORT} [${NODE_ENV}]`);
    // Start auto-planner cron job (generates plans at 3:50 AM daily)
    try {
      require('./jobs/autoPlanner.job');
      logger.info('⏰ Auto-planner cron job registered.');
    } catch (e) {
      logger.warn('Auto-planner job failed to start:', e.message);
    }
  });
}

module.exports = app;
