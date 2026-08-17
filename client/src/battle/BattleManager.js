import { MOVES } from '../data/moves.js';
import { getTypeMultiplier } from '../data/types.js';
import { buildPetCombatant } from '../data/pets.js';
import { EQUIPMENT } from '../data/equipment.js';

// ─── Damage calculation (passives + status modifiers) ────────────────────────

function calcDamage(attacker, move, defender, aoeMult = 1.0) {
  // Blind check — attacker misses more often when blinded
  if (attacker.status === 'blind' && Math.random() < 0.40) {
    return { damage: 0, crit: false, dodged: false, missed: true };
  }

  const raw = attacker.attack * move.power;
  const mitigation = defender.defense / (defender.defense + 50);
  const typeMultiplier = getTypeMultiplier(move.type, defender.type);
  let damage = Math.max(1, Math.floor(raw * (1 - mitigation) * typeMultiplier * aoeMult));

  // ── Attacker passives ──────────────────────────────────────────────────────
  // Blaze: +20% damage when attacker below 50% HP
  if (attacker.passive === 'blaze' && attacker.hp < attacker.maxHp * 0.5) {
    damage = Math.ceil(damage * 1.20);
  }
  // Fury: +25% damage when attacker below 35% HP
  if (attacker.passive === 'fury' && attacker.hp < attacker.maxHp * 0.35) {
    damage = Math.ceil(damage * 1.25);
  }
  // Predator: +15% damage vs wounded targets (<50% HP)
  if (attacker.passive === 'predator' && defender.hp < defender.maxHp * 0.5) {
    damage = Math.ceil(damage * 1.15);
  }

  // ── Defender passives ──────────────────────────────────────────────────────
  // Thick Coat / Fortress: reduce incoming damage
  if (defender.passive === 'thick_coat') damage = Math.floor(damage * 0.85);
  if (defender.passive === 'fortress')   damage = Math.floor(damage * 0.80);
  // Barrier: reduce all incoming damage by 18%
  if (defender.passive === 'barrier')    damage = Math.floor(damage * 0.82);

  // Soak status: +50% lightning damage
  if (defender.status === 'soak' && move.type === 'lightning') {
    damage = Math.floor(damage * 1.50);
  }

  damage = Math.max(1, damage);

  // Dodge check — slippery, luminous, swift passives add dodge
  const dodgeBase  = defender.speed / 300;
  const dodgeExtra = (defender.passive === 'slippery' ? 0.15 : 0)
                   + (defender.passive === 'luminous'  ? 0.15 : 0)
                   + (defender.passive === 'swift'     ? 0.40 : 0);
  if (Math.random() < dodgeBase + dodgeExtra) {
    return { damage: 0, crit: false, dodged: true };
  }

  // Crit check
  let crit = false;
  if (Math.random() < attacker.speed / 200) {
    damage = Math.floor(damage * 1.5);
    crit = true;
  }

  return { damage, crit, dodged: false, missed: false };
}

// ─── Move resolution (handles thorns + static passives) ──────────────────────

function resolveMove(attacker, move, targets) {
  const results = [];
  // AOE deals 65% per target when hitting multiple targets (single-target is full damage)
  const aoeMult = (move.isAoe && targets.filter(t => t.alive).length > 1) ? 0.65 : 1.0;
  for (const defender of targets) {
    if (!defender.alive) continue;
    const res = calcDamage(attacker, move, defender, aoeMult);
    const { damage, crit, dodged, missed } = res;

    defender.hp = Math.max(0, defender.hp - damage);
    if (defender.hp <= 0) defender.alive = false;

    let thornDmg = 0;
    let staticStun = false;

    if (!dodged && !missed && damage > 0) {
      // Thorns passive: reflect 15% damage back to attacker
      if (defender.passive === 'thorns') {
        thornDmg = Math.max(1, Math.floor(damage * 0.15));
        attacker.hp = Math.max(0, attacker.hp - thornDmg);
        if (attacker.hp <= 0) attacker.alive = false;
      }
      // Static passive: 20% chance to stun attacker
      if (defender.passive === 'static' && !attacker.status && Math.random() < 0.20) {
        attacker.status = 'stun';
        attacker.statusTurns = 1;
        staticStun = true;
      }
    }

    results.push({ targetId: defender.id, damage, crit, dodged, missed: !!missed, thornDmg, staticStun });
  }
  return results;
}

