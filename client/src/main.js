import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import LoginScene from './scenes/LoginScene.js';
import CharacterCreateScene from './scenes/CharacterCreateScene.js';
import GameScene from './scenes/GameScene.js';
import BattleScene from './scenes/BattleScene.js';
import PartyScene from './scenes/PartyScene.js';
import MapScene from './scenes/MapScene.js';
import RegionScene from './scenes/RegionScene.js';
import ShopScene from './scenes/ShopScene.js';
import BestiaryScene from './scenes/BestiaryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  dom: {
    createContainer: true,
  },
  scene: [
    BootScene,
    PreloadScene,
    LoginScene,
    CharacterCreateScene,
    GameScene,
    BattleScene,
    PartyScene,
    MapScene,
    RegionScene,
    ShopScene,
    BestiaryScene,
  ],
};

new Phaser.Game(config);
