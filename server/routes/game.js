const router = require('express').Router();
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/game/characters — list characters for logged-in user
router.get('/characters', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM characters WHERE user_id = ?').all(req.user.id);
  rows.forEach(r => { try { r.appearance = JSON.parse(r.appearance); } catch { r.appearance = {}; } });
  res.json({ characters: rows });
});

// POST /api/game/characters — create a new character
router.post('/characters', requireAuth, (req, res) => {
  const { name, appearance } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Character name is required.' });
  }

  const trimmed = name.trim();

  if (trimmed.length < 1 || trimmed.length > 20) {
    return res.status(400).json({ error: 'Name must be 1-20 characters.' });
  }

  if (!/^[a-zA-Z0-9 \-]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Name may only contain letters, numbers, spaces, and hyphens.' });
  }

  const db = getDb();
  const appearanceJson = JSON.stringify(appearance && typeof appearance === 'object' ? appearance : {});
  const stmt = db.prepare(
    'INSERT INTO characters (user_id, name, appearance) VALUES (?, ?, ?)'
  );
  const info = stmt.run(req.user.id, trimmed, appearanceJson);
  const charId = info.lastInsertRowid;
  // Give starter equipment in inventory
  const starterInventory = JSON.stringify(['basic_staff','basic_hat','basic_robe','basic_boots']);
  db.prepare('UPDATE characters SET inventory = ? WHERE id = ?').run(starterInventory, charId);
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(charId);
  try { character.appearance = JSON.parse(character.appearance); } catch { character.appearance = {}; }
  res.status(201).json({ character });
});

// POST /api/game/characters/:id/pets — save a captured pet
router.post('/characters/:id/pets', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { speciesId, nickname, type, level, hp_max, hp_current, attack, defense, speed, caught_region } = req.body;
  if (!speciesId || !type) return res.status(400).json({ error: 'speciesId and type are required.' });

  const info = db.prepare(
    'INSERT INTO pets (character_id, species, nickname, type, level, hp_max, hp_current, attack, defense, speed, caught_region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(character.id, speciesId, nickname || null, type, level || 1, hp_max || 60, hp_current || 60, attack || 10, defense || 5, speed || 8, caught_region || null);

  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ pet });
});

// GET /api/game/characters/:id/pets — list all pets for a character
router.get('/characters/:id/pets', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const pets = db.prepare('SELECT * FROM pets WHERE character_id = ? ORDER BY created_at ASC').all(character.id);
  res.json({ pets });
});

// PUT /api/game/characters/:id/pets/:petId — update a pet (slot, nickname)
router.put('/characters/:id/pets/:petId', requireAuth, (req, res) => {
  const db = getDb();
  const pet = db.prepare(
    'SELECT pets.* FROM pets JOIN characters ON pets.character_id = characters.id WHERE pets.id = ? AND characters.id = ? AND characters.user_id = ?'
  ).get(req.params.petId, req.params.id, req.user.id);
  if (!pet) return res.status(404).json({ error: 'Pet not found.' });

  const updates = {};
  if ('nickname' in req.body) updates.nickname = req.body.nickname;
  if ('active_slot' in req.body) {
    const slot = req.body.active_slot;
    if (slot !== null && slot !== 1 && slot !== 2) {
      return res.status(400).json({ error: 'active_slot must be 1, 2, or null.' });
    }
    updates.active_slot = slot;
    // Clear existing occupant of that slot first
    if (slot === 1 || slot === 2) {
      db.prepare('UPDATE pets SET active_slot = NULL WHERE character_id = ? AND active_slot = ?').run(pet.character_id, slot);
    }
  }

  if (Object.keys(updates).length === 0) return res.json({ ok: true });

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE pets SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), pet.id);
  res.json({ ok: true });
});

// PUT /api/game/characters/:id/equipment — update character equipment
const VALID_EQUIPMENT = new Set([
  'basic_staff', 'fire_staff', 'ice_staff', 'lightning_staff', 'water_staff', 'nature_staff',
  'basic_hat', 'battle_helm', 'scholars_cap', 'war_crown',
  'basic_robe', 'heavy_robe', 'silk_robe', 'traveler_cloak',
  'basic_boots', 'swift_boots', 'heavy_boots', 'winged_boots',
  'basic_relic', 'nature_relic', 'storm_relic',
]);

