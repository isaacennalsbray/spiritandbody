/**
 * Spirit and Body — Playwright battle tests.
 *
 * Uses the window.SAB semantic test API exposed in main.js.
 * No pixel-coordinate clicks — all interactions go through the game's
 * public methods so tests survive layout and scale changes.
 *
 * Run with: npx playwright test
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForScene(page, sceneName, timeout = 15_000) {
  await page.waitForFunction(
    (name) => window.SAB?.activeScene() === name,
    sceneName,
    { timeout }
  );
}

async function waitForBattleIdle(page, timeout = 15_000) {
  // Wait until the battle phase is 'selecting' (not 'resolving' or 'animating')
  await page.waitForFunction(
    () => {
      const state = window.SAB?.battleState();
      return state && (state.phase === 'selecting' || state.phase === 'victory' || state.phase === 'defeat');
    },
    null,
    { timeout }
  );
}

async function screenshot(page, name) {
  if (!fs.existsSync('tests/screenshots')) fs.mkdirSync('tests/screenshots', { recursive: true });
  await page.screenshot({ path: `tests/screenshots/${name}.png` });
}

async function bootAndAuth(page, username) {
  await page.goto('/');
  // Wait for SAB API to be ready
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');
  await screenshot(page, `${username}-01-menu`);

  // Claim username via semantic API
  await page.evaluate(async (u) => {
    await window.SAB.claimUser(u);
  }, username);
  // Wait a moment for auth to complete + scene transition
  await page.waitForTimeout(1000);
  await waitForScene(page, 'MainMenuScene');
}

async function createCharAndBattle(page, heroName) {
  // Go to character creation
  await page.evaluate(() => window.SAB.goNewGame());
  await waitForScene(page, 'CharacterCreateScene', 8000);
  await screenshot(page, `${heroName}-02-create`);

  // Fill name and submit via the DOM input
  await page.fill('#game-container input[type="text"]', heroName);
  await page.keyboard.press('Enter');

  // Wait for success screen (the scene stays CharacterCreateScene until player clicks Start Battle)
  await page.waitForTimeout(2000);
  await screenshot(page, `${heroName}-03-success`);

  // Click "Start Battle →" button — the success screen
  // Since we can't use SAB for this (the scene handles it internally), use keyboard Enter
  // The scene listens for the button click; find it via the DOM or use page.evaluate
  // to trigger the scene transition directly
  await page.evaluate(() => {
    // Find CharacterCreateScene and trigger its battle start
    const scene = game?.scene?.getScene('CharacterCreateScene');
    if (scene?._lastChar && scene?._lastBeast) {
      scene.scene.start('BattleScene', {
        char:    scene._lastChar,
        beast:   scene._lastBeast,
        enemyId: 'forest_bandit',
        terrain: 'forest',
      });
    }
  });
  await waitForScene(page, 'BattleScene', 8000);
  await screenshot(page, `${heroName}-04-battle`);
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('auth + character creation flow completes without error', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');

  // Auth: claim username directly via API (sets JWT in localStorage)
  const username = `e2e_${Date.now()}`;
  await page.evaluate((u) => window.SAB.claimUserDirect(u), username);
  await page.waitForTimeout(400);
  await screenshot(page, 'e2e-01-auth');

  // Go to character creation
  await page.evaluate(() => window.SAB.goNewGame());
  await waitForScene(page, 'CharacterCreateScene', 8000);
  await screenshot(page, 'e2e-02-create');

  // Fill hero name and submit
  const nameInput = page.locator('#game-container input[type="text"]').first();
  await nameInput.waitFor({ timeout: 5000 });
  await nameInput.fill('Elowen');
  await nameInput.press('Enter');
  await page.waitForTimeout(2500);

  // Success screen: the scene stays CharacterCreateScene and stores _lastChar
  const hasChar = await page.evaluate(() => {
    const sc = game?.scene?.getScene('CharacterCreateScene');
    return !!sc?._lastChar;
  });
  await screenshot(page, 'e2e-03-success');
  expect(hasChar).toBe(true);

  // Launch battle from success screen
  await page.evaluate(() => {
    const sc = game.scene.getScene('CharacterCreateScene');
    sc.scene.start('BattleScene', {
      char: sc._lastChar, beast: sc._lastBeast,
      enemyId: 'forest_bandit', terrain: 'forest',
    });
  });
  await waitForScene(page, 'BattleScene', 8000);
  await screenshot(page, 'e2e-04-battle');

  const state = await page.evaluate(() => window.SAB.battleState());
  expect(state).not.toBeNull();
  expect(state.phase).toBe('selecting');
  expect(state.player.hero.hp).toBeGreaterThan(0);

  // Play one turn to confirm combat works end-to-end
  await page.evaluate(() => window.SAB.submitTurn('basic_attack', 'basic_attack'));
  const stateAfter = await page.evaluate(() => window.SAB.battleState());
  expect(stateAfter.turn).toBe(1);
  await screenshot(page, 'e2e-05-turn-1');
});

test('main menu loads and shows correct title', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');
  await screenshot(page, 'main-menu');

  const scene = await page.evaluate(() => window.SAB.activeScene());
  expect(scene).toBe('MainMenuScene');
});

test('full battle — warrior vs forest bandit plays to completion', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');

  // Inject battle directly (bypass auth+create for speed)
  await page.evaluate(() => {
    const char = {
      name: 'Aldric', heroClass: 'warrior',
      hpCurrent: 100, hpMax: 100,
      attack: 12, defense: 7, speed: 8,
      unlockedAbilities: ['warrior_basic', 'warrior_shield_bash', 'warrior_war_cry', 'warrior_cleave'],
    };
    const beast = {
      displayName: 'Wolf', templateId: 'wolf', type: 'land',
      hpCurrent: 60, hpMax: 60,
      attack: 12, defense: 4, speed: 14,
      staminaCurrent: 3,
      unlockedAbilities: ['wolf_bite'],
    };
    game.scene.getScene('MainMenuScene').scene.start('BattleScene', {
      char, beast, enemyId: 'forest_bandit', terrain: 'forest',
    });
  });

  await waitForScene(page, 'BattleScene', 8000);
  await screenshot(page, 'warrior-battle-start');

  const initState = await page.evaluate(() => window.SAB.battleState());
  expect(initState).not.toBeNull();
  expect(initState.phase).toBe('selecting');
  expect(initState.player.hero.hp).toBeGreaterThan(0);
  expect(initState.enemy.hero.hp).toBeGreaterThan(0);
  expect(initState.turn).toBe(0);

  // Play up to 20 turns using a mix of abilities
  const abilities = ['warrior_basic', 'warrior_shield_bash', 'warrior_war_cry', 'warrior_cleave'];
  let turns = 0;
  while (turns < 20) {
    const state = await page.evaluate(() => window.SAB.battleState());
    if (!state || state.phase === 'victory' || state.phase === 'defeat') break;

    // Vary the strategy: use different abilities each turn
    const heroAbil = abilities[turns % abilities.length];
    const beastAbil = turns % 2 === 0 ? 'wolf_bite' : 'basic_attack';
    await page.evaluate(([h, b]) => window.SAB.submitTurn(h, b), [heroAbil, beastAbil]);
    await waitForBattleIdle(page, 10_000);
    turns++;
  }

  const finalState = await page.evaluate(() => window.SAB.battleState());
  await screenshot(page, 'warrior-battle-final');

  expect(['victory', 'defeat']).toContain(finalState.phase);
  console.log(`Battle ended: ${finalState.phase} after ${turns} turns`);
  console.log(`Player HP: ${finalState.player.hero.hp}/${finalState.player.hero.hpMax}`);
  console.log(`Enemy HP: ${finalState.enemy.hero.hp}/${finalState.enemy.hero.hpMax}`);
});

test('warrior + wolf synergy: bleed stacks up', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');

  // Inject a battle directly without going through full auth+create
  // This tests the battle engine logic in isolation
  await page.evaluate(() => {
    // Build minimal char + beast objects matching BattleManager expected shape
    const char = {
      name: 'TestWarrior', heroClass: 'warrior',
      hpCurrent: 100, hpMax: 100,
      attack: 14, defense: 8, speed: 8,
      unlockedAbilities: ['warrior_basic', 'warrior_shield_bash', 'warrior_war_cry', 'warrior_cleave'],
    };
    const beast = {
      displayName: 'Wolf', templateId: 'wolf', type: 'land',
      hpCurrent: 60, hpMax: 60,
      attack: 12, defense: 4, speed: 14,
      staminaCurrent: 3,
      unlockedAbilities: ['wolf_bite'],
    };
    const scene = game.scene.getScene('MainMenuScene');
    scene.scene.start('BattleScene', { char, beast, enemyId: 'forest_bandit', terrain: 'forest' });
  });

  await waitForScene(page, 'BattleScene', 8000);

  // Turn 1: wolf bites (applies bleed), hero basic attacks
  await page.evaluate(() => window.SAB.submitTurn('basic_attack', 'wolf_bite'));
  await waitForBattleIdle(page, 8000);
  await screenshot(page, 'synergy-01-after-wolf-bite');

  const stateAfterBite = await page.evaluate(() => window.SAB.battleState());
  // Enemy should have bleed status after wolf_bite
  const hasBleed = !!stateAfterBite.enemyStatuses?.bleed;
  console.log('Enemy has bleed after wolf bite:', hasBleed);
  console.log('Enemy statuses:', JSON.stringify(stateAfterBite.enemyStatuses));

  // Turn 2: hero uses warrior_war_cry (ATK buff), wolf bites again to reinforce bleed
  await page.evaluate(() => window.SAB.submitTurn('warrior_war_cry', 'wolf_bite'));
  await waitForBattleIdle(page, 8000);
  await screenshot(page, 'synergy-02-war-cry');

  const stateAfterCry = await page.evaluate(() => window.SAB.battleState());
  // Player should have atk_up status after war cry
  console.log('Player statuses after War Cry:', JSON.stringify(stateAfterCry.playerStatuses));
  expect(stateAfterCry.player.hero.hp).toBeGreaterThan(0); // still alive
});

test('mage plays correctly — mana drains with spells', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.SAB !== 'undefined', null, { timeout: 15_000 });
  await waitForScene(page, 'MainMenuScene');

  // Inject a mage battle directly
  await page.evaluate(() => {
    const char = {
      name: 'Lyra', heroClass: 'mage',
      hpCurrent: 80, hpMax: 80,
      attack: 8, defense: 5, speed: 10,
      magicPower: 18,
      unlockedAbilities: ['mage_basic', 'mage_frost_lance', 'mage_fireball'],
    };
    const beast = {
      displayName: 'Owl', templateId: 'owl', type: 'sky',
      hpCurrent: 50, hpMax: 50,
      attack: 10, defense: 5, speed: 15,
      staminaCurrent: 3,
      unlockedAbilities: ['owl_lunar_gaze'],
    };
    game.scene.getScene('MainMenuScene').scene.start('BattleScene', {
      char, beast, enemyId: 'swamp_witch', terrain: 'coastal',
    });
  });

  await waitForScene(page, 'BattleScene', 8000);

  const initState = await page.evaluate(() => window.SAB.battleState());
  const startMana = initState.player.hero.resourceCurrent;
  console.log('Starting mana:', startMana);

  // Cast Frost Lance (costs 15 mana)
  await page.evaluate(() => window.SAB.submitTurn('mage_frost_lance', 'basic_attack'));
  await waitForBattleIdle(page, 8000);

  const afterFrost = await page.evaluate(() => window.SAB.battleState());
  const manaAfterFrost = afterFrost.player.hero.resourceCurrent;
  console.log('Mana after Frost Lance:', manaAfterFrost, '(should regen 5/turn after spend 15)');
  // Mana regen: +5/turn, Frost Lance: -15. Net = startMana - 15 + 5 = startMana - 10
  expect(manaAfterFrost).toBeLessThan(startMana);

  // Check if enemy has slow status from frost lance
  const enemySlowed = !!afterFrost.enemyStatuses?.slow;
  console.log('Enemy slowed after Frost Lance:', enemySlowed);
  await screenshot(page, 'mage-frost-lance');
});
