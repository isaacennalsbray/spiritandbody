/**
 * ActionResolver — pure function battle math.
 * No Phaser dependencies. Shared logic between client PvE and server PvP.
 *
 * Type triangle: Land > Water > Sky > Land
 *   Attacker favored type deals +25%, takes -15% from that type.
 */

const TYPE_ADVANTAGE = {
  land:  { strong: 'water', weak: 'sky'   },
  sky:   { strong: 'land',  weak: 'water' },
  water: { strong: 'sky',   weak: 'land'  },
};

export function getTypeMultiplier(attackerType, defenderType) {
  if (!attackerType || !defenderType) return 1.0;
  const adv = TYPE_ADVANTAGE[attackerType];
  if (!adv) return 1.0;
  if (adv.strong === defenderType) return 1.25;
  if (adv.weak   === defenderType) return 0.85;
  return 1.0;
}

/**
 * Check whether a synergy condition is met this turn.
 * Returns a multiplier (1.0 = no synergy, 1.5 = synergy active).
 */
export function getSynergyMultiplier(actorId, abilityId, battleState) {
  const { playerStatuses, enemyStatuses } = battleState;
  const targetStatuses = actorId.startsWith('enemy') ? playerStatuses : enemyStatuses;

  // Warrior: Open Wound Strike deals +50% to bleeding targets
  if (abilityId === 'warrior_open_wound' && targetStatuses?.bleed) return 1.5;

  // Mage: Interrupt Blast deals 2x to silenced targets
  if (abilityId === 'mage_interrupt' && targetStatuses?.silence) return 2.0;

  // Warrior: Shield Bash vs paralyzed target = guaranteed stun (handled in effect logic)
  // Mage: Blizzard + Eel (handled by status chain detection)

  return 1.0;
}

/**
 * Softcap mitigation curve: defender.defense / (defender.defense + 50)
 * At DEF 10: ~17% reduction. At DEF 30: ~37%. At DEF 50: ~50%.
 */
function mitigation(def) {
  return def / (def + 50);
}

/**
 * Resolve a single action. Returns a result object describing what happened.
 *
 * @param {object} actor        - { id, type, attack, defense, speed, hp, abilityData, ... }
 * @param {object} target       - same shape
 * @param {object} ability      - from classes.js / beast abilities
 * @param {object} battleState  - { playerStatuses, enemyStatuses, terrain }
 * @returns {object}            - { damage, heal, effects[], log, synergyTriggered }
 */
