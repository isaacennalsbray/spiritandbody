const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(__dirname, 'spiritandbody.db');
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

  // If characters table has old 'class' column, drop all old tables and start fresh
  try {
    const info = instance.prepare("PRAGMA table_info(characters)").all();
    const hasClass = info.some(col => col.name === 'class');
    if (hasClass) {
      console.log('[db] Old schema detected — dropping old tables and rebuilding...');
      instance.exec(`
        DROP TABLE IF EXISTS pvp_turns;
        DROP TABLE IF EXISTS pvp_battles;
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS game_saves;
        DROP TABLE IF EXISTS spirit_beasts;
        DROP TABLE IF EXISTS characters;
        DROP TABLE IF EXISTS users;
      `);
    }
  } catch(e) { /* table didn't exist yet */ }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  instance.exec(schema);

  // Migrate: add appearance column if missing
  try {
    instance.exec("ALTER TABLE characters ADD COLUMN appearance TEXT DEFAULT '{\"bodyType\":\"standard\",\"skinTone\":\"medium\",\"hairStyle\":\"short\",\"hairColour\":\"brown\",\"robeColour\":\"blue\",\"hatColour\":\"blue\"}'");
  } catch(e) { /* column already exists */ }

  // Migrate: add level/xp columns if missing
  try { instance.exec('ALTER TABLE characters ADD COLUMN level INTEGER DEFAULT 1'); } catch(e) {}
  try { instance.exec('ALTER TABLE characters ADD COLUMN xp    INTEGER DEFAULT 0'); } catch(e) {}

  // Migrate: give starter inventory to characters that have an empty one
  try {
    const starter = JSON.stringify(['basic_staff','basic_hat','basic_robe','basic_boots']);
    instance.prepare("UPDATE characters SET inventory = ? WHERE inventory = '[]' OR inventory IS NULL OR inventory = ''").run(starter);
  } catch(e) {}

  // Migrate: gold economy
  try { instance.exec('ALTER TABLE characters ADD COLUMN gold INTEGER DEFAULT 0'); } catch(e) {}

  // Migrate: bestiary tracking
  try { instance.exec("ALTER TABLE characters ADD COLUMN seen_species  TEXT DEFAULT '[]'"); } catch(e) {}
  try { instance.exec("ALTER TABLE characters ADD COLUMN caught_species TEXT DEFAULT '[]'"); } catch(e) {}

  // Migrate: quest flags
  try { instance.exec("ALTER TABLE characters ADD COLUMN quest_flags TEXT DEFAULT '{}'"); } catch(e) {}

  // Migrate: pet xp column (may already exist)
  try { instance.exec('ALTER TABLE pets ADD COLUMN xp INTEGER DEFAULT 0'); } catch(e) {}

  // Migrate: region where pet was caught
  try { instance.exec('ALTER TABLE pets ADD COLUMN caught_region TEXT DEFAULT NULL'); } catch(e) {}

  console.log('[db] Schema initialized');
}

module.exports = { getDb, initDb };
