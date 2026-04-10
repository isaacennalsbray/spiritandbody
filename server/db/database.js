const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'spiritandbody.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const instance = getDb();
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  instance.exec(schema);
  console.log('[db] Schema initialized');

  // ── Incremental migrations (safe to run repeatedly) ──────────────────────
  const migrations = [
    // v0.3: add xp_to_next to spirit_beasts
    `ALTER TABLE spirit_beasts ADD COLUMN xp_to_next INTEGER DEFAULT 80`,
  ];
  for (const sql of migrations) {
    try {
      instance.exec(sql);
    } catch (e) {
      // "duplicate column" means migration already applied — safe to ignore
      if (!e.message.includes('duplicate column')) throw e;
    }
  }
  console.log('[db] Migrations applied');
}

module.exports = { getDb, initDb };
