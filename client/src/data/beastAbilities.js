/**
 * Client-side beast ability definitions.
 * Keyed by ability ID. Used by BattleManager / ActionResolver.
 */

export const BEAST_ABILITIES = {
  // ─── Wolf line ────────────────────────────────────────────────────────────
  wolf_bite: {
    id: 'wolf_bite', name: 'Bite',
    type: 'physical', power: 1.2, cost: 1, costType: 'stamina',
    effect: { bleed: true, bleedDuration: 2 },
  },
  wolf_savage_rend: {
    id: 'wolf_savage_rend', name: 'Savage Rend',
    type: 'physical', power: 1.6, cost: 1, costType: 'stamina',
    effect: { bleed: true, bleedDuration: 3 },
  },
  wolf_ragnarok_bite: {
    id: 'wolf_ragnarok_bite', name: 'Ragnarok Bite',
    type: 'physical', power: 2.2, cost: 1, costType: 'stamina',
    effect: { bleed: true, bleedDuration: 3 },
  },

  // ─── Bear line ────────────────────────────────────────────────────────────
  bear_maul: {
    id: 'bear_maul', name: 'Maul',
    type: 'physical', power: 1.1, cost: 1, costType: 'stamina',
    effect: { defDown: { pct: 0.10, duration: 2 } },
  },
  bear_crushing_maul: {
    id: 'bear_crushing_maul', name: 'Crushing Maul',
    type: 'physical', power: 1.4, cost: 1, costType: 'stamina',
    effect: { defDown: { pct: 0.20, duration: 2 } },
  },
  bear_earthquake_slam: {
    id: 'bear_earthquake_slam', name: 'Earthquake Slam',
    type: 'physical', power: 1.8, cost: 1, costType: 'stamina',
    effect: { aoe: true, defDown: { pct: 0.20, duration: 2 } },
  },

  // ─── Boar line ────────────────────────────────────────────────────────────
  boar_tusk_gore: {
    id: 'boar_tusk_gore', name: 'Tusk Gore',
    type: 'physical', power: 1.3, cost: 1, costType: 'stamina',
    effect: { pushToLast: true },
  },
  boar_iron_tusk: {
    id: 'boar_iron_tusk', name: 'Iron Tusk',
    type: 'physical', power: 1.5, cost: 1, costType: 'stamina',
    effect: { pushToLast: true, stun: 0.50 },
  },
  boar_gore_rampage: {
    id: 'boar_gore_rampage', name: 'Gore Rampage',
    type: 'physical', power: 1.9, cost: 1, costType: 'stamina',
    effect: { hits: 2, pushToLast: true },
  },

  // ─── Hawk line ────────────────────────────────────────────────────────────
  hawk_dive_strike: {
    id: 'hawk_dive_strike', name: 'Dive Strike',
    type: 'physical', power: 1.4, cost: 1, costType: 'stamina',
    effect: { ignoresDefensePct: 0.20 },
  },
  hawk_thunderstrike: {
    id: 'hawk_thunderstrike', name: 'Thunderstrike',
    type: 'physical', power: 1.8, cost: 1, costType: 'stamina',
    effect: { ignoresDefensePct: 0.30, stun: 0.25 },
  },
  hawk_heavens_talon: {
    id: 'hawk_heavens_talon', name: "Heaven's Talon",
    type: 'physical', power: 2.4, cost: 1, costType: 'stamina',
    effect: { critVsLowHp: true },
  },

  // ─── Owl line ────────────────────────────────────────────────────────────
  owl_lunar_gaze: {
    id: 'owl_lunar_gaze', name: 'Lunar Gaze',
    type: 'magic', power: 1.0, cost: 1, costType: 'stamina',
    effect: { silence: 1 },
  },
  owl_mystic_feathers: {
    id: 'owl_mystic_feathers', name: 'Mystic Feathers',
    type: 'magic', power: 1.2, cost: 1, costType: 'stamina',
    effect: { silence: 2, slow: { spdDown: 2, duration: 2 } },
  },
  owl_void_screech: {
    id: 'owl_void_screech', name: 'Void Screech',
    type: 'magic', power: 1.6, cost: 1, costType: 'stamina',
    effect: { aoe: true, silence: 1 },
  },

  // ─── Bat line ────────────────────────────────────────────────────────────
  bat_frenzy_bite: {
    id: 'bat_frenzy_bite', name: 'Frenzy Bite',
    type: 'physical', power: 1.1, cost: 1, costType: 'stamina',
    effect: { hits: 2 },
  },
  bat_leech_swarm: {
    id: 'bat_leech_swarm', name: 'Leech Swarm',
    type: 'physical', power: 1.3, cost: 1, costType: 'stamina',
    effect: { hits: 3 },
  },
  bat_eclipse_swarm: {
    id: 'bat_eclipse_swarm', name: 'Eclipse Swarm',
    type: 'physical', power: 1.5, cost: 1, costType: 'stamina',
    effect: { hits: 4, stun: 0.20 },
  },

  // ─── Eel line ────────────────────────────────────────────────────────────
  eel_shock_lash: {
    id: 'eel_shock_lash', name: 'Shock Lash',
    type: 'physical', power: 1.2, cost: 1, costType: 'stamina',
    effect: { paralyze: 0.30 },
  },
  eel_chain_lightning: {
    id: 'eel_chain_lightning', name: 'Chain Lightning',
    type: 'magic', power: 1.4, cost: 1, costType: 'stamina',
    effect: { paralyze: 0.20 },
  },
  eel_galvanic_storm: {
    id: 'eel_galvanic_storm', name: 'Galvanic Storm',
    type: 'magic', power: 1.8, cost: 1, costType: 'stamina',
    effect: { aoe: true, paralyze: 0.40 },
  },

  // ─── Crab line ────────────────────────────────────────────────────────────
  crab_claw_pinch: {
    id: 'crab_claw_pinch', name: 'Claw Pinch',
    type: 'physical', power: 1.0, cost: 1, costType: 'stamina',
    effect: { atkDown: { pct: 0.15, duration: 2 } },
  },
  crab_vice_grip: {
    id: 'crab_vice_grip', name: 'Vice Grip',
    type: 'physical', power: 1.2, cost: 1, costType: 'stamina',
    effect: { atkDown: { pct: 0.25, duration: 2 } },
  },
  crab_cosmic_crush: {
    id: 'crab_cosmic_crush', name: 'Cosmic Crush',
    type: 'physical', power: 1.6, cost: 1, costType: 'stamina',
    effect: { atkDown: { pct: 0.30, duration: 2 }, defDown: { pct: 0.20, duration: 2 } },
  },

  // ─── Turtle line ────────────────────────────────────────────────────────────
  turtle_shell_smash: {
    id: 'turtle_shell_smash', name: 'Shell Smash',
    type: 'physical', power: 1.0, cost: 1, costType: 'stamina',
    effect: { selfDefDownAtkUp: true },
  },
  turtle_terrain_crush: {
    id: 'turtle_terrain_crush', name: 'Terrain Crush',
    type: 'physical', power: 1.3, cost: 1, costType: 'stamina',
    effect: { slow: { spdDown: 3, duration: 2 }, aoe: true },
  },
  turtle_tectonic_slam: {
    id: 'turtle_tectonic_slam', name: 'Tectonic Slam',
    type: 'physical', power: 1.6, cost: 1, costType: 'stamina',
    effect: { aoe: true, slow: { spdDown: 2, duration: 2 } },
  },
};
