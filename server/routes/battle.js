const router = require('express').Router();

router.all('*', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
