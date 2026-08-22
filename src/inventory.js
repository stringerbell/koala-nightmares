import { SLOT_COUNT, ITEMS } from './items.js';

/**
 * Nine-slot inventory. Pure logic, no DOM / Three.js, so it can be unit tested.
 * Slots are 1-based to match the keyboard keys.
 */
export class Inventory {
  constructor() {
    this.slots = new Array(SLOT_COUNT + 1).fill(null); // index 0 unused
    this.selected = 0; // 0 = nothing selected
  }

  get(slot) {
    return this.slots[slot] ?? null;
  }

  has(itemId) {
    return this.slots.includes(itemId);
  }

  slotOf(itemId) {
    const i = this.slots.indexOf(itemId);
    return i === -1 ? null : i;
  }

  count() {
    return this.slots.filter(Boolean).length;
  }

  isFull() {
    return this.count() === SLOT_COUNT;
  }

  /**
   * Put itemId into slot. If the slot is occupied, the previous item is
   * returned so the caller can drop it back into the world (swap).
   * Returns { ok, swappedOut }.
   */
  place(itemId, slot) {
    if (!ITEMS[itemId]) throw new Error(`unknown item ${itemId}`);
    if (slot < 1 || slot > SLOT_COUNT) return { ok: false, swappedOut: null };
    if (this.has(itemId)) return { ok: false, swappedOut: null };
    const swappedOut = this.slots[slot];
    this.slots[slot] = itemId;
    return { ok: true, swappedOut };
  }

  remove(itemId) {
    const i = this.slotOf(itemId);
    if (i === null) return false;
    this.slots[i] = null;
    if (this.selected === i) this.selected = 0;
    return true;
  }

  select(slot) {
    if (slot < 1 || slot > SLOT_COUNT) { this.selected = 0; return null; }
    if (!this.slots[slot]) { this.selected = 0; return null; }
    this.selected = slot;
    return this.slots[slot];
  }

  selectedItem() {
    return this.selected ? this.slots[this.selected] : null;
  }

  hasAllItems() {
    return Object.keys(ITEMS).every((id) => this.has(id));
  }

  snapshot() {
    return this.slots.slice(1);
  }
}
