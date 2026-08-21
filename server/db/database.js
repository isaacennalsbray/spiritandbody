const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL (or DATABASE_URL) environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function getOne(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0];
}

async function getAll(text, params = []) {
  const { rows } = await query(text, params);
  return rows;
}

async function initDb() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await query(schema);
  console.log('[db] Schema initialized');
}

module.exports = { getPool, query, getOne, getAll, initDb };
