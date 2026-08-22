import * as THREE from 'three';
import { BaseScene } from './base.js';

const LINE = "You must complete three challenges to get out of the Koala's mind.";

/** Black void after the attack. Walk a bit, hear the voice, then into the challenges. */
export class DarkScene extends BaseScene {
  constructor(game) {
    super(game);
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 1, 9);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x0a0a0c }));
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);
    this.scene.add(new THREE.AmbientLight(0x223, 0.3));
    this.light = new THREE.PointLight(0x334, 2, 6); this.scene.add(this.light);
    this.walked = 0;
    this.spoke = false;
  }
  async enter() {
    const { player, hud } = this.game;
    this.applyToPlayer();
    player.spawn(0, 0, 0);
    hud.show(); hud.help(''); hud.objective(''); hud.prompt('');
    hud.subtitle('...');
    hud.renderInventory(this.game.inventory);
  }
  update(dt) {
    super.update(dt);
    const { player, hud, audio } = this.game;
    this.light.position.copy(player.camera.position);
    this.walked += player.lastMoveDist;
    if (!this.spoke && (this.walked > 6 || this.time > 8)) {
      this.spoke = true;
      hud.subtitle(LINE);
      audio.voice('assets/vicious_koala.mp3', LINE).then(() => { hud.subtitle(''); this.game.nextStage(); });
    }
  }
}