export function resolveAction(actor, target, ability, battleState = {}) {
  const result = {
    damage: 0,
    heal: 0,
    effects: [],       // [{ type, target, duration, magnitude }]
    log: '',
    synergyTriggered: false,
    abilityId: ability.id,
  };

  if (!ability || ability.type === 'none') {
    result.log = `${actor.name} does nothing.`;
    return result;
  }

  // ── Defend ────────────────────────────────────────────────────────────────
  if (ability.type === 'defend') {
    result.effects.push({ type: 'defending', target: 'self', duration: 1 });
    if (ability.effect?.counterChance) {
      result.effects.push({ type: 'counter_stance', target: 'self', magnitude: ability.effect.counterChance, duration: 1 });
    }
    if (ability.effect?.negateNextHit) {
      result.effects.push({ type: 'negate_hit', target: 'self', duration: 1 });
    }
    result.log = `${actor.name} takes a defensive stance.`;
    return result;
  }

  // ── Heal ──────────────────────────────────────────────────────────────────
  if (ability.type === 'heal') {
    const base = ability.effect?.healPct ? Math.floor(actor.hpMax * ability.effect.healPct) : 20;
    result.heal = base;
    result.log = `${actor.name} heals for ${base} HP.`;
    return result;
  }

  // ── Buff ──────────────────────────────────────────────────────────────────
  if (ability.type === 'buff') {
    if (ability.effect?.selfAtkBuff) {
      result.effects.push({ type: 'atk_up', target: 'self', magnitude: ability.effect.selfAtkBuff, duration: ability.effect.duration || 3 });
    }
    if (ability.effect?.beastAtkBuff) {
      result.effects.push({ type: 'beast_atk_up', target: 'ally_beast', magnitude: ability.effect.beastAtkBuff, duration: ability.effect.duration || 3 });
    }
    result.log = `${actor.name} uses ${ability.name}!`;
    return result;
  }

  // ── Dodge ─────────────────────────────────────────────────────────────────
  if (ability.type === 'dodge') {
    result.effects.push({ type: 'dodge_next', target: 'self', magnitude: ability.effect?.dodgeNext || 1.0, duration: 1 });
    if (ability.effect?.gainCp) result.effects.push({ type: 'gain_cp', magnitude: ability.effect.gainCp });
    result.log = `${actor.name} slips into the shadows.`;
    return result;
  }

  // ── Debuff ────────────────────────────────────────────────────────────────
  if (ability.type === 'debuff') {
    if (ability.effect?.blind) {
      result.effects.push({ type: 'blind', target: 'enemy', magnitude: ability.effect.blind.accDown, duration: ability.effect.blind.duration });
    }
    if (ability.effect?.damageTaken) {
      result.effects.push({ type: 'death_mark', target: 'enemy', magnitude: ability.effect.damageTaken, duration: ability.effect.duration });
    }
    if (ability.effect?.gainCp) result.effects.push({ type: 'gain_cp', magnitude: ability.effect.gainCp });
    result.log = `${actor.name} uses ${ability.name} on ${target.name}!`;
    return result;
  }

  // ── Physical / Magic attack ───────────────────────────────────────────────
  const isMagic = ability.type === 'magic';
  const hits = ability.effect?.hits || 1;
  let totalDamage = 0;

  for (let h = 0; h < hits; h++) {
    let raw = isMagic
      ? (actor.magicPower || actor.attack) * ability.power
      : actor.attack * ability.power;

    const mit = isMagic
      ? mitigation(target.magicResist || Math.floor(target.defense * 0.7))
      : mitigation(ability.effect?.ignoresDefense ? 0 : target.defense);

    let dmg = raw * (1 - mit);

    // Type advantage (beast attacks carry beast type)
    const atkType = actor.beastType || null;
    const defType = target.beastType || null;
    const typeMult = getTypeMultiplier(atkType, defType);
    if (typeMult !== 1.0 && h === 0) {
      result.effects.push({ type: typeMult > 1 ? 'type_advantage' : 'type_disadvantage', magnitude: typeMult });
    }
    dmg *= typeMult;

    // Terrain modifier
    const terrain = battleState.terrain;
    if (terrain && atkType) {
      const terrainBonus = getTerrainBonus(atkType, terrain);
      dmg *= (1 + terrainBonus);
    }

    // Synergy
    const synergyMult = getSynergyMultiplier(actor.id, ability.id, battleState);
    if (synergyMult !== 1.0) {
      dmg *= synergyMult;
      result.synergyTriggered = true;
    }

    // Death Mark (target takes extra damage)
    const targetStatuses = actor.id?.startsWith('enemy') ? battleState.playerStatuses : battleState.enemyStatuses;
    if (targetStatuses?.death_mark) {
      dmg *= (1 + targetStatuses.death_mark.magnitude);
    }

    // Crit
    const critChance = (actor.critChance || 0) + (ability.effect?.guaranteedCrit ? 1 : 0);
    const isCrit = Math.random() < critChance;
    if (isCrit) {
      dmg *= 1.5;
      result.effects.push({ type: 'crit', hit: h });
    }

    // bleedBonus
    if (ability.effect?.bleedBonus && targetStatuses?.bleed) {
      dmg *= (1 + ability.effect.bleedBonus);
    }

    // dotCrit (Thousand Cuts — auto crit with active DoT)
    if (ability.effect?.dotCrit && (targetStatuses?.bleed || targetStatuses?.poison)) {
      dmg *= 1.5;
    }

    totalDamage += Math.max(1, Math.floor(dmg));
  }

  result.damage = totalDamage;

  // ── On-hit effects ────────────────────────────────────────────────────────

  // Stun
  if (ability.effect?.stun && Math.random() < ability.effect.stun) {
    // Boost stun if target is silenced + warrior shield bash (synergy)
    const silenced = (battleState.enemyStatuses?.silence || battleState.playerStatuses?.silence);
    const stunChance = silenced && ability.id === 'warrior_shield_bash' ? 1.0 : ability.effect.stun;
    if (Math.random() < stunChance) {
      result.effects.push({ type: 'stun', target: 'enemy', duration: 1 });
    }
  }

  // Bleed (Wolf)
  if (ability.effect?.bleed || ability.id?.includes('bite') || ability.id?.includes('rend')) {
    const dur = ability.effect?.bleedDuration || 2;
    result.effects.push({ type: 'bleed', target: 'enemy', magnitude: Math.floor(actor.attack * 0.15), duration: dur });
  }

  // Poison (Assassin)
  if (ability.effect?.applyBleed) result.effects.push({ type: 'bleed', target: 'enemy', magnitude: Math.floor(actor.attack * 0.12), duration: 3 });
  if (ability.effect?.applyPoison || ability.effect?.poison) {
    const mag = ability.effect?.poison?.dmgPerTurn || Math.floor(actor.attack * 0.12);
    result.effects.push({ type: 'poison', target: 'enemy', magnitude: mag, duration: ability.effect?.poison?.duration || 3 });
  }

  // Paralyze (Eel)
  if (ability.effect?.paralyze && Math.random() < ability.effect.paralyze) {
    result.effects.push({ type: 'paralyze', target: 'enemy', duration: 1 });
  }

  // Silence (Owl)
  if (ability.effect?.silence) {
    result.effects.push({ type: 'silence', target: 'enemy', duration: ability.effect.silence });
  }

  // Slow
  if (ability.effect?.slow) {
    result.effects.push({ type: 'slow', target: 'enemy', magnitude: ability.effect.slow.spdDown, duration: ability.effect.slow.duration });
  }

  // Push to back of queue
  if (ability.effect?.pushToLast) {
    result.effects.push({ type: 'push_last', target: 'enemy' });
  }

  // Life steal (Bat)
  if (actor.lifesteal) {
    result.heal = Math.floor(totalDamage * actor.lifesteal);
  }

  // Combo points
  if (ability.effect?.gainCp) {
    result.effects.push({ type: 'gain_cp', magnitude: ability.effect.gainCp });
  }

  // Hemorrhage chain: bleed + poison on same target → combined DoT
  const st = actor.id?.startsWith('enemy') ? battleState.playerStatuses : battleState.enemyStatuses;
  const hasBleed  = result.effects.some(e => e.type === 'bleed')  || st?.bleed;
  const hasPoison = result.effects.some(e => e.type === 'poison') || st?.poison;
  if (hasBleed && hasPoison) {
    result.effects.push({ type: 'hemorrhage', target: 'enemy' });
  }

  result.log = buildLog(actor, target, ability, result, hits);
  return result;
}

