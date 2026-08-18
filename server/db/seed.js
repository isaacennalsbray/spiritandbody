require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { initDb, getPool } = require('./database');

initDb()
  .then(() => {
    console.log('[seed] Database ready — static game data lives in server/data/ and is loaded at runtime.');
    console.log('[seed] No seeding needed for Phase 1.');
    return getPool().end();
  })
  .catch(err => {
    console.error('[seed] Failed to initialize database:', err);
    process.exit(1);
  });
