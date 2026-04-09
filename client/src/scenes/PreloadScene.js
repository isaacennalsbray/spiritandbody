import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this._createLoadingBar();

    // Assets will be added here as they're created.
    // For Phase 1, nothing to load — the main menu uses generated graphics.

    this.load.on('progress', (value) => {
      this._bar.scaleX = value;
    });
  }

  create() {
    this.scene.start('MainMenuScene');
  }

  _createLoadingBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const barW = 400;
    const barH = 20;

    // Background
    this.add.rectangle(cx, cy, barW + 4, barH + 4, 0x333344).setOrigin(0.5);

    // Fill (scaled 0→1 on progress)
    this._bar = this.add.rectangle(cx - barW / 2, cy, barW, barH, 0x6688ff)
      .setOrigin(0, 0.5);
    this._bar.scaleX = 0;

    this.add.text(cx, cy - 30, 'Loading…', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aabbff',
    }).setOrigin(0.5);
  }
}
