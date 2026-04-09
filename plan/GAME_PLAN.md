# Spirit and Body — Game Implementation Plan

## Context

Building a turn-based RPG browser game from a blank repo. Players control a main character (one of three classes) plus a spirit beast companion — both act each turn. The game has a single-player PvE open-world campaign and an async PvP mode. A core design requirement is that the game must be **strategically deep**: not "first player wins," meaningful decisions every turn, and different team/map combinations should push players to think differently.

---

## Core Design Principles (Fun + Strategy)

This section drives every mechanical decision below.

### 1. Simultaneous Action Commitment (No "First Mover" Advantage)
In PvP, both players submit their hero + beast actions **before resolution**. Actions are revealed and resolved simultaneously, sorted by speed. This means:
- You're betting on what your opponent will do
- Committing to an aggressive turn when the opponent defends wastes your tempo
- Committing to defense when the opponent heals gives them free value
- Speed stat becomes a tiebreaker, not a guaranteed "go first"

This poker/prediction element is the central PvP skill expression.

### 2. Type Triangle (Counters Matter)
```
Land → Water → Sky → Land
```
- Land beasts deal +25% damage to Water, take -15% damage from Water
- Water beasts deal +25% to Sky, take -15% from Sky
- Sky beasts deal +25% to Land, take -15% from Land

This means building a team to hard-counter your opponent is a valid strategy — but so is picking a "neutral" beast and outplaying through skills. No matchup is auto-win; the triangle shifts the math by ~25%, not 100%.

### 3. Terrain Effects (Maps Change the Game)
Each battle location has a **terrain type** that modifies stats and may add special rules:

| Terrain | Bonus | Special Rule |
|---------|-------|--------------|
| Forest | Land beasts +15% ATK, +10% DEF | Dense canopy: Sky beasts -10% SPD |
| Open Sky | Sky beasts +15% ATK, +10% SPD | Crosswinds: projectile abilities have 15% miss chance |
| Coastal / River | Water beasts +15% ATK, DEF | Wet ground: paralysis chance on all attacks +10% |
| Cavern | All beasts -10% SPD | Echolocation: Bat-line beasts gain +20% ATK |
| Volcanic | Fire-adjacent abilities +20% | Burning ground: all units take 3 HP/turn DoT |
| Frozen Tundra | All SPD reduced by 2 | Blizzard turns: 20% chance any unit is slowed this turn |

In the open world, the map tile type determines terrain. In dungeons, each floor has a fixed terrain. In PvP, the challenger picks from 3 randomly offered terrain tiles — so matchup and terrain interact.

### 4. Hero + Beast Synergies (Combos Require Setup)
The most powerful moves require the hero and beast to set up for each other. Examples:
- **Warrior + Wolf**: Wolf applies Bleed → Warrior's "Open Wound Strike" deals +50% to bleeding targets
- **Mage + Owl**: Owl Silences enemy → Mage's "Interrupt Blast" deals 2x damage to a silenced target
- **Assassin + Bat**: Bat life-steals → Assassin gains Combo Points equal to HP stolen that turn
- **Warrior + Bear**: Bear uses Maul (DEF down) → Warrior's Shield Bash is enhanced vs DEF-debuffed targets
- **Mage + Eel**: Mage casts AoE → Eel's "Voltaic Aura" triggers off each spell hit target

Each hero class has 2 synergy abilities per beast **type** (6 total). Discovering which combos exist is the "puzzle" layer — there are visual cues (ability descriptions hint at conditions).

### 5. Boss Puzzle Mechanics (PvE Requires Pattern Recognition)
Bosses have **phases** with explicit mechanics players must adapt to:
- Phase 1 normal combat
- Phase transition (at 50% HP): boss changes behavior — e.g. spawns a shield that must be broken with a specific damage type, or gains a buff that can only be cleansed by a Water beast ability
- Bosses telegraph upcoming powerful attacks ("Boss is winding up…") — players can sacrifice that turn's offense to defend/debuff

Additionally, some dungeon floors have **environmental puzzles** (pressure plates, switches) that, if solved, weaken the boss before the fight (bonus mechanic, not gating).

### 6. Resource Tension (Can't Spam Best Moves)
- **Warriors** use Energy (regenerates 15/turn, high-power moves cost 40–60) — must decide when to dump big damage vs. managing for sustained fights
- **Mages** use Mana (low regen, high spells cost 60–80) — running dry mid-fight is a real threat; must mix basics and spells
- **Assassins** use Combo Points (built by basic attacks, spent on finishers) — have to "earn" their big hits

Beasts have **Stamina** (simpler: 3 ability uses per battle, recharge +1/turn after use). Basic beast attacks are always free.

