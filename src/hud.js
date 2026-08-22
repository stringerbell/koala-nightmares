import { ITEMS, SLOT_COUNT } from './items.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'), objective: $('objective'), timer: $('timer'), prompt: $('prompt'), subtitle: $('subtitle'),
      inventory: $('inventory'), help: $('controls-help'), bars: $('bars'), hpPlayer: $('hp-player'), hpKoala: $('hp-koala'),
      ammo: $('ammo'), picker: $('slot-picker'), pickerItem: $('picker-item'), pickerSlots: $('picker-slots'),
      message: $('message'), messageTitle: $('message-title'), messageBody: $('message-body'), messageButton: $('message-button'),
      fade: $('fade'), title: $('title'), intro: $('intro'),
    };
  }
  show() { this.el.hud.classList.remove('hidden'); }
  hide() { this.el.hud.classList.add('hidden'); }
  objective(t) { this.el.objective.textContent = t; }
  timer(seconds) { this.el.timer.textContent = seconds === null ? '' : Math.ceil(seconds).toString(); }
  prompt(t) { this.el.prompt.textContent = t || ''; }
  subtitle(t) { this.el.subtitle.textContent = t || ''; }
  help(t) { this.el.help.textContent = t || ''; }
  bars(show, player = 1, koala = 1, ammo = null) {
    this.el.bars.classList.toggle('hidden', !show);
    this.el.hpPlayer.style.width = `${player * 100}%`;
    this.el.hpKoala.style.width = `${koala * 100}%`;
    this.el.ammo.textContent = ammo === null ? '' : `Ammo: ${ammo}`;
  }

  renderInventory(inv) {
    this.el.inventory.innerHTML = '';
    for (let s = 1; s <= SLOT_COUNT; s++) {
      const id = inv.get(s);
      const d = document.createElement('div');
      d.className = 'slot' + (inv.selected === s ? ' selected' : '');
      d.innerHTML = `<b>${s}</b>${id ? ITEMS[id].name : ''}${id ? `<span class="swatch" style="background:#${ITEMS[id].color.toString(16).padStart(6, '0')}"></span>` : ''}`;
      this.el.inventory.appendChild(d);
    }
  }

  /** Opens the slot picker for itemId. Resolves with a slot number or null. */
  pickSlot(itemId, inv) {
    return new Promise((resolve) => {
      this.el.pickerItem.textContent = ITEMS[itemId].name;
      this.el.pickerSlots.innerHTML = '';
      const done = (slot) => { window.removeEventListener('keydown', onKey); this.el.picker.classList.add('hidden'); resolve(slot); };
      for (let s = 1; s <= SLOT_COUNT; s++) {
        const id = inv.get(s);
        const d = document.createElement('div');
        d.className = 'slot';
        d.innerHTML = `<b>${s}</b>${id ? ITEMS[id].name : '<span class="dim">empty</span>'}`;
        d.onclick = () => done(s);
        this.el.pickerSlots.appendChild(d);
      }
      const onKey = (e) => {
        if (e.code === 'Escape') done(null);
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= SLOT_COUNT) done(n);
      };
      window.addEventListener('keydown', onKey);
      this.el.picker.classList.remove('hidden');
    });
  }

  message(title, body, button = 'Continue') {
    return new Promise((resolve) => {
      this.el.messageTitle.textContent = title;
      this.el.messageBody.textContent = body;
      this.el.messageButton.textContent = button;
      this.el.message.classList.remove('hidden');
      this.el.messageButton.onclick = () => { this.el.message.classList.add('hidden'); resolve(); };
    });
  }

  fadeOut(seconds = 1.5) { return this.fadeTo(true, seconds); }
  fadeIn(seconds = 1.5) { return this.fadeTo(false, seconds); }
  fadeTo(dark, seconds) {
    const f = this.el.fade;
    f.style.transitionDuration = `${seconds}s`;
    f.classList.toggle('show', dark);
    f.classList.toggle('clear', !dark);
    return new Promise((r) => setTimeout(r, seconds * 1000));
  }
}
