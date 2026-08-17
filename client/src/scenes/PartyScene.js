import Phaser from 'phaser';
import ApiClient from '../api/ApiClient.js';
import { EQUIPMENT } from '../data/equipment.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

const TYPE_COLOURS = {
  water:     '#1e6ea0',
  fire:      '#a03c1e',
  plant:     '#2e7a2e',
  lightning: '#a09a1e',
  glow:      '#8a6ea0',
  ice:       '#4aa0a0',
  rock:      '#7a6040',
};

const TYPE_COLOURS_INT = {
  water:     0x1e6ea0,
  fire:      0xa03c1e,
  plant:     0x2e7a2e,
  lightning: 0xa09a1e,
  glow:      0x8a6ea0,
  ice:       0x4aa0a0,
  rock:      0x7a6040,
};

const PALETTE = {
  bg:       0x0a0a14,
  panel:    0x12121e,
  panelBdr: 0x2a2a4a,
  text:     0xddeeff,
  accent:   0x6688ff,
  btnBg:    0x1a1a2e,
  btnBdr:   0x2a3a5a,
};

// SLOT_ITEMS is built dynamically from owned inventory in _buildEquipmentTab
const NONE_ITEM = (slot) => ({ id: null, slot, name: '(none)', attackBonus: 0, defenseBonus: 0, speedBonus: 0, moveId: null });

export default class PartyScene extends Phaser.Scene {
  constructor() {
    super('PartyScene');
  }

  async create() {
    this._activeTab       = 'pets';
    this._selectedPet     = null;
    this._tabItems        = [];
    this._contentItems    = [];
    this._actionItems     = [];
    this._wheelRegistered = false;  // action buttons for selected pet — separate layer

    // Equipment cycling state: slot → current index
    this._eqIndices = { staff: 0, hat: 0, robe: 0, boots: 0, relic: 0 };

    this._drawBackground();
    this._drawHeader();

    const charId = localStorage.getItem('sab_char_id');
    try {
      const [charData, petsData] = await Promise.all([
        ApiClient.listCharacters(),
        ApiClient.listPets(charId),
      ]);
      this._character = charData.characters.find(c => String(c.id) === String(charId));
      this._pets      = petsData.pets;

      // Build owned-item lists from inventory
      this._rebuildSlotItems();

      // Initialise equipment cycling indices from character's current equipment
      for (const slot of ['staff', 'hat', 'robe', 'boots', 'relic']) {
        const fieldId = this._character[`${slot}_id`];
        const idx     = this._slotItems[slot].findIndex(e => e.id === fieldId);
        this._eqIndices[slot] = idx >= 0 ? idx : 0;
      }

      // Copy cycling state so we can diff on save
      this._pendingEq = { ...this._eqIndices };

      this._buildTabs();
      this._showTab('pets');
    } catch (e) {
      console.error(e);
      ApiClient.logout();
      this.scene.start('LoginScene');
    }
  }

  // ── Background ─────────────────────────────────────────────────────────────

  _drawBackground() {
    const g = this.add.graphics().setScrollFactor(0);
    g.fillStyle(PALETTE.bg, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const starGfx = this.add.graphics().setScrollFactor(0);
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      starGfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
      starGfx.fillRect(x, y, 1, 1);
    }
  }

  _drawHeader() {
    // Title
    this.add.text(GAME_WIDTH / 2, 14, 'CAPTURE', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#6688ff',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 32, 'Party', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ddeeff',
    }).setOrigin(0.5).setScrollFactor(0);

