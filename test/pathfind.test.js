import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GridPath, boxBlocker } from '../src/pathfind.js';

const box = (x0, z0, x1, z1, y0 = 0, y1 = 3) => ({ min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } });

test('straight path in an empty room', () => {
  const g = new GridPath({ minX: -5, maxX: 5, minZ: -5, maxZ: 5, blocked: () => false });
  const p = g.find(-4, 0, 4, 0);
  assert.ok(p.length > 2);
  assert.deepEqual(p[0], { x: -4, z: 0 });
  assert.deepEqual(p.at(-1), { x: 4, z: 0 });
});

test('routes around a wall through the doorway', () => {
  // wall at x=0 spanning z -5..2, doorway z 2..5
  const blocked = boxBlocker([box(-0.15, -5, 0.15, 2)]);
  const g = new GridPath({ minX: -5, maxX: 5, minZ: -5, maxZ: 5, blocked });
  const p = g.find(-4, -4, 4, -4);
  assert.ok(p, 'path exists');
  const crossing = p.find((pt) => Math.abs(pt.x) < 0.3);
  assert.ok(crossing.z > 2, `crosses through the doorway, got z=${crossing.z}`);
});

test('returns null when the target is sealed off', () => {
  const blocked = boxBlocker([box(-0.15, -5, 0.15, 5)]);
  const g = new GridPath({ minX: -5, maxX: 5, minZ: -5, maxZ: 5, blocked });
  assert.equal(g.find(-4, 0, 4, 0), null);
});

test('low furniture (below step height) and high shelves do not block', () => {
  const blocked = boxBlocker([box(-1, -5, 1, 5, 0, 0.3), box(-1, -5, 1, 5, 1.5, 3)]);
  const g = new GridPath({ minX: -5, maxX: 5, minZ: -5, maxZ: 5, blocked });
  assert.ok(g.find(-4, 0, 4, 0));
});
