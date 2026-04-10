import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import ApiClient from '../api/ApiClient.js';
import Character from '../entities/Character.js';
import Beast from '../entities/Beast.js';

const P = {
  bg: 0x0a0a0f, panel: 0x12121e, border: 0x2a2a4a,
  accent: 0x6688ff, accentDim: 0x334488,
  land: 0x88cc44, sky: 0x44aaff, water: 0x44ddcc,
  warrior: 0xff8833, mage: 0x9966ff, assassin: 0x44cc88,
  text: 0xddeeff, gold: 0xffcc44,
};

const CLASSES = [
  { id: 'warrior',  name: 'Warrior',  color: P.warrior,  symbol: '⚔', desc: 'High HP · Energy · Setup combos' },
  { id: 'mage',     name: 'Mage',     color: P.mage,     symbol: '✦', desc: 'Glass cannon · Mana · AoE spells' },
  { id: 'assassin', name: 'Assassin', color: P.assassin, symbol: '◆', desc: 'Fast · Combo Points · DoT finishers' },
];

const BEASTS = [
  { id: 'wolf',   type: 'land',  name: 'Wolf',   symbol: '🐺', desc: 'Bleed · burst damage' },
  { id: 'bear',   type: 'land',  name: 'Bear',   symbol: '🐻', desc: 'Tank · DEF debuff' },
  { id: 'boar',   type: 'land',  name: 'Boar',   symbol: '🐗', desc: 'Rampage · momentum' },
  { id: 'hawk',   type: 'sky',   name: 'Hawk',   symbol: '🦅', desc: 'Crit · DEF pierce' },
  { id: 'owl',    type: 'sky',   name: 'Owl',    symbol: '🦉', desc: 'Silence · mage sync' },
  { id: 'bat',    type: 'sky',   name: 'Bat',    symbol: '🦇', desc: 'Life steal · speed' },
  { id: 'eel',    type: 'water', name: 'Eel',    symbol: '⚡', desc: 'Paralyze · chain hits' },
  { id: 'crab',   type: 'water', name: 'Crab',   symbol: '🦀', desc: 'Tank · ATK reduction' },
  { id: 'turtle', type: 'water', name: 'Turtle', symbol: '🐢', desc: 'Shield hero · sacrifice' },
];

const TYPE_COLOR = { land: P.land, sky: P.sky, water: P.water };