// ─── Level scaling helpers ────────────────────────────────────────────────────
// Reduced from 0.12/0.15 to prevent HP/stat explosion at high levels.
// Rarity base stats drive the power gap between pets, not level inflation.
function statScale(level)  { return 1 + (level - 1) * 0.06; }
function hpScale(level)    { return 1 + (level - 1) * 0.07; }
export function xpToNextLevel(level) { return level * 100; }
export function xpForBattle(enemyAvgLevel) { return Math.round(40 * enemyAvgLevel); }
export function goldForBattle(enemyAvgLevel) { return Math.round(5 * enemyAvgLevel); }

// ─── Status names ─────────────────────────────────────────────────────────────
const STATUS_VERB = {
  burn: 'burned', poison: 'poisoned', freeze: 'frozen',
  stun: 'stunned', blind: 'blinded', soak: 'soaked',
};

// ─── BattleManager ────────────────────────────────────────────────────────────

export default class BattleManager {
  constructor(playerData, encounterData) {
    this._state = this._buildInitialState(playerData, encounterData);
  }

  getState() { return this._state; }

  // ── Turn queue ────────────────────────────────────────────────────────────

  buildTurnQueue() {
    const alive = Object.values(this._state.combatants).filter(c => c.alive);
    alive.sort((a, b) => b.speed - a.speed);
    this._state.turnQueue = alive.map(c => c.id);
    this._state.queueIndex = 0;
    return this._state.turnQueue;
  }

  // ── Execute action ────────────────────────────────────────────────────────

  executeAction(actorId, action) {
    const state = this._state;
    const actor = state.combatants[actorId];
    const logs  = [];
    const hits  = [];
    let captured   = false;
    let capturedId = null;

    if (!actor || !actor.alive) {
      this._advance();
      return { logs, hits, captured, capturedId, statusSkipped: false };
    }

    // ── Process passive at start of turn (regen etc.) ────────────────────
    logs.push(...this._processPassiveTick(actor));

    // ── Process status at start of this actor's turn ──────────────────────
    const { skip, statusLogs } = this._processStatusTick(actor);
    logs.push(...statusLogs);

    if (skip) {
      state.log.push(...logs);
      if (state.log.length > 20) state.log = state.log.slice(-20);
      state.outcome = this.checkOutcome();
      this._advance();
      return { logs, hits, captured, capturedId, statusSkipped: true };
    }

    // ── Resolve action ────────────────────────────────────────────────────
    if (action.type === 'skip') {
      logs.push(`${actor.name} waited.`);

    } else if (action.type === 'move') {
      const moveData = this._getActorMove(actor, action.moveId);
      if (!moveData) {
        logs.push(`${actor.name} has no move ${action.moveId}.`);
      } else if (moveData.cooldownRemaining > 0) {
        logs.push(`${moveData.name} is on cooldown (${moveData.cooldownRemaining} turns).`);
      } else {
        if (moveData.recharge > 0) moveData.cooldownRemaining = moveData.recharge;

        let targets;
        if (moveData.isAoe) {
          const oppSide = actor.side === 'player' ? 'enemy' : 'player';
          targets = Object.values(state.combatants).filter(c => c.side === oppSide && c.alive);
        } else {
          const t = state.combatants[action.targetId];
          targets = t && t.alive ? [t] : [];
        }

        if (targets.length === 0) {
          logs.push(`No valid targets for ${moveData.name}.`);
        } else {
          const results = resolveMove(actor, moveData, targets);
          for (const r of results) {
            hits.push(r);
            const tgt = state.combatants[r.targetId];
            if (r.dodged) {
              logs.push(`${tgt.name} dodged ${moveData.name}!`);
            } else if (r.missed) {
              logs.push(`${actor.name} missed!`);
            } else {
              const critStr = r.crit ? ' (CRIT!)' : '';
              const effectStr = moveData.statusEffect
                ? ` [may ${moveData.statusEffect}]` : '';
              logs.push(`${actor.name} used ${moveData.name}${effectStr} → ${tgt.name} took ${r.damage} dmg${critStr}.`);
              if (!tgt.alive) logs.push(`${tgt.name} was defeated!`);
              if (r.thornDmg) logs.push(`${actor.name} took ${r.thornDmg} dmg from thorns!`);
              if (r.staticStun) logs.push(`${actor.name} was stunned by Static!`);

              // Try to apply status effect
              if (moveData.statusEffect && moveData.statusChance && tgt.alive && !tgt.status) {
                if (Math.random() < moveData.statusChance) {
                  tgt.status = moveData.statusEffect;
                  tgt.statusTurns = 3;
                  logs.push(`${tgt.name} was ${STATUS_VERB[moveData.statusEffect] || moveData.statusEffect}!`);
                }
              }
            }
          }
        }
      }

    } else if (action.type === 'capture') {
      const target = state.combatants[action.targetId];
      if (!target) {
        logs.push('No target to capture.');
      } else if (!target.capturable || target.isBoss) {
        logs.push('Cannot capture this creature.');
      } else if (!target.alive) {
        logs.push('Cannot capture a defeated creature.');
      } else {
        const chance = (1 - target.hp / target.maxHp) * 0.8;
        if (Math.random() < chance) {
          target.captured = true;
          target.alive    = false;
          captured   = true;
          capturedId = target.id;
          logs.push(`${target.name} was captured!`);
        } else {
          logs.push('Capture failed!');
        }
      }
    }

    state.log.push(...logs);
    if (state.log.length > 20) state.log = state.log.slice(-20);
    state.outcome = this.checkOutcome();
    this._advance();

    return { logs, hits, captured, capturedId, statusSkipped: false };
  }

