import Phaser from 'phaser';
import ApiClient from '../api/ApiClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  async create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0f);

    // Stars
    const gfx = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      gfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
      gfx.fillRect(x, y, 1, 1);
    }

    // Small title top-left
    this.add.text(16, 14, 'CAPTURE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#6688ff',
      strokeThickness: 2,
    });

    // Back to character select — top left below title
    const backBtn = this.add.text(16, 38, '< Character Select', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#445566',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#aabbff'));
    backBtn.on('pointerout',  () => backBtn.setColor('#445566'));
    backBtn.on('pointerdown', () => this.scene.start('LoginScene'));

    // Load character data
    const charId = localStorage.getItem('sab_char_id');
    let character = null;

    try {
      const data = await ApiClient.listCharacters();
      character = data.characters.find(c => String(c.id) === String(charId)) || data.characters[0] || null;
    } catch (err) {
      // Token expired or network error — send back to login
      ApiClient.logout();
      localStorage.removeItem('sab_char_id');
      this.scene.start('LoginScene');
      return;
    }

    if (!character) {
      this.scene.start('CharacterCreateScene');
      return;
    }

    // Welcome text
    this.add.text(cx, cy - 60, `Welcome, ${character.name}!`, {
      fontFamily: 'monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ddeeff',
      stroke: '#2a2a4a',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Stats panel
    const panelW = 240;
    const panelH = 110;
    const panelX = cx - panelW / 2;
    const panelY = cy - 20;

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x12121e, 1);
    panelGfx.fillRect(panelX, panelY, panelW, panelH);
    panelGfx.lineStyle(1, 0x2a2a4a, 1);
    panelGfx.strokeRect(panelX, panelY, panelW, panelH);

    // Level + XP bar
    const charLevel  = character.level || 1;
    const charXp     = character.xp    || 0;
    const xpNeeded   = charLevel * 100;
    const xpPct      = Math.min(1, charXp / xpNeeded);

    this.add.text(cx, panelY - 22, `Level ${charLevel}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffee44',
    }).setOrigin(0.5);

    // XP bar
    const xpBarW = panelW - 20;
    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x1a1a2e, 1);
    xpBg.fillRect(panelX + 10, panelY - 10, xpBarW, 10);
    xpBg.lineStyle(1, 0x2a2a4a, 1);
    xpBg.strokeRect(panelX + 10, panelY - 10, xpBarW, 10);
    const xpFill = this.add.graphics();
    xpFill.fillStyle(0xccaa22, 1);
    xpFill.fillRect(panelX + 10, panelY - 10, Math.floor(xpBarW * xpPct), 10);
    this.add.text(cx, panelY + 2, `${charXp} / ${xpNeeded} XP`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#998844',
    }).setOrigin(0.5);

    const stats = [
      { label: 'HP',  value: `${character.hp_current} / ${character.hp_max}` },
      { label: 'ATK', value: String(character.attack)  },
      { label: 'DEF', value: String(character.defense) },
      { label: 'SPD', value: String(character.speed)   },
    ];

    const colW = panelW / 4;
    stats.forEach((s, i) => {
      const sx = panelX + colW * i + colW / 2;
      this.add.text(sx, panelY + 28, s.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#667799',
      }).setOrigin(0.5);
      this.add.text(sx, panelY + 44, s.value, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ddeeff',
      }).setOrigin(0.5);
    });

    // World Map button
    const mapBtn = this.add.text(cx, cy + 120, '[ WORLD MAP ]', {
      fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold',
      color: '#44ff88',
      backgroundColor: '#0a1a12',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    mapBtn.on('pointerover', () => mapBtn.setColor('#aaffcc'));
    mapBtn.on('pointerout',  () => mapBtn.setColor('#44ff88'));
    mapBtn.on('pointerdown', () => {
      this.scene.start('MapScene', {
        playerLevel: character.level || 1,
        playerData: character,
      });
    });

    // Party button
    const partyBtn = this.add.text(cx, cy + 180, '[ PARTY ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#44bbff',
      backgroundColor: '#12121e',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    partyBtn.on('pointerover', () => partyBtn.setColor('#aaddff'));
    partyBtn.on('pointerout',  () => partyBtn.setColor('#44bbff'));
    partyBtn.on('pointerdown', () => {
      this.scene.start('PartyScene');
    });

    // Battle test button
    const battleBtn = this.add.text(cx, cy + 235, '[ BATTLE TEST ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff9944',
      backgroundColor: '#12121e',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    battleBtn.on('pointerover', () => battleBtn.setColor('#ffcc88'));
    battleBtn.on('pointerout',  () => battleBtn.setColor('#ff9944'));
    battleBtn.on('pointerdown', async () => {
      try {
        const petsData = await ApiClient.listPets(charId);
        const activePets = petsData.pets
          .filter(p => p.active_slot === 1 || p.active_slot === 2)
          .sort((a, b) => a.active_slot - b.active_slot)
          .map(p => ({ ...p, id: `player_pet${p.active_slot}`, speciesId: p.species }));

        this.scene.start('BattleScene', {
          encounterId: 'test_battle',
          playerData: { ...character, pets: activePets.length ? activePets : undefined },
        });
      } catch {
        this.scene.start('BattleScene', { encounterId: 'test_battle', playerData: character });
      }
    });

    // Wild battle button
    const wildSpecies = ['frog','ember','sprout','spark','shimmer','frost','pebble'];
    const wildBtn = this.add.text(cx, cy + 210, '[ WILD ENCOUNTER ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#44ee88',
      backgroundColor: '#12121e',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    wildBtn.on('pointerover', () => wildBtn.setColor('#aaffcc'));
    wildBtn.on('pointerout',  () => wildBtn.setColor('#44ee88'));
    wildBtn.setY(cy + 280);
    wildBtn.on('pointerdown', async () => {
      const species = wildSpecies[Math.floor(Math.random() * wildSpecies.length)];
      const encounterId = `wild_${species}`;
      try {
        const petsData = await ApiClient.listPets(charId);
        const activePets = petsData.pets
          .filter(p => p.active_slot === 1 || p.active_slot === 2)
          .sort((a, b) => a.active_slot - b.active_slot)
          .map(p => ({ ...p, id: `player_pet${p.active_slot}`, speciesId: p.species }));

        this.scene.start('BattleScene', {
          encounterId,
          playerData: { ...character, pets: activePets.length ? activePets : undefined },
        });
      } catch {
        this.scene.start('BattleScene', { encounterId, playerData: character });
      }
    });

    // Log out button — bottom right
    const logoutBtn = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 16, '[ Log Out ]', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#445566',
      backgroundColor: '#12121e',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    logoutBtn.on('pointerover', () => logoutBtn.setColor('#ff6666'));
    logoutBtn.on('pointerout',  () => logoutBtn.setColor('#445566'));
    logoutBtn.on('pointerdown', () => {
      ApiClient.logout();
      localStorage.removeItem('sab_char_id');
      this.scene.start('LoginScene');
    });
  }
}
