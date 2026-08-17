import Phaser from 'phaser';
import ApiClient from '../api/ApiClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

// ─── Colour maps ──────────────────────────────────────────────────────────────

const SKIN_TONES = {
  pale:   0xffe0c8,
  light:  0xf5c89a,
  medium: 0xd4a574,
  tan:    0xb8864e,
  dark:   0x6b3d1e,
};

const HAIR_COLOURS = {
  black:  0x1a1a1a,
  brown:  0x4a2800,
  blonde: 0xe8c84a,
  red:    0xcc3300,
  white:  0xeeeeff,
  blue:   0x4466cc,
};

const ROBE_COLOURS = {
  blue:   0x1e3a6e,
  red:    0x6e1e1e,
  green:  0x1e5e2e,
  purple: 0x4a1e6e,
  grey:   0x3a3a4a,
  black:  0x12121e,
};

const HAT_COLOURS = { ...ROBE_COLOURS };

// ─── DOM HTML (name input + button only) ──────────────────────────────────────

const FORM_HTML = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  #sab-create {
    width: 310px;
    font-family: monospace;
    color: #ddeeff;
  }

  label {
    display: block;
    font-size: 11px;
    letter-spacing: 1px;
    color: #667799;
    margin-bottom: 5px;
  }

  input[type="text"] {
    width: 100%;
    background: #12121e;
    border: 1px solid #2a2a4a;
    color: #ddeeff;
    font-family: monospace;
    font-size: 14px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus { border-color: #6688ff; }

  input::placeholder { color: #334466; }

  .submit-btn {
    width: 100%;
    margin-top: 12px;
    padding: 10px;
    background: #1e2050;
    border: 1px solid #6688ff;
    color: #aabbff;
    font-family: monospace;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .submit-btn:hover {
    background: #334488;
    color: #ffffff;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  #create-error {
    margin-top: 8px;
    font-size: 12px;
    color: #ff6666;
    min-height: 16px;
    line-height: 1.4;
  }
</style>

<div id="sab-create">
  <label>CHARACTER NAME</label>
  <input type="text" id="char-name" maxlength="20" autocomplete="off" spellcheck="false" placeholder="enter a name" />
  <button class="submit-btn" id="begin-btn">BEGIN JOURNEY</button>
  <div id="create-error"></div>
</div>
`;

// ─── Scene ────────────────────────────────────────────────────────────────────

export default class CharacterCreateScene extends Phaser.Scene {
  constructor() {
    super('CharacterCreateScene');
  }

  create() {
    // Default appearance state
    this._appearance = {
      bodyType:   'standard',
      skinTone:   'medium',
      hairStyle:  'short',
      hairColour: 'brown',
      robeColour: 'blue',
      hatColour:  'blue',
    };

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0f);

    const gfx = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      gfx.fillRect(x, y, 1, 1);
    }

    // ── Title ────────────────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 38, 'CAPTURE', {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#6688ff',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 76, 'New Journey', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#667799',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x2a2a4a, 0.8);
    divGfx.lineBetween(60, 96, GAME_WIDTH - 60, 96);

    // ── Back link ────────────────────────────────────────────────────────────
    const back = this.add.text(20, 20, '< Back', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#445566',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#aabbff'));
    back.on('pointerout',  () => back.setColor('#445566'));
    back.on('pointerdown', () => this.scene.start('LoginScene'));

    // ── Left panel background ────────────────────────────────────────────────
    const leftPanelGfx = this.add.graphics();
    leftPanelGfx.fillStyle(0x0e0e1a, 1);
    leftPanelGfx.fillRect(30, 108, 350, 474);
    leftPanelGfx.lineStyle(1, 0x2a2a4a, 1);
    leftPanelGfx.strokeRect(30, 108, 350, 474);

    // "PREVIEW" label
    this.add.text(215, 122, 'PREVIEW', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#334466',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // ── Right panel background ───────────────────────────────────────────────
    const rightPanelGfx = this.add.graphics();
    rightPanelGfx.fillStyle(0x0e0e1a, 1);
    rightPanelGfx.fillRect(420, 108, 350, 474);
    rightPanelGfx.lineStyle(1, 0x2a2a4a, 1);
    rightPanelGfx.strokeRect(420, 108, 350, 474);

    // ── Character preview (container for dynamic redraws) ────────────────────
    this._charContainer = this.add.container(0, 0);
    this._drawCharacter();

    // ── Right panel controls ─────────────────────────────────────────────────
    this._buildControls();

    // ── DOM form (name + button) ─────────────────────────────────────────────
    this._domEl = this.add.dom(575, 508).createFromHTML(FORM_HTML);
    this._domEl.setOrigin(0.5);
    this._bindForm();
  }

  // ── Character drawing ──────────────────────────────────────────────────────

  _drawCharacter() {
    // Destroy existing graphics
    this._charContainer.removeAll(true);

    const ap = this._appearance;
    const cx = 215;
    const cy = 330;

    const skinCol  = SKIN_TONES[ap.skinTone]   || SKIN_TONES.medium;
    const hairCol  = HAIR_COLOURS[ap.hairColour] || HAIR_COLOURS.brown;
    const robeCol  = ROBE_COLOURS[ap.robeColour] || ROBE_COLOURS.blue;
    const hatCol   = HAT_COLOURS[ap.hatColour]   || HAT_COLOURS.blue;
    const isSlim   = ap.bodyType === 'slim';

    const bodyW    = isSlim ? 24 : 36;
    const bodyH    = 42;
    const headSize = 24;

    const g = this.add.graphics();
    this._charContainer.add(g);

    // ── Legs ────────────────────────────────────────────────────────────────
    g.fillStyle(0x223344, 1);
    g.fillRect(cx - bodyW / 2,           cy + bodyH / 2 + 2, 12, 20);
    g.fillRect(cx + bodyW / 2 - 12,      cy + bodyH / 2 + 2, 12, 20);

    // ── Boots ───────────────────────────────────────────────────────────────
    g.fillStyle(0x3d2200, 1);
    g.fillRect(cx - bodyW / 2 - 1,       cy + bodyH / 2 + 22, 14, 8);
    g.fillRect(cx + bodyW / 2 - 13,      cy + bodyH / 2 + 22, 14, 8);

    // ── Body (robe) ──────────────────────────────────────────────────────────
    g.fillStyle(robeCol, 1);
    g.fillRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH);

    // ── Robe trim ───────────────────────────────────────────────────────────
    g.lineStyle(2, 0x99aabb, 1);
    g.lineBetween(cx - bodyW / 2, cy + bodyH / 2, cx + bodyW / 2, cy + bodyH / 2);

    // ── Arms ─────────────────────────────────────────────────────────────────
    g.fillStyle(skinCol, 1);
    g.fillRect(cx - bodyW / 2 - 12, cy - bodyH / 2, 12, 24);
    g.fillRect(cx + bodyW / 2,      cy - bodyH / 2, 12, 24);

    // ── Staff (right side, from right hand upward) ───────────────────────────
    const staffX = cx + bodyW / 2 + 6;
    g.fillStyle(0xccddff, 1);
    g.fillRect(staffX - 2, cy - bodyH / 2 - 40, 4, 60);
    // Staff orb
    g.fillStyle(0x6688ff, 1);
    g.fillRect(staffX - 5, cy - bodyH / 2 - 45, 10, 10);

    // ── Head ─────────────────────────────────────────────────────────────────
    const headX = cx - headSize / 2;
    const headY = cy - bodyH / 2 - headSize;
    g.fillStyle(skinCol, 1);
    g.fillRect(headX, headY, headSize, headSize);

    // ── Eyes ─────────────────────────────────────────────────────────────────
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(headX + 4,  headY + 8, 4, 4);
    g.fillRect(headX + 16, headY + 8, 4, 4);

    // ── Hair ─────────────────────────────────────────────────────────────────
    g.fillStyle(hairCol, 1);
    // Top strip (all styles)
    g.fillRect(headX - 1, headY - 8, 26, 8);

    if (ap.hairStyle === 'long') {
      // Side strips
      g.fillRect(headX - 1, headY,           8, 20);
      g.fillRect(headX + 17, headY,          8, 20);
    } else if (ap.hairStyle === 'bun') {
      // Small bun square centered above top strip
      g.fillRect(cx - 5, headY - 18, 10, 10);
    }
    // 'short' = just the top strip (already drawn)

    // ── Hat ──────────────────────────────────────────────────────────────────
    const brimW  = isSlim ? 22 : 30;
    const crownW = isSlim ? 12 : 16;
    const crownH = 18;
    g.fillStyle(hatCol, 1);
    // Brim
    g.fillRect(cx - brimW / 2, headY - 14, brimW, 6);
    // Crown
    g.fillRect(cx - crownW / 2, headY - 14 - crownH, crownW, crownH);
  }

  // ── Right-panel controls ───────────────────────────────────────────────────

  _buildControls() {
    const rx = 436; // left edge of right panel content
    const rw = 318; // available width
    let ry = 128;   // current y cursor

    // Helper: section label
    const sectionLabel = (y, text) => {
      this.add.text(rx, y, text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#667799',
        letterSpacing: 1,
      });
    };

    const ROW_GAP = 38;

    // ── Body type ──────────────────────────────────────────────────────────
    sectionLabel(ry, 'BODY TYPE');
    ry += 14;
    this._bodyTypeBtns = this._makeTextToggleRow(
      rx, ry, ['standard', 'slim'], 'bodyType',
      v => { this._appearance.bodyType = v; this._drawCharacter(); }
    );
    ry += ROW_GAP;

    // ── Skin tone ──────────────────────────────────────────────────────────
    sectionLabel(ry, 'SKIN TONE');
    ry += 14;
    this._skinSwatches = this._makeSwatchRow(
      rx, ry, SKIN_TONES, 'skinTone',
      v => { this._appearance.skinTone = v; this._drawCharacter(); }
    );
    ry += ROW_GAP;

    // ── Hair style ─────────────────────────────────────────────────────────
    sectionLabel(ry, 'HAIR STYLE');
    ry += 14;
    this._hairStyleBtns = this._makeTextToggleRow(
      rx, ry, ['short', 'long', 'bun'], 'hairStyle',
      v => { this._appearance.hairStyle = v; this._drawCharacter(); }
    );
    ry += ROW_GAP;

    // ── Hair colour ────────────────────────────────────────────────────────
    sectionLabel(ry, 'HAIR COLOUR');
    ry += 14;
    this._hairColSwatches = this._makeSwatchRow(
      rx, ry, HAIR_COLOURS, 'hairColour',
      v => { this._appearance.hairColour = v; this._drawCharacter(); }
    );
    ry += ROW_GAP;

    // ── Robe colour ────────────────────────────────────────────────────────
    sectionLabel(ry, 'ROBE COLOUR');
    ry += 14;
    this._robeColSwatches = this._makeSwatchRow(
      rx, ry, ROBE_COLOURS, 'robeColour',
      v => { this._appearance.robeColour = v; this._drawCharacter(); }
    );
    ry += ROW_GAP;

    // ── Hat colour ─────────────────────────────────────────────────────────
    sectionLabel(ry, 'HAT COLOUR');
    ry += 14;
    this._hatColSwatches = this._makeSwatchRow(
      rx, ry, HAT_COLOURS, 'hatColour',
      v => { this._appearance.hatColour = v; this._drawCharacter(); }
    );
  }

  /**
   * Creates a row of text toggle buttons.
   * @param {number} x  left x
   * @param {number} y  top y
   * @param {string[]} values  option values (display text capitalised)
   * @param {string} appearanceKey  key in this._appearance
   * @param {Function} onChange
   * @returns {Phaser.GameObjects.Text[]}
   */
  _makeTextToggleRow(x, y, values, appearanceKey, onChange) {
    const btnWidth = 80;
    const btnH     = 22;
    const gap      = 6;
    const buttons  = [];

    values.forEach((val, i) => {
      const bx = x + i * (btnWidth + gap);
      const isActive = this._appearance[appearanceKey] === val;

      const label = val.charAt(0).toUpperCase() + val.slice(1);

      // Background rect
      const bg = this.add.graphics();
      const drawBg = (active) => {
        bg.clear();
        bg.fillStyle(active ? 0x1e2050 : 0x12121e, 1);
        bg.fillRect(bx, y, btnWidth, btnH);
        bg.lineStyle(1, active ? 0x6688ff : 0x2a2a4a, 1);
        bg.strokeRect(bx, y, btnWidth, btnH);
      };
      drawBg(isActive);

      const txt = this.add.text(bx + btnWidth / 2, y + btnH / 2, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: isActive ? '#aabbff' : '#667799',
      }).setOrigin(0.5);

      // Invisible hit area
      const hit = this.add.rectangle(bx + btnWidth / 2, y + btnH / 2, btnWidth, btnH)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        this._appearance[appearanceKey] = val;
        onChange(val);
        // Refresh all buttons in row
        buttons.forEach(b => {
          const active = this._appearance[appearanceKey] === b.val;
          b.drawBg(active);
          b.txt.setColor(active ? '#aabbff' : '#667799');
        });
      });

      hit.on('pointerover', () => {
        if (this._appearance[appearanceKey] !== val) txt.setColor('#aabbcc');
      });
      hit.on('pointerout', () => {
        txt.setColor(this._appearance[appearanceKey] === val ? '#aabbff' : '#667799');
      });

      buttons.push({ val, drawBg, txt });
    });

    return buttons;
  }

  /**
   * Creates a row of coloured square swatches.
   * @param {number} x  left x
   * @param {number} y  top y
   * @param {Object} colourMap  { key: 0xRRGGBB }
   * @param {string} appearanceKey
   * @param {Function} onChange
   * @returns {{ key, bg, outline }[]}
   */
  _makeSwatchRow(x, y, colourMap, appearanceKey, onChange) {
    const size = 20;
    const gap  = 6;
    const entries = Object.entries(colourMap);
    const swatches = [];

    entries.forEach(([key, col], i) => {
      const sx = x + i * (size + gap);
      const isActive = this._appearance[appearanceKey] === key;

      const bg = this.add.graphics();
      const outline = this.add.graphics();

      const drawSwatch = (active) => {
        bg.clear();
        bg.fillStyle(col, 1);
        bg.fillRect(sx, y, size, size);
        outline.clear();
        outline.lineStyle(active ? 2 : 1, active ? 0xffffff : 0x334455, 1);
        outline.strokeRect(sx, y, size, size);
      };
      drawSwatch(isActive);

      const hit = this.add.rectangle(sx + size / 2, y + size / 2, size, size)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        this._appearance[appearanceKey] = key;
        onChange(key);
        swatches.forEach(s => s.drawSwatch(this._appearance[appearanceKey] === s.key));
      });

      hit.on('pointerover', () => {
        outline.clear();
        outline.lineStyle(2, 0xaabbff, 1);
        outline.strokeRect(sx, y, size, size);
      });

      hit.on('pointerout', () => {
        drawSwatch(this._appearance[appearanceKey] === key);
      });

      swatches.push({ key, drawSwatch });
    });

    return swatches;
  }

  // ── Form binding ───────────────────────────────────────────────────────────

  _bindForm() {
    const root = this._domEl.node;
    root.querySelector('#begin-btn').addEventListener('click', () => this._handleCreate());
    root.querySelector('#char-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._handleCreate();
    });
  }

  async _handleCreate() {
    const root = this._domEl.node;
    const name = root.querySelector('#char-name').value.trim();

    if (!name) {
      return this._setError('Please enter a character name.');
    }
    if (name.length > 20) {
      return this._setError('Name must be 20 characters or fewer.');
    }
    if (!/^[a-zA-Z0-9 \-]+$/.test(name)) {
      return this._setError('Name may only contain letters, numbers, spaces, and hyphens.');
    }

    this._setLoading(true);
    this._setError('');

    try {
      const data = await ApiClient.createCharacter(name, { ...this._appearance });
      localStorage.setItem('sab_char_id', String(data.character.id));
      this._showBeginMessage(data.character);
    } catch (err) {
      this._setError(err.message || 'Failed to create character.');
      this._setLoading(false);
    }
  }

  _setError(msg) {
    const el = this._domEl.node.querySelector('#create-error');
    if (el) el.textContent = msg;
  }

  _setLoading(loading) {
    const el = this._domEl.node.querySelector('#begin-btn');
    if (el) el.disabled = loading;
  }

  _showBeginMessage(character) {
    this._newChar = character;
    this._domEl.setVisible(false);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const msg = this.add.text(cx, cy + 80, 'Journey begins...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaffcc',
      stroke: '#224433',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: msg,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.scene.start('MapScene', { playerLevel: this._newChar?.level || 1, playerData: this._newChar });
        });
      },
    });
  }
}
