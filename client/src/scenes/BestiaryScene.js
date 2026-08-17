import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import { PET_SPECIES, PET_PASSIVES, RARITY_COLORS, RARITY_LABELS } from '../data/pets.js';
import ApiClient from '../api/ApiClient.js';

const TYPE_COLOURS = {
  water: 0x1e6ea0, fire: 0xa03c1e, plant: 0x2e7a2e,
  lightning: 0xa09a1e, glow: 0x8a6ea0, ice: 0x4aa0a0,
  rock: 0x7a6040,
};

const BASE_SPECIES = Object.values(PET_SPECIES).filter(s => !s.isEvolution);
const EVO_SPECIES  = Object.values(PET_SPECIES).filter(s =>  s.isEvolution);

export default class BestiaryScene extends Phaser.Scene {
  constructor() { super('BestiaryScene'); }

  init(data) {
    this._playerData  = data.playerData  || null;
    this._returnScene = data.returnScene || 'MapScene';
    this._returnData  = data.returnData  || {};
    this._showEvos    = data.showEvos    || false;
  }

  async create() {
    const cx = GAME_WIDTH / 2;
    this._speciesList = this._showEvos ? EVO_SPECIES : BASE_SPECIES;

    // Compute world height for 140 species, 7 cols
    const COLS = 7, CARD_H = 86, GAP_Y = 6, GRID_TOP = 120;
    const rows = Math.ceil(this._speciesList.length / COLS);
    const worldH = GRID_TOP + rows * (CARD_H + GAP_Y) + 20;
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, worldH);

