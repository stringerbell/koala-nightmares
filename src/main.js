import * as THREE from 'three';
import { Input } from './input.js';
import { Player } from './player.js';
import { Hud } from './hud.js';
import { Audio } from './audio.js';
import { Inventory } from './inventory.js';
import { GameFlow } from './rules.js';
import { ITEMS, ITEM_IDS } from './items.js';
import { drawHousePicture } from './intro.js';
import { HouseScene } from './scenes/house.js';
import { JungleScene } from './scenes/jungle.js';
import { DarkScene } from './scenes/dark.js';
import { ChaseScene } from './scenes/chase.js';
import { ObstacleScene } from './scenes/obstacle.js';
import { FightScene } from './scenes/fight.js';

const SCENES = { house: HouseScene, jungle: JungleScene, dark: DarkScene, chase: ChaseScene, obstacle: ObstacleScene, fight: FightScene };

class Game {
  constructor() {
    const canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
    this.input = new Input(canvas);
    this.player = new Player(this.camera);
    this.hud = new Hud();
    this.audio = new Audio();
    this.inventory = new Inventory();
    this.flow = new GameFlow();
    this.scene = null;
    this.transitioning = false;
    this.clock = new THREE.Clock();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.getElementById('play').onclick = () => this.start();
    this.renderer.setAnimationLoop(() => this.frame());
    // Dev shortcut: ?stage=jungle|dark|chase|obstacle|fight jumps straight in with a full pack.
    const devStage = new URLSearchParams(location.search).get('stage');
    if (devStage && SCENES[devStage]) document.getElementById('play').onclick = () => this.devStart(devStage);
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  groundAt(x, z) { return this.scene ? this.scene.groundHeight(x, z) : 0; }

  async start() {
    this.audio.ensure();
    this.hud.el.title.classList.add('hidden');
    this.flow.next(); // intro
    await this.playIntro();
    await this.loadStage(this.flow.next()); // house
  }

  async devStart(stage) {
    this.audio.ensure();
    this.hud.el.title.classList.add('hidden');
    ITEM_IDS.forEach((id) => this.inventory.place(id, ITEMS[id].defaultSlot));
    while (this.flow.stage !== stage) this.flow.next();
    await this.loadStage(stage);
  }

  async playIntro() {
    const { hud } = this;
    drawHousePicture(hud.el.intro.querySelector('canvas'));
    await hud.fadeOut(1);
    hud.el.intro.classList.remove('hidden');
    await hud.fadeIn(2);
    await new Promise((r) => setTimeout(r, 3500));
    await hud.fadeOut(2.5);
    hud.el.intro.classList.add('hidden');
  }

  async loadStage(stage) {
    this.transitioning = true;
    await this.hud.fadeOut(1.2);
    if (this.scene) this.scene.exit();
    this.hud.timer(null); this.hud.prompt(''); this.hud.subtitle('');
    this.scene = new SCENES[stage](this);
    await this.scene.enter();
    this.input.flush();
    this.renderer.render(this.scene.scene, this.camera);
    await this.hud.fadeIn(1.2);
    this.transitioning = false;
    this.input.lock();
  }

  async nextStage() {
    if (this.transitioning) return;
    const stage = this.flow.next();
    if (stage === 'win') return this.win();
    await this.loadStage(stage);
  }

  async loseFight() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.input.unlock();
    await this.hud.fadeOut(1);
    await this.hud.message('The koala wins.', 'You lose. All three challenges start over from the beginning.', 'Try again');
    this.transitioning = false;
    await this.loadStage(this.flow.loseFight());
  }

  async winFight() {
    if (this.transitioning) return;
    this.flow.next();
    await this.win();
  }

  async win() {
    this.transitioning = true;
    this.input.unlock();
    await this.hud.fadeOut(2);
    if (this.scene) this.scene.exit();
    this.hud.hide();
    await this.hud.message('You escape the koala\'s mind.', 'You wake up at the edge of the forest, shaking. You pack up and go home. You never camp again.', 'Play again');
    location.reload();
  }

  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.scene && !this.transitioning) {
      const paused = !this.input.locked && this.input.enabled;
      // number keys select inventory slots
      for (let n = 1; n <= 9; n++) {
        if (this.input.justPressed(`Digit${n}`)) {
          if (this.inventory.selected === n) this.inventory.selected = 0; else this.inventory.select(n);
          this.hud.renderInventory(this.inventory);
        }
      }
      if (!paused) {
        this.player.update(dt, this.input);
        this.hud.stance(this.player.crouching ? 'CROUCHED' : '');
        this.scene.update(dt);
      } else {
        this.hud.prompt('Click to capture the mouse');
      }
      this.renderer.render(this.scene.scene, this.camera);
    }
    this.input.flush();
  }
}

window.game = new Game();
