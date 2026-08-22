import * as THREE from 'three';
import { makeItemMesh, setHighlight } from './world.js';
import { ITEMS } from './items.js';

const PICKUP_RANGE = 2.6;

/**
 * Manages item pickups lying in a scene: bobbing, highlight when looked at,
 * pressing E to open the slot picker, and dropping swapped-out items.
 */
export class PickupSystem {
  constructor(game, scene) {
    this.game = game;
    this.scene = scene;
    this.items = []; // meshes
    this.focused = null;
    this.busy = false;
    this.raycaster = new THREE.Raycaster();
  }

  add(id, x, z, y = 0) {
    const m = makeItemMesh(id);
    m.position.set(x, y + 0.25, z);
    m.userData.baseY = y + 0.25;
    this.scene.add(m);
    this.items.push(m);
    return m;
  }

  remove(mesh) {
    this.scene.remove(mesh);
    this.items = this.items.filter((m) => m !== mesh);
  }

  nearest(from) {
    let best = null, bestD = Infinity;
    for (const m of this.items) { const d = m.position.distanceTo(from); if (d < bestD) { bestD = d; best = m; } }
    return best;
  }

  async update(dt, t) {
    const { player, input, hud, inventory, audio } = this.game;
    for (const m of this.items) {
      m.position.y = m.userData.baseY + Math.sin(t * 2 + m.userData.bob) * 0.06;
      m.rotation.y += dt;
    }
    if (this.busy) return;
    // look target
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), player.camera);
    const hits = this.raycaster.intersectObjects(this.items, true);
    let target = null;
    if (hits.length && hits[0].distance < PICKUP_RANGE) {
      let o = hits[0].object; while (o && !o.userData.itemId) o = o.parent; target = o;
    }
    if (!target) { // fall back to proximity
      const n = this.nearest(player.camera.position);
      if (n && n.position.distanceTo(player.camera.position) < 2.0) target = n;
    }
    if (this.focused && this.focused !== target) setHighlight(this.focused, false);
    this.focused = target;
    if (target) {
      setHighlight(target, true);
      hud.prompt(`E — pick up ${ITEMS[target.userData.itemId].name}`);
      if (input.justPressed('KeyE')) await this.pickUp(target);
    } else {
      hud.prompt('');
    }
  }

  async pickUp(mesh) {
    const { player, input, hud, inventory, audio } = this.game;
    this.busy = true;
    player.frozen = true;
    input.enabled = false;
    input.unlock();
    const slot = await hud.pickSlot(mesh.userData.itemId, inventory);
    if (slot) {
      const { ok, swappedOut } = inventory.place(mesh.userData.itemId, slot);
      if (ok) {
        this.remove(mesh);
        audio.pickup();
        if (swappedOut) { // drop the old item at the player's feet
          const f = player.forward();
          this.add(swappedOut, player.position.x + f.x * 1.2, player.position.z + f.z * 1.2, this.game.groundAt(player.position.x, player.position.z));
        }
        inventory.select(slot);
        hud.renderInventory(inventory);
      }
    }
    hud.prompt('');
    this.focused = null;
    input.enabled = true;
    input.flush();
    player.frozen = false;
    this.busy = false;
    input.lock();
  }
}
