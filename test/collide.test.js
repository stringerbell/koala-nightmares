import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushOutOfBoxes } from '../src/collide.js';

const pillar = { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 5, z: 1 } };

test('circle overlapping a pillar side is pushed out to the surface', () => {
  const pos = { x: 1.5, y: 0, z: 0 };
  assert.equal(pushOutOfBoxes(pos, [pillar], 1), true);
  assert.ok(Math.abs(pos.x - 2) < 1e-9);
  assert.equal(pos.z, 0);
});

test('circle whose centre is inside the pillar exits through the nearest face', () => {
  const pos = { x: 0.8, y: 0, z: 0.1 };
  pushOutOfBoxes(pos, [pillar], 0.5);
  assert.ok(pos.x >= 1.5 - 1e-9);
});

test('no overlap leaves position untouched; flat floor boxes are ignored', () => {
  const pos = { x: 5, y: 0, z: 5 };
  assert.equal(pushOutOfBoxes(pos, [pillar], 1), false);
  const floor = { min: { x: -50, y: -1, z: -50 }, max: { x: 50, y: 0, z: 50 } };
  assert.equal(pushOutOfBoxes(pos, [floor], 1), false);
  assert.deepEqual(pos, { x: 5, y: 0, z: 5 });
});