router.put('/characters/:id/equipment', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const fields = ['staff_id', 'hat_id', 'robe_id', 'boots_id', 'relic_id'];
  const updates = {};
  for (const field of fields) {
    if (field in req.body) {
      const val = req.body[field];
      if (val !== null && !VALID_EQUIPMENT.has(val)) {
        return res.status(400).json({ error: `Invalid equipment id: ${val}` });
      }
      updates[field] = val;
    }
  }

  if (Object.keys(updates).length === 0) return res.json({ ok: true });

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE characters SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), character.id);
  res.json({ ok: true });
});

// POST /api/game/characters/:id/award-item — add an equipment item to inventory
router.post('/characters/:id/award-item', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required.' });

  let inventory = [];
  try { inventory = JSON.parse(character.inventory || '[]'); } catch {}
  if (!inventory.includes(itemId)) {
    inventory.push(itemId);
    db.prepare('UPDATE characters SET inventory = ? WHERE id = ?').run(JSON.stringify(inventory), character.id);
  }
  res.json({ ok: true, inventory, alreadyOwned: inventory.includes(itemId) });
});

// POST /api/game/characters/:id/award-xp — award XP to character and active pets, handle level-ups
router.post('/characters/:id/award-xp', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { xp } = req.body;
  if (!xp || xp <= 0) return res.status(400).json({ error: 'xp must be a positive number.' });

  function xpToNextLevel(level) { return level * 100; }
  function levelUpCharStat(stat, levels) {
    const gains = { hp_max: 15, hp_current: 15, attack: 2, defense: 1, speed: 1 };
    return stat + (gains[stat] || 0) * levels;
  }

  // Level up character
  let charLevel = character.level || 1;
  let charXp    = (character.xp || 0) + xp;
  let charLevelUps = 0;
  while (charXp >= xpToNextLevel(charLevel)) {
    charXp -= xpToNextLevel(charLevel);
    charLevel++;
    charLevelUps++;
  }

  // Character base stats are fixed — BattleManager's statScale/hpScale formula
  // applies the level multiplier at battle time, keeping characters on par with
  // same-level bosses. No per-level gains are stored in the DB.
  const charUpdates = { level: charLevel, xp: charXp };
  const charClauses = Object.keys(charUpdates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE characters SET ${charClauses} WHERE id = ?`).run(...Object.values(charUpdates), character.id);

  // Level up active pets
  const activePets = db.prepare('SELECT * FROM pets WHERE character_id = ? AND active_slot IS NOT NULL').all(character.id);
  const petResults = [];
  for (const pet of activePets) {
    let petLevel = pet.level || 1;
    let petXp    = (pet.xp || 0) + xp;
    let petLevelUps = 0;
    while (petXp >= xpToNextLevel(petLevel)) {
      petXp -= xpToNextLevel(petLevel);
      petLevel++;
      petLevelUps++;
    }
    const petUp = { level: petLevel, xp: petXp };
    if (petLevelUps > 0) {
      petUp.hp_max     = pet.hp_max     + 5  * petLevelUps;
      petUp.hp_current = pet.hp_current + 5  * petLevelUps;
      petUp.attack     = pet.attack     + 1  * petLevelUps;
      petUp.defense    = pet.defense    + 1  * petLevelUps;
      petUp.speed      = pet.speed      + 1  * petLevelUps;
    }
    const petClauses = Object.keys(petUp).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE pets SET ${petClauses} WHERE id = ?`).run(...Object.values(petUp), pet.id);
    petResults.push({ id: pet.id, species: pet.species, levelUps: petLevelUps, newLevel: petLevel });
  }

  const updatedChar = db.prepare('SELECT * FROM characters WHERE id = ?').get(character.id);
  try { updatedChar.appearance = JSON.parse(updatedChar.appearance); } catch { updatedChar.appearance = {}; }

  res.json({ character: updatedChar, charLevelUps, petResults });
});

// POST /api/game/characters/:id/award-gold — add (or deduct) gold
router.post('/characters/:id/award-gold', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { gold } = req.body;
  if (typeof gold !== 'number') return res.status(400).json({ error: 'gold must be a number.' });

  const newGold = Math.max(0, (character.gold || 0) + gold);
  db.prepare('UPDATE characters SET gold = ? WHERE id = ?').run(newGold, character.id);
  res.json({ ok: true, gold: newGold });
});

