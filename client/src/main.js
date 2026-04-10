import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CharacterCreateScene from './scenes/CharacterCreateScene.js';
import BattleScene from './scenes/BattleScene.js';

const config = {
  type: Phaser.CANVAS,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  // Scaling is handled by CSS in index.html so the canvas stays 960×640
  // internally (which means Phaser coordinate space always matches the canvas
  // element coordinates — no conversion needed).
  dom: { createContainer: true },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    CharacterCreateScene,
    BattleScene,
  ],
};

const game = new Phaser.Game(config);
window.game = game; // expose for tests / SAB API

// Expose a semantic test API on window so automated tests can drive the
// game without relying on pixel coordinates.
// Usage (from Playwright page.evaluate):
//   await page.evaluate(() => window.SAB.claimUser('alice'))
//   await page.evaluate(() => window.SAB.startBattle('forest_bandit'))
//   await page.evaluate(() => window.SAB.submitTurn('warrior_shield_bash', 'wolf_bite'))
//   const state = await page.evaluate(() => window.SAB.battleState())
window.SAB = {
  /** Returns the key of the currently active Phaser scene. */
  activeScene() {
    const s = game.scene.scenes.find(sc => sc.scene.isActive());
    return s?.scene.key ?? null;
  },

  /** Claims a username directly via API (no UI overlay needed — good for tests). */
  async claimUserDirect(username) {
    const res = await fetch('/api/auth/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.token) localStorage.setItem('sab_token', data.token);
    // Update MainMenuScene's currentUser ref if it's active
    const scene = game.scene.getScene('MainMenuScene');
    if (scene && data.user) {
      scene._currentUser = data.user;
      scene._updateStatus?.();
    }
    return data;
  },

  /** Triggers New Game flow — calls the internal _goNewGame method. */
  goNewGame() {
    const scene = game.scene.getScene('MainMenuScene');
    if (scene && typeof scene._goNewGame === 'function') scene._goNewGame();
  },

  /** Returns the current BattleManager state (null if not in battle). */
  battleState() {
    const scene = game.scene.getScene('BattleScene');
    if (!scene || !scene._mgr) return null;
    return JSON.parse(JSON.stringify(scene._mgr.getState()));
  },

  /** Submits a turn in BattleScene programmatically (bypasses animation). */
  submitTurn(heroAbilityId, beastAbilityId) {
    const scene = game.scene.getScene('BattleScene');
    if (!scene || !scene._mgr) throw new Error('Not in BattleScene');
    if (scene._mgr.isOver()) return; // no-op when battle is over
    if (scene._animating) return;   // still animating — skip safely

    // Call BattleManager directly (synchronous) — bypass Phaser timer animations
    const events = scene._mgr.submitPlayerActions(heroAbilityId, beastAbilityId);

    // Push logs
    events.forEach(ev => {
      if (ev.result?.log) scene._pushLog(ev.result.log);
      else if (ev.logs)   ev.logs.forEach(l => scene._pushLog(l));
      else if (ev.log)    scene._pushLog(ev.log);
    });

    // Sync UI to new state
    scene._animating = false;
    scene._afterEvents();
  },

  /** Checks if battle is over and returns phase ('victory'|'defeat'|null). */
  battlePhase() {
    const state = this.battleState();
    return state?.phase ?? null;
  },
};
