import * as THREE from 'three';
import { BaseScene } from './base.js';
import { ground, skyAndLights, makeTree, makeKoala, GuidePath, box } from '../world.js';
import { PickupSystem } from '../pickup.js';

const DAY_LENGTH = 150; // seconds from mid afternoon to dark
const ANIMALS_NEEDED = 3;

function makeAnimal(kind) {
  const g = new THREE.Group();
  const mats = { frog: 0x4caf50, bird: 0x2196f3, possum: 0x9e9e9e, wombat: 0x795548 };
  const mat = new THREE.MeshStandardMaterial({ color: mats[kind] });
  const body = new THREE.Mesh(new THREE.SphereGeometry(kind === 'frog' ? 0.25 : 0.45, 12, 10), mat);
  body.position.y = kind === 'frog' ? 0.25 : 0.45; body.scale.z = 1.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(kind === 'frog' ? 0.15 : 0.28, 10, 8), mat);
  head.position.set(0, body.position.y + 0.2, body.scale.z * 0.4);
  g.add(body, head);
  g.userData.kind = kind;
  g.userData.studied = false;
  return g;
}

/** Mid-afternoon jungle that darkens over time. Study animals; then the koala ambush. */
export class JungleScene extends BaseScene {
  constructor(game) {
    super(game);
    const s = this.scene;
    this.lights = skyAndLights(s, { sky: 0x9fd3ff, sun: 1.4, ambient: 0.6, fog: { color: 0x9fd3ff, near: 10, far: 70 } });
    s.add(ground(200, 0x2f5a2a));
    this.trees = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 180; i++) {
      const x = (rnd() - 0.5) * 180, z = (rnd() - 0.5) * 180;
      if (Math.hypot(x, z) < 6) continue;
      const t = makeTree(x, z, 0.8 + rnd() * 0.8);
      s.add(t); this.colliders.push(t.userData.collider); this.trees.push(t);
    }
    // a few rocks/logs
    for (let i = 0; i < 25; i++) this.addCollidable(box(1 + rnd() * 2, 0.6 + rnd(), 1 + rnd(), 0x6b6b6b, (rnd() - 0.5) * 160, 0.4, (rnd() - 0.5) * 160));
    this.bounds = { minX: -95, maxX: 95, minZ: -95, maxZ: 95 };

    this.animals = [];
    const animalSpots = [['frog', 18, -22], ['bird', -30, 15], ['possum', 35, 30], ['wombat', -40, -35], ['frog', 5, 45]];
    for (const [kind, x, z] of animalSpots) { const a = makeAnimal(kind); a.position.set(x, 0, z); s.add(a); this.animals.push(a); }

    this.pickups = new PickupSystem(game, s);
    this.path = new GuidePath(s);
    this.placed = [];
    this.studied = 0;
    this.phase = 'explore'; // explore -> return -> ambush
    this.ambushPos = new THREE.Vector3(0, 0, -6);
    this.ambushTime = 0;