### 7. Status Effect Stacking / Chaining
Some effects chain into stronger states:
```
Wet (Water ability) + Lightning ability → Electrified (2x paralysis chance, lasts 2 extra turns)
Bleed + Poison → Hemorrhage (combined DoT, 30% higher tick)
Slowed + Stunned → Rooted (misses their turn + can't defend)
```
Knowing these chains rewards attentive players and punishes opponents who don't cleanse.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Phaser 3 + Vite |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcryptjs |
| Dev tooling | concurrently (run both servers) |

---

## Project Directory Structure

```
spiritandbody/
├── package.json                   # root — "dev" script uses concurrently
├── .env.example
│
├── server/
│   ├── package.json
│   ├── index.js                   # Express entry point
│   ├── db/
│   │   ├── schema.sql
│   │   ├── seed.js                # populate beast/class/enemy static data
│   │   └── database.js            # better-sqlite3 singleton
│   ├── middleware/
│   │   ├── auth.js                # JWT verify
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── game.js                # /api/game/*
│   │   ├── battle.js              # /api/battle/* (PvE result save)
│   │   └── pvp.js                 # /api/pvp/*
│   ├── services/
│   │   ├── BattleEngine.js        # PURE logic — no DB, shared with client
│   │   ├── AIService.js           # PvE enemy AI decisions
│   │   ├── SaveService.js
│   │   └── PvPService.js
│   └── data/
│       ├── beasts.js              # all 27 beast definitions
│       ├── classes.js             # ability trees for warrior/mage/assassin
│       ├── enemies.js             # enemy templates + boss patterns
│       ├── terrains.js            # terrain type definitions + modifiers
│       └── world.js               # region/dungeon definitions
│
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.js             # proxies /api to localhost:3001
    ├── public/assets/
    │   ├── sprites/heroes/
    │   ├── sprites/beasts/
    │   ├── sprites/enemies/
    │   ├── tilemaps/
    │   ├── ui/
    │   └── audio/
    └── src/
        ├── main.js                # Phaser game config + scene registry
        ├── config/
        │   ├── GameConfig.js
        │   └── Constants.js
        ├── scenes/
        │   ├── BootScene.js
        │   ├── PreloadScene.js
        │   ├── MainMenuScene.js
        │   ├── CharacterCreateScene.js
        │   ├── WorldMapScene.js
        │   ├── TownScene.js
        │   ├── DungeonScene.js
        │   ├── BattleScene.js     # PvE — most complex scene
        │   ├── PvPLobbyScene.js
        │   ├── PvPBattleScene.js
        │   └── UIScene.js         # persistent HUD overlay
        ├── entities/
        │   ├── Character.js
        │   ├── Beast.js
        │   ├── Enemy.js
        │   └── StatusEffect.js
        ├── battle/
        │   ├── BattleManager.js   # orchestrates PvE battle loop
        │   ├── TurnQueue.js       # speed-based ordering
        │   ├── ActionResolver.js  # damage calc, effects, chains
        │   ├── TerrainModifier.js # applies terrain rules to battle state
        │   └── AnimationQueue.js  # sequences visual events
        ├── ui/
        │   ├── BattleHUD.js
        │   ├── ActionMenu.js      # hero + beast action pickers
        │   ├── DialogBox.js
        │   ├── SynergyHintPanel.js # subtle hints about combo conditions
        │   └── MiniMap.js
        ├── world/
        │   ├── WorldManager.js
        │   ├── RegionLoader.js
        │   └── EncounterManager.js
        └── api/
            └── ApiClient.js
```

---

## Database Schema

