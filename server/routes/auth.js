const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, query } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await getOne('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const inserted = await getOne(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, password_hash]
    );

    const user = { id: inserted.id, username };
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const row = await getOne('SELECT * FROM users WHERE username = $1', [username]);
    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    await query('UPDATE users SET last_login = now() WHERE id = $1', [row.id]);

    const user = { id: row.id, username: row.username };
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await getOne(
      'SELECT id, username, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: row });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