function buildLog(actor, target, ability, result, hits) {
  const dmg = result.damage;
  const synergy = result.synergyTriggered ? ' ✦ SYNERGY!' : '';
  const crit = result.effects.some(e => e.type === 'crit') ? ' CRIT!' : '';
  const typeEff = result.effects.find(e => e.type === 'type_advantage' || e.type === 'type_disadvantage');
  const typeTag = typeEff ? (typeEff.type === 'type_advantage' ? ' (effective!)' : ' (not very effective)') : '';
  const multiHit = hits > 1 ? ` (${hits} hits)` : '';
  return `${actor.name} uses ${ability.name}${multiHit} → ${target.name} takes ${dmg} damage${crit}${typeTag}${synergy}`;
}

/**
 * Tick status effects at end of turn.
 * Returns { damage, expiredEffects[], log[] }
 */
export function tickStatuses(statuses, ownerName) {
  const result = { damage: 0, expired: [], logs: [] };
  if (!statuses) return result;

  for (const [type, status] of Object.entries(statuses)) {
    if (type === 'bleed' || type === 'poison') {
      const dmg = status.magnitude || 5;
      result.damage += dmg;
      result.logs.push(`${ownerName} takes ${dmg} from ${type}.`);
    }
    if (status.duration !== undefined) {
      status.duration -= 1;
      if (status.duration <= 0) {
        result.expired.push(type);
      }
    }
  }

  // Hemorrhage bonus
  if (statuses.bleed && statuses.poison && !statuses.hemorrhage) {
    const bonus = Math.floor((statuses.bleed.magnitude + statuses.poison.magnitude) * 0.3);
    result.damage += bonus;
    if (bonus > 0) result.logs.push(`${ownerName} suffers Hemorrhage for ${bonus} extra damage!`);
  }

  return result;
}

function getTerrainBonus(beastType, terrain) {
  const bonuses = {
    forest:  { land: 0.15 },
    sky:     { sky: 0.15 },
    coastal: { water: 0.15 },
    cavern:  { sky: -0.10 },   // bats get cave bonus elsewhere; all beasts slower
    volcanic:{},
    tundra:  {},
  };
  return bonuses[terrain]?.[beastType] || 0;
}
