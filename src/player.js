import * as THREE from 'three';

const EYE_HEIGHT = 1.7;
const CROUCH_HEIGHT = 0.9;
const RADIUS = 0.4;
const GRAVITY = 22;
const JUMP_SPEED = 8;

/** First person controller with AABB collision and simple platform support. */
export class Player {
  constructor(camera) {
    this.camera = camera;
    this.position = new THREE.Vector3(0, 0, 0); // feet position
    this.velocityY = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = true;
    this.crouching = false;
    this.walkSpeed = 5;
    this.sprintSpeed = 10;
    this.sensitivity = 0.0022;
    this.colliders = []; // THREE.Box3 list
    this.bounds = null;  // THREE.Box2-like {minX,maxX,minZ,maxZ}
    this.frozen = false;
    this.groundHeight = () => 0;
    this.eyeOffset = EYE_HEIGHT;
    this.lastMoveDist = 0;
  }

  spawn(x, z, yawDeg = 0, y = 0) {
    this.position.set(x, y, z);
    this.velocityY = 0;
    this.yaw = THREE.MathUtils.degToRad(yawDeg);
    this.pitch = 0;
    this.syncCamera();
  }

  syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeOffset, this.position.z);
    this.camera.rotation.set(0, 0, 0, 'YXZ');
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  forward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  update(dt, input) {
    if (this.frozen) { this.syncCamera(); return; }

    this.yaw -= input.mouseDX * this.sensitivity;
    this.pitch -= input.mouseDY * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.5, 1.5);

    this.crouching = input.down('ControlLeft') || input.down('KeyC');
    const targetEye = this.crouching ? CROUCH_HEIGHT : EYE_HEIGHT;
    this.eyeOffset += (targetEye - this.eyeOffset) * Math.min(1, dt * 12);

    const fwd = this.forward();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    if (input.down('KeyW')) move.add(fwd);
    if (input.down('KeyS')) move.sub(fwd);
    if (input.down('KeyD')) move.add(right);
    if (input.down('KeyA')) move.sub(right);
    let speed = input.down('ShiftLeft') || input.down('ShiftRight') ? this.sprintSpeed : this.walkSpeed;
    if (this.crouching) speed *= 0.5;
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);
    this.lastMoveDist = move.length();

    // horizontal, axis-separated for sliding
    this.tryMove(move.x, 0);
    this.tryMove(0, move.z);

    // vertical
    if (input.justPressed('Space') && this.grounded) { this.velocityY = JUMP_SPEED; this.grounded = false; }
    this.velocityY -= GRAVITY * dt;
    this.position.y += this.velocityY * dt;
    const floor = this.floorAt(this.position.x, this.position.z, this.position.y);
    if (this.position.y <= floor) {
      this.position.y = floor;
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    // head bump
    const ceil = this.ceilingAt(this.position.x, this.position.z, this.position.y);
    const height = this.crouching ? CROUCH_HEIGHT + 0.2 : EYE_HEIGHT + 0.2;
    if (ceil !== null && !this.grounded && this.position.y + height > ceil) {
      this.position.y = ceil - height;
      if (this.velocityY > 0) this.velocityY = 0;
    }

    if (this.bounds) {
      this.position.x = THREE.MathUtils.clamp(this.position.x, this.bounds.minX, this.bounds.maxX);
      this.position.z = THREE.MathUtils.clamp(this.position.z, this.bounds.minZ, this.bounds.maxZ);
    }
    this.syncCamera();
  }

  bodyHeight() { return this.crouching ? CROUCH_HEIGHT + 0.2 : EYE_HEIGHT + 0.2; }

  /** Axis-aligned attempt; walls are boxes that overlap the player's body column. */
  tryMove(dx, dz) {
    const nx = this.position.x + dx, nz = this.position.z + dz;
    const yMin = this.position.y + 0.3, yMax = this.position.y + this.bodyHeight();
    for (const box of this.colliders) {
      if (box.max.y <= yMin || box.min.y >= yMax) continue;       // above/below us
      if (nx + RADIUS <= box.min.x || nx - RADIUS >= box.max.x) continue;
      if (nz + RADIUS <= box.min.z || nz - RADIUS >= box.max.z) continue;
      // step-up: if the box top is only slightly above our feet, allow climbing
      if (box.max.y - this.position.y <= 0.5 && this.grounded) continue;
      return; // blocked
    }
    this.position.x = nx; this.position.z = nz;
  }

  floorAt(x, z, y) {
    let floor = this.groundHeight(x, z);
    for (const box of this.colliders) {
      if (x + RADIUS <= box.min.x || x - RADIUS >= box.max.x) continue;
      if (z + RADIUS <= box.min.z || z - RADIUS >= box.max.z) continue;
      if (box.max.y > floor && box.max.y <= y + 0.5) floor = box.max.y;
    }
    return floor;
  }

  ceilingAt(x, z, y) {
    let ceil = null;
    for (const box of this.colliders) {
      if (x + RADIUS <= box.min.x || x - RADIUS >= box.max.x) continue;
      if (z + RADIUS <= box.min.z || z - RADIUS >= box.max.z) continue;
      if (box.min.y >= y + 0.5 && (ceil === null || box.min.y < ceil)) ceil = box.min.y;
    }
    return ceil;
  }

  distanceTo(v) { return this.position.distanceTo(v); }
}
