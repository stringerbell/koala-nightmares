import * as THREE from 'three';
import { BaseScene } from './base.js';
import { ground, skyAndLights, makeKoala, box } from '../world.js';
import { PickupSystem } from '../pickup.js';
import { FightRules, FIGHT } from '../rules.js';
import { ITEMS, ITEM_IDS } from '../items.js';

const ARENA = 30, KOALA_SCALE = 3, MELEE_RANGE = 4.5;

/** Challenge 3: fight the koala with what you have. Extra supplies lie around the arena. */
export class FightScene extends BaseScene {
  constructor(game) {
    super(game);
    const s = this.scene;
    skyAndLights(s, { sky: 0x1a0000, sun: 0.9, ambient: 0.4, fog: { color: 0x1a0000, near: 25, far: 90 } });
    s.add(ground(ARENA * 2 + 4, 0x3b1212));
    for (const [x, z, w, d] of [[0, -ARENA, ARENA * 2, 1], [0, ARENA, ARENA * 2, 1], [-ARENA, 0, 1, ARENA * 2], [ARENA, 0, 1, ARENA * 2]]) this.addCollidable(box(w, 6, d, 0x120000, x, 3, z));
    for (const [x, z] of [[-15, -15], [15, 15], [-15, 15], [15, -15]]) this.addCollidable(box(2.5, 5, 2.5, 0x5a1a1a, x, 2.5, z));
    this.bounds = { minX: -ARENA + 1, maxX: ARENA - 1, minZ: -ARENA + 1, maxZ: ARENA - 1 };
    this.koala = makeKoala(KOALA_SCALE); s.add(this.koala);
    this.pickups = new PickupSystem(game, s);
    this.supplies = []; // ammo / medkit crates
    this.decoy = null;
    this.attackCooldown = 0;
    this.swing = 0;
    this.rules = new FightRules();
  }
  addSupply(kind, x, z) {
    const m = box(0.7, 0.5, 0.5, kind === 'ammo' ? 0xf1c40f : 0xff6b6b, x, 0.25, z, { emissive: kind === 'ammo' ? 0x886600 : 0x661111, emissiveIntensity: 0.6 });
    m.userData.kind = kind; this.scene.add(m); this.supplies.push(m);
  }
  async enter() {
    const { player, hud, inventory } = this.game;
    this.applyToPlayer();
    player.spawn(0, ARENA - 6, 0);
    this.koala.position.set(0, 0, -ARENA + 6);
    this.rules.ammo = inventory.has('pistol') ? FIGHT.PISTOL_AMMO : 0;
    // supplies + any inventory items the player is missing, scattered around the edges
    let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const spot = () => { const a = rnd() * Math.PI * 2, r = 12 + rnd() * 14; return [Math.cos(a) * r, Math.sin(a) * r]; };
    for (let i = 0; i < 4; i++) this.addSupply('ammo', ...spot());
    for (let i = 0; i < 3; i++) this.addSupply('medkit', ...spot());
    for (const id of ITEM_IDS) if (!inventory.has(id)) this.pickups.add(id, ...spot());
    hud.show();
    hud.help('1–9 — select item, click — use\nDagger: stab up close · Pistol: shoot\nRope: slow · Flashlight: stun\nTent/Bag: decoy · Food: heal · Sweatshirt: armor');
    hud.objective('Challenge 3 of 3: Defeat the koala. Grab supplies around the arena.');
    hud.renderInventory(inventory);
    hud.bars(true, 1, 1, this.rules.ammo);
  }
  update(dt) {
    super.update(dt);
    const { player, input, hud, inventory, audio } = this.game;
    const r = this.rules;
    r.tick(dt);
    this.pickups.update(dt, this.time);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.decoy && r.decoyTimer <= 0) { this.scene.remove(this.decoy); this.decoy = null; }

    // supplies
    for (const m of [...this.supplies]) {
      m.rotation.y += dt;
      if (m.position.distanceTo(player.position) < 1.4) {
        if (m.userData.kind === 'ammo') { r.ammo += 4; hud.subtitle('+4 ammo'); }
        else { r.playerHp = Math.min(FIGHT.PLAYER_HP, r.playerHp + 30); hud.subtitle('+30 health'); }
        setTimeout(() => hud.subtitle(''), 1200);
        audio.pickup(); this.scene.remove(m); this.supplies.splice(this.supplies.indexOf(m), 1);
      }
    }

    // use selected item
    const sel = inventory.selectedItem();
    const toKoala = new THREE.Vector3().subVectors(this.koala.position, player.position); toKoala.y = 0;
    const dist = toKoala.length();
    const facing = player.forward().dot(toKoala.clone().normalize()) > 0.6;
    if (input.clicked && sel) {
      const result = r.useItem(sel, { inRange: dist < MELEE_RANGE && facing, facing });
      if (result === 'stab') { audio.stab(); this.swing = 0.25; }
      else if (result === 'shot' || result === 'miss') audio.shot();
      else if (result === 'empty') { hud.subtitle('Click. Empty.'); setTimeout(() => hud.subtitle(''), 800); }
      else if (result === 'heal') { audio.pickup(); inventory.remove('food'); }
      else if (result === 'slow' || result === 'stun') { hud.subtitle(result === 'slow' ? 'The koala is tangled!' : 'The koala is dazed!'); setTimeout(() => hud.subtitle(''), 1500); }
      else if (result === 'armor') { hud.subtitle('You pull on the sweatshirt. Halved damage.'); inventory.remove('sweatshirt'); setTimeout(() => hud.subtitle(''), 1500); }
      else if (result === 'decoy') {
        const f = player.forward();
        this.decoy = box(2, 1.5, 2, ITEMS[sel].color, player.position.x + f.x * 3, 0.75, player.position.z + f.z * 3);
        this.scene.add(this.decoy); inventory.remove(sel);
        hud.subtitle('The koala goes for the decoy!'); setTimeout(() => hud.subtitle(''), 1500);
      }
      if (result === 'heal' || result === 'armor' || result === 'decoy') hud.renderInventory(inventory);
    }
    this.swing = Math.max(0, this.swing - dt);
    player.camera.rotation.z = this.swing * 0.3;

    // koala AI
    const goal = this.decoy ? this.decoy.position : player.position;
    const dir = new THREE.Vector3().subVectors(goal, this.koala.position); dir.y = 0; dir.normalize();
    this.koala.position.addScaledVector(dir, 6.5 * r.koalaSpeedMultiplier() * dt);
    this.koala.position.y = Math.abs(Math.sin(this.time * 6)) * 0.3 * r.koalaSpeedMultiplier();
    this.koala.lookAt(goal.x, this.koala.position.y, goal.z);
    const { armL, armR } = this.koala.userData.parts;
    armL.rotation.x = Math.sin(this.time * 8) * 0.8; armR.rotation.x = -Math.sin(this.time * 8) * 0.8;
    if (!this.decoy && dist < KOALA_SCALE * 0.8 && this.attackCooldown === 0 && r.stunTimer === 0) {
      r.koalaHitsPlayer(); audio.hurt(); this.attackCooldown = 1.0;
      // shove the player back
      const push = toKoala.clone().normalize().multiplyScalar(-2.5);
      player.position.add(push);
    }
    hud.bars(true, r.playerHp / FIGHT.PLAYER_HP, r.koalaHp / FIGHT.KOALA_HP, r.ammo);
    if (r.outcome === 'win') { audio.win(); this.game.winFight(); }
    else if (r.outcome === 'lose') this.game.loseFight();
  }
  exit() { this.game.hud.bars(false); this.game.player.camera.rotation.z = 0; }
}