  // ── Passive tick (regen, etc.) ────────────────────────────────────────────

  _processPassiveTick(actor) {
    const logs = [];
    if (!actor.alive) return logs;
    if (actor.passive === 'regen' && actor.hp < actor.maxHp) {
      const heal = Math.max(1, Math.floor(actor.maxHp * 0.06));
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      logs.push(`${actor.name} regenerated ${heal} HP!`);
    }
    return logs;
  }

  // ── Status tick processing ────────────────────────────────────────────────

  _processStatusTick(actor) {
    const logs = [];
    let skip = false;

    if (!actor.status) return { skip, statusLogs: logs };

    actor.statusTurns--;

    if (actor.status === 'freeze' || actor.status === 'stun') {
      const verb = actor.status === 'freeze' ? 'frozen' : 'stunned';
      logs.push(`${actor.name} is ${verb} and can't move!`);
      skip = true;
    } else if (actor.status === 'burn') {
      const dmg = Math.max(1, Math.floor(actor.maxHp * 0.05));
      actor.hp = Math.max(0, actor.hp - dmg);
      if (actor.hp <= 0) actor.alive = false;
      logs.push(`${actor.name} is burning! (-${dmg} HP)`);
    } else if (actor.status === 'poison') {
      const dmg = Math.max(1, Math.floor(actor.maxHp * 0.08));
      actor.hp = Math.max(0, actor.hp - dmg);
      if (actor.hp <= 0) actor.alive = false;
      logs.push(`${actor.name} is poisoned! (-${dmg} HP)`);
    }
    // soak + blind modify other calculations — no tick damage

    if (actor.statusTurns <= 0) {
      const prev = actor.status;
      actor.status = null;
      actor.statusTurns = 0;
      if (!skip) logs.push(`${actor.name}'s ${prev} wore off.`);
      else {
        // still clear status even on skip turn for freeze/stun (1-turn skip)
        skip = true; // already set
      }
    }

    return { skip, statusLogs: logs };
  }

  // ── Cooldowns ─────────────────────────────────────────────────────────────

  tickCooldowns() {
    for (const combatant of Object.values(this._state.combatants)) {
      if (!combatant.moves) continue;
      for (const m of combatant.moves) {
        if (m.cooldownRemaining > 0) m.cooldownRemaining--;
      }
    }
  }

  // ── Outcome ───────────────────────────────────────────────────────────────

