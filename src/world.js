import * as THREE from 'three';
import { ITEMS } from './items.js';

export function box(w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, ...opts }));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function collider(mesh) {
  mesh.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(mesh);
}

export function ground(size, color, y = 0) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color }));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.receiveShadow = true;
  return g;
}

/** A cute-but-vicious koala. scale 1 ≈ 1.2m tall. */
export function makeKoala(scale = 1, { vicious = true } = {}) {
  const g = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.9 });
  const light = new THREE.MeshStandardMaterial({ color: 0xc9cdd0, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), fur); body.position.y = 0.5; body.scale.y = 1.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), fur); head.position.y = 1.15;
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), light); belly.position.set(0, 0.5, 0.3);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  nose.position.set(0, 1.1, 0.38); nose.scale.set(0.8, 1.2, 0.8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: vicious ? 0xff1a1a : 0x111111, emissive: vicious ? 0xff0000 : 0x000000, emissiveIntensity: vicious ? 2 : 0 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeMat); eyeL.position.set(-0.16, 1.25, 0.34);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.16;
  const earGeo = new THREE.SphereGeometry(0.22, 14, 10);
  const earL = new THREE.Mesh(earGeo, fur); earL.position.set(-0.42, 1.4, 0);
  const earR = earL.clone(); earR.position.x = 0.42;
  const earInL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), light); earInL.position.set(-0.42, 1.4, 0.1);
  const earInR = earInL.clone(); earInR.position.x = 0.42;
  const armGeo = new THREE.CapsuleGeometry(0.12, 0.35, 4, 8);
  const armL = new THREE.Mesh(armGeo, fur); armL.position.set(-0.5, 0.6, 0.15); armL.rotation.z = 0.5;
  const armR = armL.clone(); armR.position.x = 0.5; armR.rotation.z = -0.5;
  const legL = new THREE.Mesh(armGeo, fur); legL.position.set(-0.25, 0.15, 0);
  const legR = legL.clone(); legR.position.x = 0.25;
  g.add(body, head, belly, nose, eyeL, eyeR, earL, earR, earInL, earInR, armL, armR, legL, legR);
  if (vicious) {
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (const x of [-0.1, 0.1]) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), toothMat);
      t.position.set(x, 0.95, 0.36); t.rotation.x = Math.PI; g.add(t);
    }
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(scale);
  g.userData.parts = { armL, armR, head };
  return g;
}

/** Small pickup meshes per item id. Each sits on the ground at y=0. */
export function makeItemMesh(id) {
  const def = ITEMS[id];
  const mat = new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.15 });
  const g = new THREE.Group();
  let m;
  switch (id) {
    case 'flashlight': m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 12), mat); m.rotation.z = Math.PI / 2; break;
    case 'rope': m = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 10, 20), mat); m.rotation.x = Math.PI / 2; break;
    case 'dagger': m = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45, 6), mat); m.rotation.z = Math.PI / 2; break;
    case 'lantern': m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8), mat); break;
    case 'sleepingbag': m = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.5, 4, 10), mat); m.rotation.z = Math.PI / 2; break;
    case 'tent': m = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 4), mat); m.rotation.y = Math.PI / 4; break;
    case 'pistol': m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), mat); break;
    case 'food': m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), mat); break;
    case 'sweatshirt': m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.35), mat); break;
  }
  m.castShadow = true;
  g.add(m);
  g.position.y = 0.25;
  g.userData.itemId = id;
  g.userData.material = mat;
  g.userData.bob = Math.random() * Math.PI * 2;
  return g;
}

export function setHighlight(itemMesh, on) {
  itemMesh.userData.material.emissiveIntensity = on ? 1.2 : 0.15;
}

export function makeTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * scale, 0.4 * scale, 5 * scale, 8), new THREE.MeshStandardMaterial({ color: 0x4e342e }));
  trunk.position.y = 2.5 * scale;
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f5e2d });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry((2.2 - i * 0.4) * scale, 10, 8), leafMat);
    c.position.set((Math.random() - 0.5) * scale, (5 + i * 1.2) * scale, (Math.random() - 0.5) * scale);
    g.add(c);
  }
  trunk.castShadow = true;
  g.add(trunk);
  g.position.set(x, 0, z);
  g.userData.collider = new THREE.Box3(new THREE.Vector3(x - 0.4 * scale, 0, z - 0.4 * scale), new THREE.Vector3(x + 0.4 * scale, 5 * scale, z + 0.4 * scale));
  return g;
}

/** Glowing guide path on the ground along a polyline of {x,z} points. */
export class GuidePath {
  constructor(scene, color = 0x7cf7ff) {
    this.dots = [];
    this.group = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.09, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(geo, mat); d.visible = false; this.group.add(d); this.dots.push(d); }
    scene.add(this.group);
    this.time = 0;
    this.heightAt = () => 0;
  }
  /** points: array of {x,z}; a straight line is just [from, to]. */
  update(dt, points) {
    this.time += dt;
    if (!points || points.length < 2) { this.group.visible = false; return; }
    this.group.visible = true;
    const spacing = 1.0;
    const offset = (this.time * 2) % spacing;
    let seg = 0, segStart = 0, segLen = Math.hypot(points[1].x - points[0].x, points[1].z - points[0].z);
    this.dots.forEach((d, i) => {
      const t = i * spacing + offset;
      while (seg < points.length - 2 && t > segStart + segLen) { segStart += segLen; seg++; segLen = Math.hypot(points[seg + 1].x - points[seg].x, points[seg + 1].z - points[seg].z); }
      if (t > segStart + segLen) { d.visible = false; return; }
      const u = segLen === 0 ? 0 : (t - segStart) / segLen;
      const a = points[seg], b = points[seg + 1];
      d.visible = true;
      d.position.set(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u);
      d.position.y = this.heightAt(d.position.x, d.position.z) + 0.1 + Math.sin(this.time * 4 + i) * 0.03;
    });
  }
  hide() { this.group.visible = false; }
}

export function skyAndLights(scene, { sky = 0x87ceeb, sun = 1.0, ambient = 0.5, fog = null } = {}) {
  scene.background = new THREE.Color(sky);
  if (fog) scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
  const amb = new THREE.AmbientLight(0xffffff, ambient);
  const dir = new THREE.DirectionalLight(0xffffff, sun);
  dir.position.set(30, 50, 20);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  Object.assign(dir.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
  scene.add(amb, dir);
  return { amb, dir };
}
