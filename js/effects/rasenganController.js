// Owns one effect (state machine + particles + smoothed position) per hand slot and draws them.
import { HandEffectState, FX } from './handEffectState.js';
import { ParticleSystem } from './particleSystem.js';
import { drawRasengan } from './energyEffects.js';
import { palmCenter } from '../tracking/landmarkUtils.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Orb position/size from hand geometry, in canvas CSS pixels. "Up" is the wrist->middle-knuckle
// direction, so the orb follows hand rotation. Size scales with hand length (camera distance).
export function computeAnchor(lm, w, h, cfg) {
  const pc = palmCenter(lm); const wx = lm[0].x * w, wy = lm[0].y * h, mx = lm[9].x * w, my = lm[9].y * h;
  const len = Math.hypot(mx - wx, my - wy) || 1; const ux = (mx - wx) / len, uy = (my - wy) / len;
  return { x: pc.x * w + ux * len * cfg.liftFactor, y: pc.y * h + uy * len * cfg.liftFactor, r: clamp(len * cfg.radiusFactor, cfg.minRadius, cfg.maxRadius) };
}

export class RasenganController {
  constructor(effectCfg, particleCfg, videoOrb, slots = 2) {
    this.cfg = effectCfg; this.pcfg = particleCfg; this.video = videoOrb;
    this.slots = Array.from({ length: slots }, () => ({ fx: new HandEffectState(effectCfg), ps: new ParticleSystem(particleCfg.perHand), x: 0, y: 0, r: 0, placed: false }));
  }
  reset() { for (const s of this.slots) { s.fx.reset(); s.ps.clear(); s.placed = false; } }

  // inputs[slot] = null | { gesture, anchor:{x,y,r} }
  update(nowMs, dtMs, inputs) {
    const k = 1 - Math.exp(-this.cfg.positionSmoothing * dtMs / 1000);
    this.slots.forEach((s, i) => {
      const inp = inputs[i] || null;
      s.fx.update(nowMs, dtMs, inp ? inp.gesture : null);
      if (inp) {
        const a = inp.anchor;
        if (!s.placed || s.fx.state === FX.IDLE || s.fx.state === FX.DETECTED) { s.x = a.x; s.y = a.y; s.r = a.r; s.placed = true; }
        else { s.x += (a.x - s.x) * k; s.y += (a.y - s.y) * k; s.r += (a.r - s.r) * k; }
      }
      const st = s.fx.state;
      if (st === FX.IDLE || st === FX.DETECTED) s.ps.clear();
      else { const rate = st === FX.FADING ? 0 : this.pcfg.minRate + (this.pcfg.maxRate - this.pcfg.minRate) * s.fx.charge; s.ps.update(dtMs, rate, st === FX.FADING && s.fx.reason === 'release'); }
    });
  }

  render(ctx, nowMs, { glow, useVideo }) {
    const t = nowMs / 1000;
    for (const s of this.slots) {
      const { fx } = s; if (fx.alpha <= 0.003 && !s.ps.alive) continue;
      const level = fx.charge;
      let drewVideo = false;
      if (useVideo && this.video) drewVideo = this.video.draw(ctx, s.x, s.y, s.r * 4.2 * (0.45 + 0.55 * level) * (1 + fx.release * 0.5), fx.alpha * (1 - fx.release));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (glow) s.ps.draw(ctx, s.x, s.y, s.r * (0.45 + 0.55 * level), fx.alpha);
      ctx.restore();
      if (!drewVideo) drawRasengan(ctx, s.x, s.y, s.r, { level, alpha: fx.alpha, release: fx.release, glow, timeSec: t });
    }
  }

  getStatus() { return this.slots.map((s) => ({ state: s.fx.state, charge: s.fx.charge })); }
}
