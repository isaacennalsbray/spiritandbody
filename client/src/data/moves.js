// All moves keyed by id
export const MOVES = {
  // ── Player moves ─────────────────────────────────────────────────────────────
  base_attack: { id: 'base_attack', name: 'Strike',      power: 1.0, type: null, isAoe: false, recharge: 0 },
  staff_bolt:  { id: 'staff_bolt',  name: 'Staff Bolt',  power: 1.3, type: null, isAoe: false, recharge: 0 },
  relic_blast: { id: 'relic_blast', name: 'Relic Blast', power: 1.4, type: null, isAoe: false, recharge: 0 },
  arcane_nova: { id: 'arcane_nova', name: 'Arcane Nova', power: 1.2, type: null, isAoe: true,  recharge: 3 },

  // ── Water moves — apply Soak (target takes +50% lightning dmg) ────────────────
  water_1: { id: 'water_1', name: 'Splash',       power: 1.0, type: 'water', isAoe: false, recharge: 0, statusEffect: 'soak',   statusChance: 0.15 },
  water_2: { id: 'water_2', name: 'Tidal Wave',   power: 0.8, type: 'water', isAoe: true,  recharge: 0, statusEffect: 'soak',   statusChance: 0.10 },
  water_3: { id: 'water_3', name: 'Hydro Cannon', power: 1.8, type: 'water', isAoe: false, recharge: 3, statusEffect: 'soak',   statusChance: 0.35 },
  water_4: { id: 'water_4', name: 'Water Pulse',  power: 0.9, type: 'water', isAoe: false, recharge: 0, statusEffect: 'soak',   statusChance: 0.15 },

  // ── Fire moves — apply Burn (lose 5% maxHP/turn) ──────────────────────────────
  fire_1: { id: 'fire_1', name: 'Ember',       power: 1.0, type: 'fire', isAoe: false, recharge: 0, statusEffect: 'burn',   statusChance: 0.25 },
  fire_2: { id: 'fire_2', name: 'Flame Burst', power: 0.8, type: 'fire', isAoe: true,  recharge: 0, statusEffect: 'burn',   statusChance: 0.15 },
  fire_3: { id: 'fire_3', name: 'Inferno',     power: 1.8, type: 'fire', isAoe: false, recharge: 3, statusEffect: 'burn',   statusChance: 0.40 },
  fire_4: { id: 'fire_4', name: 'Fire Fang',   power: 0.9, type: 'fire', isAoe: false, recharge: 0, statusEffect: 'burn',   statusChance: 0.25 },

  // ── Plant moves — apply Poison (lose 8% maxHP/turn) ──────────────────────────
  plant_1: { id: 'plant_1', name: 'Vine Whip',   power: 1.0, type: 'plant', isAoe: false, recharge: 0, statusEffect: 'poison', statusChance: 0.25 },
  plant_2: { id: 'plant_2', name: 'Spore Cloud', power: 0.8, type: 'plant', isAoe: true,  recharge: 0, statusEffect: 'poison', statusChance: 0.20 },
  plant_3: { id: 'plant_3', name: 'Solar Beam',  power: 1.8, type: 'plant', isAoe: false, recharge: 3, statusEffect: 'poison', statusChance: 0.40 },
  plant_4: { id: 'plant_4', name: 'Leaf Blade',  power: 0.9, type: 'plant', isAoe: false, recharge: 0, statusEffect: 'poison', statusChance: 0.25 },

  // ── Lightning moves — apply Stun (skip next turn) ────────────────────────────
  lightning_1: { id: 'lightning_1', name: 'Zap',          power: 1.0, type: 'lightning', isAoe: false, recharge: 0, statusEffect: 'stun',   statusChance: 0.20 },
  lightning_2: { id: 'lightning_2', name: 'Thunder Clap', power: 0.8, type: 'lightning', isAoe: true,  recharge: 0, statusEffect: 'stun',   statusChance: 0.12 },
  lightning_3: { id: 'lightning_3', name: 'Thunderbolt',  power: 1.8, type: 'lightning', isAoe: false, recharge: 3, statusEffect: 'stun',   statusChance: 0.35 },
  lightning_4: { id: 'lightning_4', name: 'Volt Strike',  power: 0.9, type: 'lightning', isAoe: false, recharge: 0, statusEffect: 'stun',   statusChance: 0.20 },

  // ── Glow moves — apply Blind (attacker misses 40% more) ──────────────────────
  glow_1: { id: 'glow_1', name: 'Gleam',       power: 1.0, type: 'glow', isAoe: false, recharge: 0, statusEffect: 'blind',  statusChance: 0.20 },
  glow_2: { id: 'glow_2', name: 'Radiance',    power: 0.8, type: 'glow', isAoe: true,  recharge: 0, statusEffect: 'blind',  statusChance: 0.12 },
  glow_3: { id: 'glow_3', name: 'Prism Burst', power: 1.8, type: 'glow', isAoe: false, recharge: 3, statusEffect: 'blind',  statusChance: 0.35 },
  glow_4: { id: 'glow_4', name: 'Light Pulse', power: 0.9, type: 'glow', isAoe: false, recharge: 0, statusEffect: 'blind',  statusChance: 0.20 },

  // ── Ice moves — apply Freeze (skip turn) ─────────────────────────────────────
  ice_1: { id: 'ice_1', name: 'Ice Shard',    power: 1.0, type: 'ice', isAoe: false, recharge: 0, statusEffect: 'freeze', statusChance: 0.20 },
  ice_2: { id: 'ice_2', name: 'Blizzard',     power: 0.8, type: 'ice', isAoe: true,  recharge: 0, statusEffect: 'freeze', statusChance: 0.12 },
  ice_3: { id: 'ice_3', name: 'Glacial Beam', power: 1.8, type: 'ice', isAoe: false, recharge: 3, statusEffect: 'freeze', statusChance: 0.35 },
  ice_4: { id: 'ice_4', name: 'Frost Bite',   power: 0.9, type: 'ice', isAoe: false, recharge: 0, statusEffect: 'freeze', statusChance: 0.20 },

  // ── Rock moves — no status (raw power) ───────────────────────────────────────
  rock_1: { id: 'rock_1', name: 'Stone Throw',  power: 1.0, type: 'rock', isAoe: false, recharge: 0 },
  rock_2: { id: 'rock_2', name: 'Rockslide',    power: 0.8, type: 'rock', isAoe: true,  recharge: 0 },
  rock_3: { id: 'rock_3', name: 'Meteor Crash', power: 1.8, type: 'rock', isAoe: false, recharge: 3 },
  rock_4: { id: 'rock_4', name: 'Boulder Bash', power: 0.9, type: 'rock', isAoe: false, recharge: 0 },

  // ── Equipment-granted moves ───────────────────────────────────────────────────
  fire_bolt:      { id: 'fire_bolt',      name: 'Fire Bolt',      power: 1.2, type: 'fire',      isAoe: false, recharge: 0, statusEffect: 'burn',   statusChance: 0.15 },
  ice_bolt:       { id: 'ice_bolt',       name: 'Ice Bolt',       power: 1.2, type: 'ice',       isAoe: false, recharge: 0, statusEffect: 'freeze', statusChance: 0.15 },
  lightning_bolt: { id: 'lightning_bolt', name: 'Lightning Bolt', power: 1.2, type: 'lightning', isAoe: false, recharge: 0, statusEffect: 'stun',   statusChance: 0.15 },
  plant_bolt:     { id: 'plant_bolt',     name: 'Plant Bolt',     power: 1.2, type: 'plant',     isAoe: false, recharge: 0, statusEffect: 'poison', statusChance: 0.15 },
  water_bolt:     { id: 'water_bolt',     name: 'Water Bolt',     power: 1.2, type: 'water',     isAoe: false, recharge: 0, statusEffect: 'soak',   statusChance: 0.15 },
};

// Human-readable status names for UI
export const STATUS_META = {
  burn:   { label: 'Burn',   color: '#ff7733', desc: 'Lose 5% HP each turn'        },
  poison: { label: 'Poison', color: '#88dd44', desc: 'Lose 8% HP each turn'        },
  freeze: { label: 'Freeze', color: '#44ccff', desc: 'Skip next turn'              },
  stun:   { label: 'Stun',   color: '#ffee44', desc: 'Skip next turn'              },
  blind:  { label: 'Blind',  color: '#cc88ff', desc: 'Miss attacks 40% more often' },
  soak:   { label: 'Soak',   color: '#44aaff', desc: 'Take +50% lightning damage'  },
};
