/** Draws the opening picture: a house at dusk with a sign on the door. */
export function drawHousePicture(canvas) {
  const c = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a1430'); sky.addColorStop(0.6, '#5a2f4a'); sky.addColorStop(1, '#c2643a');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) c.fillRect(Math.random() * W, Math.random() * H * 0.5, 2, 2);
  // ground
  c.fillStyle = '#1d2b1a'; c.fillRect(0, H * 0.72, W, H);
  // trees silhouettes
  c.fillStyle = '#101a10';
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * W + 30, h = 120 + Math.random() * 140;
    c.beginPath(); c.moveTo(x - 40, H * 0.74); c.lineTo(x, H * 0.74 - h); c.lineTo(x + 40, H * 0.74); c.fill();
  }
  // house
  const hx = W / 2 - 220, hy = H * 0.36, hw = 440, hh = 300;
  c.fillStyle = '#3b2f2f'; c.fillRect(hx, hy, hw, hh);
  c.fillStyle = '#2a1f1f';
  c.beginPath(); c.moveTo(hx - 40, hy); c.lineTo(hx + hw / 2, hy - 150); c.lineTo(hx + hw + 40, hy); c.fill();
  // windows
  c.fillStyle = '#120c0c';
  [[hx + 40, hy + 60], [hx + hw - 130, hy + 60]].forEach(([x, y]) => { c.fillRect(x, y, 90, 90); c.strokeStyle = '#1a1212'; c.lineWidth = 6; c.strokeRect(x, y, 90, 90); });
  // door
  const dx = hx + hw / 2 - 55, dy = hy + 120, dw = 110, dh = 180;
  c.fillStyle = '#4a2c1a'; c.fillRect(dx, dy, dw, dh);
  c.fillStyle = '#d4af37'; c.beginPath(); c.arc(dx + dw - 18, dy + dh / 2, 6, 0, Math.PI * 2); c.fill();
  // sign
  c.save();
  c.translate(dx + dw / 2, dy + 60); c.rotate(-0.04);
  c.fillStyle = '#f1e7c6'; c.fillRect(-46, -30, 92, 60);
  c.strokeStyle = '#7a6a40'; c.lineWidth = 2; c.strokeRect(-46, -30, 92, 60);
  c.fillStyle = '#222'; c.font = 'bold 11px Georgia'; c.textAlign = 'center';
  c.fillText('OUT OF TOWN', 0, -8); c.fillText('FOR THE', 0, 6); c.fillText('WEEKEND', 0, 20);
  c.restore();
  // caption
  c.fillStyle = 'rgba(255,255,255,.85)'; c.font = 'italic 28px Georgia'; c.textAlign = 'center';
  c.fillText('"Out of town for the weekend"', W / 2, H - 40);
}
