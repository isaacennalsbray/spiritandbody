// ── Plot dialogues — shown once per region on first NPC visit ─────────────────
export const PLOT_DIALOGUE = {
  base: [
    { speaker: 'Elder Warden Gareth', text: "Welcome to Verdant Outpost. I am Elder Warden Gareth, keeper of the crossroads." },
    { speaker: 'Elder Warden Gareth', text: "For centuries, seven elemental regions have been held in balance by the Elemental Shards — ancient crystals, one per region." },
    { speaker: 'Elder Warden Gareth', text: "Weeks ago, the shards began to darken. Something corrupts them from within. We call it The Unbound." },
    { speaker: 'Elder Warden Gareth', text: "Each corrupted shard twists its region's guardian into a destructive force." },
    { speaker: 'Elder Warden Gareth', text: "Journey through the regions. Defeat the corrupted guardians. Break The Unbound's hold on each shard." },
    { speaker: 'Elder Warden Gareth', text: "I cannot leave my post... and truth be told, I am glad of that. Elder's Keep has been sealed for weeks. Something drove me from it. Something is in there." },
    { speaker: 'Elder Warden Gareth', text: "Do not go near the Keep. Not yet. First — the regions. Will you help?" },
  ],
  water: [
    { speaker: 'Shore Warden Mira', text: "The ocean screams, traveller. Do you hear it?" },
    { speaker: 'Shore Warden Mira', text: "The Tide Shard pulses black. Sea creatures that were once peaceful now attack anything that moves." },
    { speaker: 'Shore Warden Mira', text: "Our guardian — the Tide Keeper — has been fully consumed. It lurks deep in the Abyssal Gate." },
    { speaker: 'Shore Warden Mira', text: "If you can defeat it, the shard's hold should break. The ocean can begin to heal." },
  ],
  fire: [
    { speaker: 'Forge Sentinel Kael', text: "You reek of ocean water. Means you dealt with the shore. Good." },
    { speaker: 'Forge Sentinel Kael', text: "The Fire Shard burns black here. The mountain shudders with each pulse." },
    { speaker: 'Forge Sentinel Kael', text: "Cinderbound was this region's protector once. Now it seeks only to burn — villages, passes, everything." },
    { speaker: 'Forge Sentinel Kael', text: "I've heard the same story from travellers passing through other regions. This is coordinated. Something is using the shards as conduits." },
  ],
  plant: [
    { speaker: 'Grove Speaker Sylwen', text: "...You can still speak. The forest hasn't taken you. That's more than most." },
    { speaker: 'Grove Speaker Sylwen', text: "The Plant Shard weeps. The Root Sovereign once nurtured every living thing here. Now it consumes." },
    { speaker: 'Grove Speaker Sylwen', text: "The vines spread further each night. Villages at the forest's edge are being swallowed." },
    { speaker: 'Grove Speaker Sylwen', text: "Sentinel Kael's message reached me. A single source behind all of it. I fear he is right." },
  ],
  lightning: [
    { speaker: 'Storm Watcher Thorn', text: "Four corruptions broken and the storms only worsen. Either you're very fast, or very lucky." },
    { speaker: 'Storm Watcher Thorn', text: "The Storm Shard has been fragmented — shards scattered across the ridge by the Tempest Lord in its madness." },
    { speaker: 'Storm Watcher Thorn', text: "I've mapped the ley lines. The corruptions form a pattern. They all converge on the Stoneheart Crags." },
    { speaker: 'Storm Watcher Thorn', text: "Whatever The Unbound is, that's where it lives. Deal with the Tempest Lord first. Then we face what waits at the end." },
  ],
  glow: [
    { speaker: 'Luminary Vex', text: "Ah. The corruption-breaker. I've been watching your progress from here." },
    { speaker: 'Luminary Vex', text: "The Glow Shard is unusual. Its corruption creates light that erases — creatures, memories, entire sections of cave." },
    { speaker: 'Luminary Vex', text: "The Radiant Tyrant absorbs this erasure light. It is becoming something we have no name for." },
    { speaker: 'Luminary Vex', text: "Defeat it before it becomes fully formed. An unnamed thing is harder to kill than a named one." },
  ],
  ice: [
    { speaker: 'Frost Hermit Yara', text: "I came here a century ago to study the Frost Shard. I have not left since." },
    { speaker: 'Frost Hermit Yara', text: "The shard's corruption here is different. It doesn't rage — it spreads quietly, like sleep." },
    { speaker: 'Frost Hermit Yara', text: "The Glacial Lich was my student once. It found the shard before I did and has been slowly... becoming it." },
    { speaker: 'Frost Hermit Yara', text: "I have seen The Unbound in the ice. It is not a creature. It is an absence — a void where elemental energy should be." },
    { speaker: 'Frost Hermit Yara', text: "It has fed on the shards for centuries. You have starved it. Now it will be desperate." },
  ],
  rock: [
    { speaker: 'Stone Oracle', text: "You have come far, traveller. Farther than anyone has come in a thousand years." },
    { speaker: 'Stone Oracle', text: "I am the Stone Oracle — what remains of me. My physical form was hollowed out long ago." },
    { speaker: 'Stone Oracle', text: "The Unbound wore my body like armour. Became The Ancient One. Turned the Prime Shard into a battery for its hunger." },
    { speaker: 'Stone Oracle', text: "You have broken its power in seven regions. It is weakened. Desperate." },
    { speaker: 'Stone Oracle', text: "Defeat The Ancient One. Reclaim my body. Free the Prime Shard. The shard will do the rest." },
  ],
};

