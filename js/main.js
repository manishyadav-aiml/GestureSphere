// Application entry point: wires camera -> tracker -> association -> gestures -> effects -> renderer -> UI.
import { CONFIG, CONFIG_WARNINGS } from './config.js';
import { CameraManager } from './camera/cameraManager.js';
import { HandTracker } from './tracking/handTracker.js';
import { HandAssociator } from './tracking/handAssociator.js';
import { isValidLandmarks, palmCenter } from './tracking/landmarkUtils.js';
import { classifyGesture, sensitivityToThresholds, GESTURE } from './gestures/gestureRecognizer.js';
import { GestureSmoother } from './gestures/gestureSmoother.js';
import { RasenganController, computeAnchor } from './effects/rasenganController.js';
import { VideoOrb } from './effects/videoOrb.js';
import { CanvasRenderer } from './rendering/canvasRenderer.js';
import { SettingsPanel } from './ui/settingsPanel.js';
import { StatusPanel } from './ui/statusPanel.js';
import { setupControls } from './ui/controls.js';

const GESTURE_LABEL = { OPEN_PALM: 'Open palm', CLOSED_FIST: 'Closed fist', PARTIALLY_OPEN: 'Partly open', UNKNOWN: 'Unknown' };

export class App {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.video = $('cam'); this.stage = $('stage'); this.state = 'stopped'; this.token = 0; this.rafId = 0;
    this.settings = new SettingsPanel({ skeleton: $('optSkeleton'), glow: $('optGlow'), mirror: $('optMirror'), video: $('optVideo'), sensitivity: $('optSensitivity'), sensitivityValue: $('sensitivityValue') });
    this.status = new StatusPanel({
      camera: $('statusCamera'), dot: $('statusDot'), hands: $('statusHands'), fps: $('statusFps'), trackFps: $('statusTrackFps'),
      overlay: $('overlayMsg'), overlayText: $('overlayText'), spinner: $('spinner'),
      hand: [0, 1].map((i) => ({ gesture: $(`hand${i}Gesture`), state: $(`hand${i}State`), meter: $(`hand${i}Meter`), meterText: $(`hand${i}MeterText`) })),
    });
    this.camera = new CameraManager(this.video);
    this.tracker = new HandTracker(CONFIG);
    this.renderer = new CanvasRenderer($('overlay'), this.stage);
    this.videoOrb = new VideoOrb(CONFIG.video);
    this.controller = new RasenganController(CONFIG.effect, CONFIG.particles, this.videoOrb, CONFIG.tracking.maxHands);
    this.assoc = new HandAssociator({ maxHands: CONFIG.tracking.maxHands, ...CONFIG.association });
    this.smoothers = Array.from({ length: CONFIG.tracking.maxHands }, () => new GestureSmoother(CONFIG.gesture));
    this.latest = { time: -Infinity, hands: [] };
    this.errors = 0; this.lastVideoTime = -1; this.frames = 0; this.trackFrames = 0; this.fpsAt = 0; this.lastStatusAt = 0; this.renderFps = 0; this.trackFps = 0;

    this.tracker.onResults = (r) => this._onResults(r);
    this.camera.onEnded = () => this._fail('The camera was disconnected or stopped unexpectedly. Press Start to try again.');
    this.settings.onChange((k, v) => this._onSetting(k, v));
    this.controls = setupControls({ els: { start: $('btnStart'), stop: $('btnStop'), reset: $('btnReset'), fullscreen: $('btnFullscreen') }, app: this, stageWrap: $('stageWrap') });
    this._applyMirror();
    this._onPageHide = () => this.destroy(); window.addEventListener('pagehide', this._onPageHide);
    this._loop = this._loop.bind(this);

