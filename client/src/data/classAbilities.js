/**
 * Client-side class ability definitions.
 * Mirrors server/data/classes.js but as an ES module.
 */

export const CLASSES = {
  warrior: {
    abilities: [
      { id: 'warrior_basic',          name: 'Basic Strike',       unlockLevel: 1,  cost: 0,  costType: 'energy', power: 1.0,  type: 'physical' },
      { id: 'warrior_shield_bash',    name: 'Shield Bash',        unlockLevel: 2,  cost: 20, costType: 'energy', power: 1.1,  type: 'physical', effect: { stun: 0.30 } },
      { id: 'warrior_war_cry',        name: 'War Cry',            unlockLevel: 5,  cost: 30, costType: 'energy', power: 0,    type: 'buff',     effect: { selfAtkBuff: 0.20, beastAtkBuff: 0.10, duration: 3 } },
      { id: 'warrior_cleave',         name: 'Cleave',             unlockLevel: 8,  cost: 35, costType: 'energy', power: 0.9,  type: 'physical', effect: { aoe: true } },
      { id: 'warrior_counter_stance', name: 'Counter Stance',     unlockLevel: 12, cost: 25, costType: 'energy', power: 0,    type: 'defend',   effect: { counterChance: 0.50 } },
      { id: 'warrior_open_wound',     name: 'Open Wound Strike',  unlockLevel: 16, cost: 45, costType: 'energy', power: 1.8,  type: 'physical', effect: { bleedBonus: 0.50 } },
      { id: 'warrior_rally',          name: 'Rally',              unlockLevel: 20, cost: 40, costType: 'energy', power: 0,    type: 'heal',     effect: { healPct: 0.15 } },
      { id: 'warrior_unbreakable',    name: 'Unbreakable',        unlockLevel: 25, cost: 60, costType: 'energy', power: 0,    type: 'defend',   effect: { negateNextHit: true } },
      { id: 'warrior_titans_blow',    name: "Titan's Blow",       unlockLevel: 30, cost: 60, costType: 'energy', power: 2.5,  type: 'physical', effect: { pushToLast: true } },
    ],
  },
  mage: {
    abilities: [
      { id: 'mage_basic',          name: 'Arcane Bolt',    unlockLevel: 1,  cost: 0,  costType: 'mana', power: 1.0,  type: 'magic' },
      { id: 'mage_frost_lance',    name: 'Frost Lance',    unlockLevel: 2,  cost: 15, costType: 'mana', power: 1.2,  type: 'magic', effect: { slow: { spdDown: 2, duration: 2 } } },
      { id: 'mage_fireball',       name: 'Fireball',       unlockLevel: 5,  cost: 30, costType: 'mana', power: 1.3,  type: 'magic', effect: { aoe: true } },
      { id: 'mage_interrupt',      name: 'Interrupt Blast', unlockLevel: 8, cost: 35, costType: 'mana', power: 1.6,  type: 'magic', effect: { silencedBonus: 2.0 } },
      { id: 'mage_mana_shield',    name: 'Mana Shield',    unlockLevel: 12, cost: 20, costType: 'mana', power: 0,    type: 'defend', effect: { manaShield: true } },
      { id: 'mage_blizzard',       name: 'Blizzard',       unlockLevel: 16, cost: 50, costType: 'mana', power: 1.1,  type: 'magic', effect: { aoe: true, applyWet: true, slow: { spdDown: 3, duration: 2 } } },
      { id: 'mage_arcane_surge',   name: 'Arcane Surge',   unlockLevel: 20, cost: 0,  costType: 'mana', power: 0,    type: 'buff',  effect: { nextSpellFree: true, nextSpellBonus: 0.50, cooldown: 3 } },
      { id: 'mage_chain_arcana',   name: 'Chain Arcana',   unlockLevel: 25, cost: 60, costType: 'mana', power: 1.5,  type: 'magic', effect: { hits: 3, targetRandom: true } },
      { id: 'mage_obliterate',     name: 'Obliterate',     unlockLevel: 30, cost: 80, costType: 'mana', power: 3.0,  type: 'magic', effect: { ignoresDefense: true } },
    ],
  },
  assassin: {
    abilities: [
      { id: 'assassin_basic',         name: 'Quick Strike',       unlockLevel: 1,  cost: 0, costType: 'none', power: 1.0, type: 'physical', effect: { gainCp: 1 } },
      { id: 'assassin_poison',        name: 'Poison Blade',       unlockLevel: 2,  cost: 0, costType: 'none', power: 0.9, type: 'physical', effect: { poison: { dmgPerTurn: 8, duration: 3 }, gainCp: 1 } },
      { id: 'assassin_shadow_step',   name: 'Shadow Step',        unlockLevel: 5,  cost: 0, costType: 'none', power: 0,   type: 'dodge',    effect: { dodgeNext: 1.0, gainCp: 2 } },
      { id: 'assassin_eviscerate',    name: 'Eviscerate',         unlockLevel: 8,  cost: 3, costType: 'combo', power: 2.2, type: 'physical', effect: { dotBonusPerStack: 0.10 } },
      { id: 'assassin_smoke',         name: 'Smoke Screen',       unlockLevel: 12, cost: 0, costType: 'none', power: 0,   type: 'debuff',   effect: { blind: { accDown: 0.30, duration: 2 }, gainCp: 1 } },
      { id: 'assassin_exploit',       name: 'Exploit Weakness',   unlockLevel: 16, cost: 4, costType: 'combo', power: 2.8, type: 'physical', effect: { ignoresDefense: true, guaranteedCrit: true } },
      { id: 'assassin_hemorrhage',    name: 'Hemorrhage Strike',  unlockLevel: 20, cost: 0, costType: 'none', power: 1.0, type: 'physical', effect: { applyBleed: true, applyPoison: true, gainCp: 1 } },
      { id: 'assassin_death_mark',    name: 'Death Mark',         unlockLevel: 25, cost: 2, costType: 'combo', power: 0,   type: 'debuff',   effect: { damageTaken: 0.30, duration: 3 } },
      { id: 'assassin_thousand_cuts', name: 'One Thousand Cuts',  unlockLevel: 30, cost: 5, costType: 'combo', power: 0.6, type: 'physical', effect: { hits: 6, dotCrit: true } },
    ],
  },
};

export function getAbility(className, abilityId) {
  return CLASSES[className]?.abilities.find(a => a.id === abilityId);
}

export function getUnlockedAbilities(className, level) {
  return (CLASSES[className]?.abilities || []).filter(a => a.unlockLevel <= level);
}
