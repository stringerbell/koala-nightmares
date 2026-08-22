/**
 * Pure game rules for the three Koala's-mind challenges and the overall flow.
 * No rendering here so everything is unit-testable.
 */

export const CHALLENGE_SECONDS = 60;

/** Survive-for-60s chase. Getting tagged resets the timer. */
export class ChaseRules {
  constructor(duration = CHALLENGE_SECONDS) {
    this.duration = duration;
    this.elapsed = 0;
    this.resets = 0;
    this.complete = false;
  }
  tick(dt) {
    if (this.complete) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) { this.elapsed = this.duration; this.complete = true; }
  }
  tagged() {
    if (this.complete) return false;
    this.elapsed = 0;
    this.resets++;
    return true;
  }
  remaining() { return Math.max(0, this.duration - this.elapsed); }
}

/** Reach the finish before 60s runs out. Getting hit or timing out resets. */
export class ObstacleRules {
  constructor(duration = CHALLENGE_SECONDS, courseLength = 200) {
    this.duration = duration;
    this.courseLength = courseLength;
    this.elapsed = 0;
    this.resets = 0;
    this.complete = false;
  }
  tick(dt, playerZ) {
    if (this.complete) return 'running';
    this.elapsed += dt;
    if (playerZ >= this.courseLength) { this.complete = true; return 'finished'; }
    if (this.elapsed >= this.duration) { this.reset(); return 'timeout'; }
    return 'running';
  }
  hit() {
    if (this.complete) return false;
    this.reset();
    return true;
  }
  reset() { this.elapsed = 0; this.resets++; }
  remaining() { return Math.max(0, this.duration - this.elapsed); }
}

/** Boss fight. Items modify damage / defence. */
export const FIGHT = {
  PLAYER_HP: 100,
  KOALA_HP: 300,
  DAGGER_DAMAGE: 12,
  PISTOL_DAMAGE: 30,
  PISTOL_AMMO: 6,
  KOALA_HIT: 20,
  FOOD_HEAL: 35,
  ROPE_SLOW_SECONDS: 5,
  FLASHLIGHT_STUN_SECONDS: 2,
  DECOY_SECONDS: 6,
};

export class FightRules {
  constructor() {
    this.playerHp = FIGHT.PLAYER_HP;
    this.koalaHp = FIGHT.KOALA_HP;
    this.ammo = 0;
    this.hasSweatshirt = false;
    this.slowTimer = 0;
    this.stunTimer = 0;
    this.decoyTimer = 0;
    this.outcome = null; // 'win' | 'lose'
  }
  tick(dt) {
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.decoyTimer = Math.max(0, this.decoyTimer - dt);
  }
  koalaSpeedMultiplier() {
    if (this.stunTimer > 0) return 0;
    if (this.slowTimer > 0) return 0.4;
    return 1;
  }
  damageKoala(amount) {
    if (this.outcome) return;
    this.koalaHp = Math.max(0, this.koalaHp - amount);
    if (this.koalaHp === 0) this.outcome = 'win';
  }
  koalaHitsPlayer() {
    if (this.outcome) return;
    const dmg = this.hasSweatshirt ? Math.round(FIGHT.KOALA_HIT * 0.5) : FIGHT.KOALA_HIT;
    this.playerHp = Math.max(0, this.playerHp - dmg);
    if (this.playerHp === 0) this.outcome = 'lose';
  }
  /** Use an item. Returns a short description of what happened, or null if nothing. */
  useItem(itemId, { inRange = false, facing = true } = {}) {
    if (this.outcome) return null;
    switch (itemId) {
      case 'dagger':
        if (!inRange) return null;
        this.damageKoala(FIGHT.DAGGER_DAMAGE);
        return 'stab';
      case 'pistol':
        if (this.ammo <= 0) return 'empty';
        this.ammo--;
        if (!facing) return 'miss';
        this.damageKoala(FIGHT.PISTOL_DAMAGE);
        return 'shot';
      case 'food':
        if (this.playerHp >= FIGHT.PLAYER_HP) return null;
        this.playerHp = Math.min(FIGHT.PLAYER_HP, this.playerHp + FIGHT.FOOD_HEAL);
        return 'heal';
      case 'rope':
        if (!inRange) return null;
        this.slowTimer = FIGHT.ROPE_SLOW_SECONDS;
        return 'slow';
      case 'flashlight':
        if (!inRange) return null;
        this.stunTimer = FIGHT.FLASHLIGHT_STUN_SECONDS;
        return 'stun';
      case 'tent':
      case 'sleepingbag':
        this.decoyTimer = FIGHT.DECOY_SECONDS;
        return 'decoy';
      case 'sweatshirt':
        this.hasSweatshirt = true;
        return 'armor';
      default:
        return null;
    }
  }
}

/** High-level flow. Losing the fight restarts the challenges from the chase. */
export const STAGES = ['title', 'intro', 'house', 'jungle', 'dark', 'chase', 'obstacle', 'fight', 'win'];

export class GameFlow {
  constructor() { this.stage = 'title'; }
  next() {
    const i = STAGES.indexOf(this.stage);
    if (i < STAGES.length - 1) this.stage = STAGES[i + 1];
    return this.stage;
  }
  loseFight() { this.stage = 'chase'; return this.stage; }
  restart() { this.stage = 'title'; return this.stage; }
}
