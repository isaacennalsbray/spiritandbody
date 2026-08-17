import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import { REGIONS } from '../data/regions.js';
import { REGION_NODES } from '../data/regionNodes.js';
import { MISSIONS, REGION_MISSIONS, PLOT_DIALOGUE } from '../data/missions.js';
import { PET_SPECIES } from '../data/pets.js';
import ApiClient from '../api/ApiClient.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAP_W     = 620;   // left panel (node map) width
const PANEL_X   = 632;   // right info panel start x
const PANEL_W   = GAME_WIDTH - PANEL_X;  // 328
const HEADER_H  = 72;

const TYPE_COLS = {
  water: 0x1e6ea0, fire: 0xa03c1e, plant: 0x2e7a2e,
  lightning: 0xa09a1e, glow: 0x8a6ea0, ice: 0x4aa0a0,
  rock: 0x7a6040,
};
const TYPE_COLS_CSS = {
  water: '#1e6ea0', fire: '#a03c1e', plant: '#2e7a2e',
  lightning: '#a09a1e', glow: '#8a6ea0', ice: '#4aa0a0',
  rock: '#7a6040',
};

const NODE_STYLE = {
  npc:  { fill: 0xaa7700, stroke: 0xffdd55, label: '#ffdd88' },
  wild: { fill: 0x1a4a1a, stroke: 0x44aa44, label: '#88cc88' },
  boss: { fill: 0x4a1111, stroke: 0xcc3333, label: '#ff8888' },
};

// Rarity-weighted species picker (mirrors RegionScene's old logic)
const RARITY_WEIGHTS = { common: 50, uncommon: 30, rare: 10, very_rare: 5, legendary: 1 };
function pickWeightedSpecies(wildSpecies) {
  const pool = wildSpecies.map(id => ({
    id, weight: RARITY_WEIGHTS[PET_SPECIES[id]?.rarity] ?? RARITY_WEIGHTS.common,
  }));
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const entry of pool) { r -= entry.weight; if (r <= 0) return entry.id; }
  return pool[pool.length - 1].id;
}

export default class RegionScene extends Phaser.Scene {
  constructor() { super('RegionScene'); }

  init(data) {
    this._regionId         = data.regionId         || 'base';
    this._playerLevel      = data.playerLevel      || 1;
    this._playerData       = data.playerData       || null;
    this._nodeSearchCounts = data.nodeSearchCounts || {};
  }

  async create() {
    // Generation token — if the scene restarts before this async create finishes,
    // the stale completion will see a mismatched token and bail out.
    this._createGen = (this._createGen || 0) + 1;
    const gen = this._createGen;

    this._character    = null;
    this._pets         = [];
    this._questFlags   = {};
    this._charId       = null;
    this._selectedNode = null;
    this._panelItems   = [];
    this._dlgItems     = [];

    // Load fresh character + pets data
    const charId = this._playerData?.id;
    let playerData = { ...this._playerData };
    if (charId) {
      try {
        const [charsData, petsData] = await Promise.all([
          ApiClient.listCharacters(),
          ApiClient.listPets(charId),
        ]);
        if (this._createGen !== gen) return; // scene restarted — discard stale result
        this._character   = charsData?.characters?.find(c => c.id === charId) || this._playerData;
        this._playerLevel = this._character?.level || 1;
        playerData        = { ...this._character };
        this._pets        = petsData.pets || [];
        try { this._questFlags = JSON.parse(this._character.quest_flags || '{}'); } catch {}

        const activePets = this._pets
          .filter(p => p.active_slot === 1 || p.active_slot === 2)
          .sort((a, b) => a.active_slot - b.active_slot)
          .map(p => ({ ...p, id: `player_pet${p.active_slot}`, speciesId: p.species }));
        playerData.pets = activePets.length ? activePets : undefined;
      } catch (e) { console.error('RegionScene load error:', e); }
    }
    if (this._createGen !== gen) return; // scene restarted — discard stale result
    this._playerData = playerData;
    this._charId = this._character?.id ?? this._playerData?.id ?? charId ?? null;

    const region = REGIONS[this._regionId];
    const col    = TYPE_COLS[region.type] || 0x446644;
    const colCss = TYPE_COLS_CSS[region.type] || '#446644';

    this._buildScene(region, col, colCss);
  }

