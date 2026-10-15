// All status text in the page. Only writes to the DOM when a value actually changes.
export class StatusPanel {
  constructor(els) { this.els = els; this.cache = new Map(); this._timer = null; }
  _text(key, el, value) { if (this.cache.get(key) !== value) { this.cache.set(key, value); el.textContent = value; } }
  setCamera(text, level = 'idle') {
    this._text('cam', this.els.camera, text);
    if (this.cache.get('lvl') !== level) { this.cache.set('lvl', level); this.els.dot.className = `dot ${level}`; }
  }
  setHands(n) { this._text('hands', this.els.hands, String(n)); }
  setFps(render, tracking) { this._text('fps', this.els.fps, render ? render.toFixed(0) : '—'); this._text('tfps', this.els.trackFps, tracking ? tracking.toFixed(0) : '—'); }
  setHand(slot, gesture, state, charge) {
    const h = this.els.hand[slot];
    this._text(`g${slot}`, h.gesture, gesture); this._text(`s${slot}`, h.state, state);
    const v = Math.round(charge * 100); if (this.cache.get(`c${slot}`) !== v) { this.cache.set(`c${slot}`, v); h.meter.value = v; h.meterText.textContent = `${v}%`; }
  }
  // kind: 'info' | 'loading' | 'warn' | 'error'
  setMessage(text, kind = 'info', autoHideMs = 0) {
    clearTimeout(this._timer); const o = this.els.overlay;
    o.className = `overlay-msg ${kind}`; o.hidden = false; this.els.overlayText.textContent = text;
    this.els.spinner.hidden = kind !== 'loading';
    if (autoHideMs) this._timer = setTimeout(() => this.clearMessage(), autoHideMs);
  }
  clearMessage() { clearTimeout(this._timer); this.els.overlay.hidden = true; }
}
