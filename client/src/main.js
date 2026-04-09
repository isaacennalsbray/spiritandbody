import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';

const config = {
  type: Phaser.CANVAS,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  pixelArt: true,
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
  ],
};

new Phaser.Game(config);