// POST /api/game/characters/:id/purchase — buy a shop item (deduct gold, add to inventory)
router.post('/characters/:id/purchase', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { itemId, price } = req.body;
  if (!itemId || typeof price !== 'number') return res.status(400).json({ error: 'itemId and price required.' });

  const currentGold = character.gold || 0;
  if (currentGold < price) return res.status(400).json({ error: 'Not enough gold.' });

  let inventory = [];
  try { inventory = JSON.parse(character.inventory || '[]'); } catch {}
  if (inventory.includes(itemId)) return res.status(400).json({ error: 'Already owned.' });

  inventory.push(itemId);
  const newGold = currentGold - price;
  db.prepare('UPDATE characters SET gold = ?, inventory = ? WHERE id = ?').run(newGold, JSON.stringify(inventory), character.id);
  res.json({ ok: true, gold: newGold, inventory });
});

// POST /api/game/characters/:id/update-bestiary — mark species as seen or caught
router.post('/characters/:id/update-bestiary', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const { seen = [], caught = [] } = req.body;

  let seenList   = [];
  let caughtList = [];
  try { seenList   = JSON.parse(character.seen_species  || '[]'); } catch {}
  try { caughtList = JSON.parse(character.caught_species || '[]'); } catch {}

  for (const s of seen)   { if (!seenList.includes(s))   seenList.push(s);   }
  for (const s of caught) { if (!caughtList.includes(s)) caughtList.push(s); if (!seenList.includes(s)) seenList.push(s); }

  db.prepare('UPDATE characters SET seen_species = ?, caught_species = ? WHERE id = ?')
    .run(JSON.stringify(seenList), JSON.stringify(caughtList), character.id);
  res.json({ ok: true, seen: seenList, caught: caughtList });
});

// POST /api/game/characters/:id/pets/:petId/evolve — evolve a pet to a new species
router.post('/characters/:id/pets/:petId/evolve', requireAuth, (req, res) => {
  const db = getDb();
  const pet = db.prepare(
    'SELECT pets.* FROM pets JOIN characters ON pets.character_id = characters.id WHERE pets.id = ? AND characters.id = ? AND characters.user_id = ?'
  ).get(req.params.petId, req.params.id, req.user.id);
  if (!pet) return res.status(404).json({ error: 'Pet not found.' });

  const { newSpecies, hp_max, attack, defense, speed } = req.body;
  if (!newSpecies) return res.status(400).json({ error: 'newSpecies required.' });

  // Apply the evolution's base stats if provided, healing hp_current up to the new max
  if (hp_max && attack && defense && speed) {
    const newHpCurrent = Math.min(pet.hp_current + (hp_max - pet.hp_max), hp_max);
    db.prepare(
      'UPDATE pets SET species = ?, hp_max = ?, hp_current = ?, attack = ?, defense = ?, speed = ? WHERE id = ?'
    ).run(newSpecies, hp_max, newHpCurrent, attack, defense, speed, pet.id);
  } else {
    db.prepare('UPDATE pets SET species = ? WHERE id = ?').run(newSpecies, pet.id);
  }

  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(pet.id);
  res.json({ ok: true, pet: updated });
});

// POST /api/game/characters/:id/quest-flags — merge quest flag updates
router.post('/characters/:id/quest-flags', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!character) return res.status(404).json({ error: 'Character not found.' });

  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Expected object of flag updates.' });
  }

  let flags = {};
  try { flags = JSON.parse(character.quest_flags || '{}'); } catch {}
  Object.assign(flags, updates);
  db.prepare('UPDATE characters SET quest_flags = ? WHERE id = ?').run(JSON.stringify(flags), character.id);
  res.json({ ok: true, quest_flags: flags });
});

// DELETE /api/game/characters/:id — delete character (and its pets) if owned by user
router.delete('/characters/:id', requireAuth, (req, res) => {
  const db = getDb();
  const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!character) {
    return res.status(404).json({ error: 'Character not found.' });
  }

  db.prepare('DELETE FROM pets WHERE character_id = ?').run(character.id);
  db.prepare('DELETE FROM characters WHERE id = ?').run(character.id);
  res.json({ ok: true });
});

module.exports = router;
