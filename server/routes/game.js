const router = require('express').Router();

// Stub — implemented in Phase 2
router.all('*', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
