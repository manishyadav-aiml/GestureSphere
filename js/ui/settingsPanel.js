// Holds user-adjustable settings and keeps them in sync with the checkboxes / slider.
export class SettingsPanel {
  constructor(els) {
    this.els = els; this.listeners = []; this._handlers = [];
    this.values = { skeleton: els.skeleton.checked, glow: els.glow.checked, mirror: els.mirror.checked, video: els.video.checked, sensitivity: Number(els.sensitivity.value) / 100 };
    for (const key of ['skeleton', 'glow', 'mirror', 'video']) this._listen(els[key], 'change', () => this.set(key, els[key].checked));
    this._listen(els.sensitivity, 'input', () => this.set('sensitivity', Number(els.sensitivity.value) / 100));
    this._showSensitivity();
  }
  _listen(el, ev, fn) { el.addEventListener(ev, fn); this._handlers.push([el, ev, fn]); }
  _showSensitivity() { this.els.sensitivityValue.textContent = `${Math.round(this.values.sensitivity * 100)}%`; }
  set(key, value) {
    if (this.values[key] === value) return;
    this.values[key] = value;
    if (key === 'sensitivity') this._showSensitivity(); else this.els[key].checked = value;
    this.listeners.forEach((fn) => fn(key, value));
  }
  onChange(fn) { this.listeners.push(fn); }
  dispose() { this._handlers.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn)); this._handlers = []; this.listeners = []; }
}