export default class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super('CharacterCreateScene');
  }

  init(data) {
    this._user = data.user;
    this._selClass = 0;
    this._selBeast = 0;
    this._nameInput = null;
    this._errorText = null;
    this._classBorders = [];
    this._beastBorders = [];
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, P.bg);

    this.add.text(GAME_WIDTH / 2, 24, 'CREATE YOUR HERO', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '16px', fontStyle: 'bold', color: '#aabbff', letterSpacing: 3,
    }).setOrigin(0.5);

    this._drawClasses();
    this._drawBeasts();
    this._drawNameRow();
    this._drawCreateButton();
  }

  // ─── Class picker ───────────────────────────────────────────────────────────

  _drawClasses() {
    this.add.text(60, 52, 'CLASS', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#445566', letterSpacing: 2 }).setOrigin(0, 0.5);

    CLASSES.forEach((cls, i) => {
      const x = 120 + i * 260, y = 120;
      const w = 220, h = 120;

      const border = this.add.rectangle(x, y, w + 2, h + 2, i === this._selClass ? cls.color : P.border);
      this._classBorders.push({ border, cls, i });

      const bg = this.add.rectangle(x, y, w, h, P.panel).setInteractive({ useHandCursor: true });
      this.add.text(x - w / 2 + 16, y - 28, cls.symbol, { fontSize: '22px' }).setOrigin(0, 0.5);
      this.add.text(x - w / 2 + 50, y - 28, cls.name.toUpperCase(), {
        fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '14px', fontStyle: 'bold',
        color: '#' + cls.color.toString(16).padStart(6, '0'),
      }).setOrigin(0, 0.5);
      this.add.text(x - w / 2 + 14, y, cls.desc, {
        fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#889aaa', wordWrap: { width: w - 20 },
      }).setOrigin(0, 0.5);

      bg.on('pointerdown', () => {
        this._selClass = i;
        this._classBorders.forEach(({ border: b, cls: c, i: idx }) =>
          b.setFillStyle(idx === this._selClass ? c.color : P.border));
        this._updateSynergy();
      });
    });
  }

  // ─── Beast picker ───────────────────────────────────────────────────────────

  _drawBeasts() {
    this.add.text(60, 178, 'SPIRIT BEAST', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#445566', letterSpacing: 2 }).setOrigin(0, 0.5);

    const types = ['land', 'sky', 'water'];
    types.forEach((type, ti) => {
      const tx = 120 + ti * 280;
      this.add.text(tx, 198, type.toUpperCase(), {
        fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '10px', color: '#' + TYPE_COLOR[type].toString(16).padStart(6, '0'), letterSpacing: 2,
      }).setOrigin(0.5);

      BEASTS.filter(b => b.type === type).forEach((beast, bi) => {
        const bIdx = BEASTS.indexOf(beast);
        const x = tx + (bi - 1) * 88;
        const y = 270;
        const w = 80, h = 100;

        const border = this.add.rectangle(x, y, w + 2, h + 2, bIdx === this._selBeast ? TYPE_COLOR[type] : P.border);
        this._beastBorders.push({ border, beast, bIdx });

        const bg = this.add.rectangle(x, y, w, h, P.panel).setInteractive({ useHandCursor: true });
        this.add.text(x, y - 26, beast.symbol, { fontSize: '20px' }).setOrigin(0.5);
        this.add.text(x, y + 6, beast.name, { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '10px', color: '#ddeeff' }).setOrigin(0.5);
        this.add.text(x, y + 24, beast.desc, {
          fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '9px', color: '#667799', wordWrap: { width: w - 6 }, align: 'center',
        }).setOrigin(0.5);

        bg.on('pointerdown', () => {
          this._selBeast = bIdx;
          this._beastBorders.forEach(({ border: b, beast: bs, bIdx: idx }) =>
            b.setFillStyle(idx === this._selBeast ? TYPE_COLOR[bs.type] : P.border));
          this._updateSynergy();
        });
      });
    });
  }

  // ─── Synergy hint ───────────────────────────────────────────────────────────

  _drawSynergyRow() {
    this._synergyText = this.add.text(GAME_WIDTH / 2, 342, '', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#6688ff', align: 'center',
    }).setOrigin(0.5);
    this._updateSynergy();
  }

  _updateSynergy() {
    if (!this._synergyText) return;
    const SYNERGIES = {
      warrior: { land: '⚔🐺 Bleed + Open Wound Strike burst', sky: '⚔🦉 Silence = guaranteed stun', water: '⚔⚡ Paralyze = full hit + no counter' },
      mage:    { land: '✦🐻 DEF debuff boosts spells', sky: '✦🦉 Silence = Interrupt Blast 2×', water: '✦⚡ Blizzard + Eel = Electrified chain' },
      assassin:{ land: '◆🐺 Bleed + Poison = Hemorrhage', sky: '◆🦇 Life steal = bonus Combo Points', water: '◆🦀 ATK debuff = safe finisher window' },
    };
    const cls = CLASSES[this._selClass];
    const beast = BEASTS[this._selBeast];
    const hint = SYNERGIES[cls.id]?.[beast.type];
    this._synergyText.setText(hint ? `✦ ${hint}` : '');
  }

  // ─── Name + create ──────────────────────────────────────────────────────────

  _drawNameRow() {
    this._drawSynergyRow();

    this.add.text(GAME_WIDTH / 2 - 200, 378, 'Hero name:', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', color: '#667799',
    }).setOrigin(0, 0.5);

    this._nameInput = this.add.dom(GAME_WIDTH / 2 + 30, 378).createElement('input');
    this._nameInput.node.type = 'text';
    this._nameInput.node.placeholder = 'Enter a name…';
    this._nameInput.node.maxLength = 20;
    this._nameInput.node.style.cssText = `
      width: 220px; height: 32px; background: #1a1a2e; border: 1px solid #2a2a4a;
      color: #ddeeff; font-family: 'Share Tech Mono', 'Courier New', monospace; font-size: 14px; padding: 0 10px;
      outline: none; box-sizing: border-box;
    `;
    this._nameInput.node.addEventListener('focus', () => { this._nameInput.node.style.borderColor = '#6688ff'; });
    this._nameInput.node.addEventListener('blur',  () => { this._nameInput.node.style.borderColor = '#2a2a4a'; });
    this._nameInput.node.addEventListener('keydown', e => { if (e.key === 'Enter') this._submit(); });
    setTimeout(() => this._nameInput.node.focus(), 80);

    this._errorText = this.add.text(GAME_WIDTH / 2, 404, '', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#ff4455',
    }).setOrigin(0.5);
  }

  _drawCreateButton() {
    const backBtn = this.add.rectangle(80, GAME_HEIGHT - 40, 120, 36, P.panel).setInteractive({ useHandCursor: true });
    this.add.text(80, GAME_HEIGHT - 40, '← Menu', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', color: '#667799' }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { this._cleanup(); this.scene.start('MainMenuScene'); });

    this._createBtn = this.add.rectangle(GAME_WIDTH - 120, GAME_HEIGHT - 40, 200, 36, P.accent).setInteractive({ useHandCursor: true });
    this._createLabel = this.add.text(GAME_WIDTH - 120, GAME_HEIGHT - 40, 'Create Hero →', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    this._createBtn.on('pointerover', () => this._createBtn.setFillStyle(0x8899ff));
    this._createBtn.on('pointerout',  () => this._createBtn.setFillStyle(P.accent));
    this._createBtn.on('pointerdown', () => this._submit());
  }

  async _submit() {
    const name = this._nameInput?.node?.value?.trim();
    if (!name || name.length < 2) {
      this._errorText.setText('Name must be at least 2 characters');
      return;
    }
    this._errorText.setText('');
    this._createBtn.setInteractive(false);
    this._createLabel.setText('Creating…');

    try {
      const cls   = CLASSES[this._selClass];
      const beast = BEASTS[this._selBeast];
      const { character, beast: beastData } = await ApiClient.createCharacter(name, cls.id, beast.id);
      this._cleanup();
      this._showSuccess(new Character(character), new Beast(beastData));
    } catch (err) {
      this._errorText.setText(err.message || 'Failed to create character');
      this._createBtn.setInteractive(true);
      this._createLabel.setText('Create Hero →');
    }
  }

  _showSuccess(character, beast) {
    // Store for test API / programmatic access
    this._lastChar  = character;
    this._lastBeast = beast;

    this.children.removeAll(true);
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, P.bg);

    const bDef = BEASTS.find(b => b.id === beast.templateId);
    const cDef = CLASSES.find(c => c.id === character.heroClass);

    this.add.text(cx, cy - 80, '✦', { fontSize: '40px', color: '#ffcc44' }).setOrigin(0.5);
    this.add.text(cx, cy - 36, character.name, { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '26px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, cy - 4, `${cDef?.symbol} ${cDef?.name}  ·  ${bDef?.symbol} ${bDef?.name}`, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '15px', color: '#aabbff',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(cx, cy + 60, 220, 38, P.accent).setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 60, '⚔ Start Battle →', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('BattleScene', {
      char:    character,
      beast:   beast,
      enemyId: 'forest_bandit',
      terrain: 'forest',
    }));
  }

  _cleanup() {
    if (this._nameInput?.node) this._nameInput.node.remove();
  }
}