  checkOutcome() {
    const state = this._state;
    const enemyStillFighting = Object.values(state.combatants).some(c => c.side === 'enemy' && c.alive);
    if (!enemyStillFighting) return 'win';
    const playerAlive = Object.values(state.combatants).some(c => c.side === 'player' && c.alive);
    if (!playerAlive) return 'loss';
    return 'ongoing';
  }

  // ── Damage preview ────────────────────────────────────────────────────────

  previewDamage(actorId, moveId, defenderId) {
    const actor   = this._state.combatants[actorId];
    const defender = this._state.combatants[defenderId];
    if (!actor || !defender) return null;
    const move = (actor.moves || []).find(m => m.id === moveId);
    if (!move) return null;
    const raw = actor.attack * move.power;
    const mitigation = defender.defense / (defender.defense + 50);
    const typeMultiplier = getTypeMultiplier(move.type, defender.type);
    return Math.max(1, Math.floor(raw * (1 - mitigation) * typeMultiplier));
  }

  // ── AI ────────────────────────────────────────────────────────────────────

  aiPickAction(actorId) {
    const state = this._state;
    const actor = state.combatants[actorId];
    const available = (actor.moves || []).filter(m => m.cooldownRemaining === 0);
    if (available.length === 0) return { type: 'skip' };

    const playerTargets = Object.values(state.combatants).filter(c => c.side === 'player' && c.alive);
    if (playerTargets.length === 0) return { type: 'skip' };

    const primaryTarget = state.combatants['player']?.alive
      ? state.combatants['player']
      : playerTargets[Math.floor(Math.random() * playerTargets.length)];

    let bestMove  = available[0];
    let bestScore = -1;
    for (const m of available) {
      let score = m.power * getTypeMultiplier(m.type, primaryTarget.type);
      // Bonus for applying a status the target doesn't already have
      if (m.statusEffect && m.statusChance && !primaryTarget.status) score += m.statusChance * 0.5;
      if (score > bestScore) { bestScore = score; bestMove = m; }
    }

    return { type: 'move', moveId: bestMove.id, targetId: bestMove.isAoe ? null : primaryTarget.id };
  }

  // ── Private: build state ──────────────────────────────────────────────────

  _buildInitialState(playerData, encounterData) {
    const combatants  = {};
    const playerLevel = playerData.level || 1;

    // Player
    const playerMoves = this._buildPlayerMoves(playerData);
    // Cap hp_max to 100 so old characters with inflated stats from the previous
    // per-level-gain system aren't more durable than a same-level boss.
    const baseHp = Math.min(playerData.hp_max ?? 100, 100);
    combatants['player'] = {
      id: 'player', name: playerData.name || 'Player',
      side: 'player', isPlayer: true, type: null, passive: null,
      level: playerLevel,
      hp:      Math.round(baseHp * hpScale(playerLevel)),
      maxHp:   Math.round(baseHp * hpScale(playerLevel)),
      attack:  this._playerStat(playerData, 'attack',  playerLevel),
      defense: this._playerStat(playerData, 'defense', playerLevel),
      speed:   this._playerStat(playerData, 'speed',   playerLevel),
      moves: playerMoves,
      capturable: false, isBoss: false, alive: true, captured: false,
      status: null, statusTurns: 0,
    };

    // Player pets
    (playerData.pets || []).forEach((p, i) => {
      const petId = p.id || `player_pet${i + 1}`;
      const c = buildPetCombatant(petId, p.speciesId, p.level || 1, 'player');
      c.moves = this._hydrateMoves(c.moveIds);
      combatants[petId] = c;
    });

    // Encounter level
    const variance = Math.floor(Math.random() * 3) - 1;
    const encounterLevel = encounterData.fixedLevel != null
      ? encounterData.fixedLevel
      : encounterData.type === 'wild'
        ? Math.max(1, playerLevel + variance)
        : playerLevel;
    this._encounterLevel = encounterLevel;

    // Enemy trainer
    if (encounterData.type !== 'wild' && encounterData.enemy) {
      const ed = encounterData.enemy;
      combatants['enemy'] = {
        id: 'enemy', name: ed.name,
        side: 'enemy', isEnemy: true, type: ed.type ?? null, passive: null,
        level: encounterLevel,
        hp:      Math.round(ed.hp      * hpScale(encounterLevel)),
        maxHp:   Math.round(ed.maxHp   * hpScale(encounterLevel)),
        attack:  Math.round(ed.attack  * statScale(encounterLevel)),
        defense: Math.round(ed.defense * statScale(encounterLevel)),
        speed:   Math.round(ed.speed   * statScale(encounterLevel)),
        moves: this._hydrateMoves(ed.moveIds || []),
        capturable: ed.capturable ?? false,
        isBoss: ed.isBoss ?? false,
        alive: true, captured: false,
        status: null, statusTurns: 0,
      };
    }

    // Enemy pets
    (encounterData.pets || []).forEach((p, i) => {
      const petId = p.id || `enemy_pet${i + 1}`;
      const c = buildPetCombatant(petId, p.speciesId, encounterLevel, 'enemy');
      c.capturable = p.capturable ?? c.capturable;
      c.moves = this._hydrateMoves(c.moveIds);
      combatants[petId] = c;
    });

    // Build opening log
    const openingLog = [];
    if (encounterData.type === 'wild') {
      const wildPets = Object.values(combatants).filter(c => c.side === 'enemy' && c.isPet);
      wildPets.forEach(p => {
        const typeStr = p.type ? ` [${p.type.toUpperCase()}]` : '';
        openingLog.push(`A wild ${p.name}${typeStr} appeared!`);
      });
    } else if (encounterData.enemy) {
      openingLog.push(`${encounterData.enemy.name} wants to battle!`);
    }

    const state = {
      combatants, turnQueue: [], queueIndex: 0, turn: 1, log: openingLog, outcome: 'ongoing',
    };
    const alive = Object.values(combatants).filter(c => c.alive);
    alive.sort((a, b) => b.speed - a.speed);
    state.turnQueue = alive.map(c => c.id);
    return state;
  }

