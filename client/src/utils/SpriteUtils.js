import { PET_SPECIES } from '../data/pets.js';

// ─── Rarity-based size scale ──────────────────────────────────────────────────
const RARITY_SCALE = {
  common: 0.80, uncommon: 0.95, rare: 1.10, very_rare: 1.28, legendary: 1.50,
};
export function speciesTierScale(speciesId) {
  const r = PET_SPECIES[speciesId]?.rarity;
  return RARITY_SCALE[r] ?? 1.0;
}

// ─── Color palettes per type ──────────────────────────────────────────────────
export const TYPE_PALETTES = {
  water:     { body: 0x2277cc, belly: 0x55aaee, accent: 0x88ddff, dark: 0x0d4488, eye: 0x001133 },
  fire:      { body: 0xcc3300, belly: 0xff7722, accent: 0xffcc00, dark: 0x771100, eye: 0x220000 },
  plant:     { body: 0x227733, belly: 0x55bb44, accent: 0xaade44, dark: 0x0d4422, eye: 0x001100 },
  lightning: { body: 0xbbaa00, belly: 0xffee44, accent: 0xffffff, dark: 0x665500, eye: 0x221100 },
  glow:      { body: 0x7722aa, belly: 0xaa55dd, accent: 0xddaaff, dark: 0x440077, eye: 0xffeeff },
  ice:       { body: 0x3399bb, belly: 0x88ccee, accent: 0xddeeff, dark: 0x1a5566, eye: 0x002244 },
  rock:      { body: 0x776655, belly: 0xaa9977, accent: 0xccbbaa, dark: 0x332211, eye: 0x110800 },
};

// ─── Attack particle colors per type ─────────────────────────────────────────
export const TYPE_PARTICLE_COLORS = {
  water:     [0x44aaff, 0x88ccff, 0xaaddff],
  fire:      [0xff5500, 0xff9933, 0xffcc00],
  plant:     [0x44dd44, 0xaaee44, 0xddff88],
  lightning: [0xffee00, 0xffffff, 0xffdd44],
  glow:      [0xcc88ff, 0xeeaaff, 0xffffff],
  ice:       [0x88ddff, 0xaaeeff, 0xddeeff],
  rock:      [0xaa8866, 0xccaa88, 0xddccbb],
  null:      [0xaabbff, 0xccddff, 0xffffff],
};

// ─── Art variant lookup ───────────────────────────────────────────────────────
// [shapeIndex (0-4), colorVariant (0-2)]
// Original species are explicitly mapped; new species use a hash-based fallback.
const SPECIES_ART = {
  // Water
  frog:[0,0], tadpole:[0,1], droplet:[0,2], splasher:[0,0], rippler:[2,0], minnow:[1,0], bubblet:[2,1],
  tidepup:[0,1], wavecub:[2,2], coralite:[4,0], finling:[1,1], aqualin:[3,0],
  bubblefin:[1,0], torrenth:[3,0], deepscale:[4,1], hydrox:[1,2],
  tidemaster:[3,1], abyssling:[4,2], krakelet:[3,2],
  leviathan:[3,2],
  // Fire
  ember:[0,0], flicker:[0,1], cinder:[0,2], ignis:[0,0], scorch:[0,1], flameling:[0,2], charlet:[4,0],
  cindercub:[0,1], volkin:[2,0], burnpaw:[0,2], smoulder:[3,0], pyrite:[0,1],
  ashwing:[1,0], infernus:[2,1], blazeclaw:[0,2], scaldrix:[1,1],
  pyrarch:[2,2], flamelord:[1,1], magmataur:[3,1],
  infernos:[2,2],
  // Plant
  sprout:[0,0], seedling:[0,1], leaflet:[0,0], mosscub:[0,2], sprig:[0,1], verdling:[4,0], greenlet:[0,0],
  thornback:[0,1], vineling:[3,0], fernpaw:[0,2], briarling:[4,1], corolling:[3,1],
  bloomoth:[1,0], overgrowth:[2,0], thickethorn:[4,1], floralynx:[3,2],
  arbormight:[2,1], sylvantis:[2,2], rootlord:[3,1],
  worldtree:[2,2],
  // Lightning
  spark:[0,0], zaplet:[0,1], crackle:[0,0], jolt:[0,2], zappet:[0,1], staticling:[3,0], buzzlet:[3,1],
  voltfang:[0,1], voltcub:[0,2], shockpaw:[2,0], stormlet:[3,0], boltling:[2,1],
  zapwing:[1,0], thunderkite:[1,1], stormhawk:[3,1], voltmane:[2,2],
  stormclaw:[2,1], galeforce:[1,1], tempestis:[3,2],
  stormlord:[1,2],
  // Glow
  shimmer:[0,0], glimlet:[0,1], radlet:[3,0], sparkling:[3,1], glowlet:[0,2], lumpling:[3,2], faeling:[4,0],
  lumimoth:[1,0], gleamling:[3,1], glowpup:[4,1], prisling:[3,0], aurafly:[4,2],
  glowcrab:[2,0], radiantor:[0,1], luminary:[3,2], prismatic:[4,1],
  stellarion:[3,2], glowlord:[4,2], radiance:[0,2],
  solaris:[3,2],
  // Ice
  frost:[0,0], snowlet:[0,1], iceling:[0,0], frostcub:[0,2], chillpup:[2,0], glacelet:[0,1], permaling:[4,0],
  snowpaw:[0,1], blizzardling:[0,2], frostfang:[2,1], icecub:[4,1], winterlet:[0,2],
  glaceling:[1,0], icethorn:[2,2], crystalfang:[1,1], polaris:[3,0],
  glaciodon:[1,1], winterlord:[3,1], cryogen:[4,2],
  absolutus:[1,2],
  // Rock
  pebble:[0,0], gravel:[0,1], cobble:[0,0], rocklet:[0,2], stoneling:[0,1], boulderkin:[2,0], geolet:[4,0],
  stoneback:[0,1], granit:[0,2], quarryling:[2,1], siltling:[4,1], sediment:[3,0],
  craghorn:[1,0], rockbastion:[2,1], geomancer:[3,1], tectonis:[1,1],
  monolith:[2,2], obelisk:[3,2], terrafist:[4,1],
  colossrock:[1,2],
};

function strHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getArtVariant(speciesId) {
  if (SPECIES_ART[speciesId]) return SPECIES_ART[speciesId];
  const h = strHash(speciesId);
  return [h % 5, (h >> 4) % 3];
}

// ─── Public draw functions ────────────────────────────────────────────────────
export function drawCreature(g, type, speciesId, faceLeft) {
  const [shape, colorV] = getArtVariant(speciesId);
  switch (type) {
    case 'water':     drawWater(g, shape, colorV, faceLeft);     break;
    case 'fire':      drawFire(g, shape, colorV, faceLeft);      break;
    case 'plant':     drawPlant(g, shape, colorV, faceLeft);     break;
    case 'lightning': drawLightning(g, shape, colorV, faceLeft); break;
    case 'glow':      drawGlow(g, shape, colorV, faceLeft);      break;
    case 'ice':       drawIce(g, shape, colorV, faceLeft);       break;
    case 'rock':      drawRock(g, shape, colorV, faceLeft);      break;
    default:          drawMage(g, faceLeft, false);               break;
  }
}
export function drawPlayerMage(g, faceLeft) { drawMage(g, faceLeft, false); }
export function drawEnemyMage(g, faceLeft)  { drawMage(g, faceLeft, true);  }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function px(g, col, x, y, w, h)    { g.fillStyle(col, 1); g.fillRect(x, y, w, h); }
function circ(g, col, x, y, r)     { g.fillStyle(col, 1); g.fillCircle(x, y, r); }
function ellip(g, col, x, y, w, h) { g.fillStyle(col, 1); g.fillEllipse(x, y, w, h); }
function tri(g, col, x1,y1,x2,y2,x3,y3) {
  g.fillStyle(col, 1); g.fillTriangle(x1,y1,x2,y2,x3,y3);
}
function eye(g, x, y, r, pupilDx) {
  circ(g, 0xffffff, x, y, r);
  circ(g, 0x111111, x + pupilDx, y, r * 0.55);
  circ(g, 0xffffff, x + pupilDx + r*0.2, y - r*0.25, r * 0.18);
}

// ─── WATER ────────────────────────────────────────────────────────────────────
function drawWater(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.water;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Fish / Bubblefin
    ellip(g, p.body,  0, -14, 52, 34);
    ellip(g, p.belly, 0, -12, 34, 20);
    tri(g, p.dark, d*24, -14,  d*40, -26,  d*40, -2);
    tri(g, p.dark, -d*4, -31,  d*4, -31,  0, -44);
    ellip(g, p.dark, -14, -8, 14, 7);
    ellip(g, p.dark,  14, -8, 14, 7);
    eye(g, d*14, -18, 7, d*2);
    circ(g, p.accent, d*-20, -32, 3);
    circ(g, p.accent, d*-26, -26, 2);
  } else if (shape === 2) {
    // Jellyfish — dome top, tentacles
    ellip(g, p.body,  0, -28, 44, 32);
    ellip(g, p.belly, 0, -26, 30, 20);
    circ(g, p.accent, 0, -30, 8);
    // Tentacles
    for (let i = 0; i < 6; i++) {
      const tx = -20 + i * 8;
      px(g, p.dark, tx, -12, 3, 14 + (i % 2)*6);
      circ(g, p.accent, tx+1, -1 - (i%2)*6, 2.5);
    }
    eye(g, d*8, -28, 4, d*1.5);
    eye(g, d*-4, -28, 3, d*1);
  } else if (shape === 3) {
    // Sea serpent / eel — sinuous body
    ellip(g, p.body,  0, -20, 26, 44);
    ellip(g, p.belly, 0, -16, 16, 34);
    // Head
    ellip(g, p.body, d*10, -38, 20, 16);
    eye(g, d*14, -38, 5, d*2);
    // Fin along back
    for (let i = 0; i < 5; i++) {
      tri(g, p.dark, -d*4, -32+i*6, -d*12, -38+i*6, -d*4, -26+i*6);
    }
    // Tail curl
    ellip(g, p.dark, d*-12, -4, 14, 8);
  } else if (shape === 4) {
    // Crab — wide flat body with claws
    ellip(g, p.body, 0, -14, 46, 24);
    ellip(g, p.belly,0, -12, 30, 16);
    // Big claws
    ellip(g, p.body, -d*28, -16, 18, 12);
    tri(g, p.dark, -d*34, -10, -d*38, -20, -d*22, -20);
    ellip(g, p.body,  d*28, -16, 18, 12);
    tri(g, p.dark,  d*34, -10,  d*38, -20,  d*22, -20);
    // Eye stalks
    px(g, p.dark, -7, -26, 3, 8); circ(g, p.accent, -5, -27, 4);
    px(g, p.dark,  5, -26, 3, 8); circ(g, p.accent,  7, -27, 4);
    circ(g, 0x001133, -5, -27, 2); circ(g, 0x001133, 7, -27, 2);
    // Legs
    for (let i = -1; i <= 1; i += 2) {
      px(g, p.dark, i*8, -6, 3, 8); px(g, p.dark, i*14, -4, 3, 6);
    }
  } else {
    // Shape 0 — Frog / blob
    const w = colorV === 1 ? 44 : 38;
    ellip(g, p.body, 0, -18, w, 32);
    ellip(g, p.belly, 0, -14, w*0.6, 20);
    const ex = d * (w * 0.28);
    circ(g, p.body, ex, -32, 8);
    eye(g, ex, -32, 5.5, d*1.5);
    ellip(g, p.dark, -d*20, -20, 10, 18);
    ellip(g, p.body, -14, -2, 18, 9);
    ellip(g, p.body,  14, -2, 18, 9);
    px(g, p.dark, -20, 0, 3, 3); px(g, p.dark, -13, 0, 3, 3); px(g, p.dark, -6, 0, 3, 3);
    px(g, p.dark,  8, 0, 3, 3);  px(g, p.dark, 15, 0, 3, 3);  px(g, p.dark, 22, 0, 3, 3);
    circ(g, p.dark, d*4, -22, 3); circ(g, p.dark, d*-4, -16, 2);
  }
}