  // ── Scene build ─────────────────────────────────────────────────────────────

  _buildScene(region, col, colCss) {
    // Base background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07070f);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      stars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.22));
      stars.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 1, 1);
    }

    // Map panel tinted background
    const mapBg = this.add.graphics();
    mapBg.fillStyle(col, 0.07);
    mapBg.fillRect(0, 0, MAP_W, GAME_HEIGHT);

    // Panel divider
    const divG = this.add.graphics();
    divG.lineStyle(1, col, 0.35);
    divG.lineBetween(MAP_W + 6, 0, MAP_W + 6, GAME_HEIGHT);

    // Panel background (right)
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a18, 1);
    panelBg.fillRect(PANEL_X - 6, 0, PANEL_W + 6, GAME_HEIGHT);

    this._drawTerrain(region, col);
    this._drawHeader(region, col, colCss);
    this._drawNodeMap();
    this._showDefaultPanel(region, col, colCss);
  }

  // ── Terrain decoration ──────────────────────────────────────────────────────

  _drawTerrain(region, col) {
    const g = this.add.graphics();
    const t = region.type;
    const rng = (a, b) => Phaser.Math.Between(a, b);

    if (t === 'water') {
      g.lineStyle(1, col, 0.12);
      for (let y = HEADER_H + 30; y < GAME_HEIGHT; y += 44) {
        for (let x = 0; x < MAP_W; x += 90) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + 45, y - 12); g.lineTo(x + 90, y); g.strokePath();
        }
      }
    } else if (t === 'fire') {
      g.fillStyle(col, 0.07);
      for (let x = -20; x < MAP_W; x += 80) {
        const h = rng(50, 130);
        g.fillTriangle(x, GAME_HEIGHT, x + 40, GAME_HEIGHT - h, x + 80, GAME_HEIGHT);
      }
    } else if (t === 'plant') {
      g.fillStyle(col, 0.08);
      for (let i = 0; i < 10; i++) {
        g.fillEllipse(rng(30, MAP_W - 30), rng(HEADER_H + 30, GAME_HEIGHT - 30), rng(30, 60), rng(50, 90));
      }
    } else if (t === 'lightning') {
      g.lineStyle(1, col, 0.09);
      for (let i = 0; i < 6; i++) {
        const x = rng(50, MAP_W - 50);
        g.beginPath();
        g.moveTo(x, HEADER_H + 20); g.lineTo(x - 18, HEADER_H + 90);
        g.lineTo(x + 12, HEADER_H + 90); g.lineTo(x - 18, HEADER_H + 170); g.strokePath();
      }
    } else if (t === 'ice') {
      g.lineStyle(1, col, 0.11);
      for (let i = 0; i < 7; i++) {
        const x = rng(40, MAP_W - 40); const y = rng(HEADER_H + 40, GAME_HEIGHT - 40); const s = rng(20, 55);
        g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.55, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.55, y); g.closePath(); g.strokePath();
      }
    } else if (t === 'glow') {
      g.fillStyle(col, 0.06);
      for (let i = 0; i < 14; i++) {
        g.fillCircle(rng(20, MAP_W - 20), rng(HEADER_H + 20, GAME_HEIGHT - 20), rng(8, 32));
      }
    } else if (t === 'rock') {
      g.fillStyle(col, 0.07);
      for (let i = 0; i < 10; i++) {
        g.fillRect(rng(20, MAP_W - 60), rng(HEADER_H + 20, GAME_HEIGHT - 40), rng(25, 60), rng(18, 38));
      }
    } else {
      // base — scattered dots
      g.fillStyle(col, 0.09);
      for (let i = 0; i < 22; i++) {
        g.fillCircle(rng(20, MAP_W - 20), rng(HEADER_H + 20, GAME_HEIGHT - 20), rng(3, 9));
      }
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────────

  _drawHeader(region, col, colCss) {
    // Header strip
    const hg = this.add.graphics();
    hg.fillStyle(0x050510, 0.9);
    hg.fillRect(0, 0, MAP_W, HEADER_H);
    hg.lineStyle(1, col, 0.4);
    hg.lineBetween(0, HEADER_H, MAP_W, HEADER_H);

    // Back button
    const back = this.add.text(14, 16, '< Map', {
      fontFamily: 'monospace', fontSize: '13px', color: '#445566',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#aabbff'));
    back.on('pointerout',  () => back.setColor('#445566'));
    back.on('pointerdown', () => this.scene.start('MapScene', {
      playerLevel: this._playerLevel, playerData: this._playerData,
    }));

    // Region name
    this.add.text(MAP_W / 2, 24, region.name, {
      fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Type badge
    if (region.type) {
      const tbg = this.add.graphics();
      tbg.fillStyle(col, 1);
      tbg.fillRect(MAP_W / 2 - 28, 46, 56, 14);
      this.add.text(MAP_W / 2, 53, region.type.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
    }

    // Level requirement
    this.add.text(MAP_W - 12, 16, `Lv.${region.requiredLevel}+`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#334455',
    }).setOrigin(1, 0);
  }

  // ── Node map ────────────────────────────────────────────────────────────────

  _drawNodeMap() {
    const nodeData = REGION_NODES[this._regionId];
    if (!nodeData) return;

    const nodes   = nodeData.nodes;
    const nodeMap = {};
    nodes.forEach(n => (nodeMap[n.id] = n));

    // Connection lines (drawn first, behind nodes)
    const lineG = this.add.graphics();
    nodes.forEach(node => {
      (node.connections || []).forEach(connId => {
        const t = nodeMap[connId];
        if (!t) return;
        lineG.lineStyle(2, 0x223344, 0.9);
        lineG.lineBetween(node.x, HEADER_H + node.y, t.x, HEADER_H + t.y);
      });
    });

    // Nodes
    nodes.forEach(n => this._drawNode(n));
  }

  _drawNode(node) {
    const nx   = node.x;
    const ny   = HEADER_H + node.y;
    const R    = 26;
    const sty  = NODE_STYLE[node.type] || NODE_STYLE.wild;
    const ind  = node.type === 'npc' ? this._npcIndicator() : null;

    const g = this.add.graphics();
    const redraw = (hover) => {
      g.clear();
      g.fillStyle(sty.fill, 1);
      g.fillCircle(nx, ny, hover ? R + 4 : R);
      g.lineStyle(hover ? 3 : 2, sty.stroke, 1);
      g.strokeCircle(nx, ny, hover ? R + 4 : R);
    };
    redraw(false);

    // Icon text
    const icons = { npc: 'NPC', wild: '~', boss: '☠' };
    this.add.text(nx, ny, icons[node.type] || '?', {
      fontFamily: 'monospace', fontSize: node.type === 'npc' ? '8px' : '15px',
      fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    // Label
    this.add.text(nx, ny + R + 10, node.label, {
      fontFamily: 'monospace', fontSize: '11px', color: sty.label,
    }).setOrigin(0.5);

    // Mission indicator badge
    if (ind === 'ready') {
      const ig = this.add.graphics();
      ig.fillStyle(0x22cc66, 1); ig.fillCircle(nx + R - 2, ny - R + 2, 9);
      this.add.text(nx + R - 2, ny - R + 2, '!', {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#001100',
      }).setOrigin(0.5);
    } else if (ind === 'available') {
      const ig = this.add.graphics();
      ig.fillStyle(0xffdd00, 1); ig.fillCircle(nx + R - 2, ny - R + 2, 9);
      this.add.text(nx + R - 2, ny - R + 2, '!', {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#220000',
      }).setOrigin(0.5);
    }

    // Hit zone
    const hit = this.add.circle(nx, ny, R + 12).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => redraw(true));
    hit.on('pointerout',  () => redraw(false));
    hit.on('pointerdown', () => this._selectNode(node));
  }

  _npcIndicator() {
    const mids = REGION_MISSIONS[this._regionId] || [];
    let hasReady = false;
    for (const mid of mids) {
      const m = MISSIONS[mid]; if (!m) continue;
      const s = this._missionStatus(m);
      if (s === 'available' || s === 'active') return 'available';
      if (s === 'ready') hasReady = true;
    }
    return hasReady ? 'ready' : null;
  }

  // ── Mission logic ───────────────────────────────────────────────────────────

  _missionStatus(mission) {
    if (this._questFlags[`${mission.id}_done`]) return 'claimed';
    if (mission.prerequisite && !this._questFlags[`${mission.prerequisite}_done`]) return 'locked';
    if (this._questFlags[`${mission.id}_active`]) {
      return this._objectiveMet(mission) ? 'ready' : 'active';
    }
    return 'available';
  }

  _objectiveMet(mission) {
    const obj = mission.objective;
    if (obj.type === 'catch_any')     return (this._pets || []).some(p => p.caught_region === this._regionId);
    if (obj.type === 'catch_type')    return (this._pets || []).some(p => p.type === obj.petType && p.caught_region === this._regionId);
    if (obj.type === 'catch_species') return (this._pets || []).some(p => p.species === obj.speciesId && p.caught_region === this._regionId);
    if (obj.type === 'defeat_boss')   return !!this._questFlags[`boss_${obj.encounterId}`];
    return false;
  }

  // ── Node selection ──────────────────────────────────────────────────────────

  _selectNode(node) {
    this._selectedNode = node;
    this._clearPanel();
    if (node.type === 'npc')  this._showNpcPanel(node);
    if (node.type === 'wild') this._showWildPanel(node);
    if (node.type === 'boss') this._showBossPanel(node);
  }

  // ── Panel helpers ───────────────────────────────────────────────────────────

  _clearPanel() {
    this._panelItems.forEach(i => i.destroy());
    this._panelItems = [];
  }

  _p(item) { this._panelItems.push(item); return item; }

  _panelHeader(title, col) {
    const cx = PANEL_X + PANEL_W / 2;
    this._p(this.add.text(cx, 20, title, {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: col || '#ddeeff',
    }).setOrigin(0.5));
    const g = this._p(this.add.graphics());
    g.lineStyle(1, 0x1a2030, 1);
    g.lineBetween(PANEL_X, 42, GAME_WIDTH, 42);
  }

  _makeBtn(cx, cy, w, h, fillHex, strokeHex, label, textCol, onClick) {
    const bx = cx - w / 2, by = cy - h / 2;
    const g = this._p(this.add.graphics());
    const draw = (hov) => {
      g.clear();
      g.fillStyle(hov ? fillHex + 0x181818 : fillHex, 1);
      g.fillRect(bx, by, w, h);
      g.lineStyle(hov ? 2 : 1, strokeHex, 1);
      g.strokeRect(bx, by, w, h);
    };
    draw(false);
    const txt = this._p(this.add.text(cx, cy, label, {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: textCol,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }));
    txt.on('pointerover', () => { draw(true);  txt.setColor('#ffffff'); });
    txt.on('pointerout',  () => { draw(false); txt.setColor(textCol); });
    txt.on('pointerdown', onClick);
    return txt;
  }

  // ── Default panel (no node selected) ────────────────────────────────────────

  _showDefaultPanel(region, col, colCss) {
    const cx = PANEL_X + PANEL_W / 2;
    const px = PANEL_X + 12;

    this._panelHeader(region.name, colCss);

    this._p(this.add.text(px, 56, region.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#556677',
      wordWrap: { width: PANEL_W - 24 },
    }));

    this._p(this.add.text(px, 100, `Required Level: ${region.requiredLevel}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#334455',
    }));

    this._p(this.add.text(cx, 160, '← Select a location', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a3a4a',
    }).setOrigin(0.5));

    // Party shortcut
    this._makeBtn(cx, GAME_HEIGHT - 44, 200, 32, 0x0d1120, 0x226688, '[ PARTY ]', '#44bbff', () => {
      this.scene.start('PartyScene');
    });
  }

  // ── Guaranteed species logic ─────────────────────────────────────────────────
  // Returns a speciesId to force on the 3rd search of a node when a catch_species
  // mission is active, targets a species listed in that node, and the species
  // hasn't been caught in this region yet.  Returns null otherwise.

  // Returns the species to force on this node visit, or null.
  // The counter (_nodeSearchCounts[missionId]) is shared across all nodes
  // listed in the mission's obj.nodes, so sunken_ruins + pressure_vents
  // both count toward the same "3 searches" total.
  _guaranteedSpeciesForNode(nodeId) {
    const missionIds = REGION_MISSIONS[this._regionId] || [];
    for (const mid of missionIds) {
      const mission = MISSIONS[mid];
      if (!mission) continue;
      const obj = mission.objective;
      if (obj.type !== 'catch_species') continue;
      if (!obj.nodes || !obj.nodes.includes(nodeId)) continue;
      if (!this._questFlags[`${mid}_active`]) continue;
      // Trigger on the 3rd combined search across any of the mission's nodes
      if ((this._nodeSearchCounts[mid] || 0) < 3) continue;
      // Don't trigger if already caught in this region
      const alreadyCaught = (this._pets || []).some(
        p => p.species === obj.speciesId && p.caught_region === this._regionId
      );
      if (alreadyCaught) continue;
      return obj.speciesId;
    }
    return null;
  }

  // ── Wild panel ──────────────────────────────────────────────────────────────

  _showWildPanel(node) {
    const cx = PANEL_X + PANEL_W / 2;
    const px = PANEL_X + 12;

    this._panelHeader(node.label, '#88cc88');

    this._p(this.add.text(px, 56, node.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#556677',
      wordWrap: { width: PANEL_W - 24 },
    }));

    this._p(this.add.text(px, 130, 'Wild creatures roam here.', {
      fontFamily: 'monospace', fontSize: '11px', color: '#334455',
    }));
    this._p(this.add.text(px, 146, 'Rarer species appear less frequently.', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2a3a2a',
    }));

    this._makeBtn(cx, 220, 250, 42, 0x0d1f0d, 0x44aa44, 'EXPLORE', '#aaffaa', () => {
      // Increment the shared search counter for every active catch_species mission
      // that lists this node, so searches at either qualifying node count together.
      const missionIds = REGION_MISSIONS[this._regionId] || [];
      for (const mid of missionIds) {
        const mission = MISSIONS[mid];
        if (!mission) continue;
        const obj = mission.objective;
        if (obj.type !== 'catch_species') continue;
        if (!obj.nodes || !obj.nodes.includes(node.id)) continue;
        if (!this._questFlags[`${mid}_active`]) continue;
        this._nodeSearchCounts[mid] = (this._nodeSearchCounts[mid] || 0) + 1;
      }
      const forcedSpecies = this._guaranteedSpeciesForNode(node.id);
      const species = forcedSpecies || pickWeightedSpecies(REGIONS[this._regionId].wildSpecies);
      this.scene.start('BattleScene', {
        encounterId: `wild_${species}`,
        playerData:  this._playerData,
        returnScene: 'RegionScene',
        returnData:  { regionId: this._regionId, playerLevel: this._playerLevel, playerData: this._playerData, nodeSearchCounts: this._nodeSearchCounts },
      });
    });

    // Party shortcut
    this._makeBtn(cx, GAME_HEIGHT - 44, 200, 32, 0x0d1120, 0x226688, '[ PARTY ]', '#44bbff', () => {
      this.scene.start('PartyScene');
    });
  }

  // ── Boss panel ───────────────────────────────────────────────────────────────

  _showBossPanel(node) {
    const cx     = PANEL_X + PANEL_W / 2;
    const px     = PANEL_X + 12;
    const region = REGIONS[this._regionId];

    this._panelHeader(node.label, '#ff8888');

    this._p(this.add.text(px, 56, node.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#556677',
      wordWrap: { width: PANEL_W - 24 },
    }));

    this._p(this.add.text(px, 140, 'Boss', {
      fontFamily: 'monospace', fontSize: '10px', color: '#553333',
    }));
    this._p(this.add.text(px, 155, region.bossName, {
      fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#cc5533',
    }));

    const bossDefeated = !!this._questFlags[`boss_${region.bossEncounterId}`];

    // ── Base region: two-stage boss (tutorial → The Unbound) ──────────────
    if (this._regionId === 'base') {
      if (!bossDefeated) {
        // Stage 1: tutorial fight with Elder Warden
        this._makeBtn(cx, 240, 260, 44, 0x1a0808, 0xcc3333, 'CHALLENGE BOSS', '#ffaaaa', () => {
          this.scene.start('BattleScene', {
            encounterId: region.bossEncounterId,
            playerData:  this._playerData,
            returnScene: 'RegionScene',
            returnData:  { regionId: this._regionId, playerLevel: this._playerLevel, playerData: this._playerData, nodeSearchCounts: this._nodeSearchCounts },
          });
        });
      } else {
        // Stage 1 done — check whether all 7 regional bosses are defeated
        const REGIONAL_BOSSES = ['boss_water','boss_fire','boss_plant','boss_lightning','boss_glow','boss_ice','boss_rock'];
        const allCleared = REGIONAL_BOSSES.every(id => !!this._questFlags[`boss_${id}`]);
        const unboundDefeated = !!this._questFlags['boss_boss_unbound'];

        this._p(this.add.text(cx, 210, '✓ TRIAL PASSED', {
          fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#447744',
        }).setOrigin(0.5));

        if (unboundDefeated) {
          this._p(this.add.text(cx, 238, '✓ THE UNBOUND DEFEATED', {
            fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: '#cc88ff',
          }).setOrigin(0.5));
        } else if (allCleared) {
          this._p(this.add.text(cx, 238, 'The upper chamber seal breaks.', {
            fontFamily: 'monospace', fontSize: '10px', color: '#cc88aa',
          }).setOrigin(0.5));
          this._makeBtn(cx, 270, 260, 44, 0x120008, 0x880033, 'FACE THE UNBOUND', '#ffaacc', () => {
            this.scene.start('BattleScene', {
              encounterId: 'boss_unbound',
              playerData:  this._playerData,
              returnScene: 'RegionScene',
              returnData:  { regionId: this._regionId, playerLevel: this._playerLevel, playerData: this._playerData, nodeSearchCounts: this._nodeSearchCounts },
            });
          });
        } else {
          this._p(this.add.text(cx, 238, 'The upper chamber remains sealed.', {
            fontFamily: 'monospace', fontSize: '10px', color: '#664444',
          }).setOrigin(0.5));
          this._p(this.add.text(cx, 258, 'Defeat all seven regional bosses\nto break The Unbound\'s hold.', {
            fontFamily: 'monospace', fontSize: '10px', color: '#664444',
            align: 'center',
          }).setOrigin(0.5));
        }
      }

    // ── All other regions: single boss + legendary ─────────────────────────
    } else if (bossDefeated) {
      this._p(this.add.text(cx, 210, '✓ DEFEATED', {
        fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#447744',
      }).setOrigin(0.5));

      const legendaryId = region.legendarySpeciesId;
      const REGIONAL_BOSSES = ['boss_water','boss_fire','boss_plant','boss_lightning','boss_glow','boss_ice','boss_rock'];
      const allRegionsCleared = REGIONAL_BOSSES.every(id => !!this._questFlags[`boss_${id}`]);

      if (legendaryId) {
        const alreadyCaught = (this._pets || []).some(
          p => p.species === legendaryId && p.caught_region === this._regionId
        );
        if (alreadyCaught) {
          this._p(this.add.text(cx, 240, '✓ Legendary bonded', {
            fontFamily: 'monospace', fontSize: '11px', color: '#aa88ff',
          }).setOrigin(0.5));
        } else if (allRegionsCleared) {
          this._p(this.add.text(cx, 238, 'A legendary creature stirs here...', {
            fontFamily: 'monospace', fontSize: '10px', color: '#aa88ff',
          }).setOrigin(0.5));
          this._makeBtn(cx, 270, 260, 44, 0x0d0018, 0x9933cc, 'ENCOUNTER LEGENDARY', '#ddaaff', () => {
            this.scene.start('BattleScene', {
              encounterId: `wild_${legendaryId}`,
              playerData:  this._playerData,
              returnScene: 'RegionScene',
              returnData:  { regionId: this._regionId, playerLevel: this._playerLevel, playerData: this._playerData, nodeSearchCounts: this._nodeSearchCounts },
            });
          });
        } else {
          this._p(this.add.text(cx, 240, 'Defeat all seven regional bosses\nto awaken the legendary.', {
            fontFamily: 'monospace', fontSize: '10px', color: '#554455',
            align: 'center',
          }).setOrigin(0.5));
        }
      }
    } else {
      this._makeBtn(cx, 240, 260, 44, 0x1a0808, 0xcc3333, 'CHALLENGE BOSS', '#ffaaaa', () => {
        this.scene.start('BattleScene', {
          encounterId: region.bossEncounterId,
          playerData:  this._playerData,
          returnScene: 'RegionScene',
          returnData:  { regionId: this._regionId, playerLevel: this._playerLevel, playerData: this._playerData, nodeSearchCounts: this._nodeSearchCounts },
        });
      });
    }

    // Party shortcut
    this._makeBtn(cx, GAME_HEIGHT - 44, 200, 32, 0x0d1120, 0x226688, '[ PARTY ]', '#44bbff', () => {
      this.scene.start('PartyScene');
    });
  }

  // ── NPC panel ───────────────────────────────────────────────────────────────

  _showNpcPanel(node) {
    const cx   = PANEL_X + PANEL_W / 2;
    const px   = PANEL_X + 12;
    const mids = REGION_MISSIONS[this._regionId] || [];
    const npc  = MISSIONS[mids[0]]?.npc || 'Local Guide';

    this._panelHeader(npc, '#ffdd88');

    let y = 52;

    // Plot story button (if not yet seen)
    const plotKey = `${this._regionId}_plot`;
    if (!this._questFlags[plotKey]) {
      this._makeBtn(cx, y + 18, 270, 34, 0x12082a, 0x7744cc, '★ HEAR THE STORY ★', '#cc88ff', () => {
        this._showPlotDialogue();
      });
      y += 62;
    }

    // Mission list
    this._p(this.add.text(px, y, 'MISSIONS', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#334455',
    }));
    y += 16;

    for (const mid of mids) {
      const mission = MISSIONS[mid];
      if (!mission) continue;
      const status = this._missionStatus(mission);
      if (status === 'claimed') continue;   // completed missions disappear
      y = this._drawMissionRow(mission, status, px, y);
      y += 6;
    }

    // Party shortcut
    this._makeBtn(cx, GAME_HEIGHT - 44, 200, 32, 0x0d1120, 0x226688, '[ PARTY ]', '#44bbff', () => {
      this.scene.start('PartyScene');
    });
  }

  _drawMissionRow(mission, status, px, startY) {
    const STATUS_COL = {
      locked:    '#2a3344', available: '#5577bb',
      active:    '#bbaa44', ready:     '#44cc77', claimed: '#2a3a2a',
    };
    const STATUS_LBL = {
      locked: 'Locked', available: 'Available', active: 'In Progress',
      ready: 'Claim!', claimed: 'Done ✓',
    };

    const rowH = 64;
    const rowW = PANEL_W - 20;
    const col  = STATUS_COL[status] || '#334455';

    const bg = this._p(this.add.graphics());
    bg.fillStyle(0x0b0f1a, 1);
    bg.fillRect(px - 4, startY, rowW, rowH);
    bg.lineStyle(1, status === 'claimed' ? 0x1a2a1a : 0x1a2040, 1);
    bg.strokeRect(px - 4, startY, rowW, rowH);

    this._p(this.add.text(px + 2, startY + 6, mission.title, {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold',
      color: status === 'claimed' ? '#2a3a2a' : '#ccddef',
    }));
    this._p(this.add.text(px + 2, startY + 22, mission.objective.label, {
      fontFamily: 'monospace', fontSize: '10px',
      color: status === 'claimed' ? '#1a2a1a' : '#445566',
      wordWrap: { width: rowW - 90 },
    }));
    this._p(this.add.text(px + rowW - 12, startY + 6, STATUS_LBL[status] || '', {
      fontFamily: 'monospace', fontSize: '9px', color: col,
    }).setOrigin(1, 0));

    // Action button for available / ready
    if (status === 'available') {
      this._makeBtn(px + rowW - 56, startY + 48, 100, 22,
        0x0d1230, 0x3355aa, 'Accept', '#88aaff',
        () => this._handleMissionAction(mission, status));
    } else if (status === 'ready') {
      this._makeBtn(px + rowW - 56, startY + 48, 110, 22,
        0x0d2016, 0x33aa55, 'Claim Reward', '#44ee88',
        () => this._handleMissionAction(mission, status));
    }

    return startY + rowH;
  }

  async _handleMissionAction(mission, status) {
    const charId = this._charId;
    if (!charId) {
      this._errText(`no charId`);
      return;
    }

    if (status === 'available') {
      this._showDialogue(mission.dialogueStart, async () => {
        this._questFlags[`${mission.id}_active`] = true;
        await ApiClient.updateQuestFlags(charId, { [`${mission.id}_active`]: true })
          .catch(e => this._errText(`accept err id=${charId}: ${e.message}`));
        this._clearPanel();
        this._showNpcPanel(this._selectedNode);
      });
    } else if (status === 'ready') {
      this._showDialogue(mission.dialogueComplete, async () => {
        const { gold, xp, itemId } = mission.reward;
        this._questFlags[`${mission.id}_done`] = true;
        await ApiClient.updateQuestFlags(charId, { [`${mission.id}_done`]: true })
          .catch(e => this._errText(`claim err id=${charId}: ${e.message}`));
        if (gold)   ApiClient.awardGold(charId, gold).catch(() => null);
        if (xp)     ApiClient.awardXp(charId, xp).catch(() => null);
        if (itemId) ApiClient.awardItem(charId, itemId).catch(() => null);
        this._clearPanel();
        this._showNpcPanel(this._selectedNode);
      });
    }
  }

  _errText(msg) {
    this.add.text(PANEL_X + PANEL_W / 2, GAME_HEIGHT / 2, msg, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff4444',
      backgroundColor: '#0a0010', padding: { x: 8, y: 5 },
      wordWrap: { width: PANEL_W - 20 },
    }).setOrigin(0.5).setDepth(200);
  }

  _showPlotDialogue() {
    const lines = PLOT_DIALOGUE[this._regionId];
    if (!lines?.length) return;
    this._showDialogue(lines, async () => {
      const charId = this._charId;
      this._questFlags[`${this._regionId}_plot`] = true;
      if (charId) await ApiClient.updateQuestFlags(charId, { [`${this._regionId}_plot`]: true }).catch(() => null);
      this._clearPanel();
      this._showNpcPanel(this._selectedNode);
    });
  }

  // ── Dialogue overlay ─────────────────────────────────────────────────────────

  _showDialogue(lines, onDone) {
    this._clearDialogue();

    const BOX_H = 170;
    const BOX_Y = GAME_HEIGHT - BOX_H - 8;
    const items = [];

    // Darken
    items.push(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(100));

    // Box
    const boxG = this.add.graphics().setDepth(101);
    boxG.fillStyle(0x060616, 0.97);
    boxG.fillRect(16, BOX_Y, GAME_WIDTH - 32, BOX_H);
    boxG.lineStyle(2, 0x2233aa, 1);
    boxG.strokeRect(16, BOX_Y, GAME_WIDTH - 32, BOX_H);
    items.push(boxG);

    const speakerTxt = this.add.text(32, BOX_Y + 12, '', {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#ffdd88',
    }).setDepth(102);
    items.push(speakerTxt);

    const bodyTxt = this.add.text(32, BOX_Y + 36, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ddeeff',
      wordWrap: { width: GAME_WIDTH - 72 },
    }).setDepth(102);
    items.push(bodyTxt);

    const advTxt = this.add.text(GAME_WIDTH - 32, BOX_Y + BOX_H - 14, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#334466',
    }).setOrigin(1, 1).setDepth(102);
    items.push(advTxt);

    this._dlgItems = items;

    let idx = 0;
    const show = () => {
      if (idx >= lines.length) {
        this._clearDialogue();
        onDone && onDone();
        return;
      }
      speakerTxt.setText(lines[idx].speaker || '');
      bodyTxt.setText(lines[idx].text || '');
      advTxt.setText(idx < lines.length - 1 ? '▶ click to continue' : '▶ click to close');
      idx++;
    };
    show();

    const hit = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive().setDepth(103);
    hit.on('pointerdown', show);
    this._dlgItems.push(hit);
  }

  _clearDialogue() {
    this._dlgItems.forEach(d => d.destroy());
    this._dlgItems = [];
  }
}
