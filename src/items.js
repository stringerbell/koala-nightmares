// Item definitions. Slot numbers are the keyboard keys 1-9.
export const ITEMS = {
  flashlight:  { id: 'flashlight',  name: 'Flashlight',  defaultSlot: 1, color: 0xffe066 },
  rope:        { id: 'rope',        name: 'Rope',        defaultSlot: 2, color: 0xc89b5a },
  dagger:      { id: 'dagger',      name: 'Small Dagger',defaultSlot: 3, color: 0xcfd8dc },
  lantern:     { id: 'lantern',     name: 'Lantern',     defaultSlot: 4, color: 0xff9f43 },
  sleepingbag: { id: 'sleepingbag', name: 'Sleeping Bag',defaultSlot: 5, color: 0x4a69bd },
  tent:        { id: 'tent',        name: 'Tent',        defaultSlot: 6, color: 0x2e8b57 },
  pistol:      { id: 'pistol',      name: 'Pistol',      defaultSlot: 7, color: 0x333333 },
  food:        { id: 'food',        name: 'Food',        defaultSlot: 8, color: 0xe55039 },
  sweatshirt:  { id: 'sweatshirt',  name: 'Sweatshirt',  defaultSlot: 9, color: 0x8e44ad },
};

export const ITEM_IDS = Object.keys(ITEMS);
export const SLOT_COUNT = 9;
