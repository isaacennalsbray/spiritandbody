/**
 * All 27 beast definitions across 9 evolution lines (3 types × 3 lines × 3 tiers).
 * Each line is keyed by its base ID. Stats are for tier 1 at level 1;
 * see BeastScaling for per-level growth and tier thresholds.
 */

const BEAST_LINES = {
  // ─── LAND ──────────────────────────────────────────────────────────────────
  wolf: {
    type: 'land',
    tiers: [
      {
        tier: 1, name: 'Wolf', minLevel: 1,
        baseHp: 60, baseAtk: 12, baseDef: 4, baseSpd: 14,
        hpPerLevel: 4, atkPerLevel: 1.2, defPerLevel: 0.4, spdPerLevel: 0.3,
        passive: { id: 'wolf_pack_instinct', name: 'Pack Instinct', desc: '+5% ATK when hero acts before beast this turn' },
        abilities: ['wolf_bite', 'wolf_bite_ii'],
        ultimateLevel: 45,
      },
      {
        tier: 2, name: 'Dire Wolf', minLevel: 15,
        baseHp: 110, baseAtk: 22, baseDef: 8, baseSpd: 18,
        hpPerLevel: 6, atkPerLevel: 1.8, defPerLevel: 0.6, spdPerLevel: 0.4,
        passive: { id: 'wolf_bloodscent', name: 'Bloodscent', desc: 'Bleeding targets take +15% all damage' },
        abilities: ['wolf_savage_rend', 'wolf_savage_rend_ii'],
      },
      {
        tier: 3, name: 'Fenrir', minLevel: 30,
        baseHp: 200, baseAtk: 42, baseDef: 14, baseSpd: 24,
        hpPerLevel: 10, atkPerLevel: 3.0, defPerLevel: 1.0, spdPerLevel: 0.5,
        passive: { id: 'wolf_worlds_end', name: "World's End Fang", desc: 'Crits inflict Fear: -2 SPD for 1 turn' },
        abilities: ['wolf_ragnarok_bite', 'wolf_ragnarok_bite_ii'],
        ultimate: { id: 'wolf_ultimate', name: 'Howl of Ragnarok', desc: 'All allies gain +20% ATK and +10% SPD for 3 turns. Once per battle.' },
      },
    ],
  },

  bear: {
    type: 'land',
    tiers: [
      {
        tier: 1, name: 'Bear', minLevel: 1,
        baseHp: 90, baseAtk: 10, baseDef: 10, baseSpd: 6,
        hpPerLevel: 6, atkPerLevel: 0.9, defPerLevel: 1.0, spdPerLevel: 0.1,
        passive: { id: 'bear_thick_hide', name: 'Thick Hide', desc: '5% damage reduction' },
        abilities: ['bear_maul', 'bear_maul_ii'],
      },
      {
        tier: 2, name: 'Cave Bear', minLevel: 15,
        baseHp: 160, baseAtk: 18, baseDef: 18, baseSpd: 8,
        hpPerLevel: 9, atkPerLevel: 1.4, defPerLevel: 1.6, spdPerLevel: 0.15,
        passive: { id: 'bear_iron_skin', name: 'Iron Skin', desc: '10% damage reduction' },
        abilities: ['bear_crushing_maul', 'bear_crushing_maul_ii'],
      },
      {
        tier: 3, name: 'Ursa Prime', minLevel: 30,
        baseHp: 280, baseAtk: 32, baseDef: 32, baseSpd: 10,
        hpPerLevel: 14, atkPerLevel: 2.2, defPerLevel: 2.4, spdPerLevel: 0.2,
        passive: { id: 'bear_fortress', name: 'Fortress Body', desc: '15% DR, immune to knockback' },
        abilities: ['bear_earthquake_slam', 'bear_earthquake_slam_ii'],
        ultimate: { id: 'bear_ultimate', name: 'Primal Roar', desc: 'Reduce all enemy ATK and DEF by 25% for 3 turns. Once per battle.' },
      },
    ],
  },

  boar: {
    type: 'land',
    tiers: [
      {
        tier: 1, name: 'Boar', minLevel: 1,
        baseHp: 70, baseAtk: 14, baseDef: 6, baseSpd: 10,
        hpPerLevel: 5, atkPerLevel: 1.3, defPerLevel: 0.5, spdPerLevel: 0.25,
        passive: { id: 'boar_charge_ready', name: 'Charge Ready', desc: 'First action each battle +30% ATK' },
        abilities: ['boar_tusk_gore', 'boar_tusk_gore_ii'],
      },
      {
        tier: 2, name: 'War Boar', minLevel: 15,
        baseHp: 120, baseAtk: 24, baseDef: 11, baseSpd: 13,
        hpPerLevel: 7, atkPerLevel: 1.9, defPerLevel: 0.8, spdPerLevel: 0.3,
        passive: { id: 'boar_rampage', name: 'Rampage', desc: 'Consecutive hits on same target +5% each, stacks 3×' },
        abilities: ['boar_iron_tusk', 'boar_iron_tusk_ii'],
      },
      {
        tier: 3, name: 'Behemoth Boar', minLevel: 30,
        baseHp: 210, baseAtk: 44, baseDef: 20, baseSpd: 16,
        hpPerLevel: 11, atkPerLevel: 3.2, defPerLevel: 1.3, spdPerLevel: 0.35,
        passive: { id: 'boar_unstoppable', name: 'Unstoppable', desc: 'Immune to stun and slow' },
        abilities: ['boar_gore_rampage', 'boar_gore_rampage_ii'],
        ultimate: { id: 'boar_ultimate', name: 'Stampede', desc: 'Hit all enemies 3 times for 0.8× each. Each hit applies Rampage stack. Once per battle.' },
      },
    ],
  },

  // ─── SKY ───────────────────────────────────────────────────────────────────
  hawk: {
    type: 'sky',
    tiers: [
      {
        tier: 1, name: 'Hawk', minLevel: 1,
        baseHp: 45, baseAtk: 14, baseDef: 3, baseSpd: 18,
        hpPerLevel: 3, atkPerLevel: 1.3, defPerLevel: 0.3, spdPerLevel: 0.45,
        passive: { id: 'hawk_eagle_eye', name: 'Eagle Eye', desc: '+10% crit chance' },
        abilities: ['hawk_dive_strike', 'hawk_dive_strike_ii'],
      },
      {
        tier: 2, name: 'Storm Hawk', minLevel: 15,
        baseHp: 80, baseAtk: 26, baseDef: 6, baseSpd: 22,
        hpPerLevel: 5, atkPerLevel: 2.0, defPerLevel: 0.4, spdPerLevel: 0.5,
        passive: { id: 'hawk_gale_feathers', name: 'Gale Feathers', desc: '20% dodge chance vs physical attacks' },
        abilities: ['hawk_thunderstrike', 'hawk_thunderstrike_ii'],
      },
      {
        tier: 3, name: 'Sky Sovereign', minLevel: 30,
        baseHp: 150, baseAtk: 48, baseDef: 10, baseSpd: 28,
        hpPerLevel: 8, atkPerLevel: 3.4, defPerLevel: 0.6, spdPerLevel: 0.6,
        passive: { id: 'hawk_apex', name: 'Apex Predator', desc: 'Crits reduce target SPD by 3 for 2 turns' },
        abilities: ['hawk_heavens_talon', 'hawk_heavens_talon_ii'],
        ultimate: { id: 'hawk_ultimate', name: 'Storm Dive', desc: 'Deal 3.0× damage. Guaranteed crit. 40% stun. Once per battle.' },
      },
    ],
  },

  owl: {
    type: 'sky',
    tiers: [
      {
        tier: 1, name: 'Owl', minLevel: 1,
        baseHp: 50, baseAtk: 10, baseDef: 5, baseSpd: 15,
        hpPerLevel: 3.5, atkPerLevel: 1.0, defPerLevel: 0.5, spdPerLevel: 0.35,
        passive: { id: 'owl_night_wisdom', name: 'Night Wisdom', desc: 'Hero ability accuracy +5%' },
        abilities: ['owl_lunar_gaze', 'owl_lunar_gaze_ii'],
      },
      {
        tier: 2, name: 'Arcane Owl', minLevel: 15,
        baseHp: 90, baseAtk: 18, baseDef: 9, baseSpd: 17,
        hpPerLevel: 5.5, atkPerLevel: 1.5, defPerLevel: 0.7, spdPerLevel: 0.4,
        passive: { id: 'owl_spellweave', name: 'Spellweave', desc: 'Hero MP costs reduced by 10%' },
        abilities: ['owl_mystic_feathers', 'owl_mystic_feathers_ii'],
      },
      {
        tier: 3, name: 'Ethereal Owlord', minLevel: 30,
        baseHp: 170, baseAtk: 34, baseDef: 16, baseSpd: 21,
        hpPerLevel: 9, atkPerLevel: 2.4, defPerLevel: 1.1, spdPerLevel: 0.45,
        passive: { id: 'owl_timeless_sight', name: 'Timeless Sight', desc: 'Hero immune to silence; owl immune to debuffs' },
        abilities: ['owl_void_screech', 'owl_void_screech_ii'],
        ultimate: { id: 'owl_ultimate', name: 'Eclipse', desc: 'Silence all enemies for 2 turns and reduce their accuracy by 40%. Once per battle.' },
      },
    ],
  },

  bat: {
    type: 'sky',
    tiers: [
      {
        tier: 1, name: 'Bat', minLevel: 1,
        baseHp: 40, baseAtk: 11, baseDef: 2, baseSpd: 20,
        hpPerLevel: 2.5, atkPerLevel: 1.1, defPerLevel: 0.2, spdPerLevel: 0.5,
        passive: { id: 'bat_echolocation', name: 'Echolocation', desc: 'Enemy dodge/stealth effects reduced by 50%' },
        abilities: ['bat_frenzy_bite', 'bat_frenzy_bite_ii'],
      },
      {
        tier: 2, name: 'Dusk Bat', minLevel: 15,
        baseHp: 75, baseAtk: 20, baseDef: 5, baseSpd: 24,
        hpPerLevel: 4.5, atkPerLevel: 1.7, defPerLevel: 0.35, spdPerLevel: 0.55,
        passive: { id: 'bat_blood_drain', name: 'Blood Drain', desc: 'Heals 5% of damage dealt' },
        abilities: ['bat_leech_swarm', 'bat_leech_swarm_ii'],
      },
      {
        tier: 3, name: 'Abyssal Wraith Bat', minLevel: 30,
        baseHp: 140, baseAtk: 36, baseDef: 9, baseSpd: 30,
        hpPerLevel: 7, atkPerLevel: 2.6, defPerLevel: 0.5, spdPerLevel: 0.65,
        passive: { id: 'bat_soul_drain', name: 'Soul Drain', desc: 'Life steal 10% of damage; 5% transfers to hero' },
        abilities: ['bat_eclipse_swarm', 'bat_eclipse_swarm_ii'],
        ultimate: { id: 'bat_ultimate', name: 'Void Frenzy', desc: 'Hit 8 times for 0.5× each with full life steal. Once per battle.' },
      },
    ],
  },

  // ─── WATER ─────────────────────────────────────────────────────────────────
  eel: {
    type: 'water',
    tiers: [
      {
        tier: 1, name: 'Eel', minLevel: 1,
        baseHp: 55, baseAtk: 13, baseDef: 3, baseSpd: 16,
        hpPerLevel: 4, atkPerLevel: 1.2, defPerLevel: 0.3, spdPerLevel: 0.4,
        passive: { id: 'eel_static_body', name: 'Static Body', desc: '10% chance to paralyze attacker on physical hit received' },
        abilities: ['eel_shock_lash', 'eel_shock_lash_ii'],
      },
      {
        tier: 2, name: 'Thunder Eel', minLevel: 15,
        baseHp: 100, baseAtk: 24, baseDef: 7, baseSpd: 19,
        hpPerLevel: 6.5, atkPerLevel: 1.9, defPerLevel: 0.5, spdPerLevel: 0.45,
        passive: { id: 'eel_voltaic_aura', name: 'Voltaic Aura', desc: '20% paralyze on physical hit received; paralyzed targets take +15% damage' },
        abilities: ['eel_chain_lightning', 'eel_chain_lightning_ii'],
      },
      {
        tier: 3, name: 'Leviathan Eel', minLevel: 30,
        baseHp: 190, baseAtk: 44, baseDef: 12, baseSpd: 23,
        hpPerLevel: 11, atkPerLevel: 3.1, defPerLevel: 0.8, spdPerLevel: 0.5,
        passive: { id: 'eel_storm_king', name: 'Storm King', desc: 'Paralyzed targets lose full turn; lightning immune' },
        abilities: ['eel_galvanic_storm', 'eel_galvanic_storm_ii'],
        ultimate: { id: 'eel_ultimate', name: 'Cataclysm', desc: '2.5× AoE lightning. 60% paralyze all enemies. Once per battle.' },
      },
    ],
  },

  crab: {
    type: 'water',
    tiers: [
      {
        tier: 1, name: 'Crab', minLevel: 1,
        baseHp: 80, baseAtk: 9, baseDef: 12, baseSpd: 5,
        hpPerLevel: 5.5, atkPerLevel: 0.8, defPerLevel: 1.2, spdPerLevel: 0.1,
        passive: { id: 'crab_hard_shell', name: 'Hard Shell', desc: 'First hit each battle reduced to 1 damage' },
        abilities: ['crab_claw_pinch', 'crab_claw_pinch_ii'],
      },
      {
        tier: 2, name: 'Armored Crab', minLevel: 15,
        baseHp: 145, baseAtk: 16, baseDef: 22, baseSpd: 7,
        hpPerLevel: 8.5, atkPerLevel: 1.2, defPerLevel: 1.9, spdPerLevel: 0.15,
        passive: { id: 'crab_titan_carapace', name: 'Titan Carapace', desc: 'Damage per hit capped at 15% of beast max HP' },
        abilities: ['crab_vice_grip', 'crab_vice_grip_ii'],
      },
      {
        tier: 3, name: 'Celestial Crab', minLevel: 30,
        baseHp: 260, baseAtk: 28, baseDef: 38, baseSpd: 9,
        hpPerLevel: 14, atkPerLevel: 1.8, defPerLevel: 2.8, spdPerLevel: 0.2,
        passive: { id: 'crab_indestructible', name: 'Indestructible Shell', desc: 'Damage cap 12% max HP per hit; immune to DoTs' },
        abilities: ['crab_cosmic_crush', 'crab_cosmic_crush_ii'],
        ultimate: { id: 'crab_ultimate', name: 'Tidal Fortress', desc: 'Grant hero and beast +50% DEF and damage immunity for 1 turn. Once per battle.' },
      },
    ],
  },

  turtle: {
    type: 'water',
    tiers: [
      {
        tier: 1, name: 'Turtle', minLevel: 1,
        baseHp: 85, baseAtk: 7, baseDef: 14, baseSpd: 4,
        hpPerLevel: 6, atkPerLevel: 0.6, defPerLevel: 1.4, spdPerLevel: 0.05,
        passive: { id: 'turtle_ancient_shell', name: 'Ancient Shell', desc: 'Hero takes 10% less damage while beast is alive' },
        abilities: ['turtle_shell_smash', 'turtle_shell_smash_ii'],
      },
      {
        tier: 2, name: 'Stone Turtle', minLevel: 15,
        baseHp: 155, baseAtk: 13, baseDef: 26, baseSpd: 5,
        hpPerLevel: 9.5, atkPerLevel: 0.9, defPerLevel: 2.1, spdPerLevel: 0.08,
        passive: { id: 'turtle_world_shell', name: 'World Shell', desc: 'Hero takes 15% less damage; beast absorbs 1 hit/turn for hero' },
        abilities: ['turtle_terrain_crush', 'turtle_terrain_crush_ii'],
      },
      {
        tier: 3, name: 'World Tortoise', minLevel: 30,
        baseHp: 280, baseAtk: 22, baseDef: 46, baseSpd: 6,
        hpPerLevel: 16, atkPerLevel: 1.4, defPerLevel: 3.2, spdPerLevel: 0.1,
        passive: { id: 'turtle_cosmic_refuge', name: 'Cosmic Refuge', desc: 'Hero takes 20% less damage; once per battle: beast self-sacrifices to revive hero at 25% HP' },
        abilities: ['turtle_tectonic_slam', 'turtle_tectonic_slam_ii'],
        ultimate: { id: 'turtle_ultimate', name: 'World Shield', desc: 'Revive fallen beast at 50% HP and grant immunity to all damage for 1 turn. Once per battle.' },
      },
    ],
  },
};

