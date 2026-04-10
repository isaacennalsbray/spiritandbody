/**
 * Client-side Character entity.
 * Constructed from API response data; used by battle and UI systems.
 */
export default class Character {
  constructor(data) {
    this.id         = data.id;
    this.userId     = data.user_id;
    this.name       = data.name;
    this.heroClass  = data.class;
    this.level      = data.level ?? 1;
    this.xp         = data.xp ?? 0;
    this.xpToNext   = data.xp_to_next ?? 100;

    this.hpMax      = data.hp_max;
    this.hpCurrent  = data.hp_current;
    this.mpMax      = data.mp_max;
    this.mpCurrent  = data.mp_current;
    this.attack     = data.attack;
    this.defense    = data.defense;
    this.speed      = data.speed;
    this.skillPoints = data.skill_points ?? 0;

    this.unlockedAbilities = this._parseJson(data.unlocked_abilities, []);
    this.currentRegion = data.current_region ?? 'starting_village';
    this.positionX  = data.position_x ?? 0;
    this.positionY  = data.position_y ?? 0;
  }

  get isAlive() { return this.hpCurrent > 0; }
  get hpPercent() { return this.hpCurrent / this.hpMax; }
  get mpPercent() { return this.mpCurrent / this.mpMax; }
  get xpPercent() { return this.xp / this.xpToNext; }

  /** Apply incoming damage (after all modifiers). Returns actual damage dealt. */
  takeDamage(amount) {
    const actual = Math.min(this.hpCurrent, Math.max(0, Math.floor(amount)));
    this.hpCurrent -= actual;
    return actual;
  }

  heal(amount) {
    const actual = Math.min(this.hpMax - this.hpCurrent, Math.max(0, Math.floor(amount)));
    this.hpCurrent += actual;
    return actual;
  }

  spendResource(amount) {
    this.mpCurrent = Math.max(0, this.mpCurrent - amount);
  }

  regenResource(amount) {
    this.mpCurrent = Math.min(this.mpMax, this.mpCurrent + amount);
  }

  /** Apply XP. Returns { leveled, newLevel, newAbilityIds }. */
  applyXP(amount) {
    this.xp += amount;
    const result = { leveled: false, newLevel: this.level, newAbilityIds: [] };

    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.floor(100 * Math.pow(1.15, this.level - 1));
      result.leveled = true;
      result.newLevel = this.level;
      // Ability unlocks are checked server-side; client shows what was awarded
    }
    return result;
  }

  serialize() {
    return {
      hp_current:         this.hpCurrent,
      mp_current:         this.mpCurrent,
      xp:                 this.xp,
      level:              this.level,
      xp_to_next:         this.xpToNext,
      current_region:     this.currentRegion,
      position_x:         this.positionX,
      position_y:         this.positionY,
      unlocked_abilities: this.unlockedAbilities,
    };
  }

  _parseJson(val, fallback) {
    if (Array.isArray(val) || (val && typeof val === 'object')) return val;
    try { return JSON.parse(val); } catch { return fallback; }
  }
}
