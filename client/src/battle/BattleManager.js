/**
 * BattleManager — orchestrates a full PvE battle turn by turn.
 * Pure game logic; no Phaser code here. Driven by BattleScene.
 *
 * State shape:
 * {
 *   turn: number,
 *   phase: 'selecting' | 'resolving' | 'animating' | 'end_turn' | 'victory' | 'defeat',
 *   player: { hero, beast },
 *   enemy:  { hero, beast, template },
 *   playerStatuses: { [type]: { magnitude, duration } },
 *   enemyStatuses:  { [type]: { magnitude, duration } },
 *   log: string[],   // battle log entries
 *   terrain: string,
 * }
 */

import TurnQueue from './TurnQueue.js';
import { resolveAction, tickStatuses } from './ActionResolver.js';
import { selectEnemyActions, ENEMIES } from '../data/enemies.js';
import { CLASSES } from '../data/classAbilities.js';
import { BEAST_ABILITIES } from '../data/beastAbilities.js';

export default class BattleManager {
  constructor(playerChar, playerBeast, enemyId, terrain) {
    this._queue = new TurnQueue();
    this._enemyTemplate = ENEMIES[enemyId];
    this.terrain = terrain || this._enemyTemplate?.terrain || 'forest';

    // Deep-copy enemy so we mutate freely
    const et = this._enemyTemplate;
    this.state = {
      turn: 0,
      phase: 'selecting',
      terrain: this.terrain,
      player: {
        hero:  this._makePlayerHero(playerChar),
        beast: this._makePlayerBeast(playerBeast),
      },
      enemy: {
        hero:  { ...et.hero,  hp: et.hero.hp  },
        beast: { ...et.beast, hp: et.beast.hp },
        template: et,
      },
      playerStatuses: {},
      enemyStatuses:  {},
      log: [`⚔ Battle begins! You face ${et.name} on ${terrain} terrain.`],
      pendingPlayerActions: null,
      pendingResults: [],
      phaseTriggered: new Set(),
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  getState() { return this.state; }

  isOver() { return this.state.phase === 'victory' || this.state.phase === 'defeat'; }

  /**
   * Submit the player's chosen actions and resolve the full turn.
   * Returns an array of "events" for BattleScene to animate one-by-one.
   *
   * @param {string} heroAbilityId   - ability ID chosen for hero
   * @param {string} beastAbilityId  - ability ID chosen for beast (or 'basic_attack')
   * @returns {object[]}             - events: [{ type, actor, target, result, log }, ...]
   */
  submitPlayerActions(heroAbilityId, beastAbilityId) {
    const s = this.state;
    if (s.phase !== 'selecting') return [];

    s.turn += 1;
    s.phase = 'resolving';
    s.log = [];

    // ── Enemy AI picks actions ─────────────────────────────────────────────
    const aiActions = selectEnemyActions(
      { ...s.enemy.template, hero: s.enemy.hero, beast: s.enemy.beast, pattern: s.enemy.template.aiPattern },
      { playerStatuses: s.playerStatuses, enemyStatuses: s.enemyStatuses, turn: s.turn }
    );

    // ── Build actor list for turn queue ────────────────────────────────────
    const actors = [
      { id: 'player_hero',  side: 'player', speed: s.player.hero.speed,  isAlive: s.player.hero.hp > 0, isStunned: !!s.playerStatuses.stun },
      { id: 'player_beast', side: 'player', speed: s.player.beast.speed, isAlive: s.player.beast.hp > 0, isStunned: !!s.playerStatuses.beast_stun },
      { id: 'enemy_hero',   side: 'enemy',  speed: s.enemy.hero.speed,   isAlive: s.enemy.hero.hp > 0,  isStunned: !!s.enemyStatuses.stun },
      { id: 'enemy_beast',  side: 'enemy',  speed: s.enemy.beast.speed,  isAlive: s.enemy.beast.hp > 0, isStunned: !!s.enemyStatuses.beast_stun },
    ];

    const order = this._queue.build(actors);
    const events = [];

    // ── Resolve each actor in speed order ─────────────────────────────────
    for (const actorId of order) {
      if (this._checkWin(events)) break;

      const isPlayer = actorId.startsWith('player');
      const isHero   = actorId.endsWith('_hero');

      const actor  = isPlayer ? (isHero ? s.player.hero  : s.player.beast)  : (isHero ? s.enemy.hero  : s.enemy.beast);
      const target = isPlayer ? (isHero ? s.enemy.hero   : s.enemy.beast)   : (isHero ? s.player.hero  : s.player.beast);

      if (actor.hp <= 0) continue;
      if (target.hp <= 0) {
        // Redirect to remaining alive target on that side
        const altTarget = isPlayer
          ? (s.enemy.hero.hp > 0 ? s.enemy.hero : s.enemy.beast)
          : (s.player.hero.hp > 0 ? s.player.hero : s.player.beast);
        if (!altTarget || altTarget.hp <= 0) continue;
      }

      const abilityId = isPlayer
        ? (isHero ? heroAbilityId : beastAbilityId)
        : (isHero ? aiActions.heroAbilityId : aiActions.beastAbilityId);

      const ability = this._resolveAbility(actorId, abilityId);
      const battleStateView = {
        playerStatuses: s.playerStatuses,
        enemyStatuses:  s.enemyStatuses,
        terrain: s.terrain,
      };

      const liveTarget = this._getLiveTarget(actorId, isHero, s);
      const result = resolveAction(
        this._actorView(actorId, s),
        this._actorView(liveTarget, s),
        ability,
        battleStateView
      );

      // Apply damage
      const targetRef = this._getActorRef(liveTarget, s);
      if (result.damage > 0) {
        targetRef.hp = Math.max(0, targetRef.hp - result.damage);
      }
      if (result.heal > 0) {
        actor.hp = Math.min(actor.hpMax, actor.hp + result.heal);
      }

      // Apply status effects
      this._applyEffects(result.effects, actorId, s);

      // Resource spend
      if (ability.costType === 'energy' || ability.costType === 'mana') {
        actor.resourceCurrent = Math.max(0, (actor.resourceCurrent || 0) - ability.cost);
      } else if (ability.costType === 'combo') {
        actor.resourceCurrent = Math.max(0, (actor.resourceCurrent || 0) - ability.cost);
      }
      // Beast stamina
      if (!isHero && abilityId !== 'basic_attack' && ability.costType !== 'none') {
        actor.staminaCurrent = Math.max(0, (actor.staminaCurrent || 0) - 1);
      }

      s.log.push(result.log);
      events.push({ actorId, targetId: liveTarget, result, ability });
    }

    // ── End-of-turn: regen resources, tick DoTs ─────────────────────────────
    if (!this._checkWin(events)) {
      this._endOfTurn(s, events);
    }

    // ── Check boss phase transitions ────────────────────────────────────────
    this._checkBossPhase(s, events);

    // ── Determine phase outcome ─────────────────────────────────────────────
    if (!this._checkWin(events)) {
      s.phase = 'selecting';
    }

    return events;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  _getLiveTarget(actorId, isHero, s) {
    const isPlayer = actorId.startsWith('player');
    // Player actors target enemy side, enemy actors target player side
    const primaryTarget  = isPlayer ? (isHero ? 'enemy_hero'  : 'enemy_beast')  : (isHero ? 'player_hero'  : 'player_beast');
    const fallbackTarget = isPlayer ? (isHero ? 'enemy_beast' : 'enemy_hero')   : (isHero ? 'player_beast' : 'player_hero');

    const primary  = this._getActorRef(primaryTarget, s);
    const fallback = this._getActorRef(fallbackTarget, s);

    if (primary.hp > 0) return primaryTarget;
    if (fallback.hp > 0) return fallbackTarget;
    return primaryTarget; // both dead — won't matter, will be skipped
  }

  _getActorRef(actorId, s) {
    if (actorId === 'player_hero')  return s.player.hero;
    if (actorId === 'player_beast') return s.player.beast;
    if (actorId === 'enemy_hero')   return s.enemy.hero;
    if (actorId === 'enemy_beast')  return s.enemy.beast;
  }

  _actorView(actorId, s) {
    const ref = this._getActorRef(actorId, s);
    return { ...ref, id: actorId };
  }

  _resolveAbility(actorId, abilityId) {
    if (!abilityId || abilityId === 'basic_attack') {
      return { id: 'basic_attack', name: 'Attack', type: 'physical', power: 1.0, cost: 0, costType: 'none' };
    }
    if (abilityId === 'defend') {
      return { id: 'defend', name: 'Defend', type: 'defend', power: 0, cost: 0, costType: 'none' };
    }
    // Look up in class abilities or beast abilities
    const isHero  = actorId.endsWith('_hero');
    if (isHero) {
      for (const cls of Object.values(CLASSES)) {
        const ab = cls.abilities.find(a => a.id === abilityId);
        if (ab) return ab;
      }
    } else {
      const ab = BEAST_ABILITIES[abilityId];
      if (ab) return ab;
    }
    return { id: abilityId, name: abilityId, type: 'physical', power: 1.0, cost: 0, costType: 'none' };
  }

  _applyEffects(effects, sourceActorId, s) {
    const isPlayer = sourceActorId.startsWith('player');

    for (const eff of effects) {
      const targetIsPlayer = eff.target === 'self' ? isPlayer : !isPlayer;
      const statuses = targetIsPlayer ? s.playerStatuses : s.enemyStatuses;

      switch (eff.type) {
        case 'bleed':
        case 'poison':
        case 'stun':
        case 'silence':
        case 'paralyze':
        case 'slow':
        case 'blind':
        case 'death_mark':
        case 'defending':
        case 'counter_stance':
        case 'negate_hit':
        case 'dodge_next':
        case 'atk_up':
          statuses[eff.type] = { magnitude: eff.magnitude || 0, duration: eff.duration || 1 };
          break;
        case 'gain_cp':
          if (isPlayer) {
            s.player.hero.resourceCurrent = Math.min(
              s.player.hero.resourceMax || 5,
              (s.player.hero.resourceCurrent || 0) + (eff.magnitude || 1)
            );
          }
          break;
        case 'hemorrhage':
          statuses.hemorrhage = { magnitude: 1, duration: 3 };
          s.log.push(`⚠ ${isPlayer ? 'Enemy' : 'You'} suffer Hemorrhage — Bleed and Poison amplified!`);
          break;
        case 'type_advantage':
          s.log.push('▲ Type advantage!');
          break;
        case 'type_disadvantage':
          s.log.push('▼ Type disadvantage.');
          break;
        case 'crit':
          // logged in ActionResolver
          break;
      }
    }
  }

  _endOfTurn(s, events) {
    // Regen resources
    const h = s.player.hero;
    if (h.resource === 'energy') h.resourceCurrent = Math.min(h.resourceMax, (h.resourceCurrent || 0) + 15);
    if (h.resource === 'mana')   h.resourceCurrent = Math.min(h.resourceMax, (h.resourceCurrent || 0) + 5);

    // Beast stamina regen
    for (const b of [s.player.beast, s.enemy.beast]) {
      if (b.staminaCurrent < b.staminaMax) b.staminaCurrent += 1;
    }

    // Enemy energy/mana regen
    const eh = s.enemy.hero;
    if (eh.resource === 'energy') eh.resourceCurrent = Math.min(eh.resourceMax, (eh.resourceCurrent || 0) + 15);
    if (eh.resource === 'mana')   eh.resourceCurrent = Math.min(eh.resourceMax, (eh.resourceCurrent || 0) + 5);
    if (eh.resource === 'combo')  { /* gained by attacks, not passive */ }

    // Tick status effects
    for (const [owner, statuses] of [['Player', s.playerStatuses], ['Enemy', s.enemyStatuses]]) {
      const tick = tickStatuses(statuses, owner);
      if (tick.damage > 0) {
        const target = owner === 'Player' ? s.player.hero : s.enemy.hero;
        target.hp = Math.max(0, target.hp - tick.damage);
        events.push({ type: 'dot_tick', owner, damage: tick.damage, logs: tick.logs });
      }
      tick.expired.forEach(t => { delete statuses[t]; });
      tick.logs.forEach(l => s.log.push(l));
    }

    // Expire 'defending' after each turn
    delete s.playerStatuses.defending;
    delete s.enemyStatuses.defending;
  }

  _checkBossPhase(s, events) {
    const phases = s.enemy.template?.phases;
    if (!phases) return;
    const hpPct = s.enemy.hero.hp / s.enemy.hero.hpMax;
    for (const phase of phases) {
      if (!s.phaseTriggered.has(phase.trigger) && hpPct <= phase.hpThreshold) {
        s.phaseTriggered.add(phase.trigger);
        s.log.push(`⚡ ${phase.log}`);
        events.push({ type: 'boss_phase', trigger: phase.trigger, log: phase.log });

        if (phase.trigger === 'fortify') {
          s.enemyStatuses = {}; // cleanse all debuffs
          s.enemy.hero.defense = Math.floor(s.enemy.hero.defense * 1.3);
          s.enemy.beast.defense = Math.floor(s.enemy.beast.defense * 1.3);
          s.log.push('The Guardian cleanses all ailments and hardens its body!');
        }
      }
    }
  }

  _checkWin(events) {
    const s = this.state;
    if (s.player.hero.hp <= 0) {
      s.phase = 'defeat';
      s.log.push('💀 You were defeated…');
      events.push({ type: 'defeat' });
      return true;
    }
    if (s.enemy.hero.hp <= 0) {
      s.phase = 'victory';
      s.log.push(`🏆 Victory! ${s.enemy.template.name} defeated.`);
      events.push({ type: 'victory', xpReward: s.enemy.template.xpReward });
      return true;
    }
    return false;
  }

  _makePlayerHero(char) {
    return {
      id: 'player_hero', side: 'player',
      name: char.name, heroClass: char.heroClass,
      hp: char.hpCurrent, hpMax: char.hpMax,
      attack: char.attack, defense: char.defense, speed: char.speed,
      magicPower: char.magicPower,
      resource: char.heroClass === 'warrior' ? 'energy' : char.heroClass === 'mage' ? 'mana' : 'combo',
      resourceMax: char.heroClass === 'warrior' ? 100 : char.heroClass === 'mage' ? 120 : 5,
      resourceCurrent: char.heroClass === 'warrior' ? 60 : char.heroClass === 'mage' ? 80 : 0,
      unlockedAbilities: char.unlockedAbilities || [],
    };
  }

  _makePlayerBeast(beast) {
    return {
      id: 'player_beast', side: 'player',
      name: beast.displayName || beast.templateId,
      templateId: beast.templateId, beastType: beast.type,
      hp: beast.hpCurrent, hpMax: beast.hpMax,
      attack: beast.attack, defense: beast.defense, speed: beast.speed,
      staminaCurrent: beast.staminaCurrent, staminaMax: 3,
      abilities: beast.unlockedAbilities || [],
    };
  }
}
