import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';
import { SHOP_ITEMS, EQUIPMENT } from '../data/equipment.js';
import ApiClient from '../api/ApiClient.js';

const PALETTE = {
  bg:      0x08080f,
  panel:   0x12121e,
  border:  0x2a2a4a,
  gold:    0xffcc44,
  owned:   0x224422,
  ownedBdr:0x44aa44,
};

const SLOT_LABELS = { staff: 'Staff', hat: 'Hat', robe: 'Robe', boots: 'Boots', relic: 'Relic' };

export default class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  init(data) {
    this._playerData = data.playerData || null;
    this._returnScene = data.returnScene || 'MapScene';
    this._returnData  = data.returnData  || {};
  }

  async create() {
    const cx = GAME_WIDTH / 2;

    // Background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);
    const g = this.add.graphics();
    for (let i = 0; i < 50; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.18));
      g.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 1, 1);
    }

    // Header
    const strip = this.add.graphics();
    strip.fillStyle(0xaa7700, 0.18);
    strip.fillRect(0, 0, GAME_WIDTH, 110);
    strip.lineStyle(1, 0xffcc44, 0.3);
    strip.lineBetween(0, 110, GAME_WIDTH, 110);

    this.add.text(cx, 38, '🛒  SHOP', {
      fontFamily: 'monospace', fontSize: '26px', fontStyle: 'bold',
      color: '#ffcc44', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Back button — bottom centre
    const btnW = 220, btnH = 44, btnX = cx, btnY = GAME_HEIGHT - 36;
    const btnBg = this.add.rectangle(btnX, btnY, btnW, btnH, 0x1a1400)
      .setStrokeStyle(1, 0xffcc44, 0.6)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(btnX, btnY, '← BACK TO MAP', {
      fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffcc44',
    }).setOrigin(0.5).setDepth(11);
    const goBack = () => this.scene.start(this._returnScene, this._returnData);
    btnBg.on('pointerover',  () => { btnBg.setFillStyle(0x332800); btnLabel.setColor('#ffffff'); });
    btnBg.on('pointerout',   () => { btnBg.setFillStyle(0x1a1400); btnLabel.setColor('#ffcc44'); });
    btnBg.on('pointerdown',  goBack);
    btnLabel.setInteractive({ useHandCursor: true }).on('pointerdown', goBack);

    // Load character
    this._charId = this._playerData?.id || localStorage.getItem('sab_char_id');
    this._gold   = this._playerData?.gold || 0;
    this._inventory = [];

    try {
      const chars = await ApiClient.listCharacters();
      const me = chars.characters?.find(c => String(c.id) === String(this._charId));
      if (me) {
        this._gold = me.gold || 0;
        try { this._inventory = JSON.parse(me.inventory || '[]'); } catch {}
      }
    } catch {}

    // Gold display
    this._goldText = this.add.text(GAME_WIDTH - 16, 70, `Gold: ${this._gold}g`, {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#ffcc44',
    }).setOrigin(1, 0.5);

    this.add.text(cx, 80, 'Spend your hard-earned gold on equipment', {
      fontFamily: 'monospace', fontSize: '12px', color: '#556677',
    }).setOrigin(0.5);

    this._buildItemGrid();
  }

  _buildItemGrid() {
    const startY = 130;
    const cols   = 2;
    const itemW  = 370, itemH = 88, gapX = 20, gapY = 12;
    const totalW = cols * itemW + (cols - 1) * gapX;
    const startX = GAME_WIDTH / 2 - totalW / 2;

    SHOP_ITEMS.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x   = startX + col * (itemW + gapX);
      const y   = startY + row * (itemH + gapY);
      this._buildItemCard(x, y, itemW, itemH, item);
    });
  }

  _buildItemCard(x, y, w, h, item) {
    const owned   = this._inventory.includes(item.id);
    const canAfford = this._gold >= item.shopPrice;

    const bg = this.add.graphics();
    const drawBg = (hover) => {
      bg.clear();
      if (owned) {
        bg.fillStyle(PALETTE.owned, 1);
        bg.fillRect(x, y, w, h);
        bg.lineStyle(2, PALETTE.ownedBdr, 0.8);
      } else {
        bg.fillStyle(hover && canAfford ? 0x1a1500 : PALETTE.panel, 1);
        bg.fillRect(x, y, w, h);
        bg.lineStyle(2, hover && canAfford ? PALETTE.gold : PALETTE.border, hover && canAfford ? 1 : 0.5);
      }
      bg.strokeRect(x, y, w, h);
    };
    drawBg(false);

    // Slot tag
    const slotLabel = SLOT_LABELS[item.slot] || item.slot;
    const tagG = this.add.graphics();
    tagG.fillStyle(0x2a2a3a, 1);
    tagG.fillRect(x + 8, y + 8, 50, 14);
    this.add.text(x + 33, y + 15, slotLabel.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '9px', color: '#667799',
    }).setOrigin(0.5);

    // Name
    this.add.text(x + 68, y + 16, item.name, {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold',
      color: owned ? '#44ff88' : '#ddeeff',
    }).setOrigin(0, 0.5);

    // Stats line
    const stats = [];
    if (item.attackBonus  > 0) stats.push(`ATK +${item.attackBonus}`);
    if (item.defenseBonus > 0) stats.push(`DEF +${item.defenseBonus}`);
    if (item.speedBonus   > 0) stats.push(`SPD +${item.speedBonus}`);
    if (item.speedBonus   < 0) stats.push(`SPD ${item.speedBonus}`);
    if (item.moveId)           stats.push(`Move: ${item.moveId.replace(/_/g, ' ')}`);
    this.add.text(x + 12, y + 40, stats.join('  ') || '—', {
      fontFamily: 'monospace', fontSize: '12px', color: '#889aaa',
    });

    // Price / owned tag
    const priceStr = owned ? 'OWNED' : `${item.shopPrice}g`;
    const priceCol = owned ? '#44ff88' : canAfford ? '#ffcc44' : '#cc6633';
    const priceText = this.add.text(x + w - 12, y + h / 2, priceStr, {
      fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: priceCol,
    }).setOrigin(1, 0.5);

    if (!owned) {
      const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h)
        .setInteractive({ useHandCursor: canAfford });
      hit.on('pointerover', () => { if (canAfford) { drawBg(true); priceText.setColor('#ffffff'); } });
      hit.on('pointerout',  () => { drawBg(false); priceText.setColor(priceCol); });
      hit.on('pointerdown', () => {
        if (!canAfford) return;
        this._buyItem(item, bg, priceText, hit, drawBg);
      });
    }
  }

  async _buyItem(item, bg, priceText, hit, drawBg) {
    hit.disableInteractive();
    priceText.setText('...');

    try {
      const result = await ApiClient.purchase(this._charId, item.id, item.shopPrice);
      this._gold = result.gold;
      this._goldText.setText(`Gold: ${this._gold}g`);
      this._inventory.push(item.id);

      // Redraw as owned
      bg.clear();
      bg.fillStyle(PALETTE.owned, 1);
      bg.fillRect(bg._x || 0, bg._y || 0, 370, 88);
      bg.lineStyle(2, PALETTE.ownedBdr, 0.8);
      bg.strokeRect(bg._x || 0, bg._y || 0, 370, 88);
      priceText.setText('OWNED');
      priceText.setColor('#44ff88');
      hit.destroy();
    } catch (err) {
      priceText.setText(String(item.shopPrice) + 'g');
      priceText.setColor('#cc6633');
      hit.setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, err.message || 'Purchase failed', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ff6644',
      }).setOrigin(0.5);
    }
  }
}
