import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import ApiClient from '../api/ApiClient.js';

const PALETTE = {
  bg:        0x0a0a0f,
  panel:     0x12121e,
  border:    0x2a2a4a,
  accent:    0x6688ff,
  accentDim: 0x334488,
  gold:      0xffcc44,
  text:      0xddeeff,
  textDim:   0x667799,
  danger:    0xff4455,
  success:   0x44cc88,
};

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
    this._selectedIndex = 0;
    this._menuItems = [];
    this._authOverlay = null;
    this._currentUser = null;
  }

  create() {
    this._drawBackground();
    this._drawStars();
    this._drawTitle();
    this._drawMenu();
    this._drawVersion();
    this._setupInput();
    this._checkExistingSession();
  }

  // ─── Background ─────────────────────────────────────────────────────────────

  _drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      const alpha = 0.04 + (y / GAME_HEIGHT) * 0.06;
      this.add.rectangle(GAME_WIDTH / 2, y + 2, GAME_WIDTH, 4, PALETTE.accent).setAlpha(alpha);
    }
  }

  _drawStars() {
    const gfx = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT * 0.75);
      const size = Phaser.Math.Between(1, 2);
      gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1.0));
      gfx.fillRect(x, y, size, size);
    }
    this.tweens.add({ targets: gfx, alpha: { from: 0.7, to: 1 }, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ─── Title ──────────────────────────────────────────────────────────────────

  _drawTitle() {
    const cx = GAME_WIDTH / 2;
    const glow = this.add.rectangle(cx, 140, 520, 90, PALETTE.accent).setAlpha(0.06);
    this.tweens.add({ targets: glow, alpha: { from: 0.04, to: 0.10 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, 115, 'SPIRIT', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '52px', fontStyle: 'bold', color: '#ffffff', stroke: '#6688ff', strokeThickness: 3 }).setOrigin(0.5);
    this.add.text(cx, 160, '& BODY', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '28px', fontStyle: 'bold', color: '#aabbff' }).setOrigin(0.5);

    const gfx = this.add.graphics();
    gfx.lineStyle(1, PALETTE.accentDim, 0.8);
    gfx.lineBetween(cx - 180, 188, cx + 180, 188);
    this.add.text(cx, 202, 'A TURN-BASED RPG', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#667799', letterSpacing: 4 }).setOrigin(0.5);
  }

  // ─── Menu ───────────────────────────────────────────────────────────────────

  _drawMenu() {
    const cx = GAME_WIDTH / 2;
    const items = [
      { label: 'New Game',  key: 'new_game' },
      { label: 'Continue',  key: 'continue' },
      { label: 'PvP Lobby', key: 'pvp' },
      { label: 'Settings',  key: 'settings' },
    ];

    this._menuItems = items.map((item, i) => {
      const y = 290 + i * 52;
      const bg = this.add.rectangle(cx, y, 260, 40, PALETTE.panel).setInteractive({ useHandCursor: true });
      this.add.rectangle(cx, y, 262, 42, PALETTE.border).setDepth(-1);
      const label = this.add.text(cx, y, item.label, { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '18px', color: '#ddeeff' }).setOrigin(0.5);
      const arrow = this.add.text(cx - 148, y, '▶', { fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '14px', color: '#6688ff' }).setOrigin(0.5).setAlpha(0);
      bg.on('pointerover', () => this._selectIndex(i));
      bg.on('pointerdown', () => this._activate(i));
      return { bg, label, arrow, key: item.key };
    });

    this._highlightSelected();
  }

  _selectIndex(i) {
    this._selectedIndex = i;
    this._highlightSelected();
  }

  _highlightSelected() {
    this._menuItems.forEach((item, i) => {
      const on = i === this._selectedIndex;
      item.bg.setFillStyle(on ? PALETTE.accentDim : PALETTE.panel);
      item.label.setColor(on ? '#ffffff' : '#ddeeff');
      item.arrow.setAlpha(on ? 1 : 0);
    });
  }

  _activate(i) {
    const key = this._menuItems[i].key;
    this._flashItem(i, () => {
      if (key === 'new_game') {
        if (!this._currentUser) {
          this._showAuthOverlay(() => this._goNewGame());
        } else {
          this._goNewGame();
        }
      } else if (key === 'continue') {
        if (!this._currentUser) {
          this._showAuthOverlay(() => this._goContinue());
        } else {
          this._goContinue();
        }
      } else {
        this._showToast('Coming soon!');
      }
    });
  }

  _flashItem(i, cb) {
    const item = this._menuItems[i];
    this.tweens.add({ targets: [item.bg, item.label], alpha: { from: 1, to: 0.3 }, duration: 80, yoyo: true, repeat: 2, onComplete: cb });
  }

  _goNewGame() {
    this.scene.start('CharacterCreateScene', { user: this._currentUser });
  }

  _goContinue() {
    this._showToast('Save/load coming in Phase 5!');
  }

  // ─── Auth overlay ───────────────────────────────────────────────────────────

  _showAuthOverlay(onSuccess) {
    if (this._authOverlay) this._authOverlay.destroy();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const W = 340, H = 220;

    const container = this.add.container(0, 0).setDepth(50);

    const dim = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000).setAlpha(0.75).setInteractive();
    const border = this.add.rectangle(cx, cy, W + 2, H + 2, PALETTE.accent).setDepth(-1);
    const panel  = this.add.rectangle(cx, cy, W, H, PALETTE.panel);

    this.add.text(cx, cy - H / 2 + 28, 'ENTER YOUR NAME', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '15px', fontStyle: 'bold', color: '#aabbff',
    }).setOrigin(0.5);
    this.add.text(cx, cy - H / 2 + 50, 'Pick a username to get started', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#667799',
    }).setOrigin(0.5);

    const input = this._makeInput(cx, cy - 10, 'Username…', 'text', W - 40);
    input.node.maxLength = 20;
    setTimeout(() => input.node.focus(), 50);

    const errorText = this.add.text(cx, cy + 26, '', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#ff4455',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(cx, cy + H / 2 - 38, 180, 36, PALETTE.accent).setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(cx, cy + H / 2 - 38, 'Play →', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '15px', color: '#ffffff',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(cx + W / 2 - 16, cy - H / 2 + 14, '✕', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', color: '#667799',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    container.add([dim, border, panel, errorText, btn, btnLabel, closeBtn]);
    container.add(input);

    const cleanup = () => {
      input.node && input.node.remove();
      container.destroy();
      this._authOverlay = null;
    };

    closeBtn.on('pointerdown', cleanup);

    const submit = async () => {
      const username = input.node.value.trim();
      errorText.setText('');
      btn.setInteractive(false);
      btnLabel.setText('…');
      try {
        const { user } = await ApiClient.claim(username);
        this._currentUser = user;
        this._updateStatus();
        cleanup();
        onSuccess();
      } catch (err) {
        errorText.setText(err.message || 'Something went wrong');
        btn.setInteractive(true);
        btnLabel.setText('Play →');
        input.node.focus();
      }
    };

    btn.on('pointerover', () => btn.setFillStyle(0x8899ff));
    btn.on('pointerout',  () => btn.setFillStyle(PALETTE.accent));
    btn.on('pointerdown', submit);
    input.node.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    this._authOverlay = container;
  }

  _makeInput(x, y, placeholder, type, width) {
    const el = this.add.dom(x, y).createElement('input');
    el.node.type = type;
    el.node.placeholder = placeholder;
    el.node.style.cssText = `
      width: ${width}px; height: 30px; background: #1a1a2e; border: 1px solid #2a2a4a;
      color: #ddeeff; font-family: 'Share Tech Mono','Courier New',monospace; font-size: 13px; padding: 0 10px;
      outline: none; box-sizing: border-box;
    `;
    el.node.addEventListener('focus', () => { el.node.style.borderColor = '#6688ff'; });
    el.node.addEventListener('blur',  () => { el.node.style.borderColor = '#2a2a4a'; });
    return el;
  }

  // ─── Session ────────────────────────────────────────────────────────────────

  async _checkExistingSession() {
    if (!ApiClient.isLoggedIn()) {
      this._statusText.setText('v0.2 — not signed in').setColor('#667799');
      return;
    }
    try {
      const { user } = await ApiClient.getMe();
      this._currentUser = user;
      this._updateStatus();
    } catch {
      ApiClient.logout();
      this._statusText.setText('v0.2 — session expired').setColor('#aa4444');
    }
  }

  _updateStatus() {
    if (this._currentUser) {
      this._statusText.setText(`v0.2 — ${this._currentUser.username} ✓`).setColor('#44cc88');
    }
  }

  // ─── Version bar ────────────────────────────────────────────────────────────

  _drawVersion() {
    this._statusText = this.add.text(12, GAME_HEIGHT - 16, 'v0.2 — connecting…', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#445566',
    }).setOrigin(0, 1);
    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 16, '© Spirit and Body', {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '11px', color: '#334455',
    }).setOrigin(1, 1);
  }

  _showToast(msg) {
    const cx = GAME_WIDTH / 2;
    const toast = this.add.text(cx, GAME_HEIGHT - 50, msg, {
      fontFamily: "'Share Tech Mono', 'Courier New', monospace", fontSize: '13px', color: '#aaffcc', backgroundColor: '#112233', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
    this.tweens.add({ targets: toast, alpha: 1, duration: 200, hold: 2000, yoyo: true, onComplete: () => toast.destroy() });
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  _setupInput() {
    const up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const down  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    up.on('down', () => {
      if (this._authOverlay) return;
      this._selectedIndex = (this._selectedIndex - 1 + this._menuItems.length) % this._menuItems.length;
      this._highlightSelected();
    });
    down.on('down', () => {
      if (this._authOverlay) return;
      this._selectedIndex = (this._selectedIndex + 1) % this._menuItems.length;
      this._highlightSelected();
    });
    enter.on('down', () => {
      if (this._authOverlay) return;
      this._activate(this._selectedIndex);
    });
  }
}
