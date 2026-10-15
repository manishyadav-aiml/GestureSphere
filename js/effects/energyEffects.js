// Procedural Rasengan drawing (Canvas 2D). Glow and core are pre-rendered once to small sprites,
// so each frame only draws images, a few ellipses and four short spiral polylines.
let sprites = null;
function makeSprite(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = size / 2; const grad = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad; g.fillRect(0, 0, size, size); return c;
}
function getSprites() {
  if (!sprites) sprites = {
    glow: makeSprite(256, [[0, 'rgba(120,230,255,0.85)'], [0.35, 'rgba(40,150,255,0.45)'], [0.7, 'rgba(20,70,220,0.14)'], [1, 'rgba(0,0,0,0)']]),
    core: makeSprite(256, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(210,250,255,0.95)'], [0.6, 'rgba(70,190,255,0.7)'], [0.85, 'rgba(20,100,255,0.35)'], [1, 'rgba(0,0,0,0)']]),
  };
  return sprites;
}
const TAU = Math.PI * 2;

// level: 0..1 charge, alpha: 0..1 overall opacity, release: 0..1 progress of the release burst.
export function drawRasengan(ctx, x, y, R, { level, alpha, release, glow, timeSec }) {
  if (alpha <= 0.003 || R <= 1) return;
  const sp = getSprites();
  const size = R * (0.45 + 0.55 * level) * (1 + 0.04 * Math.sin(timeSec * 9) * (0.4 + level)) * (1 + release * 0.5);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (glow) { ctx.globalAlpha = alpha * (0.35 + 0.65 * level) * (1 - release); ctx.drawImage(sp.glow, x - size * 2.3, y - size * 2.3, size * 4.6, size * 4.6); }
  ctx.globalAlpha = alpha * (1 - release * 0.6);
  // rings: more of them appear as the charge increases
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const vis = Math.min(1, Math.max(0, level * 3 - i * 0.6)); if (vis <= 0) continue;
    ctx.globalAlpha = alpha * vis * 0.75 * (1 - release);
    ctx.strokeStyle = i === 1 ? '#ffffff' : '#7de9ff'; ctx.lineWidth = Math.max(1, size * (0.035 - i * 0.008));
    ctx.beginPath(); ctx.ellipse(x, y, size * (1.0 + i * 0.16), size * (0.42 + i * 0.12), timeSec * (1.6 + i * 0.9) * (i % 2 ? -1 : 1) + i * 1.1, 0, TAU); ctx.stroke();
  }
  // spiral arms
  ctx.globalAlpha = alpha * (0.35 + 0.55 * level) * (1 - release); ctx.strokeStyle = '#d6fbff'; ctx.lineWidth = Math.max(1, size * 0.03);
  for (let arm = 0; arm < 4; arm++) {
    const base = timeSec * 4.5 + arm * (TAU / 4); ctx.beginPath();
    for (let s = 0; s <= 22; s++) { const k = s / 22, a = base + k * 4.2, r = size * (0.12 + 0.88 * k); if (s) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.stroke();
  }
  // bright core
  ctx.globalAlpha = alpha * (1 - release * 0.8); const cs = size * (0.95 + 0.1 * Math.sin(timeSec * 13));
  ctx.drawImage(sp.core, x - cs, y - cs, cs * 2, cs * 2);
  // release shockwave
  if (release > 0) {
    ctx.globalAlpha = alpha * (1 - release) * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, size * 0.08 * (1 - release));
    ctx.beginPath(); ctx.arc(x, y, size * (1 + release * 2.6), 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
