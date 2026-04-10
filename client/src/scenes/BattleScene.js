/**
 * BattleScene — PvE battle UI.
 *
 * Layout (960×640):
 *   Top strip (y 0–30):   turn counter + terrain label
 *   Enemy row  (y 40–200): enemy hero + beast sprites (colored rects) + HP bars
 *   Log panel  (y 210–370): scrolling battle log (last 6 lines)
 *   Player row (y 380–510): player hero + beast sprites + HP/resource bars
 *   Action bar (y 520–620): hero ability buttons + beast ability buttons
 *
 * init(data) expects:
 *   data.char    — Character entity (from Character.js)
 *   data.beast   — Beast entity (from Beast.js)
 *   data.enemyId — key into ENEMIES (e.g. 'forest_bandit')
 *   data.terrain — optional terrain override
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import BattleManager from '../battle/BattleManager.js';
import { getUnlockedAbilities, CLASSES } from '../data/classAbilities.js';
import { BEAST_ABILITIES } from '../data/beastAbilities.js';
import ApiClient from '../api/ApiClient.js';

// ── Palette ────────────────────────────────────────────────────────────────
const P = {
  bg: 0x0a0a0f, panel: 0x12121e, border: 0x2a2a4a,
  accent: 0x6688ff, dim: 0x334488,
  land: 0x88cc44, sky: 0x44aaff, water: 0x44ddcc,
  warrior: 0xff8833, mage: 0x9966ff, assassin: 0x44cc88,
  enemy: 0xff4444, enemyBeast: 0xff6644,
  player: 0x4488ff, playerBeast: 0x44ffaa,
  hp: 0x44cc44, hpLow: 0xff4444, resource: 0x4488ff, mana: 0x9955ff, combo: 0xffcc44, stamina: 0xffaa22,
  text: 0xddeeff, dim2: 0x667799, gold: 0xffcc44,
  btnNormal: 0x1e1e3a, btnHover: 0x2a2a5a, btnActive: 0x334488, btnDisabled: 0x111122,
  logBg: 0x0d0d1a,
  hit: 0xff4444, heal: 0x44ff88, crit: 0xffff44,
};

const TERRAIN_COLORS = {
  forest: 0x224422, sky: 0x112244, coastal: 0x114433,
  cavern: 0x221122, volcanic: 0x442211, tundra: 0x222244,
};

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this._char    = data.char;
    this._beast   = data.beast;
    this._enemyId = data.enemyId || 'forest_bandit';
    this._terrain = data.terrain || null;
    this._animating = false;
    this._selectedHeroAbility  = null;
    this._selectedBeastAbility = null;
  }

  create() {
    // Build BattleManager (game logic — no Phaser deps)
    // Pass raw stat objects; BattleManager picks the fields it needs.
    this._mgr = new BattleManager(
      this._charStats(this._char),
      this._beastStats(this._beast),
      this._enemyId,
      this._terrain
    );

    const s = this._mgr.getState();

    // ── Background ────────────────────────────────────────────────────────
    const terrainColor = TERRAIN_COLORS[s.terrain] || TERRAIN_COLORS.forest;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, P.bg);
    this.add.rectangle(GAME_WIDTH / 2, 150, GAME_WIDTH, 300, terrainColor, 0.4);

    // ── Top bar ────────────────────────────────────────────────────────────
    this._turnLabel   = this.add.text(12, 8, 'Turn 0', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', color: '#aabbff' });
    this._terrainLabel = this.add.text(GAME_WIDTH / 2, 8, `⛰ ${s.terrain.toUpperCase()}`, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '12px', color: '#667799',
    }).setOrigin(0.5, 0);
    this._phaseLabel = this.add.text(GAME_WIDTH - 8, 8, 'SELECT', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '12px', color: '#ffcc44',
    }).setOrigin(1, 0);

    // ── Build sprite/bar groups ────────────────────────────────────────────
    this._enemyGroup  = this._buildCombatantDisplay('enemy',  350, 110, s.enemy.hero,  s.enemy.beast);
    this._playerGroup = this._buildCombatantDisplay('player', 350, 430, s.player.hero, s.player.beast);

    // ── Battle log ────────────────────────────────────────────────────────
    this._buildLog();

    // ── Action buttons ────────────────────────────────────────────────────
    this._buildActionBar(s);

    // ── Fight button ──────────────────────────────────────────────────────
    this._fightBtn = this._makeButton(GAME_WIDTH - 80, 580, 140, 40, 'FIGHT →', P.accent, () => this._fight());

    // Initial log
    this._pushLog(s.log[0] || '⚔ Battle begins!');
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Layout builders
  // ────────────────────────────────────────────────────────────────────────

  _buildCombatantDisplay(side, cx, cy, hero, beast) {
    const isEnemy = side === 'enemy';
    const heroColor  = isEnemy ? P.enemy      : P.player;
    const beastColor = isEnemy ? P.enemyBeast : P.playerBeast;

    const heroX  = cx - 120;
    const beastX = cx + 120;

    // Sprites (colored rectangles)
    const heroRect  = this.add.rectangle(heroX,  cy, 80, 100, heroColor,  0.8).setStrokeStyle(2, 0xffffff, 0.4);
    const beastRect = this.add.rectangle(beastX, cy, 80, 100, beastColor, 0.8).setStrokeStyle(2, 0xffffff, 0.3);

    // Labels
    this.add.text(heroX,  cy - 62, hero.name,  { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#ddeeff' }).setOrigin(0.5);
    this.add.text(beastX, cy - 62, beast.name, { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#ddeeff' }).setOrigin(0.5);

    // HP bars
    const heroHpBar  = this._buildBar(heroX,  cy + 58, 90, hero.hp,  hero.hpMax,  P.hp);
    const beastHpBar = this._buildBar(beastX, cy + 58, 90, beast.hp, beast.hpMax, P.hp);

    // Resource bar (player only)
    let resourceBar = null;
    let staminaBar  = null;
    if (!isEnemy) {
      const resColor = hero.resource === 'mana' ? P.mana : hero.resource === 'combo' ? P.combo : P.resource;
      resourceBar = this._buildBar(heroX,  cy + 70, 90, hero.resourceCurrent,  hero.resourceMax,  resColor);
      staminaBar  = this._buildBar(beastX, cy + 70, 90, beast.staminaCurrent,  beast.staminaMax,  P.stamina);
    }

    // HP text overlays
    const heroHpText  = this.add.text(heroX,  cy + 57, `${hero.hp}/${hero.hpMax}`,   { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '9px', color: '#ffffff' }).setOrigin(0.5);
    const beastHpText = this.add.text(beastX, cy + 57, `${beast.hp}/${beast.hpMax}`, { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '9px', color: '#ffffff' }).setOrigin(0.5);

    return { heroRect, beastRect, heroHpBar, beastHpBar, resourceBar, staminaBar, heroHpText, beastHpText, hero, beast };
  }

  _buildBar(cx, cy, width, current, max, color) {
    const bg  = this.add.rectangle(cx, cy, width, 7, 0x000000, 0.7);
    const pct = max > 0 ? Math.max(0, current / max) : 0;
    const fill = this.add.rectangle(cx - width / 2 + (width * pct) / 2, cy, width * pct, 7, color, 1);
    return { bg, fill, width, max };
  }

  _updateBar(barObj, current, max) {
    const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    barObj.fill.width  = barObj.width * pct;
    barObj.fill.x      = barObj.bg.x - barObj.width / 2 + (barObj.width * pct) / 2;
    barObj.fill.setFillStyle(pct < 0.25 ? P.hpLow : P.hp);
  }

  _buildLog() {
    this.add.rectangle(GAME_WIDTH / 2, 290, GAME_WIDTH - 20, 160, P.logBg, 0.85).setStrokeStyle(1, P.border);
    this._logLines = [];
    for (let i = 0; i < 6; i++) {
      const t = this.add.text(20, 216 + i * 24, '', {
        fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '12px', color: '#99bbcc', wordWrap: { width: GAME_WIDTH - 44 },
      });
      this._logLines.push(t);
    }
    this._logBuffer = [];
  }

  _pushLog(msg) {
    if (!msg) return;
    this._logBuffer.push(msg);
    const last6 = this._logBuffer.slice(-6);
    last6.forEach((line, i) => {
      this._logLines[i].setText(line);
      this._logLines[i].setAlpha(0.5 + 0.5 * (i / Math.max(1, last6.length - 1)));
    });
    // Clear unused lines
    for (let i = last6.length; i < 6; i++) this._logLines[i].setText('');
  }

  _buildActionBar(s) {
    // Panel background
    this.add.rectangle(GAME_WIDTH / 2, 578, GAME_WIDTH, 124, P.panel, 0.95).setStrokeStyle(1, P.border);

    // Hero label
    this.add.text(10, 522, 'HERO:', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#aabbff' });
    // Beast label
    this.add.text(10, 570, 'BEAST:', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#aabbff' });

    this._heroButtons  = [];
    this._beastButtons = [];

    this._buildHeroButtons(s);
    this._buildBeastButtons(s);
  }

  _buildHeroButtons(s) {
    const hero = s.player.hero;

    // Prefer the hero's stored unlocked abilities (from server); fall back to level-based lookup.
    let abilities;
    const stored = hero.unlockedAbilities;
    if (stored && stored.length > 0) {
      abilities = stored.map(id => {
        for (const cls of Object.values(CLASSES)) {
          const ab = cls.abilities.find(a => a.id === id);
          if (ab) return ab;
        }
        return null;
      }).filter(Boolean);
    } else {
      abilities = getUnlockedAbilities(hero.heroClass, this._char.level || 1);
    }

    const allAbils = [
      { id: 'basic_attack', name: 'Attack', cost: 0, costType: 'none', type: 'physical' },
      { id: 'defend',       name: 'Defend', cost: 0, costType: 'none', type: 'defend'   },
      ...abilities,
    ];

    const maxShow = 7;
    const shown   = allAbils.slice(0, maxShow);
    const startX  = 60;
    const spacing = 122;

    shown.forEach((ab, i) => {
      const x = startX + i * spacing;
      const canAfford = this._canAfford(ab, hero);
      const btn = this._makeAbilityButton(x, 538, 114, 30, ab, canAfford, () => {
        this._selectedHeroAbility = ab.id;
        this._refreshHeroSelection(ab.id);
      });
      this._heroButtons.push({ btn, ab });
    });
  }

  _buildBeastButtons(s) {
    const beast    = s.player.beast;
    const abilities = (beast.abilities || []).map(id => BEAST_ABILITIES[id]).filter(Boolean);
    const allAbils  = [
      { id: 'basic_attack', name: 'Attack', cost: 0, costType: 'none', type: 'physical' },
      ...abilities,
    ];

    const maxShow = 5;
    const shown   = allAbils.slice(0, maxShow);
    const startX  = 60;
    const spacing = 122;

    shown.forEach((ab, i) => {
      const x = startX + i * spacing;
      const canAfford = beast.staminaCurrent > 0 || ab.id === 'basic_attack';
      const btn = this._makeAbilityButton(x, 586, 114, 30, ab, canAfford, () => {
        this._selectedBeastAbility = ab.id;
        this._refreshBeastSelection(ab.id);
      });
      this._beastButtons.push({ btn, ab });
    });
  }

  _makeAbilityButton(x, y, w, h, ab, enabled, onClick) {
    const bg = this.add.rectangle(x, y, w, h, enabled ? P.btnNormal : P.btnDisabled)
      .setStrokeStyle(1, enabled ? P.border : 0x111111)
      .setInteractive({ useHandCursor: enabled });

    const label = this.add.text(x, y - 6, ab.name, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '10px',
      color: enabled ? '#ddeeff' : '#445566',
    }).setOrigin(0.5);

    const costStr = ab.cost > 0 ? `${ab.cost} ${ab.costType}` : '';
    this.add.text(x, y + 6, costStr, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '8px', color: '#667799',
    }).setOrigin(0.5);

    if (enabled) {
      bg.on('pointerover', () => { if (!this._animating) bg.setFillStyle(P.btnHover); });
      bg.on('pointerout',  () => {
        const sel = this._selectedHeroAbility === ab.id || this._selectedBeastAbility === ab.id;
        bg.setFillStyle(sel ? P.btnActive : P.btnNormal);
      });
      bg.on('pointerdown', () => { if (!this._animating) onClick(); });
    }

    return { bg, label, ab };
  }

  _makeButton(x, y, w, h, text, color, onClick) {
    const bg = this.add.rectangle(x, y, w, h, color, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, text, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setAlpha(1));
    bg.on('pointerout',  () => bg.setAlpha(0.9));
    bg.on('pointerdown', () => onClick());

    return { bg, label };
  }

  _refreshHeroSelection(selectedId) {
    this._heroButtons.forEach(({ btn, ab }) => {
      const sel = ab.id === selectedId;
      btn.bg.setFillStyle(sel ? P.btnActive : P.btnNormal);
      btn.bg.setStrokeStyle(1, sel ? P.accent : P.border);
    });
  }

  _refreshBeastSelection(selectedId) {
    this._beastButtons.forEach(({ btn, ab }) => {
      const sel = ab.id === selectedId;
      btn.bg.setFillStyle(sel ? P.btnActive : P.btnNormal);
      btn.bg.setStrokeStyle(1, sel ? P.accent : P.border);
    });
  }

  _canAfford(ab, hero) {
    if (!ab.cost || ab.costType === 'none') return true;
    return (hero.resourceCurrent || 0) >= ab.cost;
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Fight logic
  // ────────────────────────────────────────────────────────────────────────

  _fight() {
    if (this._animating || this._mgr.isOver()) return;
    if (!this._selectedHeroAbility || !this._selectedBeastAbility) {
      this._pushLog('⚠ Choose actions for both your hero and beast first!');
      return;
    }

    this._animating = true;
    this._phaseLabel.setText('RESOLVING…');
    this._fightBtn.bg.setAlpha(0.4);

    const events = this._mgr.submitPlayerActions(this._selectedHeroAbility, this._selectedBeastAbility);

    // Reset selections
    this._selectedHeroAbility  = null;
    this._selectedBeastAbility = null;
    this._heroButtons.forEach(({ btn })  => btn.bg.setFillStyle(P.btnNormal).setStrokeStyle(1, P.border));
    this._beastButtons.forEach(({ btn }) => btn.bg.setFillStyle(P.btnNormal).setStrokeStyle(1, P.border));

    this._playEvents(events, 0);
  }

  _playEvents(events, idx) {
    if (idx >= events.length) {
      this._afterEvents();
      return;
    }

    const ev = events[idx];
    const delay = this._handleEvent(ev);

    this.time.delayedCall(delay, () => this._playEvents(events, idx + 1));
  }

  _handleEvent(ev) {
    if (ev.result) {
      // Standard combat event
      const result = ev.result;
      if (result.log) this._pushLog(result.log);

      // Flash the target rect
      const targetSide = ev.targetId?.startsWith('player') ? 'player' : 'enemy';
      const targetIsHero = ev.targetId?.endsWith('_hero');
      const group = targetSide === 'player' ? this._playerGroup : this._enemyGroup;
      const rect  = targetIsHero ? group.heroRect : group.beastRect;
      this._flashRect(rect, result.damage > 0 ? P.hit : P.heal);

      // Show damage floater
      if (result.damage > 0) this._floater(rect.x, rect.y, `-${result.damage}`, '#ff4444');
      if (result.heal   > 0) this._floater(rect.x, rect.y, `+${result.heal}`,  '#44ff88');
    } else if (ev.type === 'dot_tick') {
      const side  = ev.owner === 'Player' ? 'player' : 'enemy';
      const group = side === 'player' ? this._playerGroup : this._enemyGroup;
      this._flashRect(group.heroRect, 0x884444);
      this._floater(group.heroRect.x, group.heroRect.y, `-${ev.damage}`, '#ff8844');
      ev.logs?.forEach(l => this._pushLog(l));
    } else if (ev.type === 'boss_phase') {
      this._pushLog(`⚡ ${ev.log}`);
      this._flashRect(this._enemyGroup.heroRect, 0xffff00);
    } else if (ev.type === 'victory') {
      this._pushLog(`🏆 Victory! +${ev.xpReward} XP`);
    } else if (ev.type === 'defeat') {
      this._pushLog('💀 You were defeated…');
    }

    return ev.type === 'boss_phase' ? 600 : 400;
  }

  _afterEvents() {
    const s = this._mgr.getState();

    // Update all bars + HP text
    this._updateBar(this._playerGroup.heroHpBar,  s.player.hero.hp,  s.player.hero.hpMax);
    this._updateBar(this._playerGroup.beastHpBar, s.player.beast.hp, s.player.beast.hpMax);
    this._updateBar(this._enemyGroup.heroHpBar,   s.enemy.hero.hp,   s.enemy.hero.hpMax);
    this._updateBar(this._enemyGroup.beastHpBar,  s.enemy.beast.hp,  s.enemy.beast.hpMax);

    if (this._playerGroup.resourceBar) {
      this._updateBar(this._playerGroup.resourceBar, s.player.hero.resourceCurrent, s.player.hero.resourceMax);
    }
    if (this._playerGroup.staminaBar) {
      this._updateBar(this._playerGroup.staminaBar, s.player.beast.staminaCurrent, s.player.beast.staminaMax || 3);
    }

    this._playerGroup.heroHpText.setText(`${s.player.hero.hp}/${s.player.hero.hpMax}`);
    this._playerGroup.beastHpText.setText(`${s.player.beast.hp}/${s.player.beast.hpMax}`);
    this._enemyGroup.heroHpText.setText(`${s.enemy.hero.hp}/${s.enemy.hero.hpMax}`);
    this._enemyGroup.beastHpText.setText(`${s.enemy.beast.hp}/${s.enemy.beast.hpMax}`);

    this._turnLabel.setText(`Turn ${s.turn}`);

    if (this._mgr.isOver()) {
      this._phaseLabel.setText(s.phase === 'victory' ? 'VICTORY!' : 'DEFEAT');
      this._fightBtn.label.setText(s.phase === 'victory' ? '← CONTINUE' : '← RETRY');
      this._fightBtn.bg.setFillStyle(s.phase === 'victory' ? 0x228833 : 0x882222);
      this._fightBtn.bg.setAlpha(1);
      this._fightBtn.bg.removeAllListeners();
      this._fightBtn.bg.on('pointerdown', () => this._endBattle(s));
      this._animating = false;

      // Report result to server
      if (s.phase === 'victory') {
        const xpReward = s.enemy.template.xpReward || 0;
        ApiClient.postBattleResult({
          characterId: this._char.id,
          beastId:     this._beast.id,
          xpGained:    xpReward,
          beastXpGained: Math.floor(xpReward * 0.8),
          outcome:     'victory',
        }).catch(() => {}); // fire and forget — don't block UI
      }
    } else {
      this._phaseLabel.setText('SELECT');
      this._fightBtn.bg.setAlpha(1);
      this._animating = false;

      // Refresh button affordability
      this._refreshButtonAffordability(s);
    }
  }

  _refreshButtonAffordability(s) {
    const hero = s.player.hero;
    this._heroButtons.forEach(({ btn, ab }) => {
      const canAfford = this._canAfford(ab, hero);
      btn.bg.setFillStyle(canAfford ? P.btnNormal : P.btnDisabled);
      btn.label.setColor(canAfford ? '#ddeeff' : '#445566');
    });

    const beast = s.player.beast;
    this._beastButtons.forEach(({ btn, ab }) => {
      const canAfford = beast.staminaCurrent > 0 || ab.id === 'basic_attack';
      btn.bg.setFillStyle(canAfford ? P.btnNormal : P.btnDisabled);
      btn.label.setColor(canAfford ? '#ddeeff' : '#445566');
    });
  }

  _endBattle(s) {
    // Return to main menu for now; WorldMapScene in Phase 5
    this.scene.start('MainMenuScene');
  }

  /** Normalize a Character entity or plain object into BattleManager shape. */
  _charStats(c) {
    // Support both Character instances and plain API objects
    return {
      name:               c.name,
      heroClass:          c.heroClass  || c.class,
      hpCurrent:          c.hpCurrent  ?? c.hp_current,
      hpMax:              c.hpMax      ?? c.hp_max,
      attack:             c.attack,
      defense:            c.defense,
      speed:              c.speed,
      magicPower:         c.magicPower ?? c.magic_power ?? null,
      unlockedAbilities:  c.unlockedAbilities ?? (c.unlocked_abilities ? JSON.parse(c.unlocked_abilities) : []),
    };
  }

  /** Normalize a Beast entity or plain object into BattleManager shape. */
  _beastStats(b) {
    return {
      displayName:        b.displayName  || b.nickname || b.templateId || b.beast_template_id,
      templateId:         b.templateId   || b.beast_template_id,
      type:               b.type         || b.beast_type,
      hpCurrent:          b.hpCurrent    ?? b.hp_current,
      hpMax:              b.hpMax        ?? b.hp_max,
      attack:             b.attack,
      defense:            b.defense,
      speed:              b.speed,
      staminaCurrent:     b.staminaCurrent ?? b.stamina_current ?? 3,
      unlockedAbilities:  b.unlockedAbilities ?? (b.unlocked_abilities ? JSON.parse(b.unlocked_abilities) : []),
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Visual helpers
  // ────────────────────────────────────────────────────────────────────────

  _flashRect(rect, color) {
    const orig = rect.fillColor;
    rect.setFillStyle(color);
    this.time.delayedCall(150, () => rect.setFillStyle(orig));
  }

  _floater(x, y, text, color) {
    const t = this.add.text(x, y - 40, text, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '14px', fontStyle: 'bold', color,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t, y: y - 90, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }
}