```sql
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    pvp_wins      INTEGER DEFAULT 0,
    pvp_losses    INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME
);

CREATE TABLE characters (
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
    unlocked_abilities  TEXT DEFAULT '[]',  -- JSON array of ability IDs
    skill_points        INTEGER DEFAULT 0,
    current_region      TEXT DEFAULT 'starting_village',
    position_x          INTEGER DEFAULT 0,
    position_y          INTEGER DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spirit_beasts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    character_id        INTEGER NOT NULL REFERENCES characters(id),
    beast_template_id   TEXT NOT NULL,   -- 'wolf', 'hawk', 'eel', etc.
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
    stamina_current     INTEGER DEFAULT 3,  -- ability uses remaining
    unlocked_abilities  TEXT DEFAULT '[]',
    active_passives     TEXT DEFAULT '[]',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_saves (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    character_id    INTEGER NOT NULL REFERENCES characters(id),
    inventory       TEXT DEFAULT '{}',    -- JSON: { item_id: quantity }
    quest_flags     TEXT DEFAULT '{}',    -- JSON: { quest_id: step }
    world_flags     TEXT DEFAULT '{}',    -- JSON: arbitrary world events
    visited_regions TEXT DEFAULT '[]',
    gold            INTEGER DEFAULT 0,
    playtime_secs   INTEGER DEFAULT 0,
    saved_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pvp_battles (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger_id         INTEGER NOT NULL REFERENCES users(id),
    defender_id           INTEGER NOT NULL REFERENCES users(id),
    status                TEXT DEFAULT 'pending'
                          CHECK(status IN ('pending','active','completed','declined','expired')),
    current_turn_user_id  INTEGER REFERENCES users(id),
    turn_number           INTEGER DEFAULT 0,
    terrain_type          TEXT NOT NULL DEFAULT 'forest',   -- set at challenge creation
    battle_state          TEXT NOT NULL DEFAULT '{}',       -- full serialized state
    pending_actions       TEXT DEFAULT '{}',  -- { userId: actions[] } before resolution
    winner_id             INTEGER REFERENCES users(id),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at            DATETIME
);

CREATE TABLE pvp_turns (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id         INTEGER NOT NULL REFERENCES pvp_battles(id),
    user_id           INTEGER NOT NULL REFERENCES users(id),
    turn_number       INTEGER NOT NULL,
    actions_submitted TEXT NOT NULL,    -- JSON: hero action + beast action
    result_snapshot   TEXT,             -- JSON: state after this turn resolved
    submitted_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    payload     TEXT DEFAULT '{}',
    read        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_pvp_battles_users ON pvp_battles(challenger_id, defender_id);
CREATE INDEX idx_characters_user ON characters(user_id);
```

---

## Backend API Routes

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | bcrypt hash, return JWT |
| POST | `/login` | validate, return JWT |
| GET | `/me` | requires JWT |

### Game State — `/api/game`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/characters` | new character + beast creation |
| GET | `/characters` | list saves for logged-in user |
| GET | `/characters/:id` | full load (char + beast + save) |
| PUT | `/characters/:id` | autosave (position, quest flags, inventory) |
| PUT | `/characters/:id/beast` | sync beast state after fight |

### Battle (PvE) — `/api/battle`
PvE logic runs client-side; server only records results.
| Method | Path | Description |
|--------|------|-------------|
| POST | `/pve/result` | `{characterId, beastId, xpGained, outcome, loot}` → applies XP, returns updated char/beast |

### Async PvP — `/api/pvp`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/challenges` | `{defenderId}` — creates battle, randomly assigns 3 terrain options for challenger |
| GET | `/challenges` | list incoming + outgoing pending challenges |
| POST | `/challenges/:id/accept` | defender accepts, terrain locked, battle begins |
| POST | `/challenges/:id/decline` | |
| GET | `/battles/:id` | full battle state + turn log |
| POST | `/battles/:id/turn` | submit `{actions: [{actor, actionType, abilityId, targetSide}]}` — if both players have submitted, resolve turn |
| GET | `/notifications` | poll every 15s for "your turn" alerts |
| POST | `/notifications/:id/read` | |

**PvP Turn Resolution Logic (server-side):**
```
1. Store submitting player's actions in pending_actions JSON
2. If both players have submitted:
   a. Load full battle_state
   b. Call BattleEngine.resolveTurn(state, player1Actions, player2Actions, terrain)
   c. BattleEngine applies TerrainModifier, then resolves all 4 actions by speed order
   d. Save new battle_state, clear pending_actions
   e. Write pvp_turns row with result_snapshot
   f. Create notification for the other player
3. If only one player submitted: return "waiting for opponent"
```

---

## Battle System Logic

### Turn Structure

**PvE (full turn):**
```
Phase 1 — Selection
  Player picks: hero action + beast action
  AI picks: enemy action(s) via AIService

Phase 2 — Terrain modifiers applied to all actors' stats for this turn

Phase 3 — Build turn queue: all actors sorted by speed (desc)
  Tiebreaker: player actors first (slight advantage for being the "human")

Phase 4 — Sequential resolution (each actor in queue):
  1. Check stunned/dead → skip
  2. Validate target alive → redirect if dead
  3. ActionResolver.resolve(actor, action, target, battleState)
     - Apply type advantage multiplier
     - Apply terrain modifier
     - Check synergy condition → bonus if met
     - Apply damage formula
     - Apply status effects + check chains
  4. Push animation event
  5. Check for deaths

Phase 5 — End of turn:
  - Tick all StatusEffects (DoT, buff durations)
  - Regen: Energy +15, Mana +5, Stamina +1 per beast
  - Check status chains (Wet+Lightning → Electrified, etc.)
  - Check win condition

Phase 6 — Post-battle (on win):
  - Award XP to char + beast separately
  - Check beast evolution threshold
  - Roll loot table
  - Boss: trigger phase transition or defeat sequence
```

**PvP simultaneous resolution** (key difference):
```
Both players commit actions without seeing each other's choices.
Resolution: same speed-sorted queue, but neither player's actions
can be "reactively" changed — all choices were blind commitments.
This creates the prediction/bluffing layer.
```