  _playerStat(playerData, stat, level = 1) {
    // Cap base stats to the intended maximum so old characters with inflated DB
    // stats from the previous per-level-gain system aren't overpowered.
    const STAT_BASE = { attack: 14, defense: 8, speed: 9 };
    let base = Math.min(playerData[stat] ?? STAT_BASE[stat], STAT_BASE[stat] ?? 999);
    base = Math.round(base * statScale(level));
    const equip = { hat_id: 'attackBonus', robe_id: 'defenseBonus', boots_id: 'speedBonus' };
    for (const [field, bonusKey] of Object.entries(equip)) {
      if (playerData[field]) {
        const item = EQUIPMENT[playerData[field]];
        if (item) {
          if (bonusKey === 'attackBonus'  && stat === 'attack')  base += item.attackBonus;
          if (bonusKey === 'defenseBonus' && stat === 'defense') base += item.defenseBonus;
          if (bonusKey === 'speedBonus'   && stat === 'speed')   base += item.speedBonus;
        }
      }
    }
    return base;
  }

  getEncounterLevel() { return this._encounterLevel || 1; }

  _buildPlayerMoves(playerData) {
    const moveIds = ['base_attack', 'arcane_nova'];
    if (playerData.staff_id) {
      const item = EQUIPMENT[playerData.staff_id];
      if (item?.moveId) moveIds.push(item.moveId);
    }
    if (playerData.relic_id) {
      const item = EQUIPMENT[playerData.relic_id];
      if (item?.moveId) moveIds.push(item.moveId);
    }
    return this._hydrateMoves(moveIds);
  }

  _hydrateMoves(moveIds) {
    return moveIds.map(id => {
      const base = MOVES[id];
      if (!base) {
        console.warn(`Unknown move id: ${id}`);
        return { id, name: id, power: 1.0, type: null, isAoe: false, recharge: 0, cooldownRemaining: 0 };
      }
      return { ...base, cooldownRemaining: 0 };
    });
  }

  _getActorMove(actor, moveId) {
    return (actor.moves || []).find(m => m.id === moveId) || null;
  }

  _advance() {
    const state = this._state;
    state.queueIndex++;
    if (state.queueIndex >= state.turnQueue.length) {
      this.tickCooldowns();
      this.buildTurnQueue();
      state.turn++;
    }
  }
}
