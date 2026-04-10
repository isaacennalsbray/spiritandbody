const router = require('express').Router();
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getClassStats, getUnlockedAbilities } = require('../data/classes');
const { computeStats, getTierData } = require('../data/beasts');

// All game routes require auth
router.use(requireAuth);

// POST /api/game/characters — create a new character + spirit beast
router.post('/characters', (req, res, next) => {
  try {
    const { name, class: heroClass, beastTemplateId } = req.body;
    if (!name || !heroClass || !beastTemplateId) {
      return res.status(400).json({ error: 'name, class, and beastTemplateId are required' });
    }
    if (!['warrior', 'mage', 'assassin'].includes(heroClass)) {
      return res.status(400).json({ error: 'class must be warrior, mage, or assassin' });
    }

    const { BEAST_LINES } = require('../data/beasts');
    if (!BEAST_LINES[beastTemplateId]) {
      return res.status(400).json({ error: 'Unknown beastTemplateId' });
    }

    const db = getDb();
    const stats = getClassStats(heroClass, 1);
    const beastStats = computeStats(beastTemplateId, 1);
    const tierData = getTierData(beastTemplateId, 1);
    const beastType = BEAST_LINES[beastTemplateId].type;

    const charResult = db.prepare(`
      INSERT INTO characters
        (user_id, name, class, level, xp, xp_to_next,
         hp_max, hp_current, mp_max, mp_current,
         attack, defense, speed, unlocked_abilities)
      VALUES (?, ?, ?, 1, 0, 100, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, name, heroClass,
      stats.hpMax, stats.hpMax,
      stats.resourceMax, stats.resourceMax,
      stats.attack, stats.defense, stats.speed,
      JSON.stringify(getUnlockedAbilities(heroClass, 1).map(a => a.id))
    );
    const charId = charResult.lastInsertRowid;

    // Create game save row
    db.prepare(`
      INSERT INTO game_saves (user_id, character_id) VALUES (?, ?)
    `).run(req.user.id, charId);

    // Create spirit beast
    const beastResult = db.prepare(`
      INSERT INTO spirit_beasts
        (user_id, character_id, beast_template_id, beast_type, tier, level, xp,
         hp_max, hp_current, attack, defense, speed, stamina_current,
         unlocked_abilities, active_passives)
      VALUES (?, ?, ?, ?, 1, 1, 0, ?, ?, ?, ?, ?, 3, ?, ?)
    `).run(
      req.user.id, charId, beastTemplateId, beastType,
      beastStats.hp, beastStats.hp,
      beastStats.atk, beastStats.def, beastStats.spd,
      JSON.stringify([tierData.abilities[0]]),
      JSON.stringify([tierData.passive.id])
    );

    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(charId);
    const beast = db.prepare('SELECT * FROM spirit_beasts WHERE id = ?').get(beastResult.lastInsertRowid);

    res.status(201).json({ character, beast });
  } catch (err) {
    next(err);
  }
});

// GET /api/game/characters — list all characters for logged-in user
router.get('/characters', (req, res, next) => {
  try {
    const db = getDb();
    const characters = db.prepare(`
      SELECT c.*, sb.beast_template_id, sb.beast_type, sb.tier as beast_tier,
             sb.level as beast_level, sb.nickname as beast_nickname
      FROM characters c
      LEFT JOIN spirit_beasts sb ON sb.character_id = c.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json({ characters });
  } catch (err) {
    next(err);
  }
});

// GET /api/game/characters/:id — full load
router.get('/characters/:id', (req, res, next) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const beast = db.prepare('SELECT * FROM spirit_beasts WHERE character_id = ?').get(character.id);
    const save  = db.prepare('SELECT * FROM game_saves WHERE character_id = ?').get(character.id);

    res.json({ character, beast, save });
  } catch (err) {
    next(err);
  }
});

// PUT /api/game/characters/:id — autosave world state
router.put('/characters/:id', (req, res, next) => {
  try {
    const db = getDb();
    const char = db.prepare('SELECT id FROM characters WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });

    const allowed = ['hp_current', 'mp_current', 'current_region', 'position_x', 'position_y', 'xp', 'level', 'xp_to_next', 'unlocked_abilities', 'skill_points'];
    const updates = Object.entries(req.body)
      .filter(([k]) => allowed.includes(k));

    if (updates.length) {
      const set = updates.map(([k]) => `${k} = ?`).join(', ');
      const vals = updates.map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v);
      db.prepare(`UPDATE characters SET ${set} WHERE id = ?`).run(...vals, req.params.id);
    }

    // Update game_save fields if present
    const saveFields = ['inventory', 'quest_flags', 'world_flags', 'visited_regions', 'gold', 'playtime_secs'];
    const saveUpdates = Object.entries(req.body).filter(([k]) => saveFields.includes(k));
    if (saveUpdates.length) {
      const set = saveUpdates.map(([k]) => `${k} = ?`).join(', ');
      const vals = saveUpdates.map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v);
      db.prepare(`UPDATE game_saves SET ${set}, saved_at = CURRENT_TIMESTAMP WHERE character_id = ?`)
        .run(...vals, req.params.id);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/game/characters/:id/beast — sync beast after fight
router.put('/characters/:id/beast', (req, res, next) => {
  try {
    const db = getDb();
    const beast = db.prepare(
      'SELECT sb.id FROM spirit_beasts sb JOIN characters c ON c.id = sb.character_id WHERE c.id = ? AND c.user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!beast) return res.status(404).json({ error: 'Beast not found' });

    const allowed = ['hp_current', 'xp', 'level', 'tier', 'hp_max', 'attack', 'defense', 'speed', 'stamina_current', 'unlocked_abilities', 'active_passives', 'nickname'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (updates.length) {
      const set = updates.map(([k]) => `${k} = ?`).join(', ');
      const vals = updates.map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v);
      db.prepare(`UPDATE spirit_beasts SET ${set} WHERE id = ?`).run(...vals, beast.id);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