### Damage Formula
```
// Physical
raw = attacker.attack * ability.power
mitigation = defender.defense / (defender.defense + 50)
damage = raw * (1 - mitigation)
damage *= typeMultiplier   // 1.25, 1.0, or 0.85 from triangle
damage *= terrainMultiplier
damage *= synergyMultiplier (1.0 or 1.5 if condition met)
crit = random() < attacker.critChance → damage *= 1.5
damage = max(1, floor(damage))

// Magic: same formula using magicPower / magicResist
// Status DoTs: flat magnitude, unaffected by defense
```

### Win Condition
- **Hero death ends the battle** — beast KO alone does not (weakens you significantly but fight continues)
- This means protecting your hero is always the priority, and killing the enemy hero is always the win condition
- Beast acts as a force multiplier and shield; losing it hurts but isn't game over

### Resource Systems
| Class | Resource | Regen | Notes |
|-------|----------|-------|-------|
| Warrior | Energy (0–100) | +15/turn | Abilities cost 20–60 |
| Mage | Mana (0–120) | +5/turn | Abilities cost 15–80; glass cannon |
| Assassin | Combo Points (0–5) | +1 per basic attack or hit | Finishers spend 3–5 CP |
| All beasts | Stamina (0–3 uses) | +1/turn after use | Basic attack always free |

---

## Spirit Beast System — All 27 Beasts

### Type Triangle
```
Land → Water (Land deals +25% to Water)
Water → Sky   (Water deals +25% to Sky)
Sky → Land    (Sky deals +25% to Land)
Attacker of favored type also takes -15% from that type.
```

### Evolution Schedule
| Tier | Level Range | Trigger |
|------|------------|---------|
| 1 | 1–14 | Starter |
| 2 | 15–29 | Auto at level 15 |
| 3 | 30+ | Auto at level 30 |

On evolution: HP % preserved, all other stats reset to new tier base.

### Ability Unlock Schedule (all beasts)
```
Level 1:  Primary active
Level 5:  Passive
Level 10: Second active (stronger variant)
Level 15: Evolution + Tier 2 active
Level 18: Tier 2 passive (replaces Tier 1)
Level 22: Second Tier 2 active
Level 30: Evolution + Tier 3 active
Level 33: Tier 3 passive (replaces Tier 2)
Level 38: Second Tier 3 active
Level 45: Ultimate (once per battle)
```

### Beast Definitions

#### LAND TYPE

**Wolf → Dire Wolf → Fenrir**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Wolf | 60 | 12 | 4 | 14 | Pack Instinct (+5% ATK when hero acts before beast this turn) | Bite (1.2x, Bleed 2t) |
| 2 | Dire Wolf | 110 | 22 | 8 | 18 | Bloodscent (bleeding targets take +15% all damage) | Savage Rend (1.6x, Bleed 3t) |
| 3 | Fenrir | 200 | 42 | 14 | 24 | World's End Fang (crits inflict Fear: -2 SPD, 1t) | Ragnarok Bite (2.2x; if crit, chains for 0.8x) |

**Bear → Cave Bear → Ursa Prime**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Bear | 90 | 10 | 10 | 6 | Thick Hide (5% damage reduction) | Maul (1.1x, target DEF -10% 2t) |
| 2 | Cave Bear | 160 | 18 | 18 | 8 | Iron Skin (10% DR) | Crushing Maul (1.4x, DEF -20% 2t) |
| 3 | Ursa Prime | 280 | 32 | 32 | 10 | Fortress Body (15% DR, immune to knockback) | Earthquake Slam (1.8x AoE, DEF -20% all) |

**Boar → War Boar → Behemoth Boar**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Boar | 70 | 14 | 6 | 10 | Charge Ready (first action each battle +30% ATK) | Tusk Gore (1.3x, pushes target to back of queue) |
| 2 | War Boar | 120 | 24 | 11 | 13 | Rampage (consecutive hits same target +5% each, stacks 3x) | Iron Tusk (1.5x, push + stun 1t) |
| 3 | Behemoth | 210 | 44 | 20 | 16 | Unstoppable (immune to stun/slow) | Gore Rampage (1.9x hits twice, each applies Rampage) |

#### SKY TYPE

**Hawk → Storm Hawk → Sky Sovereign**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Hawk | 45 | 14 | 3 | 18 | Eagle Eye (+10% crit chance) | Dive Strike (1.4x, ignores 20% DEF) |
| 2 | Storm Hawk | 80 | 26 | 6 | 22 | Gale Feathers (20% dodge physical) | Thunderstrike (1.8x, ignores 30% DEF, 25% stun) |
| 3 | Sky Sovereign | 150 | 48 | 10 | 28 | Apex Predator (crits reduce target SPD -3 for 2t) | Heaven's Talon (2.4x; auto-crit if target HP < 30%) |

