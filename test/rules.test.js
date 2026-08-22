import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChaseRules, ObstacleRules, FightRules, FIGHT, GameFlow, STAGES } from '../src/rules.js';

test('chase: surviving 60 seconds completes it', () => {
  const c = new ChaseRules();
  for (let i = 0; i < 59; i++) c.tick(1);
  assert.equal(c.complete, false);
  c.tick(1);
  assert.equal(c.complete, true);
  assert.equal(c.remaining(), 0);
});

test('chase: getting tagged resets the timer to zero', () => {
  const c = new ChaseRules();
  c.tick(40);
  assert.equal(c.tagged(), true);
  assert.equal(c.elapsed, 0);
  assert.equal(c.resets, 1);
  assert.equal(c.remaining(), 60);
});

test('chase: tags after completion do nothing', () => {
  const c = new ChaseRules();
  c.tick(60);
  assert.equal(c.tagged(), false);
  assert.equal(c.complete, true);
});

test('obstacle: reaching the end finishes, timeout resets', () => {
  const o = new ObstacleRules(60, 100);
  assert.equal(o.tick(10, 50), 'running');
  assert.equal(o.tick(1, 100), 'finished');
  const o2 = new ObstacleRules(60, 100);
  assert.equal(o2.tick(60, 20), 'timeout');
  assert.equal(o2.elapsed, 0);
  assert.equal(o2.resets, 1);
});

test('obstacle: getting hit resets the run', () => {
  const o = new ObstacleRules();
  o.tick(30, 50);
  assert.equal(o.hit(), true);
  assert.equal(o.elapsed, 0);
  o.tick(1, 200);
  assert.equal(o.hit(), false);
});

test('fight: dagger only hits in range, pistol needs ammo', () => {
  const f = new FightRules();
  assert.equal(f.useItem('dagger', { inRange: false }), null);
  assert.equal(f.useItem('dagger', { inRange: true }), 'stab');
  assert.equal(f.koalaHp, FIGHT.KOALA_HP - FIGHT.DAGGER_DAMAGE);
  assert.equal(f.useItem('pistol'), 'empty');
  f.ammo = 1;
  assert.equal(f.useItem('pistol'), 'shot');
  assert.equal(f.ammo, 0);
});

test('fight: sweatshirt halves koala damage, food heals', () => {
  const f = new FightRules();
  f.koalaHitsPlayer();
  assert.equal(f.playerHp, 100 - FIGHT.KOALA_HIT);
  f.useItem('sweatshirt');
  f.koalaHitsPlayer();
  assert.equal(f.playerHp, 100 - FIGHT.KOALA_HIT - FIGHT.KOALA_HIT / 2);
  assert.equal(f.useItem('food'), 'heal');
  assert.equal(f.playerHp, Math.min(100, 100 - 30 + FIGHT.FOOD_HEAL));
  const full = new FightRules();
  assert.equal(full.useItem('food'), null);
});

test('fight: rope slows, flashlight stuns, timers expire', () => {
  const f = new FightRules();
  f.useItem('rope', { inRange: true });
  assert.equal(f.koalaSpeedMultiplier(), 0.4);
  f.useItem('flashlight', { inRange: true });
  assert.equal(f.koalaSpeedMultiplier(), 0);
  f.tick(FIGHT.FLASHLIGHT_STUN_SECONDS);
  assert.equal(f.koalaSpeedMultiplier(), 0.4);
  f.tick(FIGHT.ROPE_SLOW_SECONDS);
  assert.equal(f.koalaSpeedMultiplier(), 1);
});

test('fight: outcomes', () => {
  const win = new FightRules();
  win.damageKoala(FIGHT.KOALA_HP);
  assert.equal(win.outcome, 'win');
  assert.equal(win.useItem('dagger', { inRange: true }), null);
  const lose = new FightRules();
  for (let i = 0; i < 5; i++) lose.koalaHitsPlayer();
  assert.equal(lose.outcome, 'lose');
});

test('flow: stages progress in order and losing the fight returns to chase', () => {
  const g = new GameFlow();
  assert.equal(g.stage, 'title');
  while (g.stage !== 'fight') g.next();
  assert.equal(g.loseFight(), 'chase');
  g.next(); g.next();
  assert.equal(g.stage, 'fight');
  assert.equal(g.next(), 'win');
  assert.equal(g.next(), 'win');
  assert.equal(STAGES.at(-1), 'win');
});

test('fight: pistol miss still spends ammo and never heals the koala', () => {
  const f = new FightRules();
  f.ammo = 2;
  assert.equal(f.useItem('pistol', { facing: false }), 'miss');
  assert.equal(f.ammo, 1);
  assert.equal(f.koalaHp, FIGHT.KOALA_HP);
  assert.equal(f.useItem('pistol', { facing: true }), 'shot');
  assert.equal(f.koalaHp, FIGHT.KOALA_HP - FIGHT.PISTOL_DAMAGE);
});
