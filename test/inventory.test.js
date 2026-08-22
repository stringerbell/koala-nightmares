import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../src/inventory.js';
import { ITEM_IDS } from '../src/items.js';

test('starts empty with nothing selected', () => {
  const inv = new Inventory();
  assert.equal(inv.count(), 0);
  assert.equal(inv.selectedItem(), null);
  assert.equal(inv.hasAllItems(), false);
});

test('places item into chosen slot', () => {
  const inv = new Inventory();
  const r = inv.place('flashlight', 4);
  assert.deepEqual(r, { ok: true, swappedOut: null });
  assert.equal(inv.get(4), 'flashlight');
  assert.equal(inv.slotOf('flashlight'), 4);
});

test('placing into occupied slot swaps the old item out', () => {
  const inv = new Inventory();
  inv.place('flashlight', 1);
  const r = inv.place('rope', 1);
  assert.deepEqual(r, { ok: true, swappedOut: 'flashlight' });
  assert.equal(inv.get(1), 'rope');
  assert.equal(inv.has('flashlight'), false);
});

test('rejects duplicate items and bad slots', () => {
  const inv = new Inventory();
  inv.place('dagger', 3);
  assert.equal(inv.place('dagger', 5).ok, false);
  assert.equal(inv.place('rope', 0).ok, false);
  assert.equal(inv.place('rope', 10).ok, false);
  assert.throws(() => inv.place('banana', 1));
});

test('select only works on filled slots', () => {
  const inv = new Inventory();
  assert.equal(inv.select(2), null);
  assert.equal(inv.selected, 0);
  inv.place('pistol', 7);
  assert.equal(inv.select(7), 'pistol');
  assert.equal(inv.selectedItem(), 'pistol');
});

test('removing the selected item clears selection', () => {
  const inv = new Inventory();
  inv.place('food', 8);
  inv.select(8);
  assert.equal(inv.remove('food'), true);
  assert.equal(inv.selected, 0);
  assert.equal(inv.remove('food'), false);
});

test('hasAllItems once every item is collected in any slots', () => {
  const inv = new Inventory();
  ITEM_IDS.forEach((id, i) => inv.place(id, 9 - i));
  assert.equal(inv.isFull(), true);
  assert.equal(inv.hasAllItems(), true);
});