// ─── FIRE ─────────────────────────────────────────────────────────────────────
function drawFire(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.fire;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Phoenix / Ashwing
    ellip(g, p.body, 0, -18, 26, 40);
    ellip(g, p.belly, 0, -14, 16, 28);
    tri(g, p.dark, -d*12, -24, -d*40, -42, -d*30, -10);
    tri(g, p.accent, -d*12, -24, -d*36, -38, -d*26, -10);
    tri(g, p.dark,    d*12, -24,  d*40, -42,  d*30, -10);
    tri(g, p.accent,  d*12, -24,  d*36, -38,  d*26, -10);
    tri(g, p.accent, -6, -2, 6, -2, 0, 16);
    tri(g, p.accent, -8, -34, 0, -50, 8, -34);
    circ(g, p.body, 0, -32, 11);
    eye(g, d*4, -33, 4, d*1.5);
    tri(g, p.dark, -8, -4, -12, 2, -4, 2);
    tri(g, p.dark,  8, -4,  12, 2,  4, 2);
  } else if (shape === 2) {
    // Large dragon — wide body, horns, fierce
    ellip(g, p.body, 0, -16, 44, 34);
    ellip(g, p.belly, 0, -12, 28, 22);
    // Horns
    tri(g, p.dark, d*6, -34, d*10, -34, d*8, -48);
    tri(g, p.dark, d*14, -32, d*18, -32, d*16, -44);
    // Head
    ellip(g, p.body, d*14, -28, 24, 18);
    eye(g, d*18, -28, 5, d*2);
    // Flame breath
    tri(g, p.accent, d*22, -26, d*38, -20, d*22, -14);
    tri(g, p.belly,  d*24, -24, d*36, -19, d*24, -15);
    // Wings
    tri(g, p.dark, -d*14, -26, -d*40, -38, -d*32, -12);
    tri(g, p.accent,-d*14, -26, -d*36, -34, -d*28, -12);
    // Tail
    tri(g, p.dark, -d*20, -8, -d*36, -2, -d*24, -20);
    // Claws
    tri(g, p.dark, -14, -4, -20, 4, -10, 4);
    tri(g, p.dark,  14, -4,  20, 4,  10, 4);
  } else if (shape === 3) {
    // Salamander / newt — long body with spots
    ellip(g, p.body, 0, -16, 38, 26);
    ellip(g, p.belly, 0, -12, 24, 18);
    // Long tail
    ellip(g, p.dark, -d*24, -10, 18, 8);
    ellip(g, p.dark, -d*38, -6, 12, 6);
    // Head
    ellip(g, p.body, d*16, -20, 20, 16);
    eye(g, d*20, -20, 4.5, d*1.5);
    // Spots
    circ(g, p.accent, -8, -20, 4); circ(g, p.accent, 4, -14, 3); circ(g, p.accent, -2, -22, 2.5);
    // Legs
    px(g, p.body, -14, -4, 8, 5); px(g, p.body, 6, -4, 8, 5);
    // Fire trail
    tri(g, p.accent, -d*38, -10, -d*48, -4, -d*44, -18);
  } else if (shape === 4) {
    // Lava slug — pudgy, cracked lava surface
    ellip(g, p.body, 0, -14, 42, 28);
    ellip(g, p.belly, 0, -10, 28, 18);
    // Lava cracks (glowing lines)
    for (let i = 0; i < 4; i++) {
      const cx = -14 + i*9, cy = -14 + (i%2)*6;
      px(g, p.accent, cx, cy, 2, 8);
    }
    // Head bump
    circ(g, p.body, d*16, -22, 12);
    eye(g, d*18, -22, 4, d*1.5);
    // Molten drip
    circ(g, p.accent, d*-20, -6, 4); circ(g, p.belly, d*-20, -2, 3);
    // Stumpy legs
    px(g, p.dark, -16, -4, 10, 6); px(g, p.dark, 8, -4, 10, 6);
  } else {
    // Shape 0 — Ember / Cindercub dragon-lizard
    const bw = colorV === 1 ? 40 : 34;
    ellip(g, p.body, 0, -16, bw, 30);
    ellip(g, p.belly, 0, -12, bw*0.55, 20);
    tri(g, p.accent, -8, -30, 0, -46, 4, -30);
    tri(g, p.belly, -4, -30, 4, -44, 8, -30);
    tri(g, p.accent, 6, -28, 14,-40, 16, -28);
    tri(g, p.dark, -d*18, -12, -d*30, -6, -d*22, -22);
    tri(g, p.belly,-d*22, -6, -d*38, -2, -d*30, -16);
    ellip(g, p.body, d*10, -26, 20, 18);
    eye(g, d*14, -26, 5, d*2);
    tri(g, p.dark, -12, -4, -18, 4, -8, 4);
    tri(g, p.dark,  12, -4,  18, 4,  8, 4);
    circ(g, p.dark, d*2, -20, 2.5); circ(g, p.dark, d*-4, -14, 2);
  }
}

