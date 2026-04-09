require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

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

initDb();

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});
