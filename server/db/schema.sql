CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    pvp_wins      INTEGER DEFAULT 0,
    pvp_losses    INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME
);

CREATE TABLE IF NOT EXISTS characters (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    name                TEXT NOT NULL,
    class               TEXT NOT NULL CHECK(class IN ('warrior','mage','assassin')),
    level               INTEGER DEFAULT 1,
    xp                  INTEGER DEFAULT 0,
    xp_to_next          INTEGER DEFAULT 100,
    hp_max              INTEGER DEFAULT 100,
    hp_current          INTEGER DEFAULT 100,
    mp_max              INTEGER DEFAULT 50,
    mp_current          INTEGER DEFAULT 50,
    attack              INTEGER DEFAULT 10,
    defense             INTEGER DEFAULT 5,
    speed               INTEGER DEFAULT 8,
    unlocked_abilities  TEXT DEFAULT '[]',
    skill_points        INTEGER DEFAULT 0,
    current_region      TEXT DEFAULT 'starting_village',
    position_x          INTEGER DEFAULT 0,
    position_y          INTEGER DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spirit_beasts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    character_id        INTEGER NOT NULL REFERENCES characters(id),
    beast_template_id   TEXT NOT NULL,
    nickname            TEXT,
    beast_type          TEXT NOT NULL CHECK(beast_type IN ('land','sky','water')),
    tier                INTEGER DEFAULT 1,
    level               INTEGER DEFAULT 1,
    xp                  INTEGER DEFAULT 0,
    hp_max              INTEGER,
    hp_current          INTEGER,
    attack              INTEGER,
    defense             INTEGER,
    speed               INTEGER,
    stamina_current     INTEGER DEFAULT 3,
    unlocked_abilities  TEXT DEFAULT '[]',
    active_passives     TEXT DEFAULT '[]',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_saves (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    character_id    INTEGER NOT NULL REFERENCES characters(id),
    inventory       TEXT DEFAULT '{}',
    quest_flags     TEXT DEFAULT '{}',
    world_flags     TEXT DEFAULT '{}',
    visited_regions TEXT DEFAULT '[]',
    gold            INTEGER DEFAULT 0,
    playtime_secs   INTEGER DEFAULT 0,
    saved_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pvp_battles (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger_id         INTEGER NOT NULL REFERENCES users(id),
    defender_id           INTEGER NOT NULL REFERENCES users(id),
    status                TEXT DEFAULT 'pending'
                          CHECK(status IN ('pending','active','completed','declined','expired')),
    current_turn_user_id  INTEGER REFERENCES users(id),
    turn_number           INTEGER DEFAULT 0,
    terrain_type          TEXT NOT NULL DEFAULT 'forest',
    battle_state          TEXT NOT NULL DEFAULT '{}',
    pending_actions       TEXT DEFAULT '{}',
    winner_id             INTEGER REFERENCES users(id),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at            DATETIME
);

CREATE TABLE IF NOT EXISTS pvp_turns (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id         INTEGER NOT NULL REFERENCES pvp_battles(id),
    user_id           INTEGER NOT NULL REFERENCES users(id),
    turn_number       INTEGER NOT NULL,
    actions_submitted TEXT NOT NULL,
    result_snapshot   TEXT,
    submitted_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    payload     TEXT DEFAULT '{}',
    read        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_users ON pvp_battles(challenger_id, defender_id);
CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
