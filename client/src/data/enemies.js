/**
 * Enemy templates for PvE.
 * Each enemy has a hero + beast pair (mirrors the player's setup).
 * AI behaviour patterns drive interesting counter-play.
 *
 * aiPattern options:
 *   'aggressive'   — always go for max damage
 *   'disruptor'    — prioritise status effects and debuffs
 *   'reactive'     — cleanse DoTs, defend when low HP, punish patterns
 *   'burst'        — wait and build resources, then dump everything in one turn
 */

export const ENEMIES = {
  // ─── Starter zone ──────────────────────────────────────────────────────────
  forest_bandit: {
    name: 'Forest Bandit',
    level: 1,
    terrain: 'forest',
    hero: {
      id: 'enemy_hero',
      name: 'Bandit',
      heroClass: 'warrior',
      hp: 80, hpMax: 80, attack: 9, defense: 6, speed: 9,
      resource: 'energy', resourceMax: 100, resourceCurrent: 60,
      side: 'enemy',
      abilities: ['warrior_basic', 'warrior_shield_bash'],
    },
    beast: {
      id: 'enemy_beast',
      name: 'Forest Boar',
      templateId: 'boar',
      beastType: 'land',
      hp: 55, hpMax: 55, attack: 10, defense: 5, speed: 10,
      staminaCurrent: 3, staminaMax: 3,
      side: 'enemy',
      abilities: ['boar_tusk_gore'],
    },
    aiPattern: 'aggressive',
    xpReward: 40,
    loot: [{ id: 'healing_herb', weight: 60, qty: 1 }, { id: 'gold', weight: 100, qty: [8, 15] }],
  },

  swamp_witch: {
    name: 'Swamp Witch',
    level: 3,
    terrain: 'coastal',
    hero: {
      id: 'enemy_hero',
      name: 'Swamp Witch',
      heroClass: 'mage',
      hp: 65, hpMax: 65, attack: 6, defense: 4, speed: 11,
      magicPower: 14,
      resource: 'mana', resourceMax: 100, resourceCurrent: 80,
      side: 'enemy',
      abilities: ['mage_basic', 'mage_frost_lance'],
    },
    beast: {
      id: 'enemy_beast',
      name: 'Mudcrawler',
      templateId: 'crab',
      beastType: 'water',
      hp: 70, hpMax: 70, attack: 7, defense: 11, speed: 5,
      staminaCurrent: 3, staminaMax: 3,
      side: 'enemy',
      abilities: ['crab_claw_pinch'],
    },
    aiPattern: 'disruptor',
    xpReward: 65,
    loot: [{ id: 'mana_crystal', weight: 50, qty: 1 }, { id: 'gold', weight: 100, qty: [12, 22] }],
  },

  sky_raider: {
    name: 'Sky Raider',
    level: 5,
    terrain: 'sky',
    hero: {
      id: 'enemy_hero',
      name: 'Sky Raider',
      heroClass: 'assassin',
      hp: 70, hpMax: 70, attack: 14, defense: 5, speed: 15,
      resource: 'combo', resourceMax: 5, resourceCurrent: 0,
      side: 'enemy',
      abilities: ['assassin_basic', 'assassin_poison', 'assassin_eviscerate'],
    },
    beast: {
      id: 'enemy_beast',
      name: 'Storm Hawk',
      templateId: 'hawk',
      beastType: 'sky',
      hp: 45, hpMax: 45, attack: 14, defense: 3, speed: 18,
      staminaCurrent: 3, staminaMax: 3,
      side: 'enemy',
      abilities: ['hawk_dive_strike'],
    },
    aiPattern: 'burst',
    xpReward: 90,
    loot: [{ id: 'swift_feather', weight: 40, qty: 1 }, { id: 'gold', weight: 100, qty: [18, 30] }],
  },

  // ─── Dungeon boss ───────────────────────────────────────────────────────────
  corrupted_guardian: {
    name: 'Corrupted Guardian',
    level: 8,
    terrain: 'cavern',
    isBoss: true,
    hero: {
      id: 'enemy_hero',
      name: 'The Guardian',
      heroClass: 'warrior',
      hp: 220, hpMax: 220, attack: 16, defense: 14, speed: 7,
      resource: 'energy', resourceMax: 100, resourceCurrent: 100,
      side: 'enemy',
      abilities: ['warrior_basic', 'warrior_shield_bash', 'warrior_cleave', 'warrior_war_cry'],
    },
    beast: {
      id: 'enemy_beast',
      name: 'Stone Sentinel',
      templateId: 'bear',
      beastType: 'land',
      hp: 140, hpMax: 140, attack: 14, defense: 18, speed: 6,
      staminaCurrent: 3, staminaMax: 3,
      side: 'enemy',
      abilities: ['bear_maul', 'bear_crushing_maul'],
    },
    // Phase 2 triggers at 50% HP: gains Fortify buff, cleanse all debuffs
    phases: [
      { hpThreshold: 0.50, trigger: 'fortify', log: 'The Guardian roars! Its wounds seal as stone covers its body.' },
    ],
    aiPattern: 'reactive',
    xpReward: 250,
    loot: [{ id: 'guardian_shard', weight: 100, qty: 1 }, { id: 'gold', weight: 100, qty: [40, 60] }],
  },
};