// ─── PLANT ────────────────────────────────────────────────────────────────────
function drawPlant(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.plant;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Butterfly / Bloomoth
    ellip(g, p.dark,  -22, -28, 26, 36); ellip(g, p.dark,   22, -28, 26, 36);
    ellip(g, p.body,  -22, -28, 22, 32); ellip(g, p.body,   22, -28, 22, 32);
    circ(g, p.accent, -22, -28, 6);      circ(g, p.accent,  22, -28, 6);
    circ(g, p.belly,  -16, -18, 3);      circ(g, p.belly,   16, -18, 3);
    ellip(g, p.dark,  0, -16, 14, 32);   ellip(g, p.belly, 0, -16, 10, 26);
    px(g, p.dark, -d*3, -34, 2, 10); px(g, p.dark, d*3, -34, 2, 10);
    circ(g, p.accent, -d*3, -42, 3); circ(g, p.accent, d*3, -42, 3);
    eye(g, d*3, -22, 4, d*1.5);
  } else if (shape === 2) {
    // Tree golem — rectangular stone body with branch arms
    px(g, p.dark, -14, -36, 28, 38);
    px(g, p.body, -12, -34, 24, 34);
    // Bark texture
    for (let i = 0; i < 4; i++) px(g, p.dark, -10+i*7, -30+i*4, 4, 6);
    // Branch arms
    tri(g, p.dark, -14, -26, -36, -36, -30, -18);
    tri(g, p.accent,-14, -26, -32, -32, -26, -18);
    tri(g, p.dark,  14, -26,  36, -36,  30, -18);
    tri(g, p.accent, 14, -26,  32, -32,  26, -18);
    // Leaf canopy
    circ(g, p.body, 0, -42, 18); circ(g, p.body, -14, -38, 12); circ(g, p.body, 14, -38, 12);
    circ(g, p.accent, 0, -44, 8);
    // Eyes
    eye(g, d*5, -24, 4, d*1.5);
    // Root feet
    tri(g, p.dark, -12, 0, -20, 8, -4, 8); tri(g, p.dark, 12, 0, 20, 8, 4, 8);
  } else if (shape === 3) {
    // Vine worm — segmented caterpillar body
    for (let i = 0; i < 4; i++) {
      const cx = -d*12 + d*i*8, cy = -10 - (i % 2)*4;
      ellip(g, i===0 ? p.belly : p.body, cx, cy, 16, 14);
    }
    // Head
    circ(g, p.belly, d*12, -18, 12);
    eye(g, d*14, -18, 4, d*1.5);
    // Leaf antennae
    px(g, p.dark, d*10, -28, 2, 8);
    ellip(g, p.accent, d*11, -34, 8, 5);
    // Leaf markings
    circ(g, p.accent, -d*4, -10, 3); circ(g, p.accent, -d*12, -8, 2.5);
  } else if (shape === 4) {
    // Cactus creature — barrel body with spines and flower
    ellip(g, p.body, 0, -18, 32, 38);
    ellip(g, p.belly, 0, -14, 20, 26);
    // Spines
    for (let i = -3; i <= 3; i++) {
      px(g, p.dark, i*4-1, -34+Math.abs(i)*2, 2, 6);
    }
    px(g, p.dark, -18, -18, 6, 2); px(g, p.dark, 14, -16, 6, 2);
    // Flower on top
    for (let i = 0; i < 5; i++) {
      const angle = (i/5)*Math.PI*2;
      circ(g, p.accent, Math.cos(angle)*7, -38+Math.sin(angle)*5, 4);
    }
    circ(g, p.belly, 0, -38, 4);
    // Eyes
    eye(g, d*7, -22, 4, d*1.5);
    // Stubby arms
    ellip(g, p.body, -20, -16, 10, 8); ellip(g, p.body, 20, -16, 10, 8);
  } else {
    // Shape 0 — Sprout / Thornback blob
    const bw = colorV === 1 ? 42 : 34;
    ellip(g, p.body,  0, -18, bw, 32);
    ellip(g, p.belly, 0, -14, bw*0.55, 22);
    tri(g, p.body, -bw*0.4-4,-26, -bw*0.4+4,-26, -bw*0.4,-42);
    tri(g, p.dark, -bw*0.4-2,-28, -bw*0.4+2,-28, -bw*0.4,-40);
    tri(g, p.body,  bw*0.4-4,-26,  bw*0.4+4,-26,  bw*0.4,-42);
    tri(g, p.dark,  bw*0.4-2,-28,  bw*0.4+2,-28,  bw*0.4,-40);
    if (colorV === 1) {
      for (let i = -12; i <= 12; i += 8) tri(g, p.dark, i-3,-34, i+3,-34, i,-44);
    }
    px(g, p.dark, -d*18,-16, 4, 3); px(g, p.dark, -d*24,-12, 4, 3); px(g, p.dark, -d*28,-8, 4, 3);
    ellip(g, p.accent, -d*30, -6, 10, 6);
    eye(g, d*8, -20, 5, d*1.5);
    px(g, p.body, -10, -4, 8, 6); px(g, p.body, 6, -4, 8, 6);
  }
}

