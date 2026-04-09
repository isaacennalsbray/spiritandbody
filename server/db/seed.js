require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getDb, initDb } = require('./database');

initDb();
const db = getDb();

console.log('[seed] Database ready — static game data lives in server/data/ and is loaded at runtime.');
console.log('[seed] No seeding needed for Phase 1.');
