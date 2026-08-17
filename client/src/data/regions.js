// wildSpecies lists one entry per catchable species — no duplicates needed.
// Encounter probability is driven by rarity weights in RegionScene (common=50,
// uncommon=30, rare=10, very_rare=5, legendary=1).
export const REGIONS = {
  base: {
    id: 'base',
    name: 'Verdant Outpost',
    description: 'A peaceful clearing where journeys begin.',
    position: { x: 160, y: 320 },
    requiredLevel: 1,
    type: null,
    wildSpecies: [
      // common (mixed starter types)
      'frog','droplet','ember','flicker','sprout','seedling','spark',
      // uncommon
      'tidepup','cindercub','thornback','voltfang',
      // rare
      'bubblefin','ashwing','bloomoth','zapwing',
      // very_rare
      'tidemaster','pyrarch','arbormight',
      // legendary
      'leviathan',
    ],
    color: 0x446644,
    bossEncounterId: 'boss_base',
    bossName: 'The Unbound',
    connections: ['water', 'fire', 'plant'],
  },
  water: {
    id: 'water',
    name: 'Tidecrest Shore',
    description: 'Rocky coastline teeming with water creatures.',
    position: { x: 340, y: 180 },
    requiredLevel: 3,
    type: 'water',
    wildSpecies: [
      // common
      'frog','droplet','tadpole','splasher','rippler','minnow','bubblet',
      // uncommon
      'tidepup','wavecub','coralite','finling',
      // rare
      'bubblefin','torrenth','deepscale','hydrox',
      // very_rare
      'tidemaster','abyssling','krakelet',
      // legendary
      'leviathan',
    ],
    color: 0x1e6ea0,
    bossEncounterId: 'boss_water',
    bossName: 'Tide Keeper',
    legendarySpeciesId: 'leviathan',
    connections: ['base', 'lightning'],
  },
  fire: {
    id: 'fire',
    name: 'Emberveil Peaks',
    description: 'Scorched mountains where fire spirits dwell.',
    position: { x: 340, y: 460 },
    requiredLevel: 5,
    type: 'fire',
    wildSpecies: [
      // common
      'ember','flicker','cinder','ignis','scorch','flameling','charlet',
      // uncommon
      'cindercub','volkin','burnpaw','smoulder',
      // rare
      'ashwing','infernus','blazeclaw','scaldrix',
      // very_rare
      'pyrarch','flamelord','magmataur',
      // legendary
      'infernos',
    ],
    color: 0xa03c1e,
    bossEncounterId: 'boss_fire',
    bossName: 'Cinderbound',
    legendarySpeciesId: 'infernos',
    connections: ['base', 'glow'],
  },
  plant: {
    id: 'plant',
    name: 'Thornwood Wilds',
    description: 'Ancient forest overgrown with living vines.',
    position: { x: 160, y: 160 },
    requiredLevel: 7,
    type: 'plant',
    wildSpecies: [
      // common
      'sprout','seedling','leaflet','mosscub','sprig','verdling','greenlet',
      // uncommon
      'thornback','vineling','fernpaw','briarling',
      // rare
      'bloomoth','overgrowth','thickethorn','floralynx',
      // very_rare
      'arbormight','sylvantis','rootlord',
      // legendary
      'worldtree',
    ],
    color: 0x2e7a2e,
    bossEncounterId: 'boss_plant',
    bossName: 'Root Sovereign',
    legendarySpeciesId: 'worldtree',
    connections: ['base', 'ice'],
  },
  lightning: {
    id: 'lightning',
    name: 'Stormspire Ridge',
    description: 'Jagged peaks crackling with eternal storms.',
    position: { x: 560, y: 180 },
    requiredLevel: 10,
    type: 'lightning',
    wildSpecies: [
      // common
      'spark','zaplet','crackle','jolt','zappet','staticling','buzzlet',
      // uncommon
      'voltfang','voltcub','shockpaw','stormlet',
      // rare
      'zapwing','thunderkite','stormhawk','voltmane',
      // very_rare
      'stormclaw','galeforce','tempestis',
      // legendary
      'stormlord',
    ],
    color: 0xa09a1e,
    bossEncounterId: 'boss_lightning',
    bossName: 'Tempest Lord',
    legendarySpeciesId: 'stormlord',
    connections: ['water', 'rock'],
  },
  glow: {
    id: 'glow',
    name: 'Luminal Depths',
    description: 'Glowing caverns lit by mysterious creatures.',
    position: { x: 560, y: 460 },
    requiredLevel: 13,
    type: 'glow',
    wildSpecies: [
      // common
      'shimmer','glimlet','radlet','sparkling','glowlet','lumpling','faeling',
      // uncommon
      'lumimoth','gleamling','glowpup','prisling',
      // rare
      'glowcrab','radiantor','luminary','prismatic',
      // very_rare
      'stellarion','glowlord','radiance',
      // legendary
      'solaris',
    ],
    color: 0x8a6ea0,
    bossEncounterId: 'boss_glow',
    bossName: 'Radiant Tyrant',
    legendarySpeciesId: 'solaris',
    connections: ['fire', 'rock'],
  },
  ice: {
    id: 'ice',
    name: 'Frostfall Tundra',
    description: 'A frozen expanse where blizzards never cease.',
    position: { x: 160, y: 480 },
    requiredLevel: 16,
    type: 'ice',
    wildSpecies: [
      // common
      'frost','snowlet','iceling','frostcub','chillpup','glacelet','permaling',
      // uncommon
      'snowpaw','blizzardling','frostfang','icecub',
      // rare
      'glaceling','icethorn','crystalfang','polaris',
      // very_rare
      'glaciodon','winterlord','cryogen',
      // legendary
      'absolutus',
    ],
    color: 0x4aa0a0,
    bossEncounterId: 'boss_ice',
    bossName: 'Glacial Lich',
    legendarySpeciesId: 'absolutus',
    connections: ['plant', 'rock'],
  },
  rock: {
    id: 'rock',
    name: 'Stoneheart Crags',
    description: 'Impenetrable fortress of living stone.',
    position: { x: 760, y: 320 },
    requiredLevel: 20,
    type: 'rock',
    wildSpecies: [
      // common
      'pebble','gravel','cobble','rocklet','stoneling','boulderkin','geolet',
      // uncommon
      'stoneback','granit','quarryling','siltling',
      // rare
      'craghorn','rockbastion','geomancer','tectonis',
      // very_rare
      'monolith','obelisk','terrafist',
      // legendary
      'colossrock',
    ],
    color: 0x7a6040,
    bossEncounterId: 'boss_rock',
    bossName: 'The Ancient One',
    legendarySpeciesId: 'colossrock',
    connections: ['lightning', 'glow', 'ice'],
  },
};

// Boss fixed levels
export const BOSS_LEVELS = {
  boss_base:      4,
  boss_unbound:   35,
  boss_water:     7,
  boss_fire:      10,
  boss_plant:     13,
  boss_lightning: 17,
  boss_glow:      21,
  boss_ice:       25,
  boss_rock:      30,
};