**Owl → Arcane Owl → Ethereal Owlord**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Owl | 50 | 10 | 5 | 15 | Night Wisdom (hero ability accuracy +5%) | Lunar Gaze (1.0x, Silence 1t) |
| 2 | Arcane Owl | 90 | 18 | 9 | 17 | Spellweave (hero MP costs -10%) | Mystic Feathers (1.2x, Silence 2t + SPD -2) |
| 3 | Owlord | 170 | 34 | 16 | 21 | Timeless Sight (hero immune to silence, owl immune to debuffs) | Void Screech (1.6x AoE, silences all enemies 1t, -SPD all) |

**Bat → Dusk Bat → Abyssal Wraith Bat**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Bat | 40 | 11 | 2 | 20 | Echolocation (enemy dodge/stealth -50%) | Frenzy Bite (1.1x hits 2x) |
| 2 | Dusk Bat | 75 | 20 | 5 | 24 | Blood Drain (heals 5% of damage dealt) | Leech Swarm (1.3x hits 3x, heals each) |
| 3 | Wraith Bat | 140 | 36 | 9 | 30 | Soul Drain (life steal 10%; 5% transfers to hero) | Eclipse Swarm (1.5x hits 4x, 20% stun each hit) |

#### WATER TYPE

**Eel → Thunder Eel → Leviathan Eel**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Eel | 55 | 13 | 3 | 16 | Static Body (10% paralyze attacker on physical hit received) | Shock Lash (1.2x, 30% paralyze 1t) |
| 2 | Thunder Eel | 100 | 24 | 7 | 19 | Voltaic Aura (20% paralyze on hit received; paralyzed targets take +15% damage) | Chain Lightning (1.4x, chains to second target at 0.7x) |
| 3 | Leviathan Eel | 190 | 44 | 12 | 23 | Storm King (paralyzed targets lose full turn; lightning immune) | Galvanic Storm (1.8x AoE, 40% paralyze all, hero gains ATK buff) |