// ── Missions ──────────────────────────────────────────────────────────────────
export const MISSIONS = {
  // ─── BASE ─────────────────────────────────────────────────────────────────
  base_m1: {
    id: 'base_m1', region: 'base',
    title: "A Warden's Request",
    npc: 'Elder Warden Gareth',
    prerequisite: null,
    objective: { type: 'catch_any', label: 'Capture any wild pet' },
    reward: { gold: 50, xp: 100, itemId: null },
    dialogueStart: [
      { speaker: 'Elder Warden Gareth', text: "Before I send you across the land, let me see what you're made of." },
      { speaker: 'Elder Warden Gareth', text: "Venture into the Mossy Glade or Stone Circle and capture a wild creature. Then return to me." },
    ],
    dialogueComplete: [
      { speaker: 'Elder Warden Gareth', text: "Well done. You have real talent for this." },
      { speaker: 'Elder Warden Gareth', text: "Here — take this gold. You'll need supplies for the journey ahead." },
    ],
  },
  base_m2: {
    id: 'base_m2', region: 'base',
    title: 'The First Trial',
    npc: 'Elder Warden Gareth',
    prerequisite: 'base_m1',
    objective: { type: 'defeat_boss', encounterId: 'boss_base', label: "Defeat the Elder Warden in combat" },
    reward: { gold: 80, xp: 150, itemId: 'basic_relic' },
    dialogueStart: [
      { speaker: 'Elder Warden Gareth', text: "Good — you're back. One more thing before I send you to the other regions." },
      { speaker: 'Elder Warden Gareth', text: "I must know you can handle what lies ahead. Find me at the Elder's Keep and face me in battle." },
      { speaker: 'Elder Warden Gareth', text: "...Don't hold back." },
    ],
    dialogueComplete: [
      { speaker: 'Elder Warden Gareth', text: "Impressive. You exceeded my expectations." },
      { speaker: 'Elder Warden Gareth', text: "Take this relic. It may serve you in the trials ahead." },
      { speaker: 'Elder Warden Gareth', text: "The Tidecrest Shore is your next destination. Seek out Shore Warden Mira. The ocean is in pain." },
    ],
  },

  // ─── WATER ────────────────────────────────────────────────────────────────
  water_m1: {
    id: 'water_m1', region: 'water',
    title: 'Tainted Tides',
    npc: 'Shore Warden Mira',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'water', label: 'Capture a water-type creature here' },
    reward: { gold: 60, xp: 120, itemId: null },
    dialogueStart: [
      { speaker: 'Shore Warden Mira', text: "I need to know which creatures can still be reached through the corruption." },
      { speaker: 'Shore Warden Mira', text: "Capture one of the wild water creatures from the Tide Pools or Coral Reef. If it bonds with you, there's still hope." },
    ],
    dialogueComplete: [
      { speaker: 'Shore Warden Mira', text: "You did it. This one is calm... it chose you willingly." },
      { speaker: 'Shore Warden Mira', text: "The corruption hasn't taken everything. That gives me hope." },
      { speaker: 'Shore Warden Mira', text: "There are ruins further in — the Sunken Ruins and Pressure Vents. Something in the deep has been drawing the rarest creatures there." },
    ],
  },
  water_m2: {
    id: 'water_m2', region: 'water',
    title: 'From the Deep',
    npc: 'Shore Warden Mira',
    prerequisite: 'water_m1',
    objective: { type: 'catch_species', speciesId: 'krakelet', nodes: ['sunken_ruins', 'pressure_vents'], label: 'Catch a Krakelet in the deeper waters' },
    reward: { gold: 80, xp: 160, itemId: null },
    dialogueStart: [
      { speaker: 'Shore Warden Mira', text: "There is a creature — the Krakelet. It has lived near the Abyssal Gate for centuries and knows the Tide Keeper's patterns." },
      { speaker: 'Shore Warden Mira', text: "Find one in the Sunken Ruins or Pressure Vents and bond with it. Its instincts will help you survive the deep." },
    ],
    dialogueComplete: [
      { speaker: 'Shore Warden Mira', text: "A Krakelet. I haven't seen one this close to shore in years." },
      { speaker: 'Shore Warden Mira', text: "It's watching the Abyssal Gate. It knows what lives there. So do you, now." },
      { speaker: 'Shore Warden Mira', text: "The Tide Keeper must be confronted. Enter the Abyssal Gate." },
    ],
  },
  water_m3: {
    id: 'water_m3', region: 'water',
    title: 'Cleanse the Deep',
    npc: 'Shore Warden Mira',
    prerequisite: 'water_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_water', label: 'Defeat the Tide Keeper' },
    reward: { gold: 120, xp: 240, itemId: 'water_staff' },
    dialogueStart: [
      { speaker: 'Shore Warden Mira', text: "The Tide Keeper was a gentle guardian once. The shard consumed it." },
      { speaker: 'Shore Warden Mira', text: "Defeating it won't destroy the creature — only free it from the corruption." },
      { speaker: 'Shore Warden Mira', text: "Enter the Abyssal Gate and break its hold on the Tide Shard." },
    ],
    dialogueComplete: [
      { speaker: 'Shore Warden Mira', text: "The water... it's calming. I can feel the shard releasing." },
      { speaker: 'Shore Warden Mira', text: "Take this staff. It carries the blessing of the tide." },
      { speaker: 'Shore Warden Mira', text: "Emberveil Peaks are next. Sentinel Kael will be expecting you. Fire is less patient than water." },
    ],
  },

  // ─── FIRE ─────────────────────────────────────────────────────────────────
  fire_m1: {
    id: 'fire_m1', region: 'fire',
    title: 'Trial by Fire',
    npc: 'Forge Sentinel Kael',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'fire', label: 'Capture a fire-type creature here' },
    reward: { gold: 70, xp: 140, itemId: null },
    dialogueStart: [
      { speaker: 'Forge Sentinel Kael', text: "If you want my help, prove yourself. Capture one of the fire creatures from the Ash Fields or Lava Flats." },
      { speaker: 'Forge Sentinel Kael', text: "Fire respects strength. Come back when you have one." },
    ],
    dialogueComplete: [
      { speaker: 'Forge Sentinel Kael', text: "Ha. You made it back. That creature chose you — fire respects strength." },
      { speaker: 'Forge Sentinel Kael', text: "The Cinder Caves and Magma Spires are deeper in. Something massive has been nesting up there — I've seen the glow from here at night." },
    ],
  },
  fire_m2: {
    id: 'fire_m2', region: 'fire',
    title: 'The Mountainborn',
    npc: 'Forge Sentinel Kael',
    prerequisite: 'fire_m1',
    objective: { type: 'catch_species', speciesId: 'magmataur', nodes: ['cinder_caves', 'magma_spires'], label: 'Catch a Magmataur near the Volcano Core' },
    reward: { gold: 100, xp: 200, itemId: null },
    dialogueStart: [
      { speaker: 'Forge Sentinel Kael', text: "The Magmataur — an ancient fire creature born from the mountain itself. They only appear near the Cinder Caves or Magma Spires." },
      { speaker: 'Forge Sentinel Kael', text: "If you can bond with one, Cinderbound won't be able to control the terrain against you. Find one and earn its trust." },
    ],
    dialogueComplete: [
      { speaker: 'Forge Sentinel Kael', text: "A Magmataur. I've only ever seen them from a distance." },
      { speaker: 'Forge Sentinel Kael', text: "It accepted you. That means the mountain itself is on your side now." },
      { speaker: 'Forge Sentinel Kael', text: "Cinderbound is waiting at the Volcano Core. End this." },
    ],
  },
  fire_m3: {
    id: 'fire_m3', region: 'fire',
    title: 'Quench the Flame',
    npc: 'Forge Sentinel Kael',
    prerequisite: 'fire_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_fire', label: 'Defeat Cinderbound' },
    reward: { gold: 150, xp: 280, itemId: 'fire_staff' },
    dialogueStart: [
      { speaker: 'Forge Sentinel Kael', text: "Cinderbound was once the protector of these peaks. Now it seeks only to burn." },
      { speaker: 'Forge Sentinel Kael', text: "Defeat it at the Volcano Core. I'll investigate the source of the corruption while you continue to the next region." },
    ],
    dialogueComplete: [
      { speaker: 'Forge Sentinel Kael', text: "The tremors are easing. You broke the shard's hold." },
      { speaker: 'Forge Sentinel Kael', text: "Take this staff. Forged in the mountain's heart — before it went dark." },
      { speaker: 'Forge Sentinel Kael', text: "Head to the Thornwood Wilds. Grove Speaker Sylwen awaits. The forest has been growing." },
    ],
  },

  // ─── PLANT ────────────────────────────────────────────────────────────────
  plant_m1: {
    id: 'plant_m1', region: 'plant',
    title: 'Root Bound',
    npc: 'Grove Speaker Sylwen',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'plant', label: 'Capture a plant-type creature here' },
    reward: { gold: 80, xp: 160, itemId: null },
    dialogueStart: [
      { speaker: 'Grove Speaker Sylwen', text: "Not all creatures here are lost. Find one that hasn't been consumed by the corruption." },
      { speaker: 'Grove Speaker Sylwen', text: "Try the Fern Path or Vine Tangle. If it bonds with you willingly, we have proof the shard can be uncorrupted." },
    ],
    dialogueComplete: [
      { speaker: 'Grove Speaker Sylwen', text: "It trusts you. That hasn't happened in weeks." },
      { speaker: 'Grove Speaker Sylwen', text: "The forest still has a heart. We just need to reach it." },
      { speaker: 'Grove Speaker Sylwen', text: "The Ancient Grove and Darkwood Depths lie ahead. Older things dwell there — things that predate the corruption." },
    ],
  },
  plant_m2: {
    id: 'plant_m2', region: 'plant',
    title: 'Voice of the Forest',
    npc: 'Grove Speaker Sylwen',
    prerequisite: 'plant_m1',
    objective: { type: 'catch_species', speciesId: 'rootlord', nodes: ['ancient_grove', 'darkwood_depths'], label: 'Catch a Rootlord in the deep forest' },
    reward: { gold: 110, xp: 220, itemId: null },
    dialogueStart: [
      { speaker: 'Grove Speaker Sylwen', text: "The Rootlord was the forest's second voice — a creature that channelled the shard's power before the corruption." },
      { speaker: 'Grove Speaker Sylwen', text: "One still remains uncorrupted, deep in the Ancient Grove or Darkwood Depths. If you can reach it before the Sovereign does, bond with it." },
      { speaker: 'Grove Speaker Sylwen', text: "Its connection to the shard will help you survive the Root Throne." },
    ],
    dialogueComplete: [
      { speaker: 'Grove Speaker Sylwen', text: "A Rootlord. The forest recognises it — the trees are leaning toward you." },
      { speaker: 'Grove Speaker Sylwen', text: "Now you carry a piece of what this forest was. Don't let it be forgotten." },
      { speaker: 'Grove Speaker Sylwen', text: "The Root Throne awaits. Defeat the Sovereign and free the Plant Shard." },
    ],
  },
  plant_m3: {
    id: 'plant_m3', region: 'plant',
    title: 'The Spreading Dark',
    npc: 'Grove Speaker Sylwen',
    prerequisite: 'plant_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_plant', label: 'Defeat the Root Sovereign' },
    reward: { gold: 170, xp: 320, itemId: 'nature_staff' },
    dialogueStart: [
      { speaker: 'Grove Speaker Sylwen', text: "The Root Sovereign once nurtured all life here. Now it consumes. The vines spread further each night." },
      { speaker: 'Grove Speaker Sylwen', text: "Defeat the Sovereign at the Root Throne. I will attempt to cleanse the shard afterward." },
    ],
    dialogueComplete: [
      { speaker: 'Grove Speaker Sylwen', text: "The spreading has stopped. I can feel the shard cooling." },
      { speaker: 'Grove Speaker Sylwen', text: "Take this staff — it carries the memory of the forest before the darkness." },
      { speaker: 'Grove Speaker Sylwen', text: "Stormspire Ridge is northeast. Storm Watcher Thorn has been trying to reach us." },
    ],
  },

  // ─── LIGHTNING ────────────────────────────────────────────────────────────
  lightning_m1: {
    id: 'lightning_m1', region: 'lightning',
    title: 'Riding the Storm',
    npc: 'Storm Watcher Thorn',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'lightning', label: 'Capture a lightning-type creature here' },
    reward: { gold: 90, xp: 180, itemId: null },
    dialogueStart: [
      { speaker: 'Storm Watcher Thorn', text: "I need a lightning creature that can track the Storm Shard's charge. Their instincts can guide us to the fragments." },
      { speaker: 'Storm Watcher Thorn', text: "Try Crackle Ridge or the Spark Plains. Capture one and bring it back." },
    ],
    dialogueComplete: [
      { speaker: 'Storm Watcher Thorn', text: "Perfect. Feel that — it's already orienting toward the nearest fragment." },
      { speaker: 'Storm Watcher Thorn', text: "Thunder Hollow and Storm Channel are further up the ridge. The rarest creatures gather where the charge is highest." },
    ],
  },
  lightning_m2: {
    id: 'lightning_m2', region: 'lightning',
    title: 'Storm-Touched',
    npc: 'Storm Watcher Thorn',
    prerequisite: 'lightning_m1',
    objective: { type: 'catch_species', speciesId: 'tempestis', nodes: ['thunder_hollow', 'storm_channel'], label: 'Catch a Tempestis on the upper ridge' },
    reward: { gold: 130, xp: 260, itemId: null },
    dialogueStart: [
      { speaker: 'Storm Watcher Thorn', text: "The Tempestis — a creature born directly from the Storm Shard's runoff. It lives in Thunder Hollow and Storm Channel." },
      { speaker: 'Storm Watcher Thorn', text: "If you bond with one, you'll be able to read the storm the Tempest Lord controls. That's the only edge you'll have up there." },
    ],
    dialogueComplete: [
      { speaker: 'Storm Watcher Thorn', text: "A Tempestis. It's been watching Tempest Peak this whole time." },
      { speaker: 'Storm Watcher Thorn', text: "It knows the Tempest Lord's patterns. Listen to it when you're up there." },
      { speaker: 'Storm Watcher Thorn', text: "The Peak is the highest point. Go. End the storm." },
    ],
  },
  lightning_m3: {
    id: 'lightning_m3', region: 'lightning',
    title: 'Eye of the Storm',
    npc: 'Storm Watcher Thorn',
    prerequisite: 'lightning_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_lightning', label: 'Defeat the Tempest Lord' },
    reward: { gold: 200, xp: 380, itemId: 'lightning_staff' },
    dialogueStart: [
      { speaker: 'Storm Watcher Thorn', text: "The Tempest Lord was once the storm's voice. Now it IS the storm — mindless, destructive." },
      { speaker: 'Storm Watcher Thorn', text: "I've mapped the ley lines. They all converge on the Stoneheart Crags. Whatever is doing this is there." },
      { speaker: 'Storm Watcher Thorn', text: "Defeat the Tempest Lord at Tempest Peak first. Then we face what waits at the end." },
    ],
    dialogueComplete: [
      { speaker: 'Storm Watcher Thorn', text: "The storm is breaking up. I can see the sky again." },
      { speaker: 'Storm Watcher Thorn', text: "Take this staff. Forged from a fragment of the Storm Shard itself." },
      { speaker: 'Storm Watcher Thorn', text: "Luminal Depths is southeast. Luminary Vex will know you're coming. They've been watching everything." },
    ],
  },

  // ─── GLOW ─────────────────────────────────────────────────────────────────
  glow_m1: {
    id: 'glow_m1', region: 'glow',
    title: 'Into the Light',
    npc: 'Luminary Vex',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'glow', label: 'Capture a glow-type creature here' },
    reward: { gold: 100, xp: 200, itemId: null },
    dialogueStart: [
      { speaker: 'Luminary Vex', text: "The creatures here are partially erased by the shard's corruption. Some are still whole." },
      { speaker: 'Luminary Vex', text: "Find one that's intact in the Glimmer Pool or Radiant Hollow. Bond with it before the light takes it." },
    ],
    dialogueComplete: [
      { speaker: 'Luminary Vex', text: "It's whole. You reached it in time." },
      { speaker: 'Luminary Vex', text: "The Crystal Cavern and Lightless Deep are further in. The rarest specimens survive there — creatures that have adapted to the erasure light." },
    ],
  },
  glow_m2: {
    id: 'glow_m2', region: 'glow',
    title: 'The Last Light',
    npc: 'Luminary Vex',
    prerequisite: 'glow_m1',
    objective: { type: 'catch_species', speciesId: 'radiance', nodes: ['crystal_cavern', 'lightless_deep'], label: 'Catch a Radiance in the crystal depths' },
    reward: { gold: 150, xp: 300, itemId: null },
    dialogueStart: [
      { speaker: 'Luminary Vex', text: "There is one creature left in these caves that the Radiant Tyrant has not claimed — a Radiance." },
      { speaker: 'Luminary Vex', text: "It carries the last of the Glow Shard's uncorrupted light. Find it in the Crystal Cavern or Lightless Deep." },
      { speaker: 'Luminary Vex', text: "Bond with it. Its light will protect you from the erasure field in the Void Chamber." },
    ],
    dialogueComplete: [
      { speaker: 'Luminary Vex', text: "A Radiance. Still burning. Against all odds." },
      { speaker: 'Luminary Vex', text: "The Tyrant will try to consume it. Keep it close in the Void Chamber." },
      { speaker: 'Luminary Vex', text: "Go. The Radiant Tyrant won't stay contained much longer." },
    ],
  },
  glow_m3: {
    id: 'glow_m3', region: 'glow',
    title: 'The Vanishing',
    npc: 'Luminary Vex',
    prerequisite: 'glow_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_glow', label: 'Defeat the Radiant Tyrant' },
    reward: { gold: 230, xp: 440, itemId: 'silk_robe' },
    dialogueStart: [
      { speaker: 'Luminary Vex', text: "The Radiant Tyrant has absorbed enough erasure light to unmake small things. Left unchecked it will begin erasing larger things. People. Places." },
      { speaker: 'Luminary Vex', text: "Defeat it in the Void Chamber before it becomes fully formed." },
    ],
    dialogueComplete: [
      { speaker: 'Luminary Vex', text: "The erasure light is fading. Things are returning." },
      { speaker: 'Luminary Vex', text: "Take this robe — woven from the light that remained. The kind that reveals, not erases." },
      { speaker: 'Luminary Vex', text: "Frostfall Tundra. Frost Hermit Yara has been there for a century. She knows what waits at the Crags." },
    ],
  },

  // ─── ICE ──────────────────────────────────────────────────────────────────
  ice_m1: {
    id: 'ice_m1', region: 'ice',
    title: 'Enduring the Cold',
    npc: 'Frost Hermit Yara',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'ice', label: 'Capture an ice-type creature here' },
    reward: { gold: 110, xp: 220, itemId: null },
    dialogueStart: [
      { speaker: 'Frost Hermit Yara', text: "Show me you can survive this cold. Capture one of the ice creatures from the Frost Flats or Snow Drift." },
      { speaker: 'Frost Hermit Yara', text: "They don't trust easily. Don't rush them." },
    ],
    dialogueComplete: [
      { speaker: 'Frost Hermit Yara', text: "It chose you. The cold respects patience." },
      { speaker: 'Frost Hermit Yara', text: "The Ice Spires and Blizzard Pass lie beyond. Only the strongest creatures survive there year-round. One in particular concerns me." },
    ],
  },
  ice_m2: {
    id: 'ice_m2', region: 'ice',
    title: 'Children of the Frost',
    npc: 'Frost Hermit Yara',
    prerequisite: 'ice_m1',
    objective: { type: 'catch_species', speciesId: 'cryogen', nodes: ['ice_spires', 'blizzard_pass'], label: 'Catch a Cryogen in the upper tundra' },
    reward: { gold: 160, xp: 320, itemId: null },
    dialogueStart: [
      { speaker: 'Frost Hermit Yara', text: "The Cryogen — a creature that can slow its own body to near-stasis. It lives in the Ice Spires or Blizzard Pass." },
      { speaker: 'Frost Hermit Yara', text: "The Glacial Lich uses the cold as a weapon. A bonded Cryogen will let you resist it." },
      { speaker: 'Frost Hermit Yara', text: "Find one. Be still when you approach it. Movement is a threat to them." },
    ],
    dialogueComplete: [
      { speaker: 'Frost Hermit Yara', text: "A Cryogen. I studied them for twenty years and never got this close." },
      { speaker: 'Frost Hermit Yara', text: "You have the tundra's blessing now. The Lich will feel that." },
      { speaker: 'Frost Hermit Yara', text: "The Glacial Tomb is ahead. End my student's suffering." },
    ],
  },
  ice_m3: {
    id: 'ice_m3', region: 'ice',
    title: 'Breaking the Freeze',
    npc: 'Frost Hermit Yara',
    prerequisite: 'ice_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_ice', label: 'Defeat the Glacial Lich' },
    reward: { gold: 260, xp: 500, itemId: 'ice_staff' },
    dialogueStart: [
      { speaker: 'Frost Hermit Yara', text: "The Glacial Lich was my student once. It has been slowly becoming the shard. I don't know where one ends and the other begins anymore." },
      { speaker: 'Frost Hermit Yara', text: "Defeat my student at the Glacial Tomb. End its suffering." },
      { speaker: 'Frost Hermit Yara', text: "After this, only the Crags remain. Go. Finish what you started." },
    ],
    dialogueComplete: [
      { speaker: 'Frost Hermit Yara', text: "The blizzard is lifting. I haven't seen the sky in forty years." },
      { speaker: 'Frost Hermit Yara', text: "Take this staff. My student would have wanted you to have it." },
      { speaker: 'Frost Hermit Yara', text: "Go to the Stoneheart Crags. The ice remembers everything — and it says you will succeed." },
    ],
  },

  // ─── ROCK ─────────────────────────────────────────────────────────────────
  rock_m1: {
    id: 'rock_m1', region: 'rock',
    title: 'Unearthed',
    npc: 'Stone Oracle',
    prerequisite: null,
    objective: { type: 'catch_type', petType: 'rock', label: 'Capture a rock-type creature here' },
    reward: { gold: 120, xp: 240, itemId: null },
    dialogueStart: [
      { speaker: 'Stone Oracle', text: "Before you face The Ancient One, prove you understand this land." },
      { speaker: 'Stone Oracle', text: "Capture one of the rock creatures from the Stone Quarry or Boulder Pass. They are not the enemy — the corruption is." },
    ],
    dialogueComplete: [
      { speaker: 'Stone Oracle', text: "Good. You understand — these creatures deserve protection, not fear." },
      { speaker: 'Stone Oracle', text: "The Deep Mines and Titan's Rest lie further in. Something enormous has awakened there. I need you to find it." },
    ],
  },
  rock_m2: {
    id: 'rock_m2', region: 'rock',
    title: 'Stone and Memory',
    npc: 'Stone Oracle',
    prerequisite: 'rock_m1',
    objective: { type: 'catch_species', speciesId: 'terrafist', nodes: ['deep_mines', 'titans_rest'], label: 'Catch a Terrafist in the deep rock' },
    reward: { gold: 180, xp: 360, itemId: null },
    dialogueStart: [
      { speaker: 'Stone Oracle', text: "The Terrafist — a creature made almost entirely of Prime Shard resonance. It lives in the Deep Mines or Titan's Rest." },
      { speaker: 'Stone Oracle', text: "The Ancient One will use my old knowledge of the shard against you. A bonded Terrafist can counter that resonance." },
      { speaker: 'Stone Oracle', text: "Find one. It will not come easily. Nothing of true value does." },
    ],
    dialogueComplete: [
      { speaker: 'Stone Oracle', text: "A Terrafist. It carries the mountain's memory." },
      { speaker: 'Stone Oracle', text: "The Ancient One will recognise it. That recognition will cost it a moment of hesitation. Use that moment." },
      { speaker: 'Stone Oracle', text: "Go. The Ancient Citadel. Reclaim what was taken from this world." },
    ],
  },
  rock_m3: {
    id: 'rock_m3', region: 'rock',
    title: 'The Ancient Reckoning',
    npc: 'Stone Oracle',
    prerequisite: 'rock_m2',
    objective: { type: 'defeat_boss', encounterId: 'boss_rock', label: 'Defeat The Ancient One' },
    reward: { gold: 400, xp: 700, itemId: 'war_crown' },
    dialogueStart: [
      { speaker: 'Stone Oracle', text: "The Unbound wears my old body like armour. It will use everything I once knew." },
      { speaker: 'Stone Oracle', text: "But you have broken its power in seven regions. It is weakened. Desperate." },
      { speaker: 'Stone Oracle', text: "Defeat The Ancient One at the Ancient Citadel. The Prime Shard will do the rest." },
    ],
    dialogueComplete: [
      { speaker: 'Stone Oracle', text: "The Ancient One is free. My body — what remained of it — is at peace." },
      { speaker: 'Stone Oracle', text: "Seven shards reclaimed. Seven guardians freed. But the corruption did not end here." },
      { speaker: 'Stone Oracle', text: "The Unbound is not a creature of the regions. It is older than the shards themselves. We were merely its channels." },
      { speaker: 'Stone Oracle', text: "It has been in the Outpost all along. Hiding in Elder's Keep. Watching you clear each region, growing stronger with every shard you released." },
      { speaker: 'Stone Oracle', text: "The freed creatures will find you if you return to each region. They will choose you — the one who broke the Unbound's grip on their homes." },
      { speaker: 'Stone Oracle', text: "Earn their bond. Then go back to the beginning. Gareth knows what waits in the Keep. He has been holding the door shut alone." },
    ],
  },

  // ─── LEGENDARY PHASE ─────────────────────────────────────────────────────
  // Unlocks after all 7 regional bosses are defeated (gated through rock_m3).
  // Chain: rock_m3 → water_legend → fire_legend → plant_legend →
  //        lightning_legend → glow_legend → ice_legend → rock_legend → base_m3

  water_legend: {
    id: 'water_legend', region: 'water',
    title: 'The Leviathan Stirs',
    npc: 'Shore Warden Mira',
    prerequisite: 'rock_m3',
    objective: { type: 'catch_species', speciesId: 'leviathan', label: 'Bond with the Leviathan at the Abyssal Gate' },
    reward: { gold: 200, xp: 400, itemId: null },
    dialogueStart: [
      { speaker: 'Shore Warden Mira', text: "You came back. And you brought news from the Crags — I felt the last shard release from here." },
      { speaker: 'Shore Warden Mira', text: "Something has surfaced at the Abyssal Gate. Enormous. Ancient. It's been circling since the Tide Shard was freed." },
      { speaker: 'Shore Warden Mira', text: "The Leviathan. The first creature the tide ever carried. It's been dormant for a thousand years, held under by the corruption." },
      { speaker: 'Shore Warden Mira', text: "It's free now. And it's waiting. Go to the Gate. Let it choose you." },
    ],
    dialogueComplete: [
      { speaker: 'Shore Warden Mira', text: "I can feel it from here. The ocean exhales for the first time in weeks." },
      { speaker: 'Shore Warden Mira', text: "The Leviathan chose you. That hasn't happened since the age of the first wardens." },
      { speaker: 'Shore Warden Mira', text: "Six more await you. And then — the Outpost. Be careful, traveller. Whatever is in that Keep has been watching all of this." },
    ],
  },

  fire_legend: {
    id: 'fire_legend', region: 'fire',
    title: 'The Infernos Wakes',
    npc: 'Forge Sentinel Kael',
    prerequisite: 'water_legend',
    objective: { type: 'catch_species', speciesId: 'infernos', label: 'Bond with the Infernos at the Volcano Core' },
    reward: { gold: 220, xp: 440, itemId: null },
    dialogueStart: [
      { speaker: 'Forge Sentinel Kael', text: "The mountain breathes again. I watched the ash settle for the first time in months the day you left." },
      { speaker: 'Forge Sentinel Kael', text: "Something has emerged at the Volcano Core. I've only ever seen drawings of it — the Infernos. The mountain's original fire." },
      { speaker: 'Forge Sentinel Kael', text: "It was sealed inside the mountain by the corruption before anyone alive can remember. It's out now. And it's waiting." },
      { speaker: 'Forge Sentinel Kael', text: "Don't approach it like a fight. Just stand still. Let it decide." },
    ],
    dialogueComplete: [
      { speaker: 'Forge Sentinel Kael', text: "The summit stopped glowing the moment it bonded with you. Peaceful. Like it used to be." },
      { speaker: 'Forge Sentinel Kael', text: "You carry the mountain's fire now. Keep moving. The Oracle said Gareth has been holding the Keep alone." },
    ],
  },

  plant_legend: {
    id: 'plant_legend', region: 'plant',
    title: 'The Worldtree Calls',
    npc: 'Grove Speaker Sylwen',
    prerequisite: 'fire_legend',
    objective: { type: 'catch_species', speciesId: 'worldtree', label: 'Bond with the Worldtree at the Root Throne' },
    reward: { gold: 240, xp: 480, itemId: null },
    dialogueStart: [
      { speaker: 'Grove Speaker Sylwen', text: "The forest is singing. Have you noticed? It started when the last shard released." },
      { speaker: 'Grove Speaker Sylwen', text: "The Worldtree has returned to the Root Throne. The oldest living thing in this region — maybe in all regions. It predates the shards." },
      { speaker: 'Grove Speaker Sylwen', text: "The Root Sovereign consumed it. Buried it. We thought it was gone forever." },
      { speaker: 'Grove Speaker Sylwen', text: "It was not. Go to the Throne. Walk slowly. The Worldtree does not trust sudden movements." },
    ],
    dialogueComplete: [
      { speaker: 'Grove Speaker Sylwen', text: "Every tree in the Thornwood just leafed simultaneously. I have never seen that before." },
      { speaker: 'Grove Speaker Sylwen', text: "The forest recognises what you carry now. Go carefully, traveller. The Outpost is where this ends." },
    ],
  },

  lightning_legend: {
    id: 'lightning_legend', region: 'lightning',
    title: 'The Stormlord Returns',
    npc: 'Storm Watcher Thorn',
    prerequisite: 'plant_legend',
    objective: { type: 'catch_species', speciesId: 'stormlord', label: 'Bond with the Stormlord at Tempest Peak' },
    reward: { gold: 260, xp: 520, itemId: null },
    dialogueStart: [
      { speaker: 'Storm Watcher Thorn', text: "Every instrument I have is going haywire. The charge at Tempest Peak is unlike anything I've measured." },
      { speaker: 'Storm Watcher Thorn', text: "The Stormlord is there. The living storm — the creature that the Tempest Lord was corrupted from, before that. Its source." },
      { speaker: 'Storm Watcher Thorn', text: "It arrived the moment the last shard broke. It's been circling the peak for hours, looking for something." },
      { speaker: 'Storm Watcher Thorn', text: "I think it's looking for you. Go up there." },
    ],
    dialogueComplete: [
      { speaker: 'Storm Watcher Thorn', text: "The ridge went quiet. Thirty years of constant storm, and now — quiet. I don't know whether to cry or panic." },
      { speaker: 'Storm Watcher Thorn', text: "You're carrying the storm now. Whatever is in the Keep should be afraid of what's coming." },
    ],
  },

  glow_legend: {
    id: 'glow_legend', region: 'glow',
    title: 'Solaris Emerges',
    npc: 'Luminary Vex',
    prerequisite: 'lightning_legend',
    objective: { type: 'catch_species', speciesId: 'solaris', label: 'Bond with Solaris in the Void Chamber' },
    reward: { gold: 280, xp: 560, itemId: null },
    dialogueStart: [
      { speaker: 'Luminary Vex', text: "The Void Chamber is lit. Truly lit — not the erasure light, but something warm and real." },
      { speaker: 'Luminary Vex', text: "Solaris. I have read about it. The first light — the creature the Glow Shard was seeded from, aeons ago." },
      { speaker: 'Luminary Vex', text: "It was consumed entirely by the Radiant Tyrant. Absorbed, not destroyed. When you defeated the Tyrant, you freed it." },
      { speaker: 'Luminary Vex', text: "It is waiting in the Chamber. It will recognise someone carrying six other legendary bonds. Go. Carefully — it has been in the dark for a very long time." },
    ],
    dialogueComplete: [
      { speaker: 'Luminary Vex', text: "The Depths are fully illuminated for the first time in recorded history. It is extraordinary." },
      { speaker: 'Luminary Vex', text: "You carry seven legendary bonds now. The Unbound will know what is coming. Do not delay." },
    ],
  },

  ice_legend: {
    id: 'ice_legend', region: 'ice',
    title: 'Absolutus Thaws',
    npc: 'Frost Hermit Yara',
    prerequisite: 'glow_legend',
    objective: { type: 'catch_species', speciesId: 'absolutus', label: 'Bond with Absolutus at the Glacial Tomb' },
    reward: { gold: 300, xp: 600, itemId: null },
    dialogueStart: [
      { speaker: 'Frost Hermit Yara', text: "Something is melting at the Glacial Tomb. Controlled melting — a chamber opening, not a collapse." },
      { speaker: 'Frost Hermit Yara', text: "Absolutus. The absolute cold. The creature that existed before winter had a name." },
      { speaker: 'Frost Hermit Yara', text: "It has been encased in the deepest ice since the age before the shards. The Glacial Lich was feeding on it — drawing power from it without realising what it held." },
      { speaker: 'Frost Hermit Yara', text: "Now it is free. Go to the Tomb. You will feel the cold drop ten degrees when it senses you. Stand still. Do not flinch." },
    ],
    dialogueComplete: [
      { speaker: 'Frost Hermit Yara', text: "The tundra has stilled. Not the dead stillness of corruption — the stillness of something watching over it." },
      { speaker: 'Frost Hermit Yara', text: "You have them all but one. Go to the Crags. The Colossrock is waiting." },
    ],
  },

  rock_legend: {
    id: 'rock_legend', region: 'rock',
    title: 'The Colossrock Rises',
    npc: 'Stone Oracle',
    prerequisite: 'ice_legend',
    objective: { type: 'catch_species', speciesId: 'colossrock', label: 'Bond with the Colossrock at the Ancient Citadel' },
    reward: { gold: 320, xp: 640, itemId: null },
    dialogueStart: [
      { speaker: 'Stone Oracle', text: "You have returned. Seven bonds. Extraordinary." },
      { speaker: 'Stone Oracle', text: "The Colossrock stirs at the Citadel. The first of the stone creatures — it predates The Ancient One. Predates me." },
      { speaker: 'Stone Oracle', text: "It watched the corruption take this region from beneath the mountain. It could not act. The Prime Shard's darkness pinned it." },
      { speaker: 'Stone Oracle', text: "The shard is free. So is the Colossrock. Go to the Citadel. Eight bonds, and The Unbound will have nothing left to hide behind." },
    ],
    dialogueComplete: [
      { speaker: 'Stone Oracle', text: "Eight. You carry all eight." },
      { speaker: 'Stone Oracle', text: "The Unbound can feel it. Every legendary bond you carry weakens its grip on the physical world." },
      { speaker: 'Stone Oracle', text: "Go back to the Verdant Outpost. Go to Elder's Keep. Gareth has held the door for as long as he can." },
      { speaker: 'Stone Oracle', text: "End this." },
    ],
  },

  // ─── BASE FINAL BOSS ──────────────────────────────────────────────────────
  base_m3: {
    id: 'base_m3', region: 'base',
    title: 'The Unbound',
    npc: 'Elder Warden Gareth',
    prerequisite: 'rock_legend',
    objective: { type: 'defeat_boss', encounterId: 'boss_unbound', label: 'Defeat The Unbound at Elder\'s Keep' },
    reward: { gold: 1000, xp: 2000, itemId: 'war_crown' },
    dialogueStart: [
      { speaker: 'Elder Warden Gareth', text: "You are here. And you have them — I can feel the legendary bonds from here. The air around you is extraordinary." },
      { speaker: 'Elder Warden Gareth', text: "The Keep. It has been sealed for forty-three days. I have been holding the door with every seal I know and it has not been enough. Things push back from inside." },
      { speaker: 'Elder Warden Gareth', text: "The Unbound is not a creature. It is a force — older than the shards, older than the regions. It uses corruption as a body. It was wearing the seven guardians like armour." },
      { speaker: 'Elder Warden Gareth', text: "Without them, it must fight as itself. And with eight legendary bonds..." },
      { speaker: 'Elder Warden Gareth', text: "Go. I will break the seals from out here. Whatever happens — do not let it leave the Keep." },
    ],
    dialogueComplete: [
      { speaker: 'Elder Warden Gareth', text: "..." },
      { speaker: 'Elder Warden Gareth', text: "The light in the windows. It's gone back to normal." },
      { speaker: 'Elder Warden Gareth', text: "Is it — is it over?" },
      { speaker: 'Elder Warden Gareth', text: "I have been a warden for sixty years. I have never seen anything like what you just walked into. And out of." },
      { speaker: 'Elder Warden Gareth', text: "The eight shards are free. The regions will heal. The creatures will return to what they were." },
      { speaker: 'Elder Warden Gareth', text: "I don't have words for what you've done. I'm not sure words exist for it." },
      { speaker: 'Elder Warden Gareth', text: "Rest. You have earned more than rest. But rest is a good start." },
    ],
  },
};

// Ordered mission IDs per region
export const REGION_MISSIONS = {
  base:      ['base_m1',      'base_m2',      'base_m3'],
  water:     ['water_m1',     'water_m2',     'water_m3',     'water_legend'],
  fire:      ['fire_m1',      'fire_m2',      'fire_m3',      'fire_legend'],
  plant:     ['plant_m1',     'plant_m2',     'plant_m3',     'plant_legend'],
  lightning: ['lightning_m1', 'lightning_m2', 'lightning_m3', 'lightning_legend'],
  glow:      ['glow_m1',      'glow_m2',      'glow_m3',      'glow_legend'],
  ice:       ['ice_m1',       'ice_m2',       'ice_m3',       'ice_legend'],
  rock:      ['rock_m1',      'rock_m2',      'rock_m3',      'rock_legend'],
};