// ─── LIGHTNING ────────────────────────────────────────────────────────────────
function drawLightning(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.lightning;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Hawk / Zapwing
    ellip(g, p.body, 0, -18, 22, 38);
    ellip(g, p.belly, 0, -16, 14, 28);
    tri(g, p.dark, -d*10,-24, -d*44,-34, -d*36,-12);
    tri(g, p.body, -d*10,-24, -d*40,-30, -d*32,-10);
    tri(g, p.dark,  d*10,-24,  d*44,-34,  d*36,-12);
    tri(g, p.body,  d*10,-24,  d*40,-30,  d*32,-10);
    tri(g, p.dark, -6,-4, 6,-4, 0,12);
    circ(g, p.body, d*6, -30, 10);
    tri(g, p.dark, d*12,-32, d*24,-28, d*14,-26);
    eye(g, d*8, -31, 4, d*1.5);
    circ(g, p.accent, d*8, -31, 2);
    tri(g, p.accent, 0,-26, 4,-20, -4,-20);
    tri(g, p.accent, 2,-20, 6,-14, -2,-14);
  } else if (shape === 2) {
    // Electric eel — long sinuous body
    ellip(g, p.body, 0, -18, 22, 42);
    ellip(g, p.belly, 0, -14, 14, 32);
    // Head
    ellip(g, p.body, d*10, -36, 18, 14);
    eye(g, d*13, -36, 4, d*1.5);
    // Electric sparks along body
    for (let i = 0; i < 5; i++) {
      const sx = -d*6 + i*d*2, sy = -26 + i*6;
      tri(g, p.accent, sx, sy, sx+d*6, sy-4, sx+d*4, sy+4);
    }
    // Fin
    tri(g, p.dark, -d*8, -30, -d*18, -38, -d*8, -22);
    // Tail crackle
    tri(g, p.accent, d*-10, -2, d*-18, 4, d*-14, -8);
  } else if (shape === 3) {
    // Storm cloud puff — round fluffy body
    // Cloud puff body
    circ(g, p.body,  0, -22, 18);
    circ(g, p.body, -14, -18, 14);
    circ(g, p.body,  14, -18, 14);
    circ(g, p.belly, -8, -20, 10);
    circ(g, p.belly,  8, -20, 10);
    circ(g, p.belly,  0, -26, 10);
    // Lightning bolt tail
    tri(g, p.accent, d*-16, -8, d*-8, -16, d*-12, -4);
    tri(g, p.accent, d*-12, -4, d*-4, -12, d*-8, 2);
    // Eyes
    eye(g, d*6, -22, 4.5, d*1.5);
    eye(g, d*-4, -22, 3.5, d*1);
  } else if (shape === 4) {
    // Thunder fish — wide flat fish with electric fins
    ellip(g, p.body,  0, -14, 48, 26);
    ellip(g, p.belly, 0, -12, 30, 16);
    // Electric dorsal fin
    tri(g, p.accent, -8, -27, 0, -40, 8, -27);
    tri(g, p.belly, -4, -27, 0, -38, 4, -27);
    // Tail
    tri(g, p.dark, d*22, -14, d*36, -22, d*36, -6);
    // Pectoral fins
    ellip(g, p.dark, 0, -6, 18, 8);
    // Whiskers
    px(g, p.dark, d*18, -16, 12, 2); px(g, p.dark, d*18, -12, 10, 2);
    eye(g, d*12, -16, 5, d*2);
    circ(g, p.accent, d*12, -16, 2.5);
  } else {
    // Shape 0 — Mouse / Spark / Voltfang
    const bw = colorV === 1 ? 38 : 30;
    ellip(g, p.body, 0, -18, bw, 28);
    ellip(g, p.belly, 0, -14, bw*0.55, 20);
    tri(g, p.body, -bw*0.35,-28, -bw*0.35+8,-28, -bw*0.35+4,-42);
    tri(g, p.accent,-bw*0.35+2,-30, -bw*0.35+6,-30, -bw*0.35+4,-40);
    tri(g, p.body, bw*0.35-8,-28, bw*0.35,-28, bw*0.35-4,-42);
    tri(g, p.accent,bw*0.35-6,-30, bw*0.35-2,-30, bw*0.35-4,-40);
    tri(g, p.accent, d*8,-22, d*12,-16, d*6,-16);
    tri(g, p.accent, d*6,-16, d*10,-10, d*4,-10);
    px(g, p.body, -d*16,-14, 5, 4);
    tri(g, p.accent, -d*18,-14, -d*26,-10, -d*20,-8);
    eye(g, d*8, -22, 5, d*2);
    px(g, p.body, -10,-4, 8, 5); px(g, p.body, 6,-4, 8, 5);
  }
}

