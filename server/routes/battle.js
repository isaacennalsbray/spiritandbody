const router = require('express').Router();
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * POST /api/battle/pve/result
 * Records a PvE battle outcome, applies XP to character and beast.
 * Body: { characterId, beastId, xpGained, beastXpGained, outcome }
 */
router.post('/pve/result', (req, res, next) => {
  try {
    const { characterId, beastId, xpGained = 0, beastXpGained = 0, outcome } = req.body;
    if (!characterId || !outcome) {
      return res.status(400).json({ error: 'characterId and outcome are required' });
    }

    const db  = getDb();
    const userId = req.user.id;

    // Verify character belongs to this user
    const char = db.prepare('SELECT * FROM characters WHERE id = ? AND user_id = ?').get(characterId, userId);
    if (!char) return res.status(404).json({ error: 'Character not found' });

    // Apply XP + level-up (simple: xp_to_next doubles each level, stat gains per class)
    let newXp    = char.xp + (outcome === 'victory' ? xpGained : Math.floor(xpGained * 0.2));
    let newLevel = char.level;
    let newXpToNext = char.xp_to_next;
    let newHpMax = char.hp_max;
    let newAtk   = char.attack;
    let newDef   = char.defense;
    let newSpd   = char.speed;

    const XP_GAINS = {
      warrior:  { hp: 8, atk: 0.8, def: 0.6, spd: 0.2 },
      mage:     { hp: 5, atk: 0.5, def: 0.3, spd: 0.3 },
      assassin: { hp: 6, atk: 1.0, def: 0.4, spd: 0.5 },
    };
    const gains = XP_GAINS[char.class] || XP_GAINS.warrior;

    while (newXp >= newXpToNext && newLevel < 50) {
      newXp      -= newXpToNext;
      newLevel   += 1;
      newXpToNext = Math.floor(newXpToNext * 1.4);
      newHpMax   += gains.hp;
      newAtk     = Math.round((newAtk + gains.atk) * 10) / 10;
      newDef     = Math.round((newDef + gains.def) * 10) / 10;
      newSpd     = Math.round((newSpd + gains.spd) * 10) / 10;
    }

    db.prepare(`
      UPDATE characters
      SET xp = ?, level = ?, xp_to_next = ?, hp_max = ?, hp_current = ?,
          attack = ?, defense = ?, speed = ?
      WHERE id = ?
    `).run(newXp, newLevel, newXpToNext, newHpMax,
           Math.min(char.hp_current + Math.floor(newHpMax * 0.10), newHpMax), // regen 10% HP after fight
           Math.round(newAtk), Math.round(newDef), Math.round(newSpd),
           characterId);

    const updatedChar = db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
    const result = { character: updatedChar, leveled: newLevel > char.level };

    // Apply beast XP if beastId provided
    if (beastId) {
      const beast = db.prepare('SELECT * FROM spirit_beasts WHERE id = ? AND user_id = ?').get(beastId, userId);
      if (beast) {
        let bXp    = beast.xp + (outcome === 'victory' ? beastXpGained : Math.floor(beastXpGained * 0.2));
        let bLevel = beast.level;
        let bXpToNext = beast.xp_to_next || 80;
        let bHpMax = beast.hp_max;
        let bAtk   = beast.attack;
        let bDef   = beast.defense;
        let bSpd   = beast.speed;

        while (bXp >= bXpToNext && bLevel < 50) {
          bXp       -= bXpToNext;
          bLevel    += 1;
          bXpToNext  = Math.floor(bXpToNext * 1.35);
          bHpMax    += 5;
          bAtk      = Math.round(bAtk * 1.04);
          bDef      = Math.round(bDef * 1.03);
          bSpd      = Math.round(bSpd * 1.02);
        }

        db.prepare(`
          UPDATE spirit_beasts
          SET xp = ?, level = ?, xp_to_next = ?, hp_max = ?, hp_current = ?,
              attack = ?, defense = ?, speed = ?
          WHERE id = ?
        `).run(bXp, bLevel, bXpToNext, bHpMax,
               Math.min(beast.hp_current + Math.floor(bHpMax * 0.10), bHpMax),
               bAtk, bDef, bSpd, beastId);

        result.beast = db.prepare('SELECT * FROM spirit_beasts WHERE id = ?').get(beastId);
        result.beastLeveled = bLevel > beast.level;
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
