import * as THREE from 'three';
import { BaseScene } from './base.js';
import { ground, skyAndLights, makeKoala, box } from '../world.js';
import { ChaseRules } from '../rules.js';

const ARENA = 45; // half size
const KOALA_SCALE = 5;

/** Challenge 1: survive a giant koala for 60 seconds. */
export class ChaseScene extends BaseScene {
  constructor(game) {
    super(game);
    const s = this.scene;
    skyAndLights(s, { sky: 0x2b0a1a, sun: 0.6, ambient: 0.35, fog: { color: 0x2b0a1a, near: 20, far: 120 } });
    s.add(ground(ARENA * 2 + 4, 0x3a1f2e));
    let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 26; i++) {
      const x = (rnd() - 0.5) * ARENA * 1.8, z = (rnd() - 0.5) * ARENA * 1.8;
      if (Math.hypot(x, z) < 8) continue;
      this.addCollidable(box(1.5 + rnd() * 2, 4 + rnd() * 6, 1.5 + rnd() * 2, 0x5c2e4a, x, 3, z));
    }
    const wallMat = 0x1a0510;
    for (const [x, z, w, d] of [[0, -ARENA, ARENA * 2, 1], [0, ARENA, ARENA * 2, 1], [-ARENA, 0, 1, ARENA * 2], [ARENA, 0, 1, ARENA * 2]]) this.addCollidable(box(w, 8, d, wallMat, x, 4, z));
    this.bounds = { minX: -ARENA + 1, maxX: ARENA - 1, minZ: -ARENA + 1, maxZ: ARENA - 1 };
    this.koala = makeKoala(KOALA_SCALE); s.add(this.koala);
    this.rules = new ChaseRules();
    this.lastTagFlash = 0;
  }
  reset() {
    const { player } = this.game;
    player.spawn(0, ARENA - 8, 0);
    this.koala.position.set(0, 0, -ARENA + 8);
  }
  async enter() {
    const { hud, inventory } = this.game;
    this.applyToPlayer();
    this.reset();
    hud.show(); hud.help('Shift — sprint (unlimited)\nSpace — jump\nUse the pillars to break line of sight');
    hud.objective('Challenge 1 of 3: Survive the giant koala for one minute. If it tags you, the clock resets.');
    hud.renderInventory(inventory);
  }
  update(dt) {
    super.update(dt);
    const { player, hud, audio } = this.game;
    this.rules.tick(dt);
    hud.timer(this.rules.remaining());
    if (this.rules.complete) { hud.timer(null); this.game.nextStage(); return; }
    // koala pursuit, ramping speed
    const speed = 7.5 + (this.rules.elapsed / this.rules.duration) * 2.5;
    const to = new THREE.Vector3().subVectors(player.position, this.koala.position); to.y = 0;
    const dist = to.length();
    to.normalize();
    this.koala.position.addScaledVector(to, speed * dt);
    this.koala.position.y = Math.abs(Math.sin(this.time * 6)) * 0.6;
    this.koala.lookAt(player.position.x, this.koala.position.y, player.position.z);
    const { armL, armR } = this.koala.userData.parts;
    armL.rotation.x = Math.sin(this.time * 8) * 0.8; armR.rotation.x = -Math.sin(this.time * 8) * 0.8;
    if (dist < KOALA_SCALE * 0.7 && this.rules.tagged()) {
      audio.hurt(); audio.roar();
      hud.subtitle(`Tagged! Start again. (reset #${this.rules.resets})`);
      setTimeout(() => hud.subtitle(''), 2000);
      this.reset();
    }
  }
  exit() { this.game.hud.timer(null); }
}
