CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME
);

CREATE TABLE IF NOT EXISTS characters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    hp_max          INTEGER DEFAULT 100,
    hp_current      INTEGER DEFAULT 100,
    attack          INTEGER DEFAULT 14,
    defense         INTEGER DEFAULT 8,
    speed           INTEGER DEFAULT 9,
    staff_id        TEXT DEFAULT 'basic_staff',
    hat_id          TEXT DEFAULT 'basic_hat',
    robe_id         TEXT DEFAULT 'basic_robe',
    boots_id        TEXT DEFAULT 'basic_boots',
    relic_id        TEXT DEFAULT NULL,
    current_region  TEXT DEFAULT 'base',
    quest_flags     TEXT DEFAULT '{}',
    inventory       TEXT DEFAULT '[]',
    gold            INTEGER DEFAULT 0,
    appearance      TEXT DEFAULT '{"bodyType":"standard","skinTone":"medium","hairStyle":"short","hairColour":"brown","robeColour":"blue","hatColour":"blue"}',
    level           INTEGER DEFAULT 1,
    xp              INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id    INTEGER NOT NULL REFERENCES characters(id),
    species         TEXT NOT NULL,
    nickname        TEXT,
    type            TEXT NOT NULL CHECK(type IN ('water','fire','plant','lightning','glow','ice','rock')),
    level           INTEGER DEFAULT 1,
    xp              INTEGER DEFAULT 0,
    hp_max          INTEGER DEFAULT 60,
    hp_current      INTEGER DEFAULT 60,
    attack          INTEGER DEFAULT 10,
    defense         INTEGER DEFAULT 5,
    speed           INTEGER DEFAULT 8,
    active_slot     INTEGER DEFAULT NULL CHECK(active_slot IN (NULL, 1, 2)),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_character ON pets(character_id);
