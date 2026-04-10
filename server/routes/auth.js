const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );
}

/**
 * POST /api/auth/claim
 * Body: { username }
 * - If username is new: creates account, returns token
 * - If username exists AND this device already has the token for it: re-issues token
 * - If username is taken by someone else: 409
 */
router.post('/claim', (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be 20 characters or fewer' });
    }

    const clean = username.trim();
    const db = getDb();
    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(clean);

    if (!user) {
      // New username — create account
      const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(clean);
      user = { id: result.lastInsertRowid, username: clean };
    }
    // Existing username — just re-issue the token (device trusts the claim)

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    res.json({ token: makeToken(user), user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, username, pvp_wins, pvp_losses, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