    this.controls.sync('stopped'); this.status.setCamera('Camera off', 'idle'); this._renderStatus(performance.now());
    if (CONFIG_WARNINGS.length) { console.warn('[Rasengan AR] config warnings:', CONFIG_WARNINGS); this.notify(`Configuration problem: ${CONFIG_WARNINGS[0]}`, 'warn'); }
    else this.status.setMessage('Press "Start Camera", then show an open palm.', 'info');
    if (!CameraManager.isSupported()) this._fail('This browser does not support webcam access. Use Google Chrome and open http://localhost:8000.');
  }

  notify(text, kind = 'info') { this.status.setMessage(text, kind, kind === 'error' ? 0 : 6000); }

  _applyMirror() { this.stage.classList.toggle('mirrored', this.settings.values.mirror); }
  async _onSetting(key, value) {
    if (key === 'mirror') this._applyMirror();
    if (key !== 'video') return;
    if (!value) { this.videoOrb.pause(); return; }
    this.notify('Looking for assets/rasengan.mp4 …', 'info');
    const ok = this.videoOrb.ready || (await this.videoOrb.check());
    if (!ok || !(await this.videoOrb.play())) { this.settings.set('video', false); this.notify('Video mode unavailable: assets/rasengan.mp4 is missing or cannot play. Using the procedural effect.', 'warn'); }
    else this.status.clearMessage();
  }

  async start() {
    if (this.state !== 'stopped') return;
    this.state = 'starting'; const token = ++this.token; this.controls.sync(this.state);
    const cancelled = () => token !== this.token;
    try {
      this.status.setCamera('Requesting camera…', 'loading'); this.status.setMessage('Waiting for camera permission…', 'loading');
      await this.camera.start(CONFIG.camera); if (cancelled()) return this._finishCancel();
      const { width, height } = this.camera.size; this.stage.style.setProperty('--ar', String(width / height || 16 / 9));
      this.status.setCamera('Loading hand tracking…', 'loading'); this.status.setMessage('Loading hand tracking model (first time can take a few seconds)…', 'loading');
      await this.tracker.init(); if (cancelled()) return this._finishCancel();
      this.state = 'running'; this.errors = 0; this.lastVideoTime = -1; this.frames = this.trackFrames = 0; this.fpsAt = this.lastTs = performance.now();
      this.controls.sync(this.state); this.status.setCamera('Camera on', 'ok'); this.status.setMessage('Show an open palm to charge the Rasengan. Close your fist to release it.', 'info', 5000);
      this.rafId = requestAnimationFrame(this._loop);
    } catch (e) {
      if (cancelled()) return this._finishCancel();
      this._fail(e && e.message ? e.message : 'Something went wrong while starting.');
    }
  }

  // Stop pressed while still starting: wait for the pending camera/model step, then release everything.
  _finishCancel() { this.camera.stop(); this.state = 'stopped'; this._halt(); this.status.setMessage('Start cancelled.', 'info', 4000); }

  stop(silent = false) {
    if (this.state === 'starting' && !silent) { this.token++; this.status.setMessage('Cancelling…', 'loading'); return; }
    this.token++; this.camera.stop(); this.state = 'stopped'; this._halt();
    if (!silent) this.status.setMessage('Camera stopped. Press "Start Camera" to begin again.', 'info');
  }

  _halt() {
    cancelAnimationFrame(this.rafId); this.rafId = 0;
    this.reset(); this.renderer.clear(); this.controls.sync(this.state);
    this.status.setFps(0, 0); this.status.setCamera('Camera off', 'idle');
  }

  reset() {
    this.controller.reset(); this.assoc.reset(); this.smoothers.forEach((s) => s.reset()); this.latest = { time: -Infinity, hands: [] };
    this._renderStatus(performance.now());
  }

  _fail(message) { this.stop(true); this.status.setCamera('Error', 'error'); this.status.setMessage(message, 'error'); }

  _onResults(res) {
    const now = performance.now(); const aspect = this.video.videoWidth / this.video.videoHeight || 16 / 9;
    const lms = res.multiHandLandmarks || [], labels = res.multiHandedness || [], dets = [];
    for (let i = 0; i < lms.length && dets.length < CONFIG.tracking.maxHands; i++) if (isValidLandmarks(lms[i])) dets.push({ lm: lms[i], center: palmCenter(lms[i]), label: labels[i] ? labels[i].label : null });
    const slots = this.assoc.associate(dets, now, aspect), thresholds = sensitivityToThresholds(this.settings.values.sensitivity);
    const hands = [], seen = new Set();
    dets.forEach((d, i) => {
      const slot = slots[i]; if (slot < 0) return; seen.add(slot);
      const raw = classifyGesture(d.lm, { thresholds, aspect }).gesture;
      hands.push({ slot, lm: d.lm, gesture: this.smoothers[slot].update(raw, now) });
    });
    this.smoothers.forEach((s, i) => { if (!seen.has(i)) s.reset(); });
    this.latest = { time: now, hands }; this.trackFrames++;
  }

  _loop(ts) {
    if (this.state !== 'running') return;
    this.rafId = requestAnimationFrame(this._loop);
    const dt = Math.min(100, Math.max(0, ts - this.lastTs)); this.lastTs = ts; this.frames++;
    const v = this.video;
    if (!this.tracker.busy && v.readyState >= 2 && v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      this.tracker.send(v).then(() => { this.errors = 0; }, (e) => { console.error(e); if (++this.errors >= CONFIG.tracking.maxConsecutiveErrors) this._fail('Hand tracking stopped working repeatedly. Press Start to try again.'); });
    }
    const fresh = ts - this.latest.time <= CONFIG.tracking.staleResultMs, hands = fresh ? this.latest.hands : [];
    const { w, h } = { w: this.renderer.w, h: this.renderer.h }; const inputs = new Array(CONFIG.tracking.maxHands).fill(null);
    for (const hd of hands) inputs[hd.slot] = { gesture: hd.gesture, anchor: computeAnchor(hd.lm, w, h, CONFIG.effect) };
    this.controller.update(ts, dt, inputs);
    this.renderer.clear();
    if (this.settings.values.skeleton) for (const hd of hands) this.renderer.drawSkeleton(hd.lm, hd.slot, this.settings.values.glow);
    this.controller.render(this.renderer.ctx, ts, { glow: this.settings.values.glow, useVideo: this.settings.values.video });
    if (ts - this.lastStatusAt >= 250) this._renderStatus(ts, hands);
  }

  _renderStatus(ts, hands = []) {
    const win = ts - this.fpsAt;
    if (this.state === 'running' && win >= 500) { this.renderFps = this.frames * 1000 / win; this.trackFps = this.trackFrames * 1000 / win; this.frames = this.trackFrames = 0; this.fpsAt = ts; this.status.setFps(this.renderFps, this.trackFps); }
    this.lastStatusAt = ts; this.status.setHands(hands.length);
    const fx = this.controller.getStatus();
    for (let i = 0; i < 2; i++) { const hd = hands.find((x) => x.slot === i); this.status.setHand(i, hd ? GESTURE_LABEL[hd.gesture] || GESTURE.UNKNOWN : '—', fx[i] ? fx[i].state : 'IDLE', fx[i] ? fx[i].charge : 0); }
  }

  destroy() {
    window.removeEventListener('pagehide', this._onPageHide);
    this.stop(true); this.tracker.close(); this.controls.dispose(); this.settings.dispose(); this.renderer.dispose();
  }
}

if (typeof document !== 'undefined') window.rasenganApp = new App();
