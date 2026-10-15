// Wrapper around MediaPipe Hands (legacy "solutions" API: window.Hands, setOptions, onResults, send, close).
// The script is loaded on demand so a CDN failure becomes a readable error instead of a blank page.
export class TrackerError extends Error {
  constructor(code, message) { super(message); this.name = 'TrackerError'; this.code = code; }
}

function loadScript(src, timeoutMs) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-mp="${src}"]`);
    if (existing && typeof window.Hands === 'function') return resolve();
    if (existing) existing.remove();
    const s = document.createElement('script');
    const fail = () => { clearTimeout(to); s.remove(); reject(new TrackerError('SCRIPT_FAILED', 'Could not load the MediaPipe Hands library (network or CDN problem). Check your internet connection, or see "CDN unavailable" in the README.')); };
    const to = setTimeout(fail, timeoutMs);
    s.src = src; s.async = true; s.crossOrigin = 'anonymous'; s.dataset.mp = src;
    s.onload = () => { clearTimeout(to); resolve(); };
    s.onerror = fail;
    document.head.appendChild(s);
  });
}

export class HandTracker {
  constructor(config) { this.config = config; this.hands = null; this.busy = false; this.onResults = null; }

  async init() {
    if (this.hands) return;
    const { mediapipeBaseUrl: base, tracking: t } = this.config;
    await loadScript(`${base}/hands.js`, t.scriptTimeoutMs);
    if (typeof window.Hands !== 'function') throw new TrackerError('SCRIPT_MISSING', 'MediaPipe loaded but did not provide the Hands class. Check the mediapipeBaseUrl setting.');
    try {
      const hands = new window.Hands({ locateFile: (f) => `${base}/${f}` });
      hands.setOptions({ maxNumHands: t.maxHands, modelComplexity: t.modelComplexity, minDetectionConfidence: t.minDetectionConfidence, minTrackingConfidence: t.minTrackingConfidence });
      hands.onResults((r) => { if (this.onResults) this.onResults(r); });
      await hands.initialize();
      this.hands = hands;
    } catch (e) {
      throw new TrackerError('INIT_FAILED', `Hand tracking could not start (${(e && e.message) || 'unknown error'}). The model files may have failed to download.`);
    }
  }

  async send(video) {
    if (!this.hands || this.busy) return;
    this.busy = true;
    try { await this.hands.send({ image: video }); } finally { this.busy = false; }
  }

  close() { if (this.hands) { try { this.hands.close(); } catch (e) { /* ignore */ } this.hands = null; } }
}
