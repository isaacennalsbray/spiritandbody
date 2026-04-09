import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

const PALETTE = {
  bg:        0x0a0a0f,
  panel:     0x12121e,
  border:    0x2a2a4a,
  accent:    0x6688ff,
  accentDim: 0x334488,
  gold:      0xffcc44,
  text:      0xddeeff,
  textDim:   0x667799,
};

const MENU_ITEMS = [
  { label: 'New Game',   key: 'new_game' },
  { label: 'Continue',   key: 'continue' },
  { label: 'PvP Lobby',  key: 'pvp' },
  { label: 'Settings',   key: 'settings' },
];

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
    this._selectedIndex = 0;
    this._menuItems = [];
  }

  create() {
    this._drawBackground();
    this._drawStars();
    this._drawTitle();
    this._drawMenu();
    this._drawVersion();
    this._setupInput();
    this._pingServer();
  }

  // ─── Background ────────────────────────────────────────────────────────────

  _drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);

    // Horizontal gradient bands (pixel-art sky effect)
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      const t = y / GAME_HEIGHT;
      const alpha = 0.04 + t * 0.06;
      this.add.rectangle(GAME_WIDTH / 2, y + 2, GAME_WIDTH, 4, PALETTE.accent)
        .setAlpha(alpha);
    }
  }

  _drawStars() {
    const gfx = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT * 0.75);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillRect(x, y, size, size);
    }

    // Slow twinkle
    this.tweens.add({
      targets: gfx,
      alpha: { from: 0.7, to: 1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Title ─────────────────────────────────────────────────────────────────

  _drawTitle() {
    const cx = GAME_WIDTH / 2;

    // Glow behind title
    const glow = this.add.rectangle(cx, 140, 520, 90, PALETTE.accent).setAlpha(0.06);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.04, to: 0.10 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Main title
    this.add.text(cx, 115, 'SPIRIT', {
      fontFamily: 'monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#6688ff',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(cx, 160, '& BODY', {
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#aabbff',
    }).setOrigin(0.5);

    // Decorative divider
    const gfx = this.add.graphics();
    gfx.lineStyle(1, PALETTE.accentDim, 0.8);
    gfx.lineBetween(cx - 180, 188, cx + 180, 188);

    // Subtitle
    this.add.text(cx, 202, 'A TURN-BASED RPG', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#667799',
      letterSpacing: 4,
    }).setOrigin(0.5);
  }

  // ─── Menu ──────────────────────────────────────────────────────────────────

  _drawMenu() {
    const cx = GAME_WIDTH / 2;
    const startY = 290;
    const spacing = 52;

    this._menuItems = MENU_ITEMS.map((item, i) => {
      const y = startY + i * spacing;

      const bg = this.add.rectangle(cx, y, 260, 40, PALETTE.panel)
        .setInteractive({ useHandCursor: true });
      const border = this.add.rectangle(cx, y, 262, 42, PALETTE.border)
        .setDepth(-1);

      const label = this.add.text(cx, y, item.label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ddeeff',
      }).setOrigin(0.5);

      // Arrow indicator
      const arrow = this.add.text(cx - 148, y, '▶', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#6688ff',
      }).setOrigin(0.5).setAlpha(0);

      bg.on('pointerover', () => this._selectIndex(i));
      bg.on('pointerdown', () => this._activateItem(i));

      return { bg, border, label, arrow, key: item.key };
    });

    this._highlightSelected();
  }

  _selectIndex(i) {
    this._selectedIndex = i;
    this._highlightSelected();
  }

  _highlightSelected() {
    this._menuItems.forEach((item, i) => {
      const selected = i === this._selectedIndex;
      item.bg.setFillStyle(selected ? PALETTE.accentDim : PALETTE.panel);
      item.border.setFillStyle(selected ? PALETTE.accent : PALETTE.border);
      item.label.setColor(selected ? '#ffffff' : '#ddeeff');
      item.arrow.setAlpha(selected ? 1 : 0);
    });
  }

  _activateItem(i) {
    const key = this._menuItems[i].key;
    // Scenes added in later phases — for now just flash the selection
    this._flashItem(i, () => {
      if (key === 'new_game') {
        // this.scene.start('CharacterCreateScene');
        this._showToast('Character creation coming in Phase 2!');
      } else if (key === 'continue') {
        this._showToast('Save/load coming in Phase 2!');
      } else {
        this._showToast(`${MENU_ITEMS[i].label} — coming soon!`);
      }
    });
  }

  _flashItem(i, onComplete) {
    const item = this._menuItems[i];
    this.tweens.add({
      targets: [item.bg, item.label],
      alpha: { from: 1, to: 0.3 },
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete,
    });
  }

  // ─── Version / status bar ──────────────────────────────────────────────────

  _drawVersion() {
    this._statusText = this.add.text(12, GAME_HEIGHT - 16, 'v0.1 — connecting to server…', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#445566',
    }).setOrigin(0, 1);

    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 16, '© Spirit and Body', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#334455',
    }).setOrigin(1, 1);
  }

  _showToast(msg) {
    const cx = GAME_WIDTH / 2;
    const toast = this.add.text(cx, GAME_HEIGHT - 50, msg, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#aaffcc',
      backgroundColor: '#112233',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      hold: 2000,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    const up   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    up.on('down', () => {
      this._selectedIndex = (this._selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this._highlightSelected();
    });
    down.on('down', () => {
      this._selectedIndex = (this._selectedIndex + 1) % MENU_ITEMS.length;
      this._highlightSelected();
    });
    enter.on('down', () => {
      this._activateItem(this._selectedIndex);
    });
  }

  // ─── Server ping ───────────────────────────────────────────────────────────

  async _pingServer() {
    try {
      const res = await fetch('/api/ping');
      const data = await res.json();
      if (data.ok) {
        this._statusText.setText('v0.1 — server connected ✓').setColor('#44aa66');
      }
    } catch {
      this._statusText.setText('v0.1 — server offline').setColor('#aa4444');
    }
  }
}