    // koala hidden in a tree near the ambush point
    this.koala = makeKoala(1.3);
    this.koala.position.set(0, 4.3, -9.6);
    this.koala.visible = false;
    s.add(this.koala);
    this.koalaTree = makeTree(0, -12, 1.6); s.add(this.koalaTree); this.colliders.push(this.koalaTree.userData.collider);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x4e342e }));
    branch.position.set(0, 4.2, -10.4); branch.rotation.x = Math.PI / 2 - 0.15; s.add(branch);
    this.lanternLight = new THREE.PointLight(0xffa040, 0, 12); s.add(this.lanternLight);
    this.flashlight = new THREE.SpotLight(0xfff2cc, 0, 40, 0.4, 0.5); s.add(this.flashlight, this.flashlight.target);
  }

  async enter() {
    const { player, hud, inventory } = this.game;
    this.applyToPlayer();
    player.spawn(0, 0, 180);
    hud.show();
    hud.help('E — study animal / pick up\n5 or 6 then click — place sleeping bag / tent\n1 / 4 — flashlight / lantern');
    hud.renderInventory(inventory);
    hud.subtitle('Mid afternoon. The jungle is quiet... for now.');
    setTimeout(() => hud.subtitle(''), 5000);
  }

  nearestAnimal(p) {
    let best = null, d0 = Infinity;
    for (const a of this.animals) { if (a.userData.studied) continue; const d = a.position.distanceTo(p); if (d < d0) { d0 = d; best = a; } }
    return best;
  }

  updateDaylight() {
    const t = Math.min(1, this.time / DAY_LENGTH);
    const sky = new THREE.Color(0x9fd3ff).lerp(new THREE.Color(0x05060f), t);
    this.scene.background = sky; this.scene.fog.color = sky;
    this.scene.fog.far = 70 - t * 45;
    this.lights.dir.intensity = 1.4 * (1 - t) + 0.05;
    this.lights.amb.intensity = 0.6 * (1 - t) + 0.06;
    this.lights.dir.color.setHSL(0.08, 0.7, 0.5 + 0.5 * (1 - t));
  }

  update(dt) {
    super.update(dt);
    const { player, input, hud, inventory, audio } = this.game;
    this.updateDaylight();
    this.pickups.update(dt, this.time);
    this.animals.forEach((a, i) => { a.position.y = Math.abs(Math.sin(this.time * 3 + i)) * 0.15; a.rotation.y += dt * 0.5; });

    // light sources
    const sel = inventory.selectedItem();
    this.lanternLight.intensity = sel === 'lantern' ? 25 : 0;
    this.lanternLight.position.copy(player.camera.position);
    this.flashlight.intensity = sel === 'flashlight' ? 150 : 0;
    this.flashlight.position.copy(player.camera.position);
    this.flashlight.target.position.copy(player.camera.position).add(player.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));

    if (this.phase === 'explore') {
      // placing camp
      if ((sel === 'tent' || sel === 'sleepingbag') && input.clicked && !this.placed.includes(sel)) {
        const f = player.forward();
        const m = sel === 'tent'
          ? box(2.4, 1.8, 2.4, 0x2e8b57, player.position.x + f.x * 3, 0.9, player.position.z + f.z * 3)
          : box(0.8, 0.25, 2, 0x4a69bd, player.position.x + f.x * 2.2, 0.12, player.position.z + f.z * 2.2);
        this.scene.add(m); this.placed.push(sel); inventory.remove(sel); hud.renderInventory(inventory); audio.pickup();
      }
      const a = this.nearestAnimal(player.position);
      const camp = this.placed.length === 2 ? 'Camp is set up. ' : `Sub-goal: set up tent & sleeping bag (${this.placed.length}/2). `;
      hud.objective(`Find and study animals (${this.studied}/${ANIMALS_NEEDED}). ${camp}It's getting dark...`);
      if (a && a.position.distanceTo(player.position) < 2.5) {
        hud.prompt(`E — study the ${a.userData.kind}`);
        if (input.justPressed('KeyE')) {
          a.userData.studied = true; this.studied++; audio.pickup();
          hud.subtitle(`You note the ${a.userData.kind} in your journal.`); setTimeout(() => hud.subtitle(''), 2500);
        }
      } else if (!this.pickups.focused) hud.prompt('');
      this.path.update(dt, a ? [player.position, a.position] : null);
      if (this.studied >= ANIMALS_NEEDED || this.time > DAY_LENGTH) {
        this.phase = 'return';
        hud.subtitle('Something is watching. Head back the way you came.');
        setTimeout(() => hud.subtitle(''), 4000);
      }
    } else if (this.phase === 'return') {
      hud.objective('Follow the path back toward the forest edge.');
      this.path.update(dt, [player.position, this.ambushPos]);
      if (player.position.distanceTo(this.ambushPos) < 3) this.startAmbush();
    } else if (this.phase === 'ambush') {
      this.ambushTime += dt;
      const t = this.ambushTime;
      player.frozen = true;
      this.path.hide();
      hud.prompt('');
      // pause, then pan camera up to the koala
      if (t > 1) {
        const target = this.koala.position.clone().add(new THREE.Vector3(0, 0.8, 0));
        const dir = target.sub(player.camera.position).normalize();
        const wantYaw = Math.atan2(-dir.x, -dir.z), wantPitch = Math.asin(dir.y);
        player.yaw += (wantYaw - player.yaw) * Math.min(1, dt * 2);
        player.pitch += (wantPitch - player.pitch) * Math.min(1, dt * 2);
      }
      if (t > 2.5 && !this.koala.visible) { this.koala.visible = true; this.koala.lookAt(player.camera.position); }
      if (t > 3.5 && t < 4) hud.subtitle("A koala. He's... cute.");
      if (t > 4.5) {
        hud.subtitle('');
        this.koala.position.lerp(player.camera.position.clone().add(new THREE.Vector3(0, -0.9, 0)), Math.min(1, dt * 6));
        this.koala.lookAt(player.camera.position);
        if (!this.roared) { this.roared = true; audio.roar(); }
      }
      if (t > 5.6) { audio.hurt(); this.game.nextStage(); }
    }
  }

  startAmbush() {
    this.phase = 'ambush';
    this.ambushTime = 0;
  }

  exit() { this.game.player.frozen = false; }
}
