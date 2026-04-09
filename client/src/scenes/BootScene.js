import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No assets to preload in Phase 1 — loading bar is drawn with generated graphics.
    // Real sprite assets will be loaded here once created.
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
