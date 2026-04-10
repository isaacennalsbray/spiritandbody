/**
 * Client-side Beast entity.
 */

// Evolution thresholds mirror server/data/beasts.js
const EVOLUTION_LEVELS = { 1: 15, 2: 30 };

export default class Beast {
  constructor(data) {
    this.id              = data.id;
    this.templateId      = data.beast_template_id;
    this.nickname        = data.nickname ?? null;
    this.type            = data.beast_type;   // 'land' | 'sky' | 'water'
    this.tier            = data.tier ?? 1;
    this.level           = data.level ?? 1;
    this.xp              = data.xp ?? 0;

    this.hpMax           = data.hp_max;
    this.hpCurrent       = data.hp_current;
    this.attack          = data.attack;
    this.defense         = data.defense;
    this.speed           = data.speed;
    this.staminaCurrent  = data.stamina_current ?? 3;
    this.staminaMax      = 3;

    this.unlockedAbilities = this._parseJson(data.unlocked_abilities, []);
    this.activePassives    = this._parseJson(data.active_passives, []);
  }

  get isAlive() { return this.hpCurrent > 0; }
  get hpPercent() { return this.hpCurrent / this.hpMax; }
  get displayName() { return this.nickname || this._tierName(); }

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

  useStamina() {
    if (this.staminaCurrent <= 0) return false;
    this.staminaCurrent -= 1;
    return true;
  }

  regenStamina() {
    if (this.staminaCurrent < this.staminaMax) this.staminaCurrent += 1;
  }

  /** Returns { leveled, evolved, newTier } */
  applyXP(amount) {
    this.xp += amount;
    const result = { leveled: false, evolved: false, newTier: this.tier };
    const xpNeeded = Math.floor(80 * Math.pow(1.12, this.level - 1));

    if (this.xp >= xpNeeded) {
      this.xp -= xpNeeded;
      this.level += 1;
      result.leveled = true;

      const evolvesAt = EVOLUTION_LEVELS[this.tier];
      if (evolvesAt && this.level >= evolvesAt) {
        this.tier += 1;
        result.evolved = true;
        result.newTier = this.tier;
      }
    }
    return result;
  }

  serialize() {
    return {
      hp_current:          this.hpCurrent,
      xp:                  this.xp,
      level:               this.level,
      tier:                this.tier,
      stamina_current:     this.staminaCurrent,
      unlocked_abilities:  this.unlockedAbilities,
      active_passives:     this.activePassives,
      nickname:            this.nickname,
    };
  }

  _tierName() {
    // Tier names are resolved server-side; client uses the template ID as fallback
    return this.templateId;
  }

  _parseJson(val, fallback) {
    if (Array.isArray(val) || (val && typeof val === 'object')) return val;
    try { return JSON.parse(val); } catch { return fallback; }
  }
}
