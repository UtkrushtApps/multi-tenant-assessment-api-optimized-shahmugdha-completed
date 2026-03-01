const express = require('express');
const morgan = require('morgan');

const apiRouter = require('./routes/api');
const { requestLogger } = require('./middleware/middleware');

const app = express();

// Basic middleware stack
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api', apiRouter);

// Not found handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// Note: intentionally simple, but functional
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
