// Node maps for each region.
// x, y are positions within the map area (left 620px of the screen).
// The map area starts at y = HEADER_H (80px from top).
// Connections list sibling node IDs that this node links to (drawn as paths).

export const REGION_NODES = {
  base: {
    npcId: 'warden_post',
    nodes: [
      {
        id: 'warden_post', label: "Warden's Post", type: 'npc',
        x: 310, y: 390,
        connections: ['mossy_glade', 'stone_circle'],
        description: "Elder Warden Gareth keeps watch here, guarding the crossroads between the elemental regions.",
      },
      {
        id: 'mossy_glade', label: 'Mossy Glade', type: 'wild',
        x: 140, y: 250,
        connections: ['elder_keep'],
        description: 'A damp clearing thick with undergrowth. Small creatures rustle in the ferns.',
      },
      {
        id: 'stone_circle', label: 'Stone Circle', type: 'wild',
        x: 480, y: 250,
        connections: ['elder_keep'],
        description: 'Ancient standing stones, worn smooth by centuries of wind and rain. Something watches from between them.',
      },
      {
        id: 'elder_keep', label: "Elder's Keep", type: 'boss',
        x: 310, y: 110,
        connections: [],
        description: "Elder Warden Gareth's stronghold. He waits inside to test all who would journey into the elemental regions. After the test — the door to the upper chambers remains sealed. Something waits beyond it.",
      },
    ],
  },

  water: {
    npcId: 'dockside',
    nodes: [
      {
        id: 'dockside', label: 'Dockside', type: 'npc',
        x: 310, y: 440,
        connections: ['tide_pools', 'coral_reef'],
        description: "Shore Warden Mira watches over the coast from this crumbling dock. She is not the Tide Keeper — only its guardian. The water laps in strange, arrhythmic pulses.",
      },
      {
        id: 'tide_pools', label: 'Tide Pools', type: 'wild',
        x: 120, y: 330,
        connections: ['sunken_ruins'],
        description: 'Rocky pools exposed at low tide. The creatures inside seem agitated, circling without purpose.',
      },
      {
        id: 'coral_reef', label: 'Coral Reef', type: 'wild',
        x: 500, y: 330,
        connections: ['pressure_vents'],
        description: 'Once vibrant with colour, the reef is dimmed by the shard\'s corruption. Strange shapes drift through the murk.',
      },
      {
        id: 'sunken_ruins', label: 'Sunken Ruins', type: 'wild',
        x: 190, y: 195,
        connections: ['abyssal_gate'],
        description: 'The remains of an old coastal settlement, now half-submerged. Creatures shelter in the hollow walls. Something larger circles the outer towers.',
      },
      {
        id: 'pressure_vents', label: 'Pressure Vents', type: 'wild',
        x: 430, y: 195,
        connections: ['abyssal_gate'],
        description: 'Geothermal vents on the ocean shelf, superheating the water above. Rare creatures gather here, drawn by the warmth.',
      },
      {
        id: 'abyssal_gate', label: 'Abyssal Gate', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'A tear in the ocean floor pulsing with dark energy. The Tide Keeper lurks in the depths beyond.',
      },
    ],
  },

  fire: {
    npcId: 'forge_post',
    nodes: [
      {
        id: 'forge_post', label: 'Forge Post', type: 'npc',
        x: 310, y: 440,
        connections: ['ash_fields', 'lava_flats'],
        description: "Forge Sentinel Kael maintains his vigil from this scorched outpost at the mountain's base.",
      },
      {
        id: 'ash_fields', label: 'Ash Fields', type: 'wild',
        x: 120, y: 330,
        connections: ['cinder_caves'],
        description: 'Fields blanketed in grey ash from the eruptions above. The heat is intense. Creatures skitter through the cinders.',
      },
      {
        id: 'lava_flats', label: 'Lava Flats', type: 'wild',
        x: 500, y: 330,
        connections: ['magma_spires'],
        description: 'Cracked earth with rivers of slow-moving fire beneath. Creatures born here barely notice the heat.',
      },
      {
        id: 'cinder_caves', label: 'Cinder Caves', type: 'wild',
        x: 190, y: 195,
        connections: ['volcano_core'],
        description: 'Caves carved by old lava flows, lined with cooling rock. Something massive has been here recently — the claw marks are still glowing.',
      },
      {
        id: 'magma_spires', label: 'Magma Spires', type: 'wild',
        x: 430, y: 195,
        connections: ['volcano_core'],
        description: 'Pillars of hardened magma rising from the crater floor. Creatures of the highest fire attunement nest near the peak.',
      },
      {
        id: 'volcano_core', label: 'Volcano Core', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'The beating heart of the mountain. Cinderbound has claimed this place as its throne.',
      },
    ],
  },

  plant: {
    npcId: 'grove_hollow',
    nodes: [
      {
        id: 'grove_hollow', label: 'Grove Hollow', type: 'npc',
        x: 310, y: 440,
        connections: ['fern_path', 'vine_tangle'],
        description: "Grove Speaker Sylwen speaks for the forest from this ancient clearing. The trees lean inward as if listening.",
      },
      {
        id: 'fern_path', label: 'Fern Path', type: 'wild',
        x: 120, y: 330,
        connections: ['ancient_grove'],
        description: 'A winding trail beneath a canopy of giant ferns. The air smells of earth and something older.',
      },
      {
        id: 'vine_tangle', label: 'Vine Tangle', type: 'wild',
        x: 500, y: 330,
        connections: ['darkwood_depths'],
        description: 'Thick vines block the path in every direction. They seem to shift when you\'re not looking directly at them.',
      },
      {
        id: 'ancient_grove', label: 'Ancient Grove', type: 'wild',
        x: 190, y: 195,
        connections: ['root_throne'],
        description: 'Trees here are older than recorded history. Their bark is dark and damp. Something moves between them that has no name in any bestiary.',
      },
      {
        id: 'darkwood_depths', label: 'Darkwood Depths', type: 'wild',
        x: 430, y: 195,
        connections: ['root_throne'],
        description: 'The forest floor is invisible under layers of rotting growth. Rare creatures burrow up from below, drawn by the shard\'s pulse.',
      },
      {
        id: 'root_throne', label: 'Root Throne', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'The seat of the Root Sovereign, now overgrown with dark, pulsing vines. Nothing lives here willingly.',
      },
    ],
  },

  lightning: {
    npcId: 'storm_watch',
    nodes: [
      {
        id: 'storm_watch', label: 'Storm Watch', type: 'npc',
        x: 310, y: 440,
        connections: ['crackle_ridge', 'spark_plains'],
        description: "Storm Watcher Thorn tracks the storms from this exposed platform. Lightning strikes the rod above every few minutes.",
      },
      {
        id: 'crackle_ridge', label: 'Crackle Ridge', type: 'wild',
        x: 120, y: 330,
        connections: ['thunder_hollow'],
        description: 'Rocky ridges crackling with uncontrolled static. Hair stands on end here. So does everything else.',
      },
      {
        id: 'spark_plains', label: 'Spark Plains', type: 'wild',
        x: 500, y: 330,
        connections: ['storm_channel'],
        description: 'Open plains where lightning strikes every few minutes. Creatures have learned to move in bursts between strikes.',
      },
      {
        id: 'thunder_hollow', label: 'Thunder Hollow', type: 'wild',
        x: 190, y: 195,
        connections: ['tempest_peak'],
        description: 'A depression in the ridge where sound echoes strangely. Thunder here is constant and directionless. Creatures of immense charge lurk in the low ground.',
      },
      {
        id: 'storm_channel', label: 'Storm Channel', type: 'wild',
        x: 430, y: 195,
        connections: ['tempest_peak'],
        description: 'A narrow canyon that funnels storm winds into a concentrated beam. Standing upright is barely possible. Rare creatures ride the current.',
      },
      {
        id: 'tempest_peak', label: 'Tempest Peak', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'The highest point of the ridge. The Tempest Lord has been here so long the peak has been reshaped by its storms.',
      },
    ],
  },

  glow: {
    npcId: 'luminous_cave',
    nodes: [
      {
        id: 'luminous_cave', label: 'Luminous Cave', type: 'npc',
        x: 310, y: 440,
        connections: ['glimmer_pool', 'radiant_hollow'],
        description: "Luminary Vex observes the light anomalies from this cave entrance. The glow here is beautiful. And wrong.",
      },
      {
        id: 'glimmer_pool', label: 'Glimmer Pool', type: 'wild',
        x: 120, y: 330,
        connections: ['crystal_cavern'],
        description: 'A pool that glows from deep within. Some creatures have half-vanished into the light and returned... changed.',
      },
      {
        id: 'radiant_hollow', label: 'Radiant Hollow', type: 'wild',
        x: 500, y: 330,
        connections: ['lightless_deep'],
        description: 'A hollow filled with pulsing light. Objects brought here flicker at the edges, as if being slowly erased.',
      },
      {
        id: 'crystal_cavern', label: 'Crystal Cavern', type: 'wild',
        x: 190, y: 195,
        connections: ['void_chamber'],
        description: 'Massive crystals amplify the shard\'s glow into blinding columns. Creatures that dwell here are almost entirely light — barely physical at all.',
      },
      {
        id: 'lightless_deep', label: 'Lightless Deep', type: 'wild',
        x: 430, y: 195,
        connections: ['void_chamber'],
        description: 'A section of the cave where all light is consumed. Creatures here have evolved to generate their own — a cold, unsettling glow.',
      },
      {
        id: 'void_chamber', label: 'Void Chamber', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'A vast chamber where light goes to die. The Radiant Tyrant waits at the centre, growing.',
      },
    ],
  },

  ice: {
    npcId: 'hermit_shelter',
    nodes: [
      {
        id: 'hermit_shelter', label: "Hermit's Shelter", type: 'npc',
        x: 310, y: 440,
        connections: ['frost_flats', 'snow_drift'],
        description: "Frost Hermit Yara has lived in this ice shelter for a hundred years. The walls are covered in a century of notes.",
      },
      {
        id: 'frost_flats', label: 'Frost Flats', type: 'wild',
        x: 120, y: 330,
        connections: ['ice_spires'],
        description: 'Endless flat ice where creatures move in near-silence. The stillness here is absolute.',
      },
      {
        id: 'snow_drift', label: 'Snow Drift', type: 'wild',
        x: 500, y: 330,
        connections: ['blizzard_pass'],
        description: 'Massive drifts of snow stretching in every direction. Things move beneath them. You can hear them breathing.',
      },
      {
        id: 'ice_spires', label: 'Ice Spires', type: 'wild',
        x: 190, y: 195,
        connections: ['glacial_tomb'],
        description: 'Columns of ancient ice stretching hundreds of feet. Frozen within some of them are creatures — some still alive, barely. The rarest specimens surface here.',
      },
      {
        id: 'blizzard_pass', label: 'Blizzard Pass', type: 'wild',
        x: 430, y: 195,
        connections: ['glacial_tomb'],
        description: 'A mountain pass perpetually scoured by a localised blizzard. Only the strongest creatures survive here year-round.',
      },
      {
        id: 'glacial_tomb', label: 'Glacial Tomb', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: 'Ancient ice, miles thick. The Glacial Lich has been entombed here for centuries, slowly merging with the shard.',
      },
    ],
  },

  rock: {
    npcId: 'oracle_shrine',
    nodes: [
      {
        id: 'oracle_shrine', label: "Oracle's Shrine", type: 'npc',
        x: 310, y: 440,
        connections: ['stone_quarry', 'boulder_pass'],
        description: "The Stone Oracle speaks from this ancient shrine — a disembodied voice from cracked stone. Its body is elsewhere.",
      },
      {
        id: 'stone_quarry', label: 'Stone Quarry', type: 'wild',
        x: 120, y: 330,
        connections: ['deep_mines'],
        description: 'A deep quarry carved by something far larger than any tool. Rock creatures nest in the walls.',
      },
      {
        id: 'boulder_pass', label: 'Boulder Pass', type: 'wild',
        x: 500, y: 330,
        connections: ['titans_rest'],
        description: 'A narrow pass between boulders the size of houses. They shift occasionally. Slowly. Deliberately.',
      },
      {
        id: 'deep_mines', label: 'Deep Mines', type: 'wild',
        x: 190, y: 195,
        connections: ['ancient_citadel'],
        description: 'Tunnels bored by ancient rock creatures, going far deeper than any map shows. The walls hum with the Prime Shard\'s resonance. Something enormous nests at the bottom.',
      },
      {
        id: 'titans_rest', label: "Titan's Rest", type: 'wild',
        x: 430, y: 195,
        connections: ['ancient_citadel'],
        description: 'A plateau scattered with the remains of stone giants from an earlier age. Their bones are still warm. Something has woken them partially.',
      },
      {
        id: 'ancient_citadel', label: 'Ancient Citadel', type: 'boss',
        x: 310, y: 70,
        connections: [],
        description: "The Unbound's fortress. The Ancient One — wearing the Stone Oracle's stolen body — waits inside.",
      },
    ],
  },
};