/** Returns the starter beast list (tier 1 only) for the character creation screen. */
function getStarters() {
  return Object.entries(BEAST_LINES).map(([id, line]) => ({
    id,
    type: line.type,
    name: line.tiers[0].name,
    tier: 1,
    baseHp:  line.tiers[0].baseHp,
    baseAtk: line.tiers[0].baseAtk,
    baseDef: line.tiers[0].baseDef,
    baseSpd: line.tiers[0].baseSpd,
    passive: line.tiers[0].passive,
    firstAbility: line.tiers[0].abilities[0],
  }));
}

/** Returns the tier data for a beast at a given level. */
function getTierData(beastId, level) {
  const line = BEAST_LINES[beastId];
  if (!line) return null;
  // Pick highest tier whose minLevel <= current level
  const tiers = [...line.tiers].reverse();
  return tiers.find(t => level >= t.minLevel) || line.tiers[0];
}

/** Compute stats for a beast at a specific level. */
function computeStats(beastId, level) {
  const tierData = getTierData(beastId, level);
  if (!tierData) return null;
  const lvlInTier = level - tierData.minLevel;
  return {
    hp:  Math.floor(tierData.baseHp  + tierData.hpPerLevel  * lvlInTier),
    atk: Math.floor(tierData.baseAtk + tierData.atkPerLevel * lvlInTier),
    def: Math.floor(tierData.baseDef + tierData.defPerLevel * lvlInTier),
    spd: Math.floor(tierData.baseSpd + tierData.spdPerLevel * lvlInTier),
  };
}

module.exports = { BEAST_LINES, getStarters, getTierData, computeStats };
