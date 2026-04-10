/**
 * Hero class definitions — ability trees for Warrior, Mage, Assassin.
 * Each ability has: id, name, desc, cost, costType, power, type, effect, unlockLevel.
 */

const CLASSES = {
  warrior: {
    name: 'Warrior',
    desc: 'Armoured frontliner with high HP and Energy-based power moves.',
    baseHp: 120, baseAtk: 14, baseDef: 10, baseSpd: 8,
    hpPerLevel: 8, atkPerLevel: 1.2, defPerLevel: 0.9, spdPerLevel: 0.1,
    resource: 'energy',   // max 100, regen 15/turn
    resourceMax: 100,
    resourceRegen: 15,
    abilities: [
      { id: 'warrior_basic',          name: 'Basic Strike',       unlockLevel: 1,  cost: 0,  costType: 'energy', power: 1.0,  type: 'physical', desc: '1.0× physical damage.' },
      { id: 'warrior_shield_bash',    name: 'Shield Bash',        unlockLevel: 2,  cost: 20, costType: 'energy', power: 1.1,  type: 'physical', effect: { stun: 0.30 }, desc: '1.1× + 30% stun chance.' },
      { id: 'warrior_war_cry',        name: 'War Cry',            unlockLevel: 5,  cost: 30, costType: 'energy', power: 0,    type: 'buff',     effect: { selfAtkBuff: 0.20, beastAtkBuff: 0.10, duration: 3 }, desc: 'Self ATK +20%, beast ATK +10% for 3 turns.' },
      { id: 'warrior_cleave',         name: 'Cleave',             unlockLevel: 8,  cost: 35, costType: 'energy', power: 0.9,  type: 'physical', effect: { aoe: true }, desc: '0.9× to all enemies.' },
      { id: 'warrior_counter_stance', name: 'Counter Stance',     unlockLevel: 12, cost: 25, costType: 'energy', power: 0,    type: 'defend',   effect: { counterChance: 0.50 }, desc: 'Defend + 50% chance to counter the next hit.' },
      { id: 'warrior_open_wound',     name: 'Open Wound Strike',  unlockLevel: 16, cost: 45, costType: 'energy', power: 1.8,  type: 'physical', effect: { bleedBonus: 0.50 }, desc: '1.8×. Deals +50% to Bleeding targets (synergy).' },
      { id: 'warrior_rally',          name: 'Rally',              unlockLevel: 20, cost: 40, costType: 'energy', power: 0,    type: 'heal',     effect: { healPct: 0.15 }, desc: 'Hero + beast each heal 15% max HP.' },
      { id: 'warrior_unbreakable',    name: 'Unbreakable',        unlockLevel: 25, cost: 60, costType: 'energy', power: 0,    type: 'defend',   effect: { negateNextHit: true }, desc: 'Negate next hit. Gain Energy equal to damage negated.' },
      { id: 'warrior_titans_blow',    name: "Titan's Blow",       unlockLevel: 30, cost: 60, costType: 'energy', power: 2.5,  type: 'physical', effect: { pushToLast: true }, desc: '2.5×. Knocks target to last in queue.' },
    ],
  },

  mage: {
    name: 'Mage',
    desc: 'Powerful spellcaster. Devastating magic at the cost of limited mana.',
    baseHp: 80,  baseAtk: 8,  baseDef: 5,  baseSpd: 10,
    hpPerLevel: 5, atkPerLevel: 0.8, defPerLevel: 0.5, spdPerLevel: 0.15,
    resource: 'mana',
    resourceMax: 120,
    resourceRegen: 5,
    magicPower: 18,   // separate from atk; scales +2/level
    magicPowerPerLevel: 2,
    abilities: [
      { id: 'mage_basic',          name: 'Arcane Bolt',    unlockLevel: 1,  cost: 0,  costType: 'mana', power: 1.0,  type: 'magic', desc: '1.0× magic damage.' },
      { id: 'mage_frost_lance',    name: 'Frost Lance',    unlockLevel: 2,  cost: 15, costType: 'mana', power: 1.2,  type: 'magic', effect: { slow: { spdDown: 2, duration: 2 } }, desc: '1.2× magic + Slow (SPD -2, 2 turns).' },
      { id: 'mage_fireball',       name: 'Fireball',       unlockLevel: 5,  cost: 30, costType: 'mana', power: 1.3,  type: 'magic', effect: { aoe: true }, desc: '1.3× magic AoE to all enemies.' },
      { id: 'mage_interrupt',      name: 'Interrupt Blast', unlockLevel: 8, cost: 35, costType: 'mana', power: 1.6,  type: 'magic', effect: { silencedBonus: 2.0 }, desc: '1.6×. Deals 2× to Silenced targets (synergy).' },
      { id: 'mage_mana_shield',    name: 'Mana Shield',    unlockLevel: 12, cost: 20, costType: 'mana', power: 0,    type: 'defend', effect: { manaShield: true }, desc: 'Absorb next hit with Mana (1 Mana = 2 HP absorbed).' },
      { id: 'mage_blizzard',       name: 'Blizzard',       unlockLevel: 16, cost: 50, costType: 'mana', power: 1.1,  type: 'magic', effect: { aoe: true, applyWet: true, slow: { spdDown: 3, duration: 2 } }, desc: '1.1× AoE + Wet all + SPD -3 all for 2 turns.' },
      { id: 'mage_arcane_surge',   name: 'Arcane Surge',   unlockLevel: 20, cost: 0,  costType: 'mana', power: 0,    type: 'buff',  effect: { nextSpellFree: true, nextSpellBonus: 0.50, cooldown: 3 }, desc: 'Next spell costs 0 Mana and deals +50%. 3-turn cooldown.' },
      { id: 'mage_chain_arcana',   name: 'Chain Arcana',   unlockLevel: 25, cost: 60, costType: 'mana', power: 1.5,  type: 'magic', effect: { hits: 3, targetRandom: true }, desc: '1.5× hits random enemy 3 times.' },
      { id: 'mage_obliterate',     name: 'Obliterate',     unlockLevel: 30, cost: 80, costType: 'mana', power: 3.0,  type: 'magic', effect: { ignoresDefense: true }, desc: '3.0× magic. Bypasses defense, only magic resist applies.' },
    ],
  },

  assassin: {
    name: 'Assassin',
    desc: 'High burst damage through Combo Points. Stack DoTs, then cash in.',
    baseHp: 90,  baseAtk: 16, baseDef: 6,  baseSpd: 14,
    hpPerLevel: 6, atkPerLevel: 1.4, defPerLevel: 0.6, spdPerLevel: 0.2,
    resource: 'combo',   // max 5 CP, +1 per basic attack/hit
    resourceMax: 5,
    resourceRegen: 0,    // gained via attacks, not passive
    abilities: [
      { id: 'assassin_basic',         name: 'Quick Strike',       unlockLevel: 1,  cost: 0,  costType: 'none', power: 1.0, type: 'physical', effect: { gainCp: 1 }, desc: '1.0× + gain 1 Combo Point.' },
      { id: 'assassin_poison',        name: 'Poison Blade',       unlockLevel: 2,  cost: 0,  costType: 'none', power: 0.9, type: 'physical', effect: { poison: { dmgPerTurn: 8, duration: 3 }, gainCp: 1 }, desc: '0.9× + Poison (DoT 3 turns) + 1 CP.' },
      { id: 'assassin_shadow_step',   name: 'Shadow Step',        unlockLevel: 5,  cost: 0,  costType: 'none', power: 0,   type: 'dodge',    effect: { dodgeNext: 1.0, gainCp: 2 }, desc: 'Dodge next attack (100%) + gain 2 CP. No attack.' },
      { id: 'assassin_eviscerate',    name: 'Eviscerate',         unlockLevel: 8,  cost: 3,  costType: 'combo', power: 2.2, type: 'physical', effect: { dotBonusPerStack: 0.10 }, desc: '2.2× + 10% per Bleed/Poison stack on target.' },
      { id: 'assassin_smoke',         name: 'Smoke Screen',       unlockLevel: 12, cost: 0,  costType: 'none', power: 0,   type: 'debuff',   effect: { blind: { accDown: 0.30, duration: 2 }, gainCp: 1 }, desc: 'Apply Blind (-30% accuracy, 2 turns) + 1 CP.' },
      { id: 'assassin_exploit',       name: 'Exploit Weakness',   unlockLevel: 16, cost: 4,  costType: 'combo', power: 2.8, type: 'physical', effect: { ignoresDefense: true, guaranteedCrit: true }, desc: '2.8×. Ignores all DEF. Guaranteed crit.' },
      { id: 'assassin_hemorrhage',    name: 'Hemorrhage Strike',  unlockLevel: 20, cost: 0,  costType: 'none', power: 1.0, type: 'physical', effect: { applyBleed: true, applyPoison: true, gainCp: 1 }, desc: '1.0× + applies Bleed AND Poison simultaneously + 1 CP.' },
      { id: 'assassin_death_mark',    name: 'Death Mark',         unlockLevel: 25, cost: 2,  costType: 'combo', power: 0,   type: 'debuff',   effect: { damageTaken: 0.30, duration: 3 }, desc: 'Target takes +30% damage from all sources for 3 turns.' },
      { id: 'assassin_thousand_cuts', name: 'One Thousand Cuts',  unlockLevel: 30, cost: 5,  costType: 'combo', power: 0.6, type: 'physical', effect: { hits: 6, dotCrit: true }, desc: '0.6× hits 6 times. Each hit auto-crits if target has active DoT.' },
    ],
  },
};

/** Returns the base stats for a class at a given level. */
function getClassStats(className, level) {
  const cls = CLASSES[className];
  if (!cls) return null;
  const lvl = level - 1;
  return {
    hpMax:   Math.floor(cls.baseHp  + cls.hpPerLevel  * lvl),
    attack:  Math.floor(cls.baseAtk + cls.atkPerLevel  * lvl),
    defense: Math.floor(cls.baseDef + cls.defPerLevel  * lvl),
    speed:   Math.floor(cls.baseSpd + cls.spdPerLevel  * lvl),
    resourceMax: cls.resourceMax,
    ...(cls.magicPower !== undefined
      ? { magicPower: Math.floor(cls.magicPower + cls.magicPowerPerLevel * lvl) }
      : {}),
  };
}

/** Returns abilities unlocked at or below a given level for a class. */
function getUnlockedAbilities(className, level) {
  const cls = CLASSES[className];
  if (!cls) return [];
  return cls.abilities.filter(a => a.unlockLevel <= level);
}

module.exports = { CLASSES, getClassStats, getUnlockedAbilities };
