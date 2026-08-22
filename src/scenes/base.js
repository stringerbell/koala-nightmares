import * as THREE from 'three';

export class BaseScene {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.time = 0;
    this.colliders = [];
    this.groundHeight = () => 0;
  }
  addCollidable(mesh) {
    this.scene.add(mesh);
    mesh.updateMatrixWorld(true);
    this.colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  }
  applyToPlayer() {
    const p = this.game.player;
    p.colliders = this.colliders;
    p.groundHeight = this.groundHeight;
    p.bounds = this.bounds || null;
  }
  async enter() {}
  update(dt) { this.time += dt; }
  exit() {}
}
