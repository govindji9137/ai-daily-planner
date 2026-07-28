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

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
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
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
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