**Crab → Armored Crab → Celestial Crab**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Crab | 80 | 9 | 12 | 5 | Hard Shell (first hit each battle → 1 damage) | Claw Pinch (1.0x, target ATK -15% 2t) |
| 2 | Armored Crab | 145 | 16 | 22 | 7 | Titan Carapace (damage per hit capped at 15% max HP) | Vice Grip (1.2x, ATK -25%, can't flee 2t) |
| 3 | Celestial Crab | 260 | 28 | 38 | 9 | Indestructible (cap at 12%, immune to DoTs) | Cosmic Crush (1.6x, ATK -30% + DEF -20% 2t) |

**Turtle → Stone Turtle → World Tortoise**
| Tier | Name | HP | ATK | DEF | SPD | Passive | Active |
|------|------|----|-----|-----|-----|---------|--------|
| 1 | Turtle | 85 | 7 | 14 | 4 | Ancient Shell (hero takes -10% damage while beast alive) | Shell Smash (1.0x, own DEF -20% this turn → ATK +30% next turn) |
| 2 | Stone Turtle | 155 | 13 | 26 | 5 | World Shell (-15% to hero; beast absorbs 1 hit/turn for hero) | Terrain Crush (1.3x, all enemy SPD -3 for 2t) |
| 3 | World Tortoise | 280 | 22 | 46 | 6 | Cosmic Refuge (-20% to hero; once per battle: beast sacrifices self to revive hero at 25% HP) | Tectonic Slam (1.6x AoE, all enemy SPD+DEF down, hero gains DEF buff) |

### Status Effect Chains
```
Wet (any Water ability) + Lightning (any Eel ability) → Electrified
  Effect: 2x paralyze chance, lasts 2 extra turns

Bleed (Wolf line) + Poison (Assassin abilities) → Hemorrhage
  Effect: +30% combined tick damage

Slowed + Stunned → Rooted
  Effect: full turn skip + cannot use Defend action

Silence + Fear (Fenrir) → Shattered Will
  Effect: -20% all stats for duration
```

---

## Hero Class Ability Trees

### Warrior
Uses Energy (max 100, regen 15/turn)

| Level Unlocked | Ability | Cost | Effect |
|---------------|---------|------|--------|
| 1 | Basic Strike | 0 | 1.0x physical |
| 2 | Shield Bash | 20 | 1.1x + stun 30% chance |
| 5 | War Cry | 30 | Self ATK +20% 3t, beast ATK +10% 3t |
| 8 | Cleave | 35 | 0.9x hits all enemies |
| 12 | Counter Stance | 25 | Defend + 50% chance to counter next hit |
| 16 | Open Wound Strike | 45 | 1.8x — deals +50% extra vs Bleeding targets (synergy) |
| 20 | Rally | 40 | Hero + beast each heal 15% max HP |
| 25 | Unbreakable | 60 | Negate next hit entirely, gain Energy equal to damage negated |
| 30 | Titan's Blow | 60 | 2.5x — knocks target to last in queue |

### Mage
Uses Mana (max 120, regen 5/turn)

| Level Unlocked | Ability | Cost | Effect |
|---------------|---------|------|--------|
| 1 | Arcane Bolt | 0 | 1.0x magic |
| 2 | Frost Lance | 15 | 1.2x magic + Slow (SPD -2 2t) |
| 5 | Fireball | 30 | 1.3x AoE to all enemies |
| 8 | Interrupt Blast | 35 | 1.6x — deals 2x vs Silenced targets (synergy with Owl) |
| 12 | Mana Shield | 20 | Absorb next hit using Mana instead of HP (1 Mana = 2 HP absorbed) |
| 16 | Blizzard | 50 | 1.1x AoE + applies Wet to all + SPD -3 all 2t |
| 20 | Arcane Surge | 0 | Next spell costs 0 Mana and deals +50% (no cost, 3t cooldown) |
| 25 | Chain Arcana | 60 | 1.5x hits random enemy 3 times |
| 30 | Obliterate | 80 | 3.0x single target magic — cannot be mitigated by defense, only magic resist |

### Assassin
Uses Combo Points (max 5, +1 per basic attack; finishers spend CP)

| Level Unlocked | Ability | Cost | Effect |
|---------------|---------|------|--------|
| 1 | Quick Strike | 0 | 1.0x + gains 1 CP |
| 2 | Poison Blade | 0 | 0.9x + Poison (DoT 3t) + 1 CP |
| 5 | Shadow Step | 0 | Dodge next attack 100% this turn + gain 2 CP (no attack) |
| 8 | Eviscerate | 3 CP | 2.2x finisher — +10% per Bleed/Poison stack on target |
| 12 | Smoke Screen | 0 | Apply Blind to one target (-30% accuracy 2t) + 1 CP |
| 16 | Exploit Weakness | 4 CP | 2.8x — ignores all DEF, guaranteed crit |
| 20 | Hemorrhage Strike | 0 | 1.0x + applies both Bleed AND Poison simultaneously + 1 CP |
| 25 | Death Mark | 2 CP | Target takes +30% from all sources for 3t |
| 30 | One Thousand Cuts | 5 CP | 0.6x hits 6 times; each hit with active DoT on target crits |

---

## Hero+Beast Synergy Abilities
These are not separate abilities — they're **bonus effects** that trigger automatically when the described condition is met in the same turn:

| Hero Class | Beast Type | Condition | Bonus |
|------------|-----------|-----------|-------|
| Warrior | Land | Warrior attacks after beast lands a hit same turn | Warrior gets +15% ATK on that attack |
| Warrior | Land | Beast applies Bleed, Warrior uses "Open Wound Strike" | Open Wound bonus triggers (already in ability) |
| Warrior | Water | Beast paralyzes target, Warrior attacks it | Paralyzed target takes full damage + cannot counter |
| Warrior | Sky | Beast silences target, Warrior uses Shield Bash | Stun chance of Shield Bash goes to 100% |
| Mage | Sky | Owl silences target, Mage uses Interrupt Blast | 2x damage triggers (already in ability) |
| Mage | Land | Beast reduces target DEF, Mage follows with spell same turn | Spell ignores 20% additional magic resist |
| Mage | Water | Mage casts Blizzard (applies Wet), Eel uses Shock Lash same turn | → Electrified chain triggers |
| Assassin | Sky | Bat life-steals, Assassin gains CP = HP stolen / 10 (bonus CP) | — |
| Assassin | Land | Wolf applies Bleed, Assassin uses Poison Blade same turn | → Hemorrhage chain triggers |
| Assassin | Water | Crab reduces target ATK, Assassin attacks that target | Assassin takes -20% damage from target retaliation effects |

Synergies are hinted in ability descriptions (e.g., "deals 2x vs Silenced targets") and a tooltip panel in the UI shows detected synergy conditions in-battle.

---

## Phaser 3 Scene List

| Scene | Purpose |
|-------|---------|
| BootScene | Minimal assets for loading bar; sets registry defaults |
| PreloadScene | All spritesheets, tilemaps, audio, UI atlas |
| MainMenuScene | Title, login/register overlay, continue/new game |
| CharacterCreateScene | Class selector (stat cards), beast type + starter selector, name input |
| WorldMapScene | Top-down movement, encounter trigger, portals to towns/dungeons |
| TownScene | NPCs, Inn (save+heal), Shop, Guild (quests) |
| DungeonScene | Dungeon maps, higher encounter rate, boss room |
| BattleScene | PvE: action menu for hero+beast, animations, XP, evolution cutscene |
| PvPLobbyScene | Challenges list, send challenge, active battles with "Your Turn" badge |
| PvPBattleScene | Replay last opponent turn, submit your actions, "waiting" state |
| UIScene | Persistent overlay: HP/MP bars, minimap, gold, notification badge |

---

## Build / Run Setup

**Root package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm i && npm i --prefix server && npm i --prefix client"
  },
  "devDependencies": { "concurrently": "^8.0.0" }
}
```

**server/package.json key deps:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "better-sqlite3": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5"
  }
}
```