// ─── GLOW ─────────────────────────────────────────────────────────────────────
function drawGlow(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.glow;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Moth / Lumimoth
    ellip(g, p.dark,  0, -16, 14, 32);
    ellip(g, p.belly, 0, -16, 10, 26);
    ellip(g, p.dark, -22, -28, 26, 36); ellip(g, p.dark,  22, -28, 26, 36);
    ellip(g, p.body, -22, -28, 22, 32); ellip(g, p.body,  22, -28, 22, 32);
    circ(g, p.accent, -22, -28, 6);     circ(g, p.accent,  22, -28, 6);
    circ(g, p.belly,  -16, -18, 3);     circ(g, p.belly,   16, -18, 3);
    px(g, p.dark, -d*3, -34, 2, 10); px(g, p.dark, d*3, -34, 2, 10);
    circ(g, p.accent, -d*3, -42, 3); circ(g, p.accent, d*3, -42, 3);
    eye(g, d*3, -22, 4, d*1.5);
  } else if (shape === 2) {
    // Glowcrab
    ellip(g, p.body, 0, -16, 44, 28);
    ellip(g, p.belly, 0, -16, 30, 18);
    circ(g, p.accent, 0, -16, 8); circ(g, p.belly, 0, -16, 4);
    ellip(g, p.body, -d*24, -18, 14, 10);
    tri(g, p.dark, -d*30,-14, -d*34,-22, -d*20,-22);
    ellip(g, p.body,  d*24, -18, 14, 10);
    tri(g, p.dark,  d*30,-14,  d*34,-22,  d*20,-22);
    px(g, p.dark, -8,-28, 3, 8); px(g, p.dark, 6,-28, 3, 8);
    circ(g, p.accent, -6,-30, 5); circ(g, p.accent, 8,-30, 5);
    circ(g, p.belly, -6,-30, 2.5); circ(g, p.belly, 8,-30, 2.5);
    for (let i = -1; i <= 1; i += 2) { px(g, p.dark, i*6,-6, 3, 8); px(g, p.dark, i*14,-4, 3, 6); }
  } else if (shape === 3) {
    // Glowing orb / Stellarion — pulsing sphere with light rings
    circ(g, p.dark,   0, -24, 26);
    circ(g, p.body,   0, -24, 20);
    circ(g, p.belly,  0, -24, 14);
    circ(g, p.accent, 0, -24, 8);
    circ(g, 0xffffff, 0, -24, 4);
    // Orbital rings
    ellip(g, p.dark,  0, -24, 50, 12);
    ellip(g, p.body,  0, -24, 46, 8);
    ellip(g, p.dark,  0, -24, 20, 50);
    ellip(g, p.body,  0, -24, 16, 46);
    // Light beams
    for (let i = 0; i < 6; i++) {
      const angle = (i/6)*Math.PI*2;
      const bx = Math.cos(angle)*22, by = Math.sin(angle)*22;
      circ(g, p.accent, bx, by-24, 3.5);
    }
  } else if (shape === 4) {
    // Lanternfish — deep-sea creature with glowing lure
    ellip(g, p.body,  0, -14, 36, 28);
    ellip(g, p.belly, 0, -12, 22, 18);
    // Big round eyes
    circ(g, p.accent, d*10, -20, 10); eye(g, d*10, -20, 7, d*2.5);
    // Glowing lure on head
    px(g, p.dark, d*18, -24, 3, 12);
    circ(g, p.accent, d*19, -34, 6);
    circ(g, 0xffffff, d*19, -34, 3);
    // Tail fin
    tri(g, p.dark, d*-18, -14, d*-32, -24, d*-32, -4);
    tri(g, p.body, d*-18, -14, d*-28, -20, d*-28, -8);
    // Fins
    ellip(g, p.dark, 0, -4, 16, 8);
  } else {
    // Shape 0 — Wisp / Shimmer
    const r = colorV === 1 ? 20 : 16;
    circ(g, p.dark,  0, -20, r+10);
    circ(g, p.body,  0, -20, r+4);
    circ(g, p.belly, 0, -20, r);
    circ(g, p.accent,0, -20, r-6);
    circ(g, 0xffffff,0, -20, r-12);
    if (colorV === 1) {
      ellip(g, p.body, -22, -26, 20, 30); ellip(g, p.body, 22, -26, 20, 30);
      circ(g, p.accent, -22, -26, 5);     circ(g, p.accent, 22, -26, 5);
    }
    for (let i = 0; i < 5; i++) {
      const angle = (i/5)*Math.PI;
      const tx = Math.cos(angle)*(r+4), ty = Math.sin(angle)*(r+4)-20;
      circ(g, p.dark, tx, ty+r*0.5, 3); circ(g, p.body, tx*0.6, ty*0.7+r*0.5, 2);
    }
    eye(g, d*6, -22, 4, d*1.5);
    eye(g, d*-4, -22, 3, d*1.5);
    circ(g, p.accent, d*6, -22, 2); circ(g, p.accent, d*-4, -22, 1.5);
  }
}

