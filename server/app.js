require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Ensure the schema exists before handling any request. Cheap no-op after the
// first successful run since the Postgres tables persist across invocations.
let dbReady = null;
app.use((req, res, next) => {
  if (!dbReady) dbReady = initDb().catch(err => { dbReady = null; throw err; });
  dbReady.then(() => next()).catch(next);
});

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'Spirit and Body server running' });
});

// Routes (added incrementally each phase)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/battle', require('./routes/battle'));
app.use('/api/pvp', require('./routes/pvp'));

app.use(require('./middleware/errorHandler'));

module.exports = app;