    // Back button
    const back = this.add.text(16, 14, '< Back', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#445566',
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    back.on('pointerover', () => back.setColor('#aabbff'));
    back.on('pointerout',  () => back.setColor('#445566'));
    back.on('pointerdown', () => this.scene.start('MapScene', {
      playerLevel: this._character?.level || 1,
      playerData:  this._character || null,
    }));
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  _buildTabs() {
    if (this._tabItems.length) this._tabItems.forEach(t => t.destroy());
    this._tabItems = [];

    const tabs   = ['pets', 'equipment'];
    const labels = ['PETS', 'EQUIPMENT'];
    const tabY   = 60;

    tabs.forEach((tab, i) => {
      const active = this._activeTab === tab;
      const tx     = GAME_WIDTH / 2 - 80 + i * 160;

      const bg = this.add.graphics().setScrollFactor(0);
      bg.fillStyle(active ? 0x1e2050 : PALETTE.panel, 1);
      bg.fillRect(tx - 60, tabY - 14, 120, 28);
      bg.lineStyle(1, active ? PALETTE.accent : PALETTE.panelBdr, 1);
      bg.strokeRect(tx - 60, tabY - 14, 120, 28);

      const txt = this.add.text(tx, tabY, labels[i], {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: active ? '#aabbff' : '#556677',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);

      txt.on('pointerdown', () => this._showTab(tab));

      this._tabItems.push(bg, txt);
    });
  }

  _showTab(tab) {
    this._activeTab = tab;
    this._selectedPet = null;
    // Reset camera scroll when switching tabs
    this.cameras.main.scrollY = 0;
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Rebuild tabs to update active highlight
    this._buildTabs();

    // Clear previous content
    this._contentItems.forEach(t => t.destroy());
    this._contentItems = [];
    this._actionItems.forEach(t => t.destroy());
    this._actionItems = [];

    if (tab === 'pets')      this._buildPetsTab();
    else                     this._buildEquipmentTab();
  }

  // ── PETS tab ───────────────────────────────────────────────────────────────

  _buildPetsTab() {
    const pets   = this._pets || [];
    const cardH  = 90;
    const cardW  = 440;
    const startX = 20;
    const listTop = 90;
    const rowH   = cardH + 6;

    // Expand camera bounds to fit all cards
    const worldH = Math.max(GAME_HEIGHT, listTop + 18 + pets.length * rowH + 20);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, worldH);

    // Mouse wheel → smooth camera scroll (register once per create)
    if (!this._wheelRegistered) {
      this._wheelRegistered = true;
      this.input.on('wheel', (_ptr, _objs, _dx, dy) => {
        if (this._activeTab !== 'pets') return;
        const cam = this.cameras.main;
        const maxScroll = (cam._bounds?.height ?? GAME_HEIGHT) - GAME_HEIGHT;
        cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy * 0.8, 0, Math.max(0, maxScroll));
      });
    }

    // Roster label (scrolls with content)
    const rosterLabel = this.add.text(startX, listTop, `ALL PETS  (${pets.length})`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#445566',
    });
    this._contentItems.push(rosterLabel);

    // All pet cards in world space
    pets.forEach((pet, i) => {
      this._drawPetCard(pet, startX, listTop + 18 + i * rowH, cardW, cardH);
    });

    if (pets.length === 0) {
      const empty = this.add.text(startX + cardW / 2, listTop + 60, 'No pets captured yet.', {
        fontFamily: 'monospace', fontSize: '14px', color: '#334455',
      }).setOrigin(0.5);
      this._contentItems.push(empty);
    }

