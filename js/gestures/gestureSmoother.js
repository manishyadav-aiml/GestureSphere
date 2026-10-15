// Time-based debouncing of gesture labels. A new label must be seen continuously for
// `holdMs` before it becomes the stable gesture (UNKNOWN needs the longer `unknownHoldMs`,
// so brief tracking noise does not cause visible changes).
import { GESTURE } from './gestureRecognizer.js';

const VALID = new Set(Object.values(GESTURE));
const num = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);

export class GestureSmoother {
  constructor({ holdMs = 120, unknownHoldMs = 300 } = {}) {
    this.holdMs = num(holdMs, 120);
    this.unknownHoldMs = num(unknownHoldMs, 300);
    this.reset();
  }
  reset() { this.stable = GESTURE.UNKNOWN; this.candidate = null; this.since = 0; }
  update(raw, nowMs) {
    const g = VALID.has(raw) ? raw : GESTURE.UNKNOWN;
    if (g === this.stable) { this.candidate = null; return this.stable; }
    if (g !== this.candidate) { this.candidate = g; this.since = nowMs; }
    const need = g === GESTURE.UNKNOWN ? this.unknownHoldMs : this.holdMs;
    if (nowMs - this.since >= need) { this.stable = g; this.candidate = null; }
    return this.stable;
  }
}