**client/package.json key deps:**
```json
{
  "dependencies": { "phaser": "^3.60.0" },
  "devDependencies": { "vite": "^5.0.0" }
}
```

**server/.env:**
```
PORT=3001
JWT_SECRET=<random 256-bit string>
DB_PATH=./db/spiritandbody.db
CLIENT_ORIGIN=http://localhost:5173
```

**client/vite.config.js:**
```js
export default { server: { proxy: { '/api': 'http://localhost:3001' } } }
```

**First-time setup:**
```bash
npm run install:all
cd server && npm run seed   # populate beast/class/enemy data
cd ..
npm run dev                 # starts server :3001 + client :5173
```

---

## Playable Versions (Incremental Milestones)

Each phase produces something you can actually run and play. You don't need to wait for the "full game."

| Version | After Phase | What You Can Play |
|---------|------------|-------------------|
| **v0.1 — Skeleton** | Phase 1 | Game boots in browser, main menu loads, backend pings |
| **v0.2 — Character Builder** | Phase 2 | Create an account, pick a class, pick a starter beast |
| **v0.3 — First Fight** | Phase 3 | Full battle against a test enemy — type triangle, terrain, synergies, status chains all working |
| **v0.4 — Level Up Loop** | Phase 4 | XP → levels → new abilities → beast evolves. Play until level 30 |
| **v0.5 — Explore the World** | Phase 5 | Walk the open world, enter towns, fight varied enemies, save progress |
| **v0.6 — Story Mode** | Phase 6 | 5-quest campaign with a dungeon boss — a complete single-player experience |
| **v1.0 — Full Game** | Phase 7 | Async PvP added — challenge friends, blind simultaneous turns |
| **v1.x — Polished** | Phase 8–9 | Final art, sound, balancing, mobile support, hardened backend |

Each version above is a usable game. Stop at any version and it's coherent — nothing later breaks anything earlier.

---

## Implementation Phases

### Phase 1 — Foundation (Days 1–5) → v0.1
Goal: browser opens, backend responds, both dev servers run.

1. Create directory structure, `package.json` files, `concurrently` setup
2. Express: health check `/api/ping`, CORS, dotenv
3. SQLite: `database.js`, `schema.sql` runs on startup, `seed.js` for static data
4. Vite + Phaser: `BootScene → PreloadScene → MainMenuScene` (placeholder art)
5. `ApiClient.js` with fetch wrapper (JWT header injection, error handling)

**Verification:** `npm run dev` starts both; browser shows main menu; `/api/ping` returns 200.

---

### Phase 2 — Auth + Character Creation (Days 6–10) → v0.2
1. Auth routes: `/register`, `/login`, `/me`
2. `MainMenuScene` login/register form (Phaser DOM elements or HTML overlay)
3. JWT stored in localStorage
4. `CharacterCreateScene`: class picker with stat previews, beast type tabs, starter picker, name input
5. `Character.js` + `Beast.js` entities constructed from API response

**Verification:** Create account → create character with class + starter beast → confirmed in DB.

---

### Phase 3 — Core Battle System (Days 11–22) → v0.3
This is the most critical phase. Get this right before building anything on top.

1. `ActionResolver.js`: damage formula with type triangle, terrain modifier, synergy check, status effect application
2. `StatusEffect.js`: Poison, Bleed, Stun, Silence, Paralyze, Slow, Fear + chain detection
3. `TurnQueue.js`: speed-based sort
4. `TerrainModifier.js`: stat modifiers per terrain type
5. `BattleManager.js`: full PvE battle loop (select → terrain → queue → resolve → animate → end-of-turn → win check)
6. `AIService.js`: basic weighted-random enemy action + phase-check for boss patterns
7. `BattleScene.js`: action menu (hero + beast action pickers), placeholder sprites, damage floaters
8. `AnimationQueue.js`: sequential tween playback
9. `SynergyHintPanel.js`: shows when a synergy condition is active
10. POST `/api/battle/pve/result` saves XP; client applies level-up
11. Hardcode one test enemy + one terrain; wire "start battle" on world map

**Verification:** Full PvE battle plays correctly with type advantage, terrain effect, a synergy bonus triggered, status effect chain, and XP awarded.

---

