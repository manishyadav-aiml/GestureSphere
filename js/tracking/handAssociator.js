// Gives each detected hand a stable "slot" (0 or 1) across frames so every hand keeps its own
// effect. MediaPipe's output order can change between frames, so index is NOT used as identity.
// Strategy: greedy nearest-neighbour matching of palm centres to recently seen tracks, with a
// small distance bonus when the (unreliable) handedness label agrees. Limitations are listed in
// docs/architecture.md (hands that cross or overlap quickly can swap slots).
import { dist } from './landmarkUtils.js';

export class HandAssociator {
  constructor({ maxHands = 2, maxJump = 0.45, matchTimeoutMs = 700, labelBonus = 0.75 } = {}) {
    this.maxHands = maxHands; this.maxJump = maxJump; this.matchTimeoutMs = matchTimeoutMs; this.labelBonus = labelBonus;
    this.reset();
  }
  reset() { this.tracks = Array.from({ length: this.maxHands }, () => ({ center: null, label: null, lastSeen: -Infinity })); }

  // detections: [{center:{x,y}, label}] -> array of slot numbers (same order), -1 = no slot available.
  associate(detections, nowMs, aspect = 1) {
    const out = new Array(detections.length).fill(-1);
    const used = new Set();
    const alive = (t) => t.center && nowMs - t.lastSeen <= this.matchTimeoutMs;
    const pairs = [];
    detections.forEach((d, di) => this.tracks.forEach((t, ti) => {
      if (!alive(t)) return;
      let c = dist(d.center, t.center, aspect);
      if (d.label && d.label === t.label) c *= this.labelBonus;
      pairs.push({ di, ti, c });
    }));
    pairs.sort((a, b) => a.c - b.c);
    for (const p of pairs) if (out[p.di] < 0 && !used.has(p.ti) && p.c <= this.maxJump) { out[p.di] = p.ti; used.add(p.ti); }
    detections.forEach((d, di) => {
      if (out[di] >= 0) return;
      let slot = this.tracks.findIndex((t, ti) => !used.has(ti) && !alive(t));
      if (slot < 0) { // every free slot is still "alive": take the nearest unused one
        let best = Infinity;
        this.tracks.forEach((t, ti) => { if (!used.has(ti)) { const c = dist(d.center, t.center, aspect); if (c < best) { best = c; slot = ti; } } });
      }
      if (slot >= 0) { out[di] = slot; used.add(slot); }
    });
    out.forEach((slot, di) => { if (slot >= 0) Object.assign(this.tracks[slot], { center: detections[di].center, label: detections[di].label || null, lastSeen: nowMs }); });
    return out;
  }
}
