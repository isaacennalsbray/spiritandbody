import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import BattleManager, { xpForBattle, xpToNextLevel, goldForBattle } from '../battle/BattleManager.js';
import { drawCreature, drawPlayerMage, drawEnemyMage, speciesTierScale, TYPE_PARTICLE_COLORS } from '../utils/SpriteUtils.js';
import { ENCOUNTERS, BOSS_DROPS } from '../data/encounters.js';
import { EQUIPMENT } from '../data/equipment.js';
import { MOVES, STATUS_META } from '../data/moves.js';
import { PET_SPECIES, RARITY_COLORS, RARITY_LABELS } from '../data/pets.js';
import { getTypeMultiplier, TYPE_BEATS } from '../data/types.js';
import ApiClient from '../api/ApiClient.js';

// ── Type colours ──────────────────────────────────────────────────────────────
const TYPE_COLOURS = {
  water:     0x1e6ea0,
  fire:      0xa03c1e,
  plant:     0x2e7a2e,
  lightning: 0xa09a1e,
  glow:      0x8a6ea0,
  ice:       0x4aa0a0,
  rock:      0x7a6040,
  null:      0x334455,
};

const PALETTE = {
  bg:         0x0a0a14,
  panel:      0x12121e,
  panelBdr:   0x2a2a4a,
  text:       0xddeeff,
  textDim:    0x667799,
  accent:     0x6688ff,
  hpGreen:    0x22aa44,
  hpYellow:   0xccaa22,
  hpRed:      0xcc2222,
  btnBg:      0x1a1a2e,
  btnBdr:     0x2a3a5a,
  btnActive:  0x1e2050,
  btnActBdr:  0x6688ff,
  overlay:    0x000000,
};

// ── Layout constants ──────────────────────────────────────────────────────────
// PANEL_Y=510 gives enough vertical separation so trainer hat (y≈393) clears
// the pet row (y=255, feet at y=255) without overlapping.
const PANEL_Y   = 510;
const PANEL_H   = GAME_HEIGHT - PANEL_Y; // 130
const SPRITE_SC = 1.45; // global scale multiplier for all creatures & mages

