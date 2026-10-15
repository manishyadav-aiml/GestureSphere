// Canvas overlay: DPR-aware sizing (only when the size really changes) and skeleton drawing.
// Drawing uses CSS-pixel coordinates in the UNMIRRORED video frame; mirroring is done by CSS
// on the video and canvas together, so skeleton, orb and video always stay aligned.
import { HAND_CONNECTIONS } from '../tracking/landmarkUtils.js';

export const PALETTES = [
  { bone: '#ff9a4d', joint: '#fff36a', glow: 'rgba(255,120,40,0.28)' },
  { bone: '#62f0ff', joint: '#ff66e0', glow: 'rgba(40,170,255,0.28)' },
];

export class CanvasRenderer {
  constructor(canvas, stage) {
    this.canvas = canvas; this.stage = stage; this.ctx = canvas.getContext('2d');
    this.w = 0; this.h = 0; this.dpr = 1;
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(stage); this._onDpr = () => this.resize(); window.addEventListener('resize', this._onDpr);
    this.resize();
  }
  resize() {
    const r = this.stage.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  clear() { this.ctx.clearRect(0, 0, this.w, this.h); }

  drawSkeleton(lm, slot, glow) {
    const c = this.ctx, w = this.w, h = this.h, p = PALETTES[slot % PALETTES.length];
    c.save(); c.lineCap = 'round';
    c.beginPath(); for (const [a, b] of HAND_CONNECTIONS) { c.moveTo(lm[a].x * w, lm[a].y * h); c.lineTo(lm[b].x * w, lm[b].y * h); }
    if (glow) { c.strokeStyle = p.glow; c.lineWidth = 8; c.stroke(); }
    c.strokeStyle = p.bone; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = p.joint; c.beginPath();
    for (const q of lm) { c.moveTo(q.x * w + 3.2, q.y * h); c.arc(q.x * w, q.y * h, 3.2, 0, 6.2832); }
    c.fill(); c.restore();
  }
  dispose() { this._ro.disconnect(); window.removeEventListener('resize', this._onDpr); }
}