### Phase 4 — Progression Systems (Days 23–30) → v0.4
1. All 3 class ability trees in `classes.js` (9 abilities each)
2. Level-up in `Character.js`: stat gains per class, ability unlock checks
3. Beast level-up in `Beast.js`: stat scaling, ability unlock schedule
4. Beast evolution: `evolve()` method, evolution cutscene (particle + sprite swap) in BattleScene
5. Assassin CP system, Mage MP regen, Warrior Energy regen all working
6. All 27 beast active abilities implemented in `ActionResolver`
7. All 10 synergy bonuses implemented

**Verification:** Character levels 1→30, unlocks all abilities, beast evolves at 15 and 30 with correct stat jump. All three resource systems behave correctly under extended play.

---

### Phase 5 — World + Exploration (Days 31–42) → v0.5
1. 3 Tiled tilemaps: Starting Village, World Map (5 regions), first dungeon (3 floors)
2. `WorldMapScene`: movement (WASD/arrows), collision, camera, region transitions
3. `TownScene`: NPC dialog system, Inn (save + heal), Shop
4. `DungeonScene`: encounter zones, floor transitions, boss room
5. `EncounterManager.js`: visible enemy sprites on map, collision starts battle
6. 3–4 enemy types per region, each with terrain-appropriate type
7. `UIScene` persistent HUD
8. Save/load via Inn save point

**Verification:** Player walks world, enters town/dungeon, fights terrain-appropriate enemies, saves at Inn, reloads correctly.

---

### Phase 6 — Quest System + Story (Days 43–52) → v0.6
1. Quest engine: `quest_flags` JSON tracks state, quest definitions in `world.js`
2. NPC dialog trees check/set quest flags
3. 5 story quests guiding player through starting region into first dungeon
4. Boss encounters with 2-phase patterns (AIService phase check)
5. Pre-boss environmental puzzle (optional weakening mechanic)
6. Loot drops + inventory + usable items in battle (Item action)

**Verification:** Player can complete all 5 quests, fight dungeon boss with both phases, use loot, and see narrative context.

---

### Phase 7 — Async PvP (Days 53–67) → v1.0
1. All `/api/pvp/*` routes
2. `BattleEngine.js` on server: `resolveTurn(state, p1Actions, p2Actions, terrain)` — pure function, no side effects, identical logic to client ActionResolver
3. Turn submission stores in `pending_actions`; resolves when both submitted
4. `PvPLobbyScene`: search player, send challenge, list incoming/active
5. `PvPBattleScene`: replay last turn animations, submit your turn, polling state
6. Terrain selection at challenge creation (challenger picks from 3 random options) — strategic layer
7. Notifications polling + badge in `UIScene`
8. Battle expiry after 7 days inactivity

**Verification:** Two accounts challenge each other, go 5+ turns back and forth with correct simultaneous resolution, winner determined correctly.

---

### Phase 8 — Polish + Balancing (Days 68–82)
1. Final spritesheets replace placeholders
2. Sound effects + music
3. Full stat balancing pass: no single class/beast combo should dominate all terrains
4. Additional dungeon maps + enemy variety per region
5. PvP leaderboard
6. Mobile touch controls
7. Consistent error handling across all API routes

---

### Phase 9 — Hardening + Deployment (Days 83–90)
1. Rate limiting on auth routes
2. Input validation on all API bodies
3. SQLite WAL mode
4. Vite production build served by Express (`/dist` as static)
5. Unit tests for BattleEngine (all damage formulas, chain effects, win conditions)
6. Integration tests for auth + PvP turn routes

---

## Critical Files (implement in this order)

1. `server/db/schema.sql` — get the schema right before anything else; changing it later is costly
2. `server/data/beasts.js` + `server/data/classes.js` — all static game data; everything references these
3. `client/src/battle/ActionResolver.js` — the math engine; all other battle code depends on it
4. `server/services/BattleEngine.js` — the server-side version of the same logic (must stay in sync)
5. `client/src/scenes/BattleScene.js` — most complex scene, integrates everything
6. `client/src/battle/BattleManager.js` — PvE orchestrator that drives BattleScene

## What Makes This Not "First Player Wins"

- **Simultaneous PvP commitment**: both players submit blind; prediction/counter-prediction is the skill
- **Type triangle**: counters shift matchups ~25% — significant but not auto-win
- **Terrain**: the same team performs differently across maps; forces adaptation
- **Resource tension**: powerful moves have real costs; spamming burns you out
- **Synergy setup**: the best damage requires coordination between hero and beast actions across turns
- **Status chains**: Wet+Lightning, Bleed+Poison are game-changing; recognizing when to trigger them is a puzzle
- **Boss phases**: PvE bosses require reactive strategy mid-fight, not just "hit hard"
- **Beast death ≠ loss**: creates interesting decisions about sacrificing the beast to protect the hero
