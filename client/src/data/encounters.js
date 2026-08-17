// ─── Boss helper ──────────────────────────────────────────────────────────────
// fixedLevel overrides player-level scaling so bosses are always challenging.
function boss(id, trainerName, petSpecies, fixedLevel) {
  return {
    id, type: 'trainer', fixedLevel,
    enemy: {
      id: 'enemy', name: trainerName,
      hp: 100, maxHp: 100, attack: 14, defense: 8, speed: 9,
      type: null, isBoss: true, capturable: false,
      moveIds: ['base_attack', 'arcane_nova', 'staff_bolt', 'relic_blast'],
    },
    pets: petSpecies.map((s, i) => ({
      id: `enemy_pet${i + 1}`, speciesId: s, capturable: false,
    })),
  };
}

export const ENCOUNTERS = {
  // ── Test battle ─────────────────────────────────────────────────────────────
  test_battle: {
    id: 'test_battle',
    type: 'trainer',
    enemy: {
      id: 'enemy',
      name: 'Wild Trainer',
      hp: 80, maxHp: 80,
      attack: 10, defense: 5, speed: 7,
      type: null, isBoss: false, capturable: false,
      moveIds: ['base_attack', 'staff_bolt', 'relic_blast', 'arcane_nova'],
    },
    pets: [
      { id: 'enemy_pet1', speciesId: 'ember',  capturable: false },
      { id: 'enemy_pet2', speciesId: 'sprout', capturable: false },
    ],
  },

  // ── Wild encounters ──────────────────────────────────────────────────────────
  wild_frog:      { id: 'wild_frog',      type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'frog',      capturable: true }] },
  wild_tidepup:   { id: 'wild_tidepup',   type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'tidepup',   capturable: true }] },
  wild_bubblefin: { id: 'wild_bubblefin', type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'bubblefin', capturable: true }] },

  wild_ember:     { id: 'wild_ember',     type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'ember',     capturable: true }] },
  wild_cindercub: { id: 'wild_cindercub', type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'cindercub', capturable: true }] },
  wild_ashwing:   { id: 'wild_ashwing',   type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'ashwing',   capturable: true }] },

  wild_sprout:    { id: 'wild_sprout',    type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'sprout',    capturable: true }] },
  wild_thornback: { id: 'wild_thornback', type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'thornback', capturable: true }] },
  wild_bloomoth:  { id: 'wild_bloomoth',  type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'bloomoth',  capturable: true }] },

  wild_spark:     { id: 'wild_spark',     type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'spark',     capturable: true }] },
  wild_voltfang:  { id: 'wild_voltfang',  type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'voltfang',  capturable: true }] },
  wild_zapwing:   { id: 'wild_zapwing',   type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'zapwing',   capturable: true }] },

  wild_shimmer:   { id: 'wild_shimmer',   type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'shimmer',   capturable: true }] },
  wild_lumimoth:  { id: 'wild_lumimoth',  type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'lumimoth',  capturable: true }] },
  wild_glowcrab:  { id: 'wild_glowcrab',  type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'glowcrab',  capturable: true }] },

  wild_frost:     { id: 'wild_frost',     type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'frost',     capturable: true }] },
  wild_snowpaw:   { id: 'wild_snowpaw',   type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'snowpaw',   capturable: true }] },
  wild_glaceling: { id: 'wild_glaceling', type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'glaceling', capturable: true }] },

  wild_pebble:    { id: 'wild_pebble',    type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'pebble',    capturable: true }] },
  wild_stoneback: { id: 'wild_stoneback', type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'stoneback', capturable: true }] },
  wild_craghorn:  { id: 'wild_craghorn',  type: 'wild', pets: [{ id: 'enemy_pet1', speciesId: 'craghorn',  capturable: true }] },

  // ── Region bosses ────────────────────────────────────────────────────────────
  boss_base:      boss('boss_base',      'Elder Warden',    ['frog', 'ember'],                                4),
  boss_unbound:   boss('boss_unbound',   'The Unbound',     ['monolith', 'leviathan', 'infernos', 'worldtree'], 35),
  boss_water:     boss('boss_water',     'Tide Keeper',     ['frog', 'tidepup', 'bubblefin'],                 7),
  boss_fire:      boss('boss_fire',      'Cinderbound',     ['ember', 'cindercub', 'ashwing'],               10),
  boss_plant:     boss('boss_plant',     'Root Sovereign',  ['sprout', 'thornback', 'bloomoth'],             13),
  boss_lightning: boss('boss_lightning', 'Tempest Lord',    ['spark', 'voltfang', 'zapwing'],               17),
  boss_glow:      boss('boss_glow',      'Radiant Tyrant',  ['shimmer', 'lumimoth', 'glowcrab'],            21),
  boss_ice:       boss('boss_ice',       'Glacial Lich',    ['frost', 'snowpaw', 'glaceling'],              25),
  boss_rock:      boss('boss_rock',      'The Ancient One', ['pebble', 'stoneback', 'craghorn'],            30),
};

// Equipment dropped by each boss encounter
export const BOSS_DROPS = {
  boss_base:      ['scholars_cap'],
  boss_unbound:   ['war_crown', 'heavy_robe', 'swift_boots'],
  boss_water:     ['ice_staff'],
  boss_fire:      ['fire_staff'],
  boss_plant:     ['nature_relic'],
  boss_lightning: ['lightning_staff'],
  boss_glow:      ['basic_relic'],
  boss_ice:       ['silk_robe', 'swift_boots'],
  boss_rock:      ['battle_helm', 'heavy_robe', 'heavy_boots'],
};
