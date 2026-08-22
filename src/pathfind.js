/**
 * Tiny grid BFS pathfinder. Pure logic so it can be unit tested.
 * `blocked(x, z)` answers whether the world point is walkable.
 */
export class GridPath {
  constructor({ minX, maxX, minZ, maxZ, cell = 0.5, blocked }) {
    this.minX = minX; this.minZ = minZ; this.cell = cell;
    this.w = Math.ceil((maxX - minX) / cell) + 1;
    this.h = Math.ceil((maxZ - minZ) / cell) + 1;
    this.grid = new Uint8Array(this.w * this.h);
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      this.grid[j * this.w + i] = blocked(minX + i * cell, minZ + j * cell) ? 1 : 0;
    }
  }
  toCell(x, z) {
    return [Math.round((x - this.minX) / this.cell), Math.round((z - this.minZ) / this.cell)];
  }
  toWorld(i, j) { return { x: this.minX + i * this.cell, z: this.minZ + j * this.cell }; }
  inside(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }
  free(i, j) { return this.inside(i, j) && this.grid[j * this.w + i] === 0; }

  /** Nearest free cell to (i,j), searching outward. */
  nearestFree(i, j) {
    for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      if (this.free(i + di, j + dj)) return [i + di, j + dj];
    }
    return null;
  }

  /** Returns a list of world points from (fx,fz) to (tx,tz), or null if unreachable. */
  find(fx, fz, tx, tz) {
    const s = this.nearestFree(...this.toCell(fx, fz));
    const g = this.nearestFree(...this.toCell(tx, tz));
    if (!s || !g) return null;
    const key = (i, j) => j * this.w + i;
    const prev = new Int32Array(this.w * this.h).fill(-1);
    const queue = [s]; prev[key(...s)] = key(...s);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let found = false;
    for (let qi = 0; qi < queue.length && !found; qi++) {
      const [i, j] = queue[qi];
      for (const [di, dj] of dirs) {
        const ni = i + di, nj = j + dj;
        if (!this.free(ni, nj) || prev[key(ni, nj)] !== -1) continue;
        if (di && dj && !(this.free(i + di, j) && this.free(i, j + dj))) continue; // no corner cutting
        prev[key(ni, nj)] = key(i, j);
        if (ni === g[0] && nj === g[1]) { found = true; break; }
        queue.push([ni, nj]);
      }
    }
    if (!found && !(s[0] === g[0] && s[1] === g[1])) return null;
    const path = [];
    let k = key(...g);
    while (true) {
      path.push(this.toWorld(k % this.w, Math.floor(k / this.w)));
      if (prev[k] === k) break;
      k = prev[k];
    }
    path.reverse();
    path[0] = { x: fx, z: fz }; path[path.length - 1] = { x: tx, z: tz };
    return path;
  }
}

/** Builds a `blocked` function from axis-aligned boxes ({min:{x,z}, max:{x,z}}) padded by radius. */
export function boxBlocker(boxes, radius = 0.45, maxY = 1.2) {
  return (x, z) => boxes.some((b) => b.min.y < maxY && b.max.y > 0.35 && x > b.min.x - radius && x < b.max.x + radius && z > b.min.z - radius && z < b.max.z + radius);
}
