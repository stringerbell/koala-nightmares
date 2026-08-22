import * as THREE from 'three';
import { BaseScene } from './base.js';
import { ground, skyAndLights, box } from '../world.js';
import { ObstacleRules } from '../rules.js';

const LENGTH = 200, HALF_W = 6;

/** Challenge 2: a one-minute obstacle course. Jump, duck, and dodge to the end. */
export class ObstacleScene extends BaseScene {
  constructor(game) {
    super(game);
    const s = this.scene;
    skyAndLights(s, { sky: 0x0b1026, sun: 0.8, ambient: 0.4, fog: { color: 0x0b1026, near: 30, far: 140 } });
    s.add(ground(600, 0x1a1f3a));
    // lane walls
    this.addCollidable(box(0.5, 6, LENGTH + 20, 0x2a2f5a, -HALF_W - 0.25, 3, LENGTH / 2));
    this.addCollidable(box(0.5, 6, LENGTH + 20, 0x2a2f5a, HALF_W + 0.25, 3, LENGTH / 2));
    this.addCollidable(box(HALF_W * 2 + 1, 6, 0.5, 0x2a2f5a, 0, 3, -5));
    this.movers = [];
    this.bars = [];
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let z = 14; z < LENGTH - 6; z += 9) {
      const kind = Math.floor(rnd() * 4);
      if (kind === 0) {            // hurdle: jump over
        this.addCollidable(box(HALF_W * 2, 1.1, 0.6, 0xe67e22, 0, 0.55, z));
      } else if (kind === 1) {     // low bar: crouch under
        this.bars.push(this.addCollidable(box(HALF_W * 2, 0.5, 0.8, 0x27ae60, 0, 1.6, z)));
        const post = (x) => this.addCollidable(box(0.3, 1.35, 0.3, 0x27ae60, x, 0.675, z));
        post(-HALF_W + 0.2); post(HALF_W - 0.2);
      } else if (kind === 2) {     // sweeping block: dodge
        const m = box(3, 2.2, 1.2, 0xc0392b, 0, 1.1, z, { emissive: 0x550000 });
        m.userData = { phase: rnd() * Math.PI * 2, speed: 1.2 + rnd(), range: HALF_W - 1.5 };
        s.add(m); this.movers.push(m);
      } else {                     // wall with a gap: weave
        const gapX = (rnd() - 0.5) * (HALF_W * 2 - 3);
        const leftW = gapX - 1.2 + HALF_W, rightW = HALF_W - gapX - 1.2;
        if (leftW > 0.3) this.addCollidable(box(leftW, 3, 0.6, 0x8e44ad, -HALF_W + leftW / 2, 1.5, z));
        if (rightW > 0.3) this.addCollidable(box(rightW, 3, 0.6, 0x8e44ad, HALF_W - rightW / 2, 1.5, z));
      }
    }
    // finish gate
    const gate = box(HALF_W * 2, 0.3, 0.3, 0xffd166, 0, 4, LENGTH, { emissive: 0xffd166, emissiveIntensity: 0.8 }); s.add(gate);
    const finishPad = box(HALF_W * 2, 0.1, 4, 0xffd166, 0, 0.05, LENGTH + 2, { emissive: 0xaa8800 }); s.add(finishPad);
    this.bounds = { minX: -HALF_W + 0.4, maxX: HALF_W - 0.4, minZ: -4, maxZ: LENGTH + 6 };
    this.rules = new ObstacleRules(60, LENGTH);
  }
  reset() { this.game.player.spawn(0, 0, 180); }
  async enter() {
    const { hud, inventory } = this.game;
    this.applyToPlayer();
    this.reset();
    hud.show(); hud.help('Space — jump hurdles\nCtrl or C — duck under bars\nDodge the red blocks\nShift — sprint');
    hud.objective('Challenge 2 of 3: Reach the golden gate before the clock hits zero. Getting hit resets you.');
    hud.renderInventory(inventory);
  }
  update(dt) {
    super.update(dt);
    const { player, hud, audio } = this.game;
    const result = this.rules.tick(dt, player.position.z);
    hud.timer(this.rules.remaining());
    if (result === 'finished') { hud.timer(null); this.game.nextStage(); return; }
    if (result === 'timeout') { this.fail('Out of time!'); return; }
    // coach the duck: a bar just ahead and the player is still standing
    const barAhead = this.bars.some((b) => b.position.z - player.position.z > 0 && b.position.z - player.position.z < 4);
    hud.prompt(barAhead && !player.crouching ? 'Low bar — hold Ctrl (or C) to duck' : '');
    const pBox = new THREE.Box3(
      new THREE.Vector3(player.position.x - 0.35, player.position.y + 0.1, player.position.z - 0.35),
      new THREE.Vector3(player.position.x + 0.35, player.position.y + player.bodyHeight(), player.position.z + 0.35));
    for (const m of this.movers) {
      const u = m.userData;
      m.position.x = Math.sin(this.time * u.speed + u.phase) * u.range;
      m.updateMatrixWorld();
      if (new THREE.Box3().setFromObject(m).intersectsBox(pBox) && this.rules.hit()) { this.fail('Hit!'); return; }
    }
  }
  fail(msg) {
    const { hud, audio } = this.game;
    audio.hurt();
    hud.subtitle(`${msg} Back to the start. (reset #${this.rules.resets})`);
    setTimeout(() => hud.subtitle(''), 2000);
    this.reset();
  }
  exit() { this.game.hud.timer(null); }
}