    // Right column — active party (fixed, doesn't scroll)
    this._drawActiveParty();
  }

  _drawPetCard(pet, x, y, w, h) {
    const isSlot1 = pet.active_slot === 1;
    const isSlot2 = pet.active_slot === 2;

    const bdrCol = isSlot1 ? 0x22aa55 : isSlot2 ? 0x2255aa : PALETTE.panelBdr;

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.panel, 1);
    bg.fillRect(x, y, w, h);
    bg.lineStyle(2, bdrCol, 1);
    bg.strokeRect(x, y, w, h);
    this._contentItems.push(bg);

    // Slot label
    if (isSlot1 || isSlot2) {
      const slotLabel = this.add.text(x + w - 6, y + 4, isSlot1 ? '[SLOT 1]' : '[SLOT 2]', {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: isSlot1 ? '#22ee66' : '#2266ee',
      }).setOrigin(1, 0);
      this._contentItems.push(slotLabel);
    }

    // Name + level
    const name = this.add.text(x + 8, y + 6, pet.nickname || pet.species, {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ddeeff',
    });
    const lvlTxt = this.add.text(x + 8 + name.width + 8, y + 8, `Lv.${pet.level || 1}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffee44',
    });
    this._contentItems.push(name, lvlTxt);

    // Type badge
    if (pet.type) {
      const typeCol = TYPE_COLOURS[pet.type] || '#334455';
      const typeBg = this.add.graphics();
      typeBg.fillStyle(TYPE_COLOURS_INT[pet.type] || 0x334455, 1);
      typeBg.fillRect(x + 8, y + 26, 56, 14);
      this._contentItems.push(typeBg);
      const typeText = this.add.text(x + 36, y + 33, pet.type.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5);
      this._contentItems.push(typeText);
    }

    // Stats
    const statsStr = `ATK:${pet.attack}  DEF:${pet.defense}  SPD:${pet.speed}`;
    const stats = this.add.text(x + 8, y + 48, statsStr, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#667799',
    });
    this._contentItems.push(stats);

    // XP bar
    const xpNeeded = (pet.level || 1) * 100;
    const xpPct    = Math.min(1, (pet.xp || 0) / xpNeeded);
    const xpBarW   = w - 16;
    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x111122, 1);
    xpBg.fillRect(x + 8, y + 64, xpBarW, 6);
    const xpFill = this.add.graphics();
    xpFill.fillStyle(0xaa8800, 1);
    xpFill.fillRect(x + 8, y + 64, Math.floor(xpBarW * xpPct), 6);
    const xpLabel = this.add.text(x + w - 8, y + 63, `${pet.xp || 0}/${xpNeeded} XP`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#665500',
    }).setOrigin(1, 0);
    this._contentItems.push(xpBg, xpFill, xpLabel);

    // Clickable hit area
    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this._selectPet(pet));
    this._contentItems.push(hit);
  }

  _selectPet(pet) {
    // Toggle off if same pet clicked again
    if (this._selectedPet?.id === pet.id) {
      this._selectedPet = null;
      this._actionItems.forEach(t => t.destroy());
      this._actionItems = [];
      return;
    }
    this._selectedPet = pet;
    // Only clear and redraw action buttons — don't rebuild all cards
    this._actionItems.forEach(t => t.destroy());
    this._actionItems = [];
    this._drawPetActions(pet);
  }

  _drawPetActions(pet) {
    const ax = 20;
    const rowH = 96;
    // Find this pet's actual world-space position
    const petIdx  = (this._pets || []).findIndex(p => p.id === pet.id);
    const cardY   = 90 + 18 + (petIdx >= 0 ? petIdx : 0) * rowH;
    const actionY = cardY + 90 + 8;

    const btnDefs = [
      { label: 'Set Slot 1', fn: () => this._setPetSlot(pet, 1) },
      { label: 'Set Slot 2', fn: () => this._setPetSlot(pet, 2) },
      { label: 'Remove from slot', fn: () => this._setPetSlot(pet, null) },
    ];

    btnDefs.forEach((def, i) => {
      const bx = ax + i * 150;
      const by = actionY;
      const bw = 140, bh = 30;

      const bg = this.add.graphics();
      bg.fillStyle(PALETTE.btnBg, 1);
      bg.fillRect(bx, by, bw, bh);
      bg.lineStyle(1, PALETTE.btnBdr, 1);
      bg.strokeRect(bx, by, bw, bh);
      this._actionItems.push(bg);

      const txt = this.add.text(bx + bw / 2, by + bh / 2, def.label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aabbff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      txt.on('pointerover', () => txt.setColor('#ffffff'));
      txt.on('pointerout',  () => txt.setColor('#aabbff'));
      txt.on('pointerdown', def.fn);
      this._actionItems.push(txt);
    });
  }

  async _setPetSlot(pet, slot) {
    const charId = this._character.id;
    try {
      await ApiClient.updatePet(charId, pet.id, { active_slot: slot });
      // Refresh pets list
      const petsData = await ApiClient.listPets(charId);
      this._pets = petsData.pets;
      this._selectedPet = null;
      this._actionItems.forEach(t => t.destroy());
      this._actionItems = [];
      this._showTab('pets');
    } catch (e) {
      console.error('Failed to update pet slot:', e);
    }
  }

  _drawActiveParty() {
    const rx = 480;
    const ry = 90;
    const slotW = 220, slotH = 180;

    const header = this.add.text(rx + slotW / 2, ry, 'ACTIVE PARTY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#aabbff',
    }).setOrigin(0.5).setScrollFactor(0);
    this._contentItems.push(header);

    const slot1Pet = (this._pets || []).find(p => p.active_slot === 1);
    const slot2Pet = (this._pets || []).find(p => p.active_slot === 2);

    [{ label: 'Slot 1', pet: slot1Pet, y: ry + 20 }, { label: 'Slot 2', pet: slot2Pet, y: ry + 210 }].forEach(({ label, pet, y }) => {
      const bg = this.add.graphics().setScrollFactor(0);
      bg.fillStyle(PALETTE.panel, 1);
      bg.fillRect(rx, y, slotW, slotH);
      bg.lineStyle(1, pet ? 0x2255aa : PALETTE.panelBdr, 1);
      bg.strokeRect(rx, y, slotW, slotH);
      this._contentItems.push(bg);

      const slotTxt = this.add.text(rx + 8, y + 6, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#445566',
      }).setScrollFactor(0);
      this._contentItems.push(slotTxt);

      if (pet) {
        const pname = this.add.text(rx + slotW / 2, y + 30, `${pet.nickname || pet.species}  Lv.${pet.level || 1}`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ddeeff',
        }).setOrigin(0.5).setScrollFactor(0);
        this._contentItems.push(pname);

        if (pet.type) {
          const tbg = this.add.graphics().setScrollFactor(0);
          tbg.fillStyle(TYPE_COLOURS_INT[pet.type] || 0x334455, 1);
          tbg.fillRect(rx + slotW / 2 - 28, y + 50, 56, 14);
          const ttxt = this.add.text(rx + slotW / 2, y + 57, pet.type.toUpperCase(), {
            fontFamily: 'monospace',
            fontSize: '9px',
            fontStyle: 'bold',
            color: '#ffffff',
          }).setOrigin(0.5).setScrollFactor(0);
          this._contentItems.push(tbg, ttxt);
        }

        const petStats = [
          `ATK: ${pet.attack}`,
          `DEF: ${pet.defense}`,
          `SPD: ${pet.speed}`,
        ];
        petStats.forEach((s, i) => {
          const st = this.add.text(rx + slotW / 2, y + 78 + i * 22, s, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#aabbcc',
          }).setOrigin(0.5).setScrollFactor(0);
          this._contentItems.push(st);
        });

        // XP bar in slot panel
        const slotXpNeeded = (pet.level || 1) * 100;
        const slotXpPct    = Math.min(1, (pet.xp || 0) / slotXpNeeded);
        const slotXpBarW   = slotW - 20;
        const slotXpY      = y + 168;
        const slotXpBg = this.add.graphics().setScrollFactor(0);
        slotXpBg.fillStyle(0x111122, 1);
        slotXpBg.fillRect(rx + 10, slotXpY, slotXpBarW, 7);
        const slotXpFill = this.add.graphics().setScrollFactor(0);
        slotXpFill.fillStyle(0xaa8800, 1);
        slotXpFill.fillRect(rx + 10, slotXpY, Math.floor(slotXpBarW * slotXpPct), 7);
        const slotXpTxt = this.add.text(rx + slotW / 2, slotXpY + 10, `${pet.xp || 0} / ${slotXpNeeded} XP`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#665500',
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this._contentItems.push(slotXpBg, slotXpFill, slotXpTxt);
      } else {
        const empty = this.add.text(rx + slotW / 2, y + slotH / 2, 'Empty', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#334455',
        }).setOrigin(0.5).setScrollFactor(0);
        this._contentItems.push(empty);
      }
    });

    // Go to Battle button
    const battleBtnY = ry + 410;
    const battleBg = this.add.graphics().setScrollFactor(0);
    battleBg.fillStyle(0x1a1a2e, 1);
    battleBg.fillRect(rx, battleBtnY, slotW, 36);
    battleBg.lineStyle(2, 0x6688ff, 1);
    battleBg.strokeRect(rx, battleBtnY, slotW, 36);
    this._contentItems.push(battleBg);

    const battleTxt = this.add.text(rx + slotW / 2, battleBtnY + 18, 'Go to Battle', {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#aabbff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);

    battleTxt.on('pointerover', () => battleTxt.setColor('#ffffff'));
    battleTxt.on('pointerout',  () => battleTxt.setColor('#aabbff'));
    battleTxt.on('pointerdown', () => {
      const activePets = (this._pets || [])
        .filter(p => p.active_slot === 1 || p.active_slot === 2)
        .sort((a, b) => a.active_slot - b.active_slot)
        .map(p => ({ ...p, id: `player_pet${p.active_slot}`, speciesId: p.species }));
      this.scene.start('BattleScene', {
        encounterId: 'test_battle',
        playerData: { ...this._character, pets: activePets.length ? activePets : undefined },
        returnScene: 'MapScene',
        returnData:  { playerLevel: this._character?.level || 1, playerData: this._character },
      });
    });
    this._contentItems.push(battleTxt);
  }

  // ── EQUIPMENT tab ──────────────────────────────────────────────────────────

  _rebuildSlotItems() {
    const inventory = this._character?.inventory || [];
    const owned = typeof inventory === 'string' ? JSON.parse(inventory) : (Array.isArray(inventory) ? inventory : []);
    this._slotItems = {};
    for (const slot of ['staff', 'hat', 'robe', 'boots', 'relic']) {
      this._slotItems[slot] = [NONE_ITEM(slot)];
    }
    for (const itemId of owned) {
      const item = EQUIPMENT[itemId];
      if (item) this._slotItems[item.slot].push(item);
    }
  }

  _buildEquipmentTab() {
    this._rebuildSlotItems();

    const slots    = ['staff', 'hat', 'robe', 'boots', 'relic'];
    const labels   = ['STAFF', 'HAT', 'ROBE', 'BOOTS', 'RELIC'];
    const rowH     = 70;
    const startY   = 90;
    const leftX    = 20;
    const rowW     = 460;

    slots.forEach((slot, i) => {
      const y   = startY + i * rowH;
      this._drawEquipmentRow(slot, labels[i], leftX, y, rowW);
    });

    // Save Equipment button
    const saveY = startY + slots.length * rowH + 10;
    const saveBg = this.add.graphics();
    saveBg.fillStyle(0x1a1a2e, 1);
    saveBg.fillRect(leftX, saveY, 200, 36);
    saveBg.lineStyle(2, 0x44aa44, 1);
    saveBg.strokeRect(leftX, saveY, 200, 36);
    this._contentItems.push(saveBg);

    const saveTxt = this.add.text(leftX + 100, saveY + 18, 'Save Equipment', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#44ee44',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    saveTxt.on('pointerover', () => saveTxt.setColor('#88ff88'));
    saveTxt.on('pointerout',  () => saveTxt.setColor('#44ee44'));
    saveTxt.on('pointerdown', () => this._saveEquipment(saveTxt));
    this._contentItems.push(saveTxt);

    // Stats panel
    this._drawStatsPanel(500, 90);
  }

  _drawEquipmentRow(slot, label, x, y, w) {
    const rowH = 64;
    const idx  = this._eqIndices[slot];
    const item = this._slotItems[slot][idx];

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.panel, 1);
    bg.fillRect(x, y, w, rowH);
    bg.lineStyle(1, PALETTE.panelBdr, 1);
    bg.strokeRect(x, y, w, rowH);
    this._contentItems.push(bg);

    // Slot label
    const slotTxt = this.add.text(x + 8, y + 8, label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#556677',
    });
    this._contentItems.push(slotTxt);

    // Item name
    const nameTxt = this.add.text(x + 8, y + 26, item.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: item.id ? '#ddeeff' : '#334455',
    });
    this._contentItems.push(nameTxt);

    // Stat bonuses
    const bonuses = [];
    if (item.attackBonus  !== 0) bonuses.push({ str: `${item.attackBonus > 0 ? '+' : ''}${item.attackBonus} ATK`, col: '#ffaa44' });
    if (item.defenseBonus !== 0) bonuses.push({ str: `${item.defenseBonus > 0 ? '+' : ''}${item.defenseBonus} DEF`, col: '#44aaff' });
    if (item.speedBonus   !== 0) bonuses.push({ str: `${item.speedBonus > 0 ? '+' : ''}${item.speedBonus} SPD`, col: '#aaff44' });
    if (item.moveId)             bonuses.push({ str: `+${item.moveId.replace(/_/g, ' ')}`, col: '#cc88ff' });

    let bx = x + 8;
    bonuses.forEach(b => {
      const bt = this.add.text(bx, y + 46, b.str, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: b.col,
      });
      this._contentItems.push(bt);
      bx += bt.width + 12;
    });

    // Arrow buttons
    const arrowSize = 28;
    const arrowY    = y + rowH / 2;

    // Left arrow
    const leftArr = this.add.text(x + w - 70, arrowY, '<', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#556677',
      backgroundColor: '#12121e',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leftArr.on('pointerover', () => leftArr.setColor('#aabbff'));
    leftArr.on('pointerout',  () => leftArr.setColor('#556677'));
    leftArr.on('pointerdown', () => {
      const len = this._slotItems[slot].length;
      this._eqIndices[slot] = (this._eqIndices[slot] - 1 + len) % len;
      this._showTab('equipment');
    });
    this._contentItems.push(leftArr);

    // Right arrow
    const rightArr = this.add.text(x + w - 30, arrowY, '>', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#556677',
      backgroundColor: '#12121e',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    rightArr.on('pointerover', () => rightArr.setColor('#aabbff'));
    rightArr.on('pointerout',  () => rightArr.setColor('#556677'));
    rightArr.on('pointerdown', () => {
      const len = this._slotItems[slot].length;
      this._eqIndices[slot] = (this._eqIndices[slot] + 1) % len;
      this._showTab('equipment');
    });
    this._contentItems.push(rightArr);
  }

  _drawStatsPanel(x, y) {
    const panelW = 400, panelH = 320;
    const char   = this._character;
    if (!char) return;

    // Compute totals from currently selected equipment
    let atkBonus = 0, defBonus = 0, spdBonus = 0;
    for (const slot of ['staff', 'hat', 'robe', 'boots', 'relic']) {
      const item = this._slotItems[slot][this._eqIndices[slot]];
      if (item) {
        atkBonus += item.attackBonus  || 0;
        defBonus += item.defenseBonus || 0;
        spdBonus += item.speedBonus   || 0;
      }
    }

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.panel, 1);
    bg.fillRect(x, y, panelW, panelH);
    bg.lineStyle(1, PALETTE.panelBdr, 1);
    bg.strokeRect(x, y, panelW, panelH);
    this._contentItems.push(bg);

    const title = this.add.text(x + panelW / 2, y + 14, 'CHARACTER STATS', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#445566',
    }).setOrigin(0.5);
    this._contentItems.push(title);

    const rows = [
      { label: 'HP',      base: char.hp_max,    bonus: 0,       col: '#22cc55' },
      { label: 'ATTACK',  base: char.attack,    bonus: atkBonus, col: '#ffaa44' },
      { label: 'DEFENSE', base: char.defense,   bonus: defBonus, col: '#44aaff' },
      { label: 'SPEED',   base: char.speed,     bonus: spdBonus, col: '#aaff44' },
    ];

    rows.forEach((row, i) => {
      const ry = y + 38 + i * 40;
      const total = row.base + row.bonus;

      const lbl = this.add.text(x + 16, ry, row.label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#556677',
      });
      this._contentItems.push(lbl);

      const base = this.add.text(x + 130, ry, String(row.base), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aabbcc',
      });
      this._contentItems.push(base);

      if (row.bonus !== 0) {
        const bonusStr = `${row.bonus > 0 ? '+' : ''}${row.bonus}`;
        const bonusTxt = this.add.text(x + 180, ry, bonusStr, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: row.bonus > 0 ? '#44ff88' : '#ff6644',
        });
        this._contentItems.push(bonusTxt);

        const totalTxt = this.add.text(x + 240, ry, `= ${total}`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: row.col,
        });
        this._contentItems.push(totalTxt);
      } else {
        const totalTxt = this.add.text(x + 180, ry, String(total), {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: row.col,
        });
        this._contentItems.push(totalTxt);
      }
    });
  }

  async _saveEquipment(saveTxt) {
    const charId = this._character.id;
    const payload = {};
    for (const slot of ['staff', 'hat', 'robe', 'boots', 'relic']) {
      const item = this._slotItems[slot][this._eqIndices[slot]];
      payload[`${slot}_id`] = item ? item.id : null;
    }

    saveTxt.setText('Saving...');
    saveTxt.setColor('#667799');

    try {
      await ApiClient.updateEquipment(charId, payload);
      // Update local character data
      for (const slot of ['staff', 'hat', 'robe', 'boots', 'relic']) {
        this._character[`${slot}_id`] = payload[`${slot}_id`];
      }
      saveTxt.setText('Saved!');
      saveTxt.setColor('#44ff88');
      this.time.delayedCall(1500, () => {
        if (saveTxt.active) {
          saveTxt.setText('Save Equipment');
          saveTxt.setColor('#44ee44');
        }
      });
    } catch (e) {
      console.error('Failed to save equipment:', e);
      saveTxt.setText('Error — retry');
      saveTxt.setColor('#ff6644');
      this.time.delayedCall(2000, () => {
        if (saveTxt.active) {
          saveTxt.setText('Save Equipment');
          saveTxt.setColor('#44ee44');
        }
      });
    }
  }
}