// ─── ICE ──────────────────────────────────────────────────────────────────────
function drawIce(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.ice;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Crystal elemental / Glaceling
    ellip(g, p.body, 0, -20, 46, 38);
    ellip(g, p.belly, 0, -18, 30, 26);
    tri(g, p.dark, -d*20,-30, -d*16,-46, -d*12,-30);
    tri(g, p.accent,-d*18,-30, -d*15,-44, -d*12,-30);
    tri(g, p.dark, -d*8,-32, -d*4,-48, -d*0,-32);
    tri(g, p.accent,-d*7,-32, -d*4,-46, -d*1,-32);
    tri(g, p.dark, -10,-34, 0,-50, 10,-34);
    tri(g, p.accent,-8,-34, 0,-48, 8,-34);
    circ(g, p.body, d*10,-26, 12);
    eye(g, d*13,-27, 5, d*2);
    circ(g, p.accent, d*13,-27, 2.5);
    ellip(g, p.dark, -14,-2, 18, 10); ellip(g, p.dark, 14,-2, 18, 10);
    px(g, p.accent, -1,-22, 2, 10); px(g, p.accent, -5,-18, 10, 2);
  } else if (shape === 2) {
    // Ice bear — stocky with ice crystals on back
    ellip(g, p.body, 0, -18, 44, 36);
    ellip(g, p.belly, 0, -14, 28, 24);
    // Round head
    circ(g, p.body, d*14, -32, 16);
    circ(g, p.belly, d*14, -32, 10);
    // Ears
    circ(g, p.dark, d*8, -44, 5); circ(g, p.body, d*8, -44, 3);
    circ(g, p.dark, d*20, -44, 5); circ(g, p.body, d*20, -44, 3);
    eye(g, d*16, -32, 5, d*2);
    // Ice crystals on back
    tri(g, p.accent, -14, -34, -10, -46, -6, -34);
    tri(g, p.dark,   -12, -34,  -10, -44, -8, -34);
    tri(g, p.accent,  -4, -36,  0, -48, 4, -36);
    // Paws
    ellip(g, p.dark, -18,-2, 20, 10); ellip(g, p.dark, 16,-2, 20, 10);
  } else if (shape === 3) {
    // Penguin — round body, ice tuxedo
    ellip(g, p.body, 0, -18, 30, 38);
    ellip(g, p.belly, 0, -14, 18, 28);
    // Tuxedo front
    ellip(g, p.accent, 0, -10, 12, 22);
    // Head
    circ(g, p.body, 0, -36, 14);
    circ(g, p.belly, 0, -36, 8);
    // Eyes
    eye(g, d*5, -37, 4, d*1.5);
    // Beak
    tri(g, 0xffaa00, d*10, -36, d*18, -34, d*10, -32);
    // Flipper wings
    ellip(g, p.dark, -20, -20, 12, 24); ellip(g, p.dark, 20, -20, 12, 24);
    // Ice crystal feet
    tri(g, p.accent, -8, 0, -14, 8, -2, 8); tri(g, p.accent, 8, 0, 14, 8, 2, 8);
  } else if (shape === 4) {
    // Arctic elk — four legs, ice antlers
    ellip(g, p.body, 0, -14, 34, 24);
    ellip(g, p.belly, 0, -10, 20, 16);
    // Neck + head
    px(g, p.body, d*10, -32, 12, 18);
    ellip(g, p.body, d*14, -40, 18, 14);
    eye(g, d*18, -40, 4, d*1.5);
    // Ice antlers
    px(g, p.accent, d*8, -48, 2, 10);
    tri(g, p.accent, d*6,-48, d*2,-40, d*4,-46); // left branch
    tri(g, p.accent, d*10,-48, d*14,-40, d*12,-46);
    // Legs
    px(g, p.dark, -14,-2, 6, 12); px(g, p.dark, -6,-2, 6, 12);
    px(g, p.dark,  6,-2, 6, 12);  px(g, p.dark, 14,-2, 6, 12);
    // Ice hooves
    px(g, p.accent, -15,8, 7, 4); px(g, p.accent, -7,8, 7, 4);
    px(g, p.accent, 5,8, 7, 4);   px(g, p.accent, 13,8, 7, 4);
  } else {
    // Shape 0 — Fox / Frost / Snowpaw
    const bw = colorV === 1 ? 38 : 30;
    ellip(g, p.body,  0, -18, bw, 28);
    ellip(g, p.belly, 0, -14, bw*0.6, 18);
    tri(g, p.dark, -bw*0.35-4,-28, -bw*0.35+4,-28, -bw*0.35,-44);
    tri(g, p.body, -bw*0.35-2,-30, -bw*0.35+2,-30, -bw*0.35,-42);
    tri(g, p.dark,  bw*0.35-4,-28,  bw*0.35+4,-28,  bw*0.35,-44);
    tri(g, p.body,  bw*0.35-2,-30,  bw*0.35+2,-30,  bw*0.35,-42);
    ellip(g, p.dark, -d*22,-14, 18, 14); ellip(g, p.belly,-d*22,-14, 12, 10);
    tri(g, p.accent, -4,-30, 0,-40, 4,-30); tri(g, p.dark, -3,-30, 0,-38, 3,-30);
    if (colorV === 1) tri(g, p.accent, 4,-28, 8,-38, 12,-28);
    eye(g, d*8,-22, 5, d*2);
    circ(g, p.accent, d*8,-22, 2.5); circ(g, p.dark, d*14,-19, 2.5);
    ellip(g, p.body, -12,-2, 14, 8); ellip(g, p.body, 12,-2, 14, 8);
  }
}

