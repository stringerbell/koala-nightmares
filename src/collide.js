/**
 * Pushes a circle (x,z,radius) out of any axis-aligned boxes it overlaps,
 * along the shortest axis. Pure so it can be unit tested. Mutates `pos`.
 */
export function pushOutOfBoxes(pos, boxes, radius) {
  let moved = false;
  for (const b of boxes) {
    if (b.max.y <= 0.1) continue; // not a wall-like obstacle
    const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x));
    const cz = Math.max(b.min.z, Math.min(pos.z, b.max.z));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    moved = true;
    if (d2 > 1e-9) { // outside the box: push along the contact normal
      const d = Math.sqrt(d2), k = (radius - d) / d;
      pos.x += dx * k; pos.z += dz * k;
    } else {         // centre is inside the box: exit through the nearest face
      const exits = [
        [b.max.x + radius - pos.x, 0], [b.min.x - radius - pos.x, 0],
        [0, b.max.z + radius - pos.z], [0, b.min.z - radius - pos.z],
      ];
      const [ex, ez] = exits.reduce((a, c) => (Math.hypot(...c) < Math.hypot(...a) ? c : a));
      pos.x += ex; pos.z += ez;
    }
  }
  return moved;
}
