const router = require('express').Router();
const { query, getOne, getAll } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

function buildSetClause(updates, startIndex = 1) {
  const keys = Object.keys(updates);
  const clause = keys.map((k, i) => `${k} = $${startIndex + i}`).join(', ');
  const values = keys.map(k => updates[k]);
  return { clause, values, nextIndex: startIndex + keys.length };
}

function parseAppearance(row) {
  try { row.appearance = JSON.parse(row.appearance); } catch { row.appearance = {}; }
  return row;
}

// GET /api/game/characters — list characters for logged-in user
router.get('/characters', requireAuth, async (req, res, next) => {
  try {
    const rows = await getAll('SELECT * FROM characters WHERE user_id = $1', [req.user.id]);
    rows.forEach(parseAppearance);
    res.json({ characters: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters — create a new character
router.post('/characters', requireAuth, async (req, res, next) => {
  try {
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

    const appearanceJson = JSON.stringify(appearance && typeof appearance === 'object' ? appearance : {});
    const starterInventory = JSON.stringify(['basic_staff', 'basic_hat', 'basic_robe', 'basic_boots']);

    const character = await getOne(
      'INSERT INTO characters (user_id, name, appearance, inventory) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, trimmed, appearanceJson, starterInventory]
    );
    parseAppearance(character);
    res.status(201).json({ character });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/pets — save a captured pet
router.post('/characters/:id/pets', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const { speciesId, nickname, type, level, hp_max, hp_current, attack, defense, speed, caught_region } = req.body;
    if (!speciesId || !type) return res.status(400).json({ error: 'speciesId and type are required.' });

    const pet = await getOne(
      `INSERT INTO pets (character_id, species, nickname, type, level, hp_max, hp_current, attack, defense, speed, caught_region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [character.id, speciesId, nickname || null, type, level || 1, hp_max || 60, hp_current || 60, attack || 10, defense || 5, speed || 8, caught_region || null]
    );
    res.status(201).json({ pet });
  } catch (err) {
    next(err);
  }
});

// GET /api/game/characters/:id/pets — list all pets for a character
router.get('/characters/:id/pets', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const pets = await getAll('SELECT * FROM pets WHERE character_id = $1 ORDER BY created_at ASC', [character.id]);
    res.json({ pets });
  } catch (err) {
    next(err);
  }
});

// PUT /api/game/characters/:id/pets/:petId — update a pet (slot, nickname)
router.put('/characters/:id/pets/:petId', requireAuth, async (req, res, next) => {
  try {
    const pet = await getOne(
      'SELECT pets.* FROM pets JOIN characters ON pets.character_id = characters.id WHERE pets.id = $1 AND characters.id = $2 AND characters.user_id = $3',
      [req.params.petId, req.params.id, req.user.id]
    );
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
        await query('UPDATE pets SET active_slot = NULL WHERE character_id = $1 AND active_slot = $2', [pet.character_id, slot]);
      }
    }

    if (Object.keys(updates).length === 0) return res.json({ ok: true });

    const { clause, values, nextIndex } = buildSetClause(updates);
    await query(`UPDATE pets SET ${clause} WHERE id = $${nextIndex}`, [...values, pet.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/game/characters/:id/equipment — update character equipment
const VALID_EQUIPMENT = new Set([
  'basic_staff', 'fire_staff', 'ice_staff', 'lightning_staff', 'water_staff', 'nature_staff',
  'basic_hat', 'battle_helm', 'scholars_cap', 'war_crown',
  'basic_robe', 'heavy_robe', 'silk_robe', 'traveler_cloak',
  'basic_boots', 'swift_boots', 'heavy_boots', 'winged_boots',
  'basic_relic', 'nature_relic', 'storm_relic',
]);

router.put('/characters/:id/equipment', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
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

    const { clause, values, nextIndex } = buildSetClause(updates);
    await query(`UPDATE characters SET ${clause} WHERE id = $${nextIndex}`, [...values, character.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/award-item — add an equipment item to inventory
router.post('/characters/:id/award-item', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId required.' });

    let inventory = [];
    try { inventory = JSON.parse(character.inventory || '[]'); } catch {}
    const alreadyOwned = inventory.includes(itemId);
    if (!alreadyOwned) {
      inventory.push(itemId);
      await query('UPDATE characters SET inventory = $1 WHERE id = $2', [JSON.stringify(inventory), character.id]);
    }
    res.json({ ok: true, inventory, alreadyOwned });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/award-xp — award XP to character and active pets, handle level-ups
router.post('/characters/:id/award-xp', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
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
    const charSet = buildSetClause(charUpdates);
    await query(`UPDATE characters SET ${charSet.clause} WHERE id = $${charSet.nextIndex}`, [...charSet.values, character.id]);

    // Level up active pets
    const activePets = await getAll('SELECT * FROM pets WHERE character_id = $1 AND active_slot IS NOT NULL', [character.id]);
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
      const petSet = buildSetClause(petUp);
      await query(`UPDATE pets SET ${petSet.clause} WHERE id = $${petSet.nextIndex}`, [...petSet.values, pet.id]);
      petResults.push({ id: pet.id, species: pet.species, levelUps: petLevelUps, newLevel: petLevel });
    }

    const updatedChar = await getOne('SELECT * FROM characters WHERE id = $1', [character.id]);
    parseAppearance(updatedChar);

    res.json({ character: updatedChar, charLevelUps, petResults });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/award-gold — add (or deduct) gold
router.post('/characters/:id/award-gold', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const { gold } = req.body;
    if (typeof gold !== 'number') return res.status(400).json({ error: 'gold must be a number.' });

    const newGold = Math.max(0, (character.gold || 0) + gold);
    await query('UPDATE characters SET gold = $1 WHERE id = $2', [newGold, character.id]);
    res.json({ ok: true, gold: newGold });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/purchase — buy a shop item (deduct gold, add to inventory)
router.post('/characters/:id/purchase', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
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
    await query('UPDATE characters SET gold = $1, inventory = $2 WHERE id = $3', [newGold, JSON.stringify(inventory), character.id]);
    res.json({ ok: true, gold: newGold, inventory });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/update-bestiary — mark species as seen or caught
router.post('/characters/:id/update-bestiary', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const { seen = [], caught = [] } = req.body;

    let seenList   = [];
    let caughtList = [];
    try { seenList   = JSON.parse(character.seen_species  || '[]'); } catch {}
    try { caughtList = JSON.parse(character.caught_species || '[]'); } catch {}

    for (const s of seen)   { if (!seenList.includes(s))   seenList.push(s);   }
    for (const s of caught) { if (!caughtList.includes(s)) caughtList.push(s); if (!seenList.includes(s)) seenList.push(s); }

    await query(
      'UPDATE characters SET seen_species = $1, caught_species = $2 WHERE id = $3',
      [JSON.stringify(seenList), JSON.stringify(caughtList), character.id]
    );
    res.json({ ok: true, seen: seenList, caught: caughtList });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/pets/:petId/evolve — evolve a pet to a new species
router.post('/characters/:id/pets/:petId/evolve', requireAuth, async (req, res, next) => {
  try {
    const pet = await getOne(
      'SELECT pets.* FROM pets JOIN characters ON pets.character_id = characters.id WHERE pets.id = $1 AND characters.id = $2 AND characters.user_id = $3',
      [req.params.petId, req.params.id, req.user.id]
    );
    if (!pet) return res.status(404).json({ error: 'Pet not found.' });

    const { newSpecies, hp_max, attack, defense, speed } = req.body;
    if (!newSpecies) return res.status(400).json({ error: 'newSpecies required.' });

    let updated;
    // Apply the evolution's base stats if provided, healing hp_current up to the new max
    if (hp_max && attack && defense && speed) {
      const newHpCurrent = Math.min(pet.hp_current + (hp_max - pet.hp_max), hp_max);
      updated = await getOne(
        'UPDATE pets SET species = $1, hp_max = $2, hp_current = $3, attack = $4, defense = $5, speed = $6 WHERE id = $7 RETURNING *',
        [newSpecies, hp_max, newHpCurrent, attack, defense, speed, pet.id]
      );
    } else {
      updated = await getOne('UPDATE pets SET species = $1 WHERE id = $2 RETURNING *', [newSpecies, pet.id]);
    }

    res.json({ ok: true, pet: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/characters/:id/quest-flags — merge quest flag updates
router.post('/characters/:id/quest-flags', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!character) return res.status(404).json({ error: 'Character not found.' });

    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ error: 'Expected object of flag updates.' });
    }

    let flags = {};
    try { flags = JSON.parse(character.quest_flags || '{}'); } catch {}
    Object.assign(flags, updates);
    await query('UPDATE characters SET quest_flags = $1 WHERE id = $2', [JSON.stringify(flags), character.id]);
    res.json({ ok: true, quest_flags: flags });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/game/characters/:id — delete character (and its pets) if owned by user
router.delete('/characters/:id', requireAuth, async (req, res, next) => {
  try {
    const character = await getOne('SELECT * FROM characters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (!character) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    await query('DELETE FROM pets WHERE character_id = $1', [character.id]);
    await query('DELETE FROM characters WHERE id = $1', [character.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