// ─── ROCK ─────────────────────────────────────────────────────────────────────
function drawRock(g, shape, colorV, faceLeft) {
  const p = TYPE_PALETTES.rock;
  const d = faceLeft ? -1 : 1;

  if (shape === 1) {
    // Rhino / Craghorn
    ellip(g, p.body, 0, -18, 50, 34);
    ellip(g, p.belly, 0, -14, 32, 22);
    px(g, p.dark, -24,-28, 12, 8); px(g, p.accent, -22,-30, 10, 6);
    px(g, p.dark, 10,-28, 14, 8);  px(g, p.accent, 12,-30, 10, 6);
    px(g, p.dark, -8,-30, 16, 8);  px(g, p.accent, -6,-32, 12, 6);
    tri(g, p.dark,   d*22,-28, d*24,-28, d*23,-44);
    tri(g, p.accent, d*22,-30, d*24,-30, d*23,-42);
    circ(g, p.body, d*20,-22, 14); circ(g, p.dark, d*22,-30, 4);
    eye(g, d*24,-24, 5, d*2);
    px(g, p.dark, -20,-4, 14, 8); px(g, p.dark, 8,-4, 14, 8);
    for (let i = 0; i < 4; i++) circ(g, p.dark, -12+i*8,-14, 2.5);
  } else if (shape === 2) {
    // Rock golem — boxy humanoid stone body
    px(g, p.dark, -16,-36, 32, 38);
    px(g, p.body, -14,-34, 28, 34);
    // Block head
    px(g, p.dark, -10,-50, 20, 16);
    px(g, p.body, -8,-48, 16, 12);
    // Eyes as glowing cracks
    px(g, p.accent, -6,-44, 4, 3); px(g, p.accent, 4,-44, 4, 3);
    // Stone arm blocks
    px(g, p.dark, -26,-30, 12, 22); px(g, p.accent, -24,-28, 10, 18);
    px(g, p.dark,  16,-30, 12, 22); px(g, p.accent,  18,-28, 10, 18);
    // Fist bumps
    px(g, p.dark, -28,-12, 14, 10); px(g, p.dark, 16,-12, 14, 10);
    // Rock texture cracks
    for (let i = 0; i < 3; i++) { px(g, p.dark, -10+i*9,-20+i*4, 2, 8); }
    // Slab feet
    px(g, p.dark, -18, 0, 16, 8); px(g, p.dark, 4, 0, 16, 8);
  } else if (shape === 3) {
    // Stone serpent — large snake with rock scales
    ellip(g, p.body, 0, -20, 22, 40);
    ellip(g, p.belly, 0, -14, 14, 30);
    // Scale pattern
    for (let i = 0; i < 5; i++) {
      const sy = -28 + i*8;
      circ(g, p.dark, -4, sy, 4); circ(g, p.dark, 4, sy+4, 4);
    }
    // Head with hood
    ellip(g, p.dark, d*14, -38, 28, 18);
    ellip(g, p.body, d*14, -38, 22, 14);
    eye(g, d*18, -38, 5, d*2);
    // Fangs
    tri(g, p.accent, d*18,-32, d*14,-32, d*16,-26);
    tri(g, p.accent, d*22,-32, d*18,-32, d*20,-26);
    // Coiled tail
    ellip(g, p.dark, d*-14, 0, 20, 10);
    ellip(g, p.body, d*-14, 0, 14, 6);
  } else if (shape === 4) {
    // Scorpion — compact body with raised stinger tail
    ellip(g, p.body, 0, -14, 36, 22);
    ellip(g, p.belly, 0, -10, 22, 14);
    // Head
    ellip(g, p.body, d*14, -18, 18, 14);
    eye(g, d*16, -18, 4, d*1.5); eye(g, d*20, -16, 3, d*1.5);
    // Pincers
    ellip(g, p.body, d*26, -22, 14, 10);
    tri(g, p.dark, d*30,-16, d*34,-24, d*20,-24);
    ellip(g, p.body, d*26, -10, 14, 10);
    tri(g, p.dark, d*30,-16, d*34,-8, d*20,-8);
    // Tail segments (raised high)
    px(g, p.dark, -d*18,-16, 8, 6);
    px(g, p.dark, -d*24,-24, 7, 6);
    px(g, p.dark, -d*28,-32, 6, 6);
    // Stinger
    tri(g, p.accent, -d*28,-38, -d*24,-38, -d*26,-28);
    // Legs
    for (let i = 0; i < 3; i++) {
      px(g, p.dark, -10+i*8,-4, 4, 8);
    }
  } else {
    // Shape 0 — Turtle / Pebble / Stoneback
    const bw = colorV === 1 ? 44 : 36;
    ellip(g, p.dark, 0,-20, bw, 28);
    ellip(g, p.body, 0,-20, bw-6, 24);
    circ(g, p.dark, 0,-22, 8);   circ(g, p.dark, -12,-18, 6); circ(g, p.dark, 12,-18, 6);
    circ(g, p.dark, -10,-28, 5); circ(g, p.dark, 10,-28, 5);
    circ(g, p.accent, 0,-22, 4); circ(g, p.accent,-12,-18, 3); circ(g, p.accent, 12,-18, 3);
    ellip(g, p.body, d*20,-26, 18, 16);
    circ(g, p.dark, d*24,-32, 4);
    eye(g, d*22,-26, 5, d*2);
    px(g, p.body, -bw/2-2,-8, 10, 10); px(g, p.body, bw/2-8,-8, 10, 10);
    px(g, p.body, -12,-2, 12, 8);      px(g, p.body,  6,-2, 12, 8);
  }
}

// ─── MAGE ─────────────────────────────────────────────────────────────────────
function drawMage(g, faceLeft, isEnemy) {
  const d = faceLeft ? -1 : 1;
  const robeCol   = isEnemy ? 0x4a1a3a : 0x1a2a6e;
  const accentCol = isEnemy ? 0xdd3366 : 0x4488ff;
  const skinCol   = 0xd4a574;
  const hairCol   = isEnemy ? 0xcc2244 : 0x2244aa;

  g.fillStyle(robeCol, 1);
  g.fillTriangle(-16, -2, 16, -2, 20, 10);
  px(g, robeCol, -14, -26, 28, 26);
  px(g, accentCol, -16, 6, 32, 4);
  px(g, accentCol, -14, -8, 28, 4);
  px(g, accentCol, d*-4, -22, 3, 14);
  const sx = d * 22;
  px(g, 0x8B6914, sx-1, -44, 3, 52);
  circ(g, accentCol, sx, -44, 6);
  circ(g, 0xffffff, sx, -44, 3);
  circ(g, accentCol, sx, -44, 1.5);
  px(g, robeCol, d*14, -20, 10, 6);
  tri(g, 0x0a0a22, -20, -26, d*-2, -26, -18, -14);
  tri(g, 0x0a0a22,  20, -26, d* 2, -26,  18, -14);
  circ(g, skinCol, 0, -34, 10);
  eye(g, d*4, -34, 3.5, d*1.5);
  px(g, 0x774433, d*2, -30, 5, 2);
  tri(g, robeCol, -12, -42, 12, -42, 0, -58);
  px(g, robeCol, -14, -44, 28, 6);
  px(g, accentCol, -14, -48, 28, 3);
  px(g, hairCol, -10, -42, 5, 4);
  px(g, hairCol,   6, -42, 5, 4);
  ellip(g, 0x00000044, 0, 10, 28, 8);
}