    // Background (tall, scrolls with world)
    this.add.rectangle(cx, worldH / 2, GAME_WIDTH, worldH, 0x08080f);
    const g = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.18));
      g.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, worldH), 1, 1);
    }

    // Header (fixed — scrollFactor 0)
    const strip = this.add.graphics().setScrollFactor(0);
    strip.fillStyle(0x1a1a3a, 0.97);
    strip.fillRect(0, 0, GAME_WIDTH, 110);
    strip.lineStyle(1, 0x445566, 0.5);
    strip.lineBetween(0, 110, GAME_WIDTH, 110);

    this.add.text(cx, 38, 'BESTIARY', {
      fontFamily: 'monospace', fontSize: '26px', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0);

    // Back (fixed)
    const back = this.add.text(16, 14, '< Back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#445566',
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    back.on('pointerover', () => back.setColor('#aabbff'));
    back.on('pointerout',  () => back.setColor('#445566'));
    back.on('pointerdown', () => this.scene.start(this._returnScene, this._returnData));

    // Load bestiary data
    this._seen   = new Set();
    this._caught = new Set();
    const charId = this._playerData?.id || localStorage.getItem('sab_char_id');
    try {
      const chars = await ApiClient.listCharacters();
      const me = chars.characters?.find(c => String(c.id) === String(charId));
      if (me) {
        try { JSON.parse(me.seen_species   || '[]').forEach(s => this._seen.add(s));   } catch {}
        try { JSON.parse(me.caught_species || '[]').forEach(s => this._caught.add(s)); } catch {}
      }
    } catch {}

    // Summary (fixed)
    const seenCount   = this._seen.size;
    const caughtCount = this._caught.size;
    const total       = BASE_SPECIES.length;
    this.add.text(cx, 72, `Seen: ${seenCount}/${total}   Caught: ${caughtCount}/${total}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#556677',
    }).setOrigin(0.5).setScrollFactor(0);

    // Toggle: Base / Evolutions
    const toggleLabel = this._showEvos ? '[ Show Base Pets ]' : '[ Show Evolutions ]';
    const toggleCol   = this._showEvos ? '#aabbff' : '#445566';
    const toggleBtn = this.add.text(GAME_WIDTH - 16, 72, toggleLabel, {
      fontFamily: 'monospace', fontSize: '11px', color: toggleCol,
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    toggleBtn.on('pointerover', () => toggleBtn.setColor('#aabbff'));
    toggleBtn.on('pointerout',  () => toggleBtn.setColor(toggleCol));
    toggleBtn.on('pointerdown', () => {
      this.scene.start('BestiaryScene', {
        playerData: this._playerData, returnScene: this._returnScene,
        returnData: this._returnData, showEvos: !this._showEvos,
      });
    });

    // Detail panel (fixed)
    this._detail = this._buildDetailPanel();

    // Grid (in world space — scrolls with camera)
    this._buildGrid();

    // Mouse wheel scrolling
    this.input.on('wheel', (_ptr, _objs, _dx, dy) => {
      const cam = this.cameras.main;
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy * 0.8, 0, worldH - GAME_HEIGHT);
    });

    // Scroll hint (fixed at bottom)
    if (worldH > GAME_HEIGHT) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, '▲ ▼  scroll to see all', {
        fontFamily: 'monospace', fontSize: '11px', color: '#445566',
      }).setOrigin(0.5, 1).setScrollFactor(0);
    }
  }

  _buildGrid() {
    const cols  = 7, cardW = 118, cardH = 86, gapX = 6, gapY = 6;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = GAME_WIDTH / 2 - totalW / 2;
    const startY = 120;

    this._speciesList.forEach((species, idx) => {
      const col  = idx % cols;
      const row  = Math.floor(idx / cols);
      const x    = startX + col * (cardW + gapX);
      const y    = startY + row * (cardH + gapY);
      this._buildCard(x, y, cardW, cardH, species);
    });
  }

  _buildCard(x, y, w, h, species) {
    const seen   = this._seen.has(species.id);
    const caught = this._caught.has(species.id);
    const typeCol   = seen ? (TYPE_COLOURS[species.type] || 0x334455) : 0x1a1a2e;
    const rarityHex = seen ? (RARITY_COLORS[species.rarity] || '#888888') : '#223344';
    const rarityCol = parseInt(rarityHex.replace('#', ''), 16);

    const bg = this.add.graphics();
    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x1a1a3a : 0x111120, 1);
      bg.fillRect(x, y, w, h);
      bg.lineStyle(2, seen ? rarityCol : 0x223344, seen ? (hover ? 1 : 0.7) : 0.25);
      bg.strokeRect(x, y, w, h);
    };
    drawBg(false);

    if (!seen) {
      this.add.text(x + w / 2, y + h / 2, '???', {
        fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#334455',
      }).setOrigin(0.5);

      const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: false });
      hit.on('pointerover', () => drawBg(true));
      hit.on('pointerout',  () => drawBg(false));
      return;
    }

    // Type color strip at top
    const typeG = this.add.graphics();
    typeG.fillStyle(typeCol, 0.35);
    typeG.fillRect(x, y, w, 11);

    // Name
    this.add.text(x + w / 2, y + 19, species.name, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#ddeeff',
    }).setOrigin(0.5);

    // Type label
    this.add.text(x + w / 2, y + 31, species.type?.toUpperCase() || '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#' + typeCol.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    // Rarity label
    this.add.text(x + w / 2, y + 43, RARITY_LABELS[species.rarity] || '', {
      fontFamily: 'monospace', fontSize: '8px', color: rarityHex,
    }).setOrigin(0.5);

    // Caught star
    if (caught) {
      this.add.text(x + w - 5, y + 6, '★', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffcc44',
      }).setOrigin(1, 0);
    }

    // Evo indicator
    if (species.evolvesTo) {
      const nextName = PET_SPECIES[species.evolvesTo]?.name || species.evolvesTo;
      this.add.text(x + w / 2, y + 57, `→ ${nextName} Lv.${species.evolvesAtLevel}`, {
        fontFamily: 'monospace', fontSize: '7px', color: '#aaffcc',
      }).setOrigin(0.5);
    }

    // Passive badge
    const passive = PET_PASSIVES[species.passive];
    if (passive) {
      this.add.text(x + w / 2, y + 70, passive.name, {
        fontFamily: 'monospace', fontSize: '8px', color: passive.color || '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Hover for detail panel
    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { drawBg(true); this._showDetail(species, caught); });
    hit.on('pointerout',  () => { drawBg(false); this._hideDetail(); });
  }

  _buildDetailPanel() {
    const pw = 280, ph = 178;
    const px = GAME_WIDTH - pw - 12;
    const py = GAME_HEIGHT - ph - 12;

    const container = this.add.container(0, 0).setVisible(false).setScrollFactor(0);

    const bg = this.add.graphics().setScrollFactor(0);
    bg.fillStyle(0x12121e, 0.97);
    bg.fillRect(px, py, pw, ph);
    bg.lineStyle(1, 0x445566, 1);
    bg.strokeRect(px, py, pw, ph);
    container.add(bg);

    const name = this.add.text(px + pw / 2, py + 18, '', {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: '#ddeeff',
    }).setOrigin(0.5).setScrollFactor(0);
    const rarity = this.add.text(px + pw / 2, py + 34, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0);
    const type = this.add.text(px + pw / 2, py + 48, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#667799',
    }).setOrigin(0.5).setScrollFactor(0);
    const stats = this.add.text(px + 16, py + 64, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aabbcc',
    }).setScrollFactor(0);
    const passive = this.add.text(px + 16, py + 100, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aaaaaa',
    }).setScrollFactor(0);
    const evo = this.add.text(px + 16, py + 148, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aaffcc',
    }).setScrollFactor(0);
    container.add([name, rarity, type, stats, passive, evo]);

    return { container, name, rarity, type, stats, passive, evo };
  }

  _showDetail(species, caught) {
    const { container, name, rarity, type, stats, passive: passiveTxt, evo } = this._detail;
    name.setText(species.name + (caught ? '  ★' : ''));
    const rarityHex = RARITY_COLORS[species.rarity] || '#888888';
    rarity.setText(RARITY_LABELS[species.rarity] || '').setColor(rarityHex);
    type.setText(species.type?.toUpperCase() || '');
    stats.setText(
      `HP ${species.baseHp}  ATK ${species.baseAtk}  DEF ${species.baseDef}  SPD ${species.baseSpd}`
    );
    const p = PET_PASSIVES[species.passive];
    passiveTxt.setText(p ? `Passive: ${p.name}\n${p.desc}` : '');
    evo.setText(species.evolvesTo
      ? `Evolves → ${PET_SPECIES[species.evolvesTo]?.name} at Lv.${species.evolvesAtLevel}`
      : 'Final form');
    container.setVisible(true);
  }

  _hideDetail() {
    this._detail.container.setVisible(false);
  }
}
