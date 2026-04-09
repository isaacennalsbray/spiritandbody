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
}

module.exports = { getDb, initDb };
