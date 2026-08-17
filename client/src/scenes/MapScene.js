import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import { REGIONS } from '../data/regions.js';
import ApiClient from '../api/ApiClient.js';

const TYPE_COLOURS = {
  water: 0x1e6ea0, fire: 0xa03c1e, plant: 0x2e7a2e,
  lightning: 0xa09a1e, glow: 0x8a6ea0, ice: 0x4aa0a0,
  rock: 0x7a6040, null: 0x446644,
};

export default class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  init(data) {
    this._playerLevel = data.playerLevel || 1;
    this._playerData  = data.playerData  || null;
  }

  create() {
    this._drawBackground();
    this._drawTitle();
    this._drawConnections();
    this._drawRegions();
    this._drawLegend();

    // Character select button
    const back = this.add.text(16, 14, '< Characters', {
      fontFamily: 'monospace', fontSize: '13px', color: '#445566',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#aabbff'));
    back.on('pointerout',  () => back.setColor('#445566'));
    back.on('pointerdown', () => this.scene.start('LoginScene'));

    // Shop button
    const shopBtn = this.add.text(GAME_WIDTH - 16, 14, '[ Shop ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffcc44',
      backgroundColor: '#1a1400', padding: { x: 8, y: 5 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    shopBtn.on('pointerover', () => shopBtn.setColor('#ffee88'));
    shopBtn.on('pointerout',  () => shopBtn.setColor('#ffcc44'));
    shopBtn.on('pointerdown', () => this.scene.start('ShopScene', {
      playerData: this._playerData,
      returnScene: 'MapScene',
      returnData: { playerLevel: this._playerLevel, playerData: this._playerData },
    }));

    // Bestiary button
    const bestiaryBtn = this.add.text(GAME_WIDTH - 16, 46, '[ Bestiary ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaffcc',
      backgroundColor: '#0a1a12', padding: { x: 8, y: 5 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    bestiaryBtn.on('pointerover', () => bestiaryBtn.setColor('#ccffee'));
    bestiaryBtn.on('pointerout',  () => bestiaryBtn.setColor('#aaffcc'));
    bestiaryBtn.on('pointerdown', () => this.scene.start('BestiaryScene', {
      playerData: this._playerData,
      returnScene: 'MapScene',
      returnData: { playerLevel: this._playerLevel, playerData: this._playerData },
    }));

    // Log out button
    const logoutBtn = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 16, '[ Log Out ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#445566',
      backgroundColor: '#12121e', padding: { x: 10, y: 6 },
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    logoutBtn.on('pointerover', () => logoutBtn.setColor('#ff6666'));
    logoutBtn.on('pointerout',  () => logoutBtn.setColor('#445566'));
    logoutBtn.on('pointerdown', () => {
      ApiClient.logout();
      localStorage.removeItem('sab_char_id');
      this.scene.start('LoginScene');
    });
  }

  _drawBackground() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08080f);
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.05, 0.3));
      g.fillRect(x, y, 1, 1);
    }
  }

  _drawTitle() {
    this.add.text(GAME_WIDTH / 2, 22, 'WORLD MAP', {
      fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#2a2a4a', strokeThickness: 2,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 42, `Explorer Level ${this._playerLevel}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#445566',
    }).setOrigin(0.5);
  }

  _drawConnections() {
    const g = this.add.graphics();
    g.lineStyle(2, 0x223344, 0.6);
    for (const region of Object.values(REGIONS)) {
      for (const connId of region.connections) {
        const other = REGIONS[connId];
        if (!other) continue;
        // Only draw each connection once (lower id draws it)
        if (region.id < connId) {
          g.lineBetween(region.position.x, region.position.y, other.position.x, other.position.y);
        }
      }
    }
  }

  _drawRegions() {
    for (const region of Object.values(REGIONS)) {
      this._drawRegionNode(region);
    }
  }

  _drawRegionNode(region) {
    const { x, y } = region.position;
    const locked = this._playerLevel < region.requiredLevel;
    const col    = locked ? 0x222233 : region.color;
    const radius = 38;

    const g = this.add.graphics();
    const drawNode = (hover) => {
      g.clear();
      // Outer glow ring
      if (!locked && hover) {
        g.fillStyle(col, 0.25);
        g.fillCircle(x, y, radius + 10);
      }
      // Main circle
      g.fillStyle(col, locked ? 0.35 : 1);
      g.fillCircle(x, y, radius);
      // Border
      g.lineStyle(2, locked ? 0x334455 : 0xffffff, locked ? 0.3 : 0.5);
      g.strokeCircle(x, y, radius);
      // Lock icon
      if (locked) {
        g.fillStyle(0x445566, 0.8);
        g.fillRect(x - 8, y - 6, 16, 12);
        g.fillStyle(0x223344, 0.8);
        g.fillCircle(x, y - 8, 6);
        g.fillStyle(0x08080f, 1);
        g.fillCircle(x, y - 8, 4);
      }
    };
    drawNode(false);

    // Region name
    const nameCol = locked ? '#334455' : '#ddeeff';
    const name = this.add.text(x, y + radius + 10, region.name, {
      fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: nameCol,
    }).setOrigin(0.5, 0);

    // Level requirement
    const lvlStr = locked ? `Lv.${region.requiredLevel} required` : `Lv.${region.requiredLevel}+`;
    const lvlCol  = locked ? '#cc4444' : '#667799';
    const lvlTxt = this.add.text(x, y + radius + 24, lvlStr, {
      fontFamily: 'monospace', fontSize: '10px', color: lvlCol,
    }).setOrigin(0.5, 0);

    if (!locked) {
      const hit = this.add.circle(x, y, radius).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { drawNode(true); name.setColor('#ffffff'); });
      hit.on('pointerout',  () => { drawNode(false); name.setColor(nameCol); });
      hit.on('pointerdown', () => {
        this.scene.start('RegionScene', {
          regionId: region.id,
          playerLevel: this._playerLevel,
          playerData: this._playerData,
        });
      });
    }
  }

  _drawLegend() {
    const types = ['water','fire','plant','lightning','glow','ice','rock'];
    const lx = GAME_WIDTH - 130, ly = 70;
    this.add.text(lx, ly, 'TYPES', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#445566',
    });
    types.forEach((t, i) => {
      const g = this.add.graphics();
      g.fillStyle(TYPE_COLOURS[t], 1);
      g.fillCircle(lx + 6, ly + 18 + i * 18, 5);
      this.add.text(lx + 16, ly + 13 + i * 18, t.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '10px', color: '#667799',
      });
    });
  }
}
