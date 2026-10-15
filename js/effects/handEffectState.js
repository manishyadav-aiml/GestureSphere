// Pure per-hand effect state machine (no canvas, no DOM) so it can be unit-tested.
//
//  IDLE --hand appears--> DETECTED --OPEN_PALM--> CHARGING --charge>=1--> ACTIVE
//  CHARGING/ACTIVE --CLOSED_FIST--> FADING(release) --done--> DETECTED (IDLE if hand gone)
//  CHARGING/ACTIVE --hand lost longer than lostGraceMs--> FADING(lost) --done--> IDLE
//  PARTIALLY_OPEN / UNKNOWN while CHARGING/ACTIVE: neutral (charge is held, nothing jumps)
//  After a release, charging cannot restart for releaseCooldownMs (stops noisy re-triggering).
import { GESTURE } from '../gestures/gestureRecognizer.js';

export const FX = Object.freeze({ IDLE: 'IDLE', DETECTED: 'DETECTED', CHARGING: 'CHARGING', ACTIVE: 'ACTIVE', FADING: 'FADING' });
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class HandEffectState {
  constructor(cfg) { this.cfg = cfg; this.reset(); }
  reset() {
    this.state = FX.IDLE; this.charge = 0; this.alpha = 0; this.release = 0; this.reason = '';
    this.fadeElapsed = 0; this.fadeDuration = 1; this.lastSeen = -Infinity; this.cooldownUntil = -Infinity;
  }
  _fade(reason, ms) { this.state = FX.FADING; this.reason = reason; this.fadeElapsed = 0; this.fadeDuration = Math.max(1, ms); }

  // gesture === null means "this hand is not currently tracked".
  update(nowMs, dtMs, gesture) {
    const c = this.cfg; const present = gesture !== null && gesture !== undefined;
    if (present) this.lastSeen = nowMs;
    if (this.state === FX.FADING) {
      this.fadeElapsed += dtMs;
      const p = clamp01(this.fadeElapsed / this.fadeDuration);
      this.alpha = 1 - p; this.release = this.reason === 'release' ? p : 0;
      if (p >= 1) { this.charge = 0; this.alpha = 0; this.release = 0; this.reason = ''; this.state = present ? FX.DETECTED : FX.IDLE; }
      return this.state;
    }
    if (!present) {
      if (this.state === FX.DETECTED) this.state = FX.IDLE;
      else if ((this.state === FX.CHARGING || this.state === FX.ACTIVE) && nowMs - this.lastSeen > c.lostGraceMs) this._fade('lost', c.lostFadeMs);
      return this.state;
    }
    if (this.state === FX.IDLE) this.state = FX.DETECTED;
    if (this.state === FX.DETECTED && gesture === GESTURE.OPEN_PALM && nowMs >= this.cooldownUntil) this.state = FX.CHARGING;
    if (this.state === FX.CHARGING || this.state === FX.ACTIVE) {
      if (gesture === GESTURE.CLOSED_FIST) { this._fade('release', c.releaseMs); this.cooldownUntil = nowMs + c.releaseCooldownMs; return this.state; }
      if (this.state === FX.CHARGING && gesture === GESTURE.OPEN_PALM) {
        this.charge = clamp01(this.charge + dtMs / Math.max(1, c.chargeMs));
        if (this.charge >= 1) this.state = FX.ACTIVE;
      }
      this.alpha = clamp01(this.alpha + dtMs / Math.max(1, c.appearMs));
    }
    return this.state;
  }
}
