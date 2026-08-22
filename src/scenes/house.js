import * as THREE from 'three';
import { BaseScene } from './base.js';
import { box, ground, skyAndLights, GuidePath } from '../world.js';
import { PickupSystem } from '../pickup.js';
import { GridPath, boxBlocker } from '../pathfind.js';

const HELP = `WASD — move\nMouse — look\nSpace — jump\nShift — sprint\nC / Ctrl — crouch\nE — pick up item\n1–9 — select item`;

/** The player's house. Collect all nine items to leave for the jungle. */
export class HouseScene extends BaseScene {
  constructor(game) {
    super(game);
    const s = this.scene;
    skyAndLights(s, { sky: 0x202030, sun: 0.35, ambient: 0.55 });
    s.add(ground(60, 0x6d5843));
    // house footprint 24 x 18, rooms: bedroom (SW), hall (center), kitchen (NE), garage (SE), living (NW)
    const wallMat = { roughness: 0.9 };
    const W = 0.3, H = 3.2;
    const wall = (x, z, w, d) => this.addCollidable(box(w, H, d, 0xbfb4a0, x, H / 2, z, wallMat));
    // outer walls
    wall(0, -9, 24, W); wall(0, 9, 24, W); wall(-12, 0, W, 18); wall(12, 0, W, 18);
    // interior
    wall(-4, -4, W, 10);           // bedroom / hall split (left) with gap at z>1
    wall(4, -3.5, W, 11);          // hall / kitchen+garage split, gap at z>2
    wall(-9.5, 0, 5, W);           // bedroom / living split, doorway at x -7..-4
    wall(9, 1, 6, W);              // kitchen / garage split, doorway at x 4..6
    wall(0, 5.5, 4, W);            // hall / back room, doorways either side
    // ceiling
    const ceil = box(24, 0.2, 18, 0xeeeeee, 0, H + 0.1, 0); s.add(ceil);
    // furniture (bedroom is x -12..-4, z -9..0)
    this.addCollidable(box(3, 0.6, 4, 0x5b3a8a, -10, 0.3, -6));      // bed
    this.addCollidable(box(1.2, 0.8, 0.6, 0x6b4f2a, -5.5, 0.4, -8.4)); // dresser
    this.addCollidable(box(2, 0.8, 1, 0x6b4f2a, -10.5, 0.4, -1.5));   // desk
    this.addCollidable(box(0.4, 2.5, 2, 0x4a3520, -11.7, 1.25, 2.5)); // bookshelf (living)
    this.addCollidable(box(3, 0.7, 1.2, 0x8a2b2b, -8, 0.35, 6));      // couch
    this.addCollidable(box(1.5, 0.9, 1.5, 0x777777, 7, 0.45, -7));    // fridge
    this.addCollidable(box(4, 0.9, 1, 0x999999, 9, 0.45, -2));        // counter
    this.addCollidable(box(3, 1, 2, 0x333333, 9, 0.5, 5));            // car hood / workbench in garage
    this.addCollidable(box(1, 1, 1, 0x8b6b3b, 1, 0.5, 7.5));          // crate
    this.addCollidable(box(1, 0.5, 1, 0x8b6b3b, 2.5, 0.25, 8));       // low crate
    // lamps
    const lamp = new THREE.PointLight(0xffd9a0, 30, 14); lamp.position.set(-8, 2.8, -4); s.add(lamp);
    const lamp2 = new THREE.PointLight(0xffd9a0, 30, 14); lamp2.position.set(8, 2.8, -4); s.add(lamp2);
    const lamp3 = new THREE.PointLight(0xffd9a0, 25, 14); lamp3.position.set(0, 2.8, 6); s.add(lamp3);
    const lamp4 = new THREE.PointLight(0xffd9a0, 25, 14); lamp4.position.set(-8, 2.8, 5); s.add(lamp4);
    // front door marker (exit), on south wall of hall
    this.exitPos = new THREE.Vector3(0, 0, 8.6);
    const door = box(1.6, 2.4, 0.15, 0x3a2616, 0, 1.2, 8.9); s.add(door);
    this.doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ color: 0x7cf7ff, transparent: true, opacity: 0 }));
    this.doorGlow.position.set(0, 1.2, 8.8); this.doorGlow.rotation.y = Math.PI; s.add(this.doorGlow);

    this.bounds = { minX: -11.5, maxX: 11.5, minZ: -8.5, maxZ: 8.5 };
    this.pickups = new PickupSystem(game, s);
    const spots = {
      sweatshirt: [-6, -8], flashlight: [-10.5, -1.5, 0.8], rope: [-11, 6.5], dagger: [9, -2, 0.9],
      food: [7, -7, 0.9], lantern: [10.5, 7], pistol: [9, 5, 1], tent: [1, 7.5, 1], sleepingbag: [-8, 6, 0.7],
    };
    for (const [id, [x, z, y = 0]] of Object.entries(spots)) this.pickups.add(id, x, z, y);
    this.path = new GuidePath(s);
    this.nav = new GridPath({ ...this.bounds, cell: 0.5, blocked: boxBlocker(this.colliders) });
    this.navTimer = 0;
    this.navPoints = null;
  }

  async enter() {
    const { player, hud, inventory } = this.game;
    this.applyToPlayer();
    player.spawn(-7, -4, 180);
    hud.show();
    hud.help(HELP);
    hud.objective('Pack for the camping trip. Follow the glowing path to each item.');
    hud.renderInventory(inventory);
    hud.subtitle('You are packing for a weekend camping trip. Find all nine items.');
    setTimeout(() => hud.subtitle(''), 6000);
  }

  update(dt) {
    super.update(dt);
    const { player, inventory, hud } = this.game;
    this.pickups.update(dt, this.time);
    const done = inventory.hasAllItems();
    const target = done ? this.exitPos : this.pickups.nearest(player.position)?.position;
    this.navTimer -= dt;
    if (this.navTimer <= 0) { // re-plan a few times a second
      this.navTimer = 0.25;
      this.navPoints = target ? this.nav.find(player.position.x, player.position.z, target.x, target.z) : null;
      if (!this.navPoints && target) this.navPoints = [{ x: player.position.x, z: player.position.z }, { x: target.x, z: target.z }];
    }
    this.path.update(dt, this.navPoints);
    if (done) {
      hud.objective('All packed! Head out the front door (glowing) to start the trip.');
      this.doorGlow.material.opacity = 0.35 + Math.sin(this.time * 4) * 0.15;
      if (player.position.distanceTo(this.exitPos) < 1.6) this.game.nextStage();
    } else {
      hud.objective(`Pack for the camping trip (${inventory.count()}/9). Follow the glowing path.`);
    }
  }
}