/**
 * AI action selection.
 * Returns { heroAbilityId, beastAbilityId }
 *
 * The AI considers:
 * - Current enemy statuses (prioritise cleanse if DoT stacks are dangerous)
 * - Player statuses (attack into silenced/slowed targets)
 * - HP thresholds (defend when low, burst when resources are full)
 * - Pattern (aggressive / disruptor / reactive / burst)
 */
export function selectEnemyActions(enemy, battleState) {
  const { pattern, hero, beast } = enemy;
  const { playerStatuses = {}, enemyStatuses = {}, turn = 0 } = battleState;

  // ── Reactive: cleanse dangerous DoTs first ─────────────────────────────────
  const dotDamage = (enemyStatuses.bleed?.magnitude || 0) + (enemyStatuses.poison?.magnitude || 0);
  if (dotDamage >= 10 && pattern !== 'aggressive') {
    return {
      heroAbilityId:  'warrior_counter_stance',
      beastAbilityId: 'defend',
      reason: 'enemy_cleansing',
    };
  }

  // ── Burst: build up then dump ──────────────────────────────────────────────
  if (pattern === 'burst') {
    const cp = hero.resourceCurrent || 0;
    if (hero.heroClass === 'assassin' && cp >= 3) {
      return { heroAbilityId: 'assassin_eviscerate', beastAbilityId: _pickBeastAbility(beast, battleState), reason: 'burst_finisher' };
    }
    // Build phase: basic attack to accumulate CP
    return { heroAbilityId: 'assassin_basic', beastAbilityId: _pickBeastAbility(beast, battleState), reason: 'building_cp' };
  }

  // ── Disruptor: target with status effects ─────────────────────────────────
  if (pattern === 'disruptor') {
    const abilities = hero.abilities || [];
    const debuffAbility = abilities.find(id => ['mage_frost_lance', 'mage_blizzard', 'crab_claw_pinch'].includes(id));
    if (debuffAbility && Math.random() < 0.6) {
      return { heroAbilityId: debuffAbility, beastAbilityId: _pickBeastAbility(beast, battleState), reason: 'applying_debuff' };
    }
  }

  // ── Reactive: defend when low HP ──────────────────────────────────────────
  if (pattern === 'reactive') {
    const hpPct = hero.hp / hero.hpMax;
    if (hpPct < 0.30 && Math.random() < 0.5) {
      return { heroAbilityId: 'warrior_counter_stance', beastAbilityId: 'defend', reason: 'low_hp_defend' };
    }
    // Cleave if player is clustered (always true in 2v2)
    if (hero.abilities?.includes('warrior_cleave') && Math.random() < 0.4) {
      return { heroAbilityId: 'warrior_cleave', beastAbilityId: _pickBeastAbility(beast, battleState), reason: 'cleave' };
    }
  }

  // ── Default: pick strongest available ability ──────────────────────────────
  const heroAbilityId = _pickHeroAbility(hero, battleState);
  const beastAbilityId = _pickBeastAbility(beast, battleState);
  return { heroAbilityId, beastAbilityId, reason: 'default' };
}

function _pickHeroAbility(hero, { enemyStatuses = {} }) {
  const abilities = hero.abilities || ['warrior_basic'];
  const resource = hero.resourceCurrent || 0;

  // Prefer abilities we have resource for
  const usable = abilities.filter(id => {
    // Rough resource check — real costs live in classes.js; approximate here
    if (id.endsWith('_basic')) return true;
    if (hero.heroClass === 'mage' && resource < 20) return id.endsWith('_basic');
    if (hero.heroClass === 'assassin') {
      const cpCosts = { assassin_eviscerate: 3, assassin_exploit: 4, assassin_thousand_cuts: 5, assassin_death_mark: 2 };
      return resource >= (cpCosts[id] || 0);
    }
    return true;
  });

  // Prefer non-basic if target has a vulnerable status
  const hasDoT = enemyStatuses.bleed || enemyStatuses.poison;
  if (hasDoT) {
    const exploit = usable.find(id => id === 'assassin_eviscerate' || id === 'assassin_exploit');
    if (exploit) return exploit;
  }

  // Pick randomly from usable, weighted toward non-basic
  const nonBasic = usable.filter(id => !id.endsWith('_basic'));
  if (nonBasic.length && Math.random() < 0.65) {
    return nonBasic[Math.floor(Math.random() * nonBasic.length)];
  }
  return usable[Math.floor(Math.random() * usable.length)];
}

function _pickBeastAbility(beast, battleState) {
  if (!beast || beast.staminaCurrent <= 0) return 'basic_attack';
  const abilities = beast.abilities || [];
  if (!abilities.length) return 'basic_attack';
  // 60% chance to use special ability if stamina available
  return Math.random() < 0.60 ? abilities[Math.floor(Math.random() * abilities.length)] : 'basic_attack';
}