// Trainers/bosses pushed to opposite corners from pets so there is no overlap.
// Pet row sits at y=255; trainer at y=385 (hat tip ≈ 268, well below pets at y=255).
const SLOTS = {
  player:      { x: 110, y: 385 },   // far-left, clearly below pet row
  player_pet1: { x: 230, y: 255 },   // upper-left quadrant
  player_pet2: { x: 375, y: 255 },   // mid-left quadrant
  enemy:       { x: 850, y: 385 },   // far-right, clearly below pet row
  enemy_pet1:  { x: 585, y: 255 },   // mid-right quadrant
  enemy_pet2:  { x: 725, y: 255 },   // upper-right quadrant
  enemy_pet3:  { x: 862, y: 255 },   // far-right quadrant (x offset from trainer)
};

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────

  init(data) {
    this._encounterId  = data.encounterId  || 'test_battle';
    this._playerData   = data.playerData   || this._fallbackPlayerData();
    this._returnScene  = data.returnScene  || 'GameScene';
    this._returnData   = data.returnData   || {};
  }

  create() {
    this._sprites       = {};   // combatantId → container
    this._hpBars        = {};   // combatantId → { bar, label }
    this._statusLabels  = {};   // combatantId → text object
    this._overlayShown  = false;

    this._drawBackground();
    this._drawBottomPanel();

    let encounter = ENCOUNTERS[this._encounterId];
    // Auto-generate wild encounter for any species not explicitly in ENCOUNTERS
    if (!encounter && this._encounterId.startsWith('wild_')) {
      const speciesId = this._encounterId.slice(5);
      if (PET_SPECIES[speciesId]) {
        encounter = {
          id: this._encounterId,
          type: 'wild',
          pets: [{ id: 'enemy_pet1', speciesId, capturable: true }],
        };
      }
    }
    if (!encounter) {
      console.error(`Unknown encounter: ${this._encounterId}`);
      this.scene.start(this._returnScene, this._returnData);
      return;
    }
    this._manager   = new BattleManager(this._playerData, encounter);

    this._buildAllSprites();
    this._buildTurnQueueBar();
    this._startNextActor();

    // Mark enemy pets as "seen" in the bestiary
    const charId = this._playerData?.id;
    if (charId) {
      const seen = (encounter.pets || []).map(p => p.speciesId).filter(Boolean);
      if (seen.length) ApiClient.updateBestiary(charId, { seen }).catch(() => {});
    }
  }

  // ── Background ────────────────────────────────────────────────────────────

  _drawBackground() {
    const g = this.add.graphics();

    // Sky gradient (dark top → slightly lighter bottom)
    for (let y = 0; y < PANEL_Y; y += 2) {
      const t = y / PANEL_Y;
      const r = Math.floor(8  + t * 12);
      const gb = Math.floor(8  + t * 10);
      const b  = Math.floor(16 + t * 24);
      g.fillStyle((r << 16) | (gb << 8) | b, 1);
      g.fillRect(0, y, GAME_WIDTH, 2);
    }

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, PANEL_Y * 0.6);
      const a  = Phaser.Math.FloatBetween(0.15, 0.7);
      stars.fillStyle(0xffffff, a);
      stars.fillRect(sx, sy, 1, 1);
    }

    // Ground plane — perspective grid
    const gnd = this.add.graphics();
    gnd.lineStyle(1, 0x223344, 0.35);
    const horizon = 240, gndBottom = PANEL_Y;
    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const gy = horizon + (gndBottom - horizon) * t;
      gnd.lineBetween(0, gy, GAME_WIDTH, gy);
    }
    // Vertical perspective lines
    const vp = GAME_WIDTH / 2;
    for (let i = 0; i <= 8; i++) {
      const bx = (GAME_WIDTH / 8) * i;
      gnd.lineBetween(vp, horizon, bx, gndBottom);
    }

    // Ground fill
    const gf = this.add.graphics();
    gf.fillStyle(0x0d1a0d, 0.5);
    gf.fillRect(0, horizon, GAME_WIDTH, gndBottom - horizon);

    // Dividing fog strip at horizon
    const fog = this.add.graphics();
    fog.fillGradientStyle(0x0d1a2e, 0x0d1a2e, 0x0a1a1a, 0x0a1a1a, 0.6);
    fog.fillRect(0, horizon - 6, GAME_WIDTH, 12);

    // Title
    this.add.text(GAME_WIDTH / 2, 14, 'CAPTURE', {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#4466aa', strokeThickness: 2,
    }).setOrigin(0.5);
  }

  _drawBottomPanel() {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.panel, 1);
    g.fillRect(0, PANEL_Y, GAME_WIDTH, PANEL_H);
    g.lineStyle(1, PALETTE.panelBdr, 1);
    g.lineBetween(0, PANEL_Y, GAME_WIDTH, PANEL_Y);
    // Vertical separator between move buttons and log
    g.lineBetween(GAME_WIDTH * 0.62, PANEL_Y, GAME_WIDTH * 0.62, GAME_HEIGHT);
  }

  // ── Combatant sprites ─────────────────────────────────────────────────────

  _buildAllSprites() {
    const state = this._manager.getState();
    for (const id of Object.keys(state.combatants)) {
      this._buildSprite(id);
    }
  }

  _buildSprite(id) {
    const state = this._manager.getState();
    const c   = state.combatants[id];
    const pos = SLOTS[id] || { x: GAME_WIDTH / 2, y: 350 };
    const faceLeft = c.side === 'enemy';

    const container = this.add.container(pos.x, pos.y);
    this._sprites[id] = container;

    // ── Drop shadow ───────────────────────────────────────────────────────────
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, 10, 54, 14);
    container.add(shadow);

    // ── Creature sprite ───────────────────────────────────────────────────────
    const g = this.add.graphics();
    if (c.isPet) {
      const sc = speciesTierScale(c.speciesId);
      g.setScale(sc * SPRITE_SC);
      drawCreature(g, c.type, c.speciesId, faceLeft);
    } else if (c.isEnemy || c.isBoss) {
      g.setScale(SPRITE_SC);
      drawEnemyMage(g, faceLeft);
    } else {
      g.setScale(SPRITE_SC);
      drawPlayerMage(g, faceLeft);
    }
    container.add(g);

    // ── Level badge (just below sprite feet) ─────────────────────────────────
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0x0a0a18, 0.88);
    lvlBg.fillRoundedRect(-34, 16, 36, 18, 5);
    const lvlTxt = this.add.text(-16, 25, `Lv.${c.level || 1}`, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#aabbdd',
    }).setOrigin(0.5);
    container.add(lvlBg);
    container.add(lvlTxt);

    // ── Name label ────────────────────────────────────────────────────────────
    const rarityCol = c.rarity ? (RARITY_COLORS[c.rarity] || '#aaaaaa') : '#aaaaaa';
    const nameText = this.add.text(0, 38, c.name, {
      fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ddeeff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(nameText);

    // ── Rarity label (shown for all pets) ────────────────────────────────────
    if (c.isPet && c.rarity) {
      const rarityLabel = RARITY_LABELS[c.rarity] || c.rarity;
      const rarityText = this.add.text(0, 52, rarityLabel, {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: rarityCol,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      container.add(rarityText);
    }

    // ── Type badge ────────────────────────────────────────────────────────────
    const typeBadgeY = (c.isPet && c.rarity) ? 66 : 54;
    if (c.type) {
      const typeCol = TYPE_COLOURS[c.type] || TYPE_COLOURS.null;
      const typeBg = this.add.graphics();
      typeBg.fillStyle(typeCol, 1);
      typeBg.fillRoundedRect(-25, typeBadgeY, 50, 16, 5);
      const typeText = this.add.text(0, typeBadgeY + 8, c.type.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      container.add(typeBg);
      container.add(typeText);

      // Weakness tag for enemies
      if (c.side === 'enemy') {
        const weakTo = Object.entries(TYPE_BEATS).find(([atk, def]) => def === c.type)?.[0];
        if (weakTo) {
          const weakTxt = this.add.text(0, typeBadgeY + 19, `↑ ${weakTo}`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#ff9999',
            stroke: '#000000', strokeThickness: 1,
          }).setOrigin(0.5);
          container.add(weakTxt);
        }
      }
    }

    // ── HP bar ────────────────────────────────────────────────────────────────
    const hpOff = (c.isPet && c.type) ? 28 : (c.side === 'enemy' && c.type) ? 16 : 0;
    const hpBgG = this.add.graphics();
    hpBgG.fillStyle(0x0a0a18, 0.9);
    hpBgG.fillRoundedRect(-35, 76 + hpOff, 70, 12, 4);
    hpBgG.lineStyle(1, 0x2a2a4a, 0.8);
    hpBgG.strokeRoundedRect(-35, 76 + hpOff, 70, 12, 4);

    const hpBar = this.add.graphics();
    container.add(hpBgG);
    container.add(hpBar);

    const hpLabel = this.add.text(0, 93 + hpOff, '', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#667799',
    }).setOrigin(0.5);
    container.add(hpLabel);

    this._hpBars[id] = { bar: hpBar, label: hpLabel, hpOff };
    this._refreshHpBar(id);

    // ── Status label ──────────────────────────────────────────────────────────
    const statusLabel = this.add.text(0, 102 + hpOff, '', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    container.add(statusLabel);
    this._statusLabels[id] = statusLabel;
  }

  _drawFigure(g, combatant) {
    const cx = 0;
    // Determine body colour — type colour for enemies/pets, default blue for player
    const bodyCol = combatant.type
      ? (TYPE_COLOURS[combatant.type] || 0x334455)
      : 0x1e3a6e;

    const skinCol = 0xd4a574;
    const hatCol  = bodyCol;

    // Body (robe)
    g.fillStyle(bodyCol, 1);
    g.fillRect(cx - 14, -20, 28, 40);

    // Head
    g.fillStyle(skinCol, 1);
    g.fillRect(cx - 8, -36, 16, 16);

    // Eyes
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(cx - 5, -31, 3, 3);
    g.fillRect(cx + 2,  -31, 3, 3);

    // Hat
    g.fillStyle(hatCol, 1);
    g.fillRect(cx - 6, -44, 12, 8); // crown
    g.fillRect(cx - 9, -37, 18, 4); // brim
  }

  _refreshHpBar(id) {
    const state = this._manager.getState();
    const c = state.combatants[id];
    const { bar, label } = this._hpBars[id];

    bar.clear();
    const pct = Math.max(0, c.hp / c.maxHp);
    const fullW = 66;
    const barW  = Math.floor(fullW * pct);
    const col   = pct > 0.5 ? PALETTE.hpGreen : pct > 0.25 ? PALETTE.hpYellow : PALETTE.hpRed;
    const hpOff = this._hpBars[id]?.hpOff ?? ((c.side === 'enemy' && c.type) ? 16 : 0);
    if (barW > 0) {
      bar.fillStyle(col, 1);
      bar.fillRoundedRect(-34, 77 + hpOff, barW, 10, 3);
    }

    if (c.alive) {
      label.setText(`${c.hp}/${c.maxHp}`);
    } else {
      label.setText(c.captured ? 'captured' : 'fainted');
      label.setColor('#664444');
    }

    // Dim figure if dead
    const sprite = this._sprites[id];
    if (!c.alive) sprite.setAlpha(0.3);
  }

  _refreshStatusLabel(id) {
    const label = this._statusLabels[id];
    if (!label) return;
    const c = this._manager.getState().combatants[id];
    if (!c || !c.status) { label.setText(''); return; }
    const meta = STATUS_META[c.status];
    label.setText(meta ? meta.label.toUpperCase() : c.status.toUpperCase());
    label.setColor(meta ? meta.color : '#ffffff');
  }

  _refreshAllStatus() {
    for (const id of Object.keys(this._statusLabels)) {
      this._refreshStatusLabel(id);
    }
  }

  // ── Turn-queue bar ────────────────────────────────────────────────────────

  _buildTurnQueueBar() {
    this._queueBarContainer = this.add.container(GAME_WIDTH / 2, 52);
    this._refreshTurnQueueBar();
  }

  _refreshTurnQueueBar() {
    this._queueBarContainer.removeAll(true);
    const state = this._manager.getState();
    const queue = state.turnQueue;
    const current = queue[state.queueIndex];
    const iconW = 40;
    const gap   = 5;
    const totalW = queue.length * (iconW + gap) - gap;
    const startX = -totalW / 2;

    queue.forEach((id, i) => {
      const c = state.combatants[id];
      const x = startX + i * (iconW + gap) + iconW / 2;
      const isActive = id === current;

      const g = this.add.graphics();
      const col = c.side === 'player' ? 0x1e2050 : 0x2a1414;
      g.fillStyle(col, 1);
      g.fillRect(x - iconW / 2, -14, iconW, 27);
      g.lineStyle(isActive ? 2 : 1, isActive ? PALETTE.accent : PALETTE.panelBdr, 1);
      g.strokeRect(x - iconW / 2, -14, iconW, 27);

      const label = this.add.text(x, 2, c.name.slice(0, 6), {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isActive ? '#ffffff' : '#667799',
      }).setOrigin(0.5);

      this._queueBarContainer.add(g);
      this._queueBarContainer.add(label);
    });
  }

  // ── Combat flow ───────────────────────────────────────────────────────────

  _startNextActor() {
    if (this._overlayShown) return;

    const state = this._manager.getState();
    if (state.outcome !== 'ongoing') {
      this._showOutcomeOverlay(state.outcome);
      return;
    }

    this._refreshTurnQueueBar();

    const actorId = state.turnQueue[state.queueIndex];
    if (!actorId) {
      // Rebuild
      this._manager.buildTurnQueue();
      this._startNextActor();
      return;
    }

    const actor = state.combatants[actorId];
    if (!actor || !actor.alive) {
      // Skip dead actors by advancing
      this._manager.executeAction(actorId, { type: 'skip' });
      this._startNextActor();
      return;
    }

    if (actor.side === 'player') {
      this._showActionMenu(actorId);
    } else {
      this._showEnemyActing(actorId);
    }
  }

  // ── Action menu ───────────────────────────────────────────────────────────

  _showActionMenu(actorId) {
    this._clearActionMenu();
    this._pendingMove = null;

    const state = this._manager.getState();
    const actor = state.combatants[actorId];
    const btnW = 168, btnH = 42, gap = 7;
    const startX = 10, startY = PANEL_Y + 10;

    this._actionMenuItems = [];

    // Actor label
    const actorLabel = this.add.text(startX, startY, `${actor.name}'s turn`, {
      fontFamily: 'monospace',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#aabbff',
    });
    this._actionMenuItems.push(actorLabel);

    // Work out the primary target for damage preview
    const primaryTargetId = Object.values(state.combatants).find(
      c => c.side === 'enemy' && c.alive
    )?.id || null;

    // Move buttons (up to 4 in a 2×2 grid)
    const moves = actor.moves || [];
    moves.forEach((move, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = startX + col * (btnW + gap);
      const by = startY + 26 + row * (btnH + gap);

      const onCooldown = move.cooldownRemaining > 0;
      const bgCol  = onCooldown ? 0x111122 : PALETTE.btnBg;
      const bdrCol = onCooldown ? PALETTE.panelBdr : PALETTE.btnBdr;

      const bg = this.add.graphics();
      const drawBg = (active) => {
        bg.clear();
        bg.fillStyle(active ? PALETTE.btnActive : bgCol, 1);
        bg.fillRect(bx, by, btnW, btnH);
        bg.lineStyle(2, active ? PALETTE.btnActBdr : bdrCol, 1);
        bg.strokeRect(bx, by, btnW, btnH);
      };
      drawBg(false);

      const nameStr = onCooldown ? `${move.name} [CD:${move.cooldownRemaining}]` : move.name;
      const moveTxt = this.add.text(bx + 10, by + 10, nameStr, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: onCooldown ? '#445566' : '#ddeeff',
      });

      // Tags row: type · AOE · effect%
      const tags = [];
      if (move.type) tags.push(move.type.toUpperCase());
      if (move.isAoe) tags.push('AOE');
      if (move.statusEffect && move.statusChance) {
        const pct = Math.round(move.statusChance * 100);
        tags.push(`${move.statusEffect} ${pct}%`);
      }
      if (tags.length) {
        const effectCol = move.statusEffect
          ? (STATUS_META[move.statusEffect]?.color || '#aaaaaa') : '#667799';
        const infoTxt = this.add.text(bx + 10, by + 27, tags.join(' · '), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: effectCol,
        });
        this._actionMenuItems.push(infoTxt);
      }

      // Damage preview (right side of button)
      if (!onCooldown && primaryTargetId) {
        const dmg = this._manager.previewDamage(actorId, move.id, primaryTargetId);
        if (dmg !== null) {
          const dmgStr = move.isAoe ? `~${dmg} each` : `~${dmg} dmg`;
          const dmgTxt = this.add.text(bx + btnW - 8, by + btnH / 2, dmgStr, {
            fontFamily: 'monospace',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffdd66',
          }).setOrigin(1, 0.5);
          this._actionMenuItems.push(dmgTxt);
        }
      }

      this._actionMenuItems.push(bg, moveTxt);

      if (!onCooldown) {
        const hit = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => drawBg(true));
        hit.on('pointerout',  () => drawBg(false));
        hit.on('pointerdown', () => {
          if (move.isAoe) {
            this._executePlayerAction(actorId, { type: 'move', moveId: move.id, targetId: null });
          } else {
            this._showTargetSelect(actorId, move.id);
          }
        });
        this._actionMenuItems.push(hit);
      }
    });

    // Capture button
    const capX = startX + 2 * (btnW + gap) + 10;
    const capY = startY + 26;
    const enemyPets = Object.values(state.combatants).filter(
      c => c.side === 'enemy' && c.alive && c.capturable
    );
    const canCapture = actor.isPlayer && enemyPets.length > 0;

    const capBg = this.add.graphics();
    const capCol = canCapture ? 0x0d2010 : 0x111122;
    const capBdrCol = canCapture ? 0x44aa44 : PALETTE.panelBdr;
    capBg.fillStyle(capCol, 1);
    capBg.fillRect(capX, capY, btnW, btnH);
    capBg.lineStyle(2, capBdrCol, 1);
    capBg.strokeRect(capX, capY, btnW, btnH);

    const capTxt = this.add.text(capX + btnW / 2, capY + btnH / 2, 'CAPTURE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: canCapture ? '#44ee44' : '#334433',
    }).setOrigin(0.5);

    this._actionMenuItems.push(capBg, capTxt);

    if (canCapture) {
      const capHit = this.add.rectangle(capX + btnW / 2, capY + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true });
      capHit.on('pointerdown', () => this._showTargetSelect(actorId, '__capture__'));
      this._actionMenuItems.push(capHit);
    }

    // Skip / do nothing button
    const skipX = capX;
    const skipY = capY + btnH + gap;
    const skipBg = this.add.graphics();
    const drawSkipBg = (hover) => {
      skipBg.clear();
      skipBg.fillStyle(hover ? 0x1a1a1a : 0x111118, 1);
      skipBg.fillRect(skipX, skipY, btnW, btnH);
      skipBg.lineStyle(2, hover ? 0x667799 : 0x334455, 1);
      skipBg.strokeRect(skipX, skipY, btnW, btnH);
    };
    drawSkipBg(false);
    const skipTxt = this.add.text(skipX + btnW / 2, skipY + btnH / 2, 'DO NOTHING', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#556677',
    }).setOrigin(0.5);
    const skipHit = this.add.rectangle(skipX + btnW / 2, skipY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    skipHit.on('pointerover', () => { drawSkipBg(true); skipTxt.setColor('#aabbcc'); });
    skipHit.on('pointerout',  () => { drawSkipBg(false); skipTxt.setColor('#556677'); });
    skipHit.on('pointerdown', () => this._executePlayerAction(actorId, { type: 'skip' }));
    this._actionMenuItems.push(skipBg, skipTxt, skipHit);

    this._refreshBattleLog();
  }

  // ── Target selection ──────────────────────────────────────────────────────

  _showTargetSelect(actorId, moveIdOrCapture) {
    // Remove only target buttons, not the whole menu
    if (this._targetItems) {
      this._targetItems.forEach(t => t.destroy());
    }
    this._targetItems = [];

    const state = this._manager.getState();
    const actor = state.combatants[actorId];
    const isCapture = moveIdOrCapture === '__capture__';

    const oppSide = actor.side === 'player' ? 'enemy' : 'player';
    const targets = Object.values(state.combatants).filter(c => c.side === oppSide && c.alive);

    // Prompt label
    const prompt = this.add.text(GAME_WIDTH / 2, PANEL_Y + 14, 'Choose a target:', {
      fontFamily: 'monospace',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffdd88',
    }).setOrigin(0.5);
    this._targetItems.push(prompt);

    // Highlight enemy sprites
    targets.forEach((target, i) => {
      const pos = SLOTS[target.id];
      if (!pos) return;

      // Highlight ring
      const ring = this.add.graphics();
      ring.lineStyle(3, 0xffdd44, 1);
      ring.strokeRect(pos.x - 36, pos.y - 72, 72, 120);
      this._targetItems.push(ring);

      // Compute type effectiveness label for this target
      let effStr = '', effCol = '#888888';
      if (!isCapture && moveIdOrCapture) {
        const move = MOVES[moveIdOrCapture];
        if (move && move.type && target.type) {
          const mult = getTypeMultiplier(move.type, target.type);
          if (mult > 1)      { effStr = '▲ WEAK';    effCol = '#ff4444'; }
          else if (mult < 1) { effStr = '▼ RESISTS'; effCol = '#4488ff'; }
          else               { effStr = '— NEUTRAL'; effCol = '#888888'; }
        }
      }

      // Target button at bottom of screen
      const btnW = 160, btnH = effStr ? 60 : 44;
      const totalW = targets.length * (btnW + 10) - 10;
      const bx = GAME_WIDTH / 2 - totalW / 2 + i * (btnW + 10);
      const by = PANEL_Y + 38;

      const bg = this.add.graphics();
      const drawBg = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x2a1a00 : 0x1a1200, 1);
        bg.fillRect(bx, by, btnW, btnH);
        bg.lineStyle(2, hover ? 0xffdd44 : 0xaa8800, 1);
        bg.strokeRect(bx, by, btnW, btnH);
      };
      drawBg(false);

      const nameTxt = this.add.text(bx + btnW / 2, by + 13, target.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffdd88',
      }).setOrigin(0.5);

      const hpTxt = this.add.text(bx + btnW / 2, by + 31, `${target.hp}/${target.maxHp} HP`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#aa8844',
      }).setOrigin(0.5);

      this._targetItems.push(bg, nameTxt, hpTxt);

      if (effStr) {
        const effTxt = this.add.text(bx + btnW / 2, by + 40, effStr, {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: effCol,
        }).setOrigin(0.5);
        this._targetItems.push(effTxt);
      }

      const hit = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => drawBg(true));
      hit.on('pointerout',  () => drawBg(false));
      hit.on('pointerdown', () => {
        if (this._targetItems) {
          this._targetItems.forEach(t => t.destroy());
          this._targetItems = [];
        }
        if (isCapture) {
          this._executePlayerAction(actorId, { type: 'capture', targetId: target.id });
        } else {
          this._executePlayerAction(actorId, { type: 'move', moveId: moveIdOrCapture, targetId: target.id });
        }
      });

      this._targetItems.push(hit);
    });
  }

  _clearActionMenu() {
    if (this._actionMenuItems) {
      this._actionMenuItems.forEach(item => item.destroy());
      this._actionMenuItems = [];
    }
    if (this._targetItems) {
      this._targetItems.forEach(item => item.destroy());
      this._targetItems = [];
    }
    if (this._enemyActingText) {
      this._enemyActingText.destroy();
      this._enemyActingText = null;
    }
  }

  _showEnemyActing(actorId) {
    this._clearActionMenu();
    const state = this._manager.getState();
    const actor = state.combatants[actorId];

    this._enemyActingText = this.add.text(GAME_WIDTH / 2, PANEL_Y + 55, `${actor.name} is acting...`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff9966',
    }).setOrigin(0.5);

    this.time.delayedCall(800, () => {
      const action = this._manager.aiPickAction(actorId);
      this._executeEnemyAction(actorId, action);
    });
  }

  // ── Action execution ──────────────────────────────────────────────────────

  _executePlayerAction(actorId, action) {
    this._clearActionMenu();
    this._lastActorId  = actorId;
    this._lastMoveType = (action.type === 'move' && action.moveId) ? (MOVES[action.moveId]?.type || null) : null;
    const result = this._manager.executeAction(actorId, action);
    this._applyResultVisuals(result, () => {
      this._refreshBattleLog();
      this._checkAndContinue();
    });
  }

  _executeEnemyAction(actorId, action) {
    this._lastActorId  = actorId;
    this._lastMoveType = (action.type === 'move' && action.moveId) ? (MOVES[action.moveId]?.type || null) : null;
    const result = this._manager.executeAction(actorId, action);
    this._applyResultVisuals(result, () => {
      this._refreshBattleLog();
      this._checkAndContinue();
    });
  }

  _checkAndContinue() {
    const state = this._manager.getState();
    if (state.outcome !== 'ongoing') {
      this._showOutcomeOverlay(state.outcome);
    } else {
      this._startNextActor();
    }
  }

  // ── Visuals: damage numbers + HP flashes ──────────────────────────────────

  _applyResultVisuals(result, onComplete) {
    // Refresh status labels (ticks/applications from this action)
    this._refreshAllStatus();
    // Refresh HP bars for status tick damage (burn/poison)
    for (const id of Object.keys(this._hpBars)) this._refreshHpBar(id);

    const { hits } = result;
    if (!hits || hits.length === 0) { onComplete(); return; }

    // Determine move type for particle color (from the state log if possible)
    const moveType = this._lastMoveType || null;

    let pending = hits.length;
    const done = () => { if (--pending <= 0) onComplete(); };

    for (const hit of hits) {
      const fromId  = this._lastActorId;
      const fromPos = SLOTS[fromId] || null;
      const toPos   = SLOTS[hit.targetId];
      if (!toPos) { done(); continue; }

      if (hit.dodged || hit.missed || !fromPos || hit.damage === 0) {
        // No animation — just show miss text and done
        this._refreshHpBar(hit.targetId);
        const txt = (hit.dodged || hit.missed) ? 'MISS' : '0';
        this._floatText(toPos.x, toPos.y - 30, txt, '#aabbff', false, done);
        continue;
      }

      // ── Attack particle trail ─────────────────────────────────────────────
      this._animateAttack(fromPos, toPos, moveType, () => {
        this._refreshHpBar(hit.targetId);
        this._flashSprite(hit.targetId);
        if (hit.crit) this.cameras.main.shake(120, 0.006);

        const txt = hit.crit ? `${hit.damage}!` : String(hit.damage);
        const col = hit.crit ? '#ffee44' : '#ffffff';
        this._floatText(toPos.x, toPos.y - 30, txt, col, hit.crit, done);

        // Thorns rebound number
        if (hit.thornDmg > 0 && fromPos) {
          this.time.delayedCall(100, () => {
            this._refreshHpBar(fromId);
            this._floatText(fromPos.x, fromPos.y - 30, `-${hit.thornDmg}`, '#88dd44', false, () => {});
          });
        }
      });
    }
  }

  _animateAttack(fromPos, toPos, moveType, onComplete) {
    const colors = TYPE_PARTICLE_COLORS[moveType] || TYPE_PARTICLE_COLORS.null;
    const count  = 8;
    let arrived  = 0;

    for (let i = 0; i < count; i++) {
      const col = colors[i % colors.length];
      const r   = Phaser.Math.Between(3, 6);
      const p   = this.add.graphics().setDepth(15);
      p.fillStyle(col, 1);
      p.fillCircle(0, 0, r);
      p.x = fromPos.x + Phaser.Math.Between(-6, 6);
      p.y = fromPos.y - 20 + Phaser.Math.Between(-6, 6);

      this.tweens.add({
        targets: p,
        x: toPos.x + Phaser.Math.Between(-5, 5),
        y: toPos.y - 20,
        scaleX: 0.2, scaleY: 0.2,
        alpha: 0,
        duration: 180 + i * 12,
        delay:    i * 14,
        ease:     'Quad.easeIn',
        onComplete: () => {
          p.destroy();
          arrived++;
          if (arrived === count) onComplete();
        },
      });
    }
  }

  _flashSprite(id) {
    const sprite = this._sprites[id];
    if (!sprite) return;
    this.tweens.add({
      targets: sprite,
      alpha: { from: 0.15, to: 1 },
      duration: 80,
      yoyo: false,
      onStart: () => sprite.setAlpha(0.15),
    });
  }

  _floatText(x, y, txt, col, big, onDone) {
    const t = this.add.text(x, y, txt, {
      fontFamily: 'monospace',
      fontSize:   big ? '20px' : '15px',
      fontStyle:  'bold',
      color:      col,
      stroke:     '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: t,
      y: y - 55,
      alpha: { from: 1, to: 0 },
      duration: 750,
      ease: 'Sine.easeOut',
      onComplete: () => { t.destroy(); onDone(); },
    });
  }

  // ── Battle log ────────────────────────────────────────────────────────────

  _refreshBattleLog() {
    if (this._logTexts) this._logTexts.forEach(t => t.destroy());
    this._logTexts = [];

    const state = this._manager.getState();
    const recent = state.log.slice(-4);
    const logX = GAME_WIDTH * 0.62 + 12;
    const logY = PANEL_Y + 10;

    recent.forEach((msg, i) => {
      const alpha = i === recent.length - 1 ? '#ddeeff' : '#7788aa';
      const t = this.add.text(logX, logY + i * 29, msg, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: alpha,
        wordWrap: { width: GAME_WIDTH * 0.38 - 22 },
      });
      this._logTexts.push(t);
    });
  }

  // ── Outcome overlay ───────────────────────────────────────────────────────

  _showOutcomeOverlay(outcome) {
    this._overlayShown = true;
    this._clearActionMenu();

    const state = this._manager.getState();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark overlay
    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(PALETTE.overlay, 0.75);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 480, panelH = 280;
    const panel = this.add.graphics().setDepth(21);
    panel.fillStyle(PALETTE.panel, 1);
    panel.fillRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);
    panel.lineStyle(2, outcome === 'win' ? 0x44cc44 : 0xcc4444, 1);
    panel.strokeRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    // Title
    const titleText = outcome === 'win' ? 'VICTORY!' : 'DEFEATED...';
    const titleCol  = outcome === 'win' ? '#44ff88'  : '#ff6644';
    this.add.text(cx, cy - 80, titleText, {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: titleCol,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);

    // Win: award XP + gold + save captured pets + bestiary + evolutions
    if (outcome === 'win') {
      const captured    = Object.values(state.combatants).filter(c => c.captured);
      const charId      = this._playerData && this._playerData.id;
      const encLevel    = this._manager.getEncounterLevel();
      const earnedXp    = xpForBattle(encLevel);
      const earnedGold  = goldForBattle(encLevel);

      this.add.text(cx, cy - 45, `+${earnedXp} XP  +${earnedGold}g`, {
        fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold',
        color: '#ffee44', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(22);

      const statusText = this.add.text(cx, cy - 20, 'Saving...', {
        fontFamily: 'monospace', fontSize: '13px', color: '#667799',
      }).setOrigin(0.5).setDepth(22);

      const caughtRegion = this._returnData?.regionId || null;
      const petSaves = captured.map(c =>
        ApiClient.savePet(charId, {
          speciesId: c.speciesId || c.id, nickname: null, type: c.type,
          level: c.level || 1, hp_max: c.maxHp, hp_current: c.hp,
          attack: c.attack, defense: c.defense, speed: c.speed,
          caught_region: caughtRegion,
        }).catch(() => null)
      );

      const xpSave   = charId ? ApiClient.awardXp(charId, earnedXp).catch(() => null)    : Promise.resolve(null);
      const goldSave = charId ? ApiClient.awardGold(charId, earnedGold).catch(() => null) : Promise.resolve(null);

      // Bestiary: mark captured species as caught
      const caughtSpecies = captured.map(c => c.speciesId).filter(Boolean);
      const bestiarySave  = (charId && caughtSpecies.length)
        ? ApiClient.updateBestiary(charId, { caught: caughtSpecies }).catch(() => null)
        : Promise.resolve(null);

      // Boss drops + boss defeat quest flag
      const drops        = BOSS_DROPS[this._encounterId] || [];
      const dropSaves    = charId ? drops.map(itemId => ApiClient.awardItem(charId, itemId).catch(() => null)) : [];
      const bossFlagSave = (charId && this._encounterId.startsWith('boss_'))
        ? ApiClient.updateQuestFlags(charId, { [`boss_${this._encounterId}`]: true }).catch(() => null)
        : Promise.resolve(null);

      Promise.all([...petSaves, xpSave, goldSave, bestiarySave, bossFlagSave, ...dropSaves]).then(async results => {
        const xpResult = results[petSaves.length];
        statusText.destroy();

        // Check for evolutions
        const evolutions = [];
        if (charId && xpResult?.petResults) {
          for (const pr of xpResult.petResults) {
            const species = PET_SPECIES[pr.species];
            if (!species?.evolvesTo) continue;
            const prevLevel = pr.newLevel - pr.levelUps;
            if (prevLevel < species.evolvesAtLevel && pr.newLevel >= species.evolvesAtLevel) {
              const evoSpecies = PET_SPECIES[species.evolvesTo];
              const stats = evoSpecies
                ? { hp_max: evoSpecies.baseHp, attack: evoSpecies.baseAtk, defense: evoSpecies.baseDef, speed: evoSpecies.baseSpd }
                : {};
              await ApiClient.evolvePet(charId, pr.id, species.evolvesTo, stats).catch(() => null);
              const newName = evoSpecies?.name || species.evolvesTo;
              evolutions.push({ from: species.name, to: newName });
            }
          }
        }

        const lines = [];
        if (captured.length > 0) lines.push('Captured: ' + captured.map(c => c.name).join(', '));
        for (const ev of evolutions) lines.push(`✦ ${ev.from} evolved into ${ev.to}!`);
        if (xpResult?.charLevelUps > 0) lines.push(`LEVEL UP! Now Lv.${xpResult.character.level}!`);
        for (const p of (xpResult?.petResults || []).filter(p => p.levelUps > 0)) {
          lines.push(`${p.species} → Lv.${p.newLevel}!`);
        }
        for (const itemId of drops) {
          const item = EQUIPMENT[itemId];
          if (item) lines.push(`Dropped: ${item.name}!`);
        }
        lines.forEach((line, i) => {
          const isDrop = line.startsWith('Dropped:');
          const isEvo  = line.startsWith('✦');
          const isCap  = captured.length > 0 && i === 0;
          this.add.text(cx, cy - 5 + i * 22, line, {
            fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
            color: isEvo ? '#aaffee' : isCap ? '#aaffcc' : isDrop ? '#ffcc44' : '#ffee88',
          }).setOrigin(0.5).setDepth(22);
        });

        this._addOutcomeButton(cx, cy + 80 + Math.max(0, lines.length - 3) * 11, 'Continue', '#aabbff', PALETTE.accent,
          () => this.scene.start(this._returnScene, this._returnData));
      });

      return;
    }

    // Defeat buttons — shown immediately (no save needed)
    const btnGap = 16, btnW = 150;
    const btnY = cy + 70;
    this._addOutcomeButton(cx - btnW / 2 - btnGap / 2, btnY, 'Try Again', '#aabbff', PALETTE.accent,
      () => this.scene.start('BattleScene', { encounterId: this._encounterId, playerData: this._playerData }));
    this._addOutcomeButton(cx + btnW / 2 + btnGap / 2, btnY, 'Retreat', '#ff9966', 0xcc6633,
      () => this.scene.start(this._returnScene, this._returnData));
  }

  _addOutcomeButton(cx, y, label, col, bdrCol, action) {
    const btnW = 150, btnH = 36;
    const btnBg = this.add.graphics().setDepth(22);
    btnBg.fillStyle(0x1a1a2e, 1);
    btnBg.fillRect(cx - btnW / 2, y - btnH / 2, btnW, btnH);
    btnBg.lineStyle(2, bdrCol, 1);
    btnBg.strokeRect(cx - btnW / 2, y - btnH / 2, btnW, btnH);
    const btnTxt = this.add.text(cx, y, label, {
      fontFamily: 'monospace', fontSize: '16px', color: col,
    }).setOrigin(0.5).setDepth(23);
    const btnHit = this.add.rectangle(cx, y, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(23);
    btnHit.on('pointerover', () => btnTxt.setColor('#ffffff'));
    btnHit.on('pointerout',  () => btnTxt.setColor(col));
    btnHit.on('pointerdown', action);
  }

  // ── Fallback player data ──────────────────────────────────────────────────

  _fallbackPlayerData() {
    return {
      id: 0,
      name: 'Hero',
      hp_max: 100,
      hp_current: 100,
      attack: 14,
      defense: 8,
      speed: 9,
      staff_id: 'basic_staff',
      hat_id: null,
      robe_id: null,
      boots_id: null,
      relic_id: null,
    };
  }
}
