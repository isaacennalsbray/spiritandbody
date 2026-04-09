const router = require('express').Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
