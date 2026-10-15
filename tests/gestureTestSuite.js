// Shared test suite: runs in the browser (gesture-tests.html) and in Node (same ES modules).
// All landmarks here are SYNTHETIC (generated geometry), not real MediaPipe output.
import { classifyGesture, GESTURE, sanitizeThresholds, sensitivityToThresholds, DEFAULT_THRESHOLDS } from '../js/gestures/gestureRecognizer.js';
import { GestureSmoother } from '../js/gestures/gestureSmoother.js';
import { HandAssociator } from '../js/tracking/handAssociator.js';
import { HandEffectState, FX } from '../js/effects/handEffectState.js';
import { resolveConfig, DEFAULTS } from '../js/config.js';

// ---- synthetic hand generator (local units: wrist->middle knuckle = 1, palm points up) ----
const MCP = [[-0.3, 0.95], [0, 1.0], [0.28, 0.95], [0.5, 0.85]];
const DIR = [[-0.1, 1], [0, 1], [0.08, 1], [0.2, 1]];
const POSE = { open: [0.45, 0.75, 1.0], partial: [0.4, 0.5, 0.45], curl: [0.3, 0.1, -0.2] };
const THUMB = { open: [[-0.35, 0.2], [-0.6, 0.45], [-0.8, 0.65], [-1.0, 0.8]], closed: [[-0.3, 0.2], [-0.45, 0.4], [-0.35, 0.5], [-0.2, 0.6]] };

export function makeHand({ fingers = ['open', 'open', 'open', 'open'], thumb = 'open', scale = 0.2, angle = 0, cx = 0.5, cy = 0.6, aspect = 1, noise = 0, rand = Math.random } = {}) {
  const local = [[0, 0], ...THUMB[thumb]];
  fingers.forEach((pose, i) => {
    const [px, py] = MCP[i]; const [dx, dy] = DIR[i]; const n = Math.hypot(dx, dy);
    local.push([px, py]);
    POSE[pose].forEach((e) => local.push([px + (dx / n) * e, py + (dy / n) * e]));
  });
  const ca = Math.cos(angle), sa = Math.sin(angle);
  return local.map(([x, y]) => {
    let rx = (x * ca - y * sa) * scale, ry = (x * sa + y * ca) * scale;
    rx += (rand() - 0.5) * 2 * noise * scale; ry += (rand() - 0.5) * 2 * noise * scale;
    return { x: cx + rx / aspect, y: cy - ry, z: 0 }; // screen y grows downward; x is stored normalized by width
  });
}
const ALL = (p) => [p, p, p, p];
const hand = (p, o = {}) => makeHand({ fingers: ALL(p), ...o });
function seeded(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// ---- tiny assertion helpers ----
const eq = (a, b, msg = '') => { if (a !== b) throw new Error(`${msg} expected ${b}, got ${a}`); };
const ok = (c, msg) => { if (!c) throw new Error(msg); };
const G = GESTURE;
const cls = (lm, o) => classifyGesture(lm, o).gesture;
const FXCFG = { chargeMs: 1000, releaseMs: 400, lostGraceMs: 200, lostFadeMs: 300, releaseCooldownMs: 500, appearMs: 100 };
function run(fx, gesture, ms, t, step = 16) { for (let e = 0; e < ms; e += step) { t += step; fx.update(t, step, gesture); } return t; }

export const TESTS = [
  { id: 'G-01', name: 'Open palm classified as OPEN_PALM', fn: () => eq(cls(hand('open')), G.OPEN_PALM) },
  { id: 'G-02', name: 'Closed fist classified as CLOSED_FIST', fn: () => eq(cls(hand('curl', { thumb: 'closed' })), G.CLOSED_FIST) },
  { id: 'G-03', name: 'Half-curled fingers classified as PARTIALLY_OPEN', fn: () => eq(cls(hand('partial')), G.PARTIALLY_OPEN) },
  { id: 'G-04', name: 'Two fingers extended, two curled is PARTIALLY_OPEN', fn: () => eq(cls(makeHand({ fingers: ['open', 'open', 'curl', 'curl'] })), G.PARTIALLY_OPEN) },
  { id: 'G-05', name: 'Invalid / missing landmarks return UNKNOWN without throwing', fn: () => {
    const bad = [null, undefined, [], 'x', 42, hand('open').slice(0, 20)];
    const nan = hand('open'); nan[8] = { x: NaN, y: 0.1 }; const hole = hand('open'); hole[3] = null;
    for (const b of [...bad, nan, hole]) eq(cls(b), G.UNKNOWN, 'invalid input');
    const flat = hand('open').map(() => ({ x: 0.5, y: 0.5 })); eq(cls(flat), G.UNKNOWN, 'collapsed hand');
  } },
  { id: 'G-06', name: 'Same result for hand scales 0.05 to 0.6 (distance independence)', fn: () => {
    for (const s of [0.05, 0.1, 0.2, 0.4, 0.6]) {
      eq(cls(hand('open', { scale: s })), G.OPEN_PALM, `open@${s}`); eq(cls(hand('curl', { scale: s })), G.CLOSED_FIST, `fist@${s}`);
      eq(cls(hand('partial', { scale: s })), G.PARTIALLY_OPEN, `partial@${s}`);
    }
  } },
  { id: 'G-07', name: 'Hand smaller than minHandSize returns UNKNOWN', fn: () => eq(cls(hand('open', { scale: 0.005 })), G.UNKNOWN) },
  { id: 'G-08', name: 'Rotation 0/30/-30/90/180 degrees does not change the result', fn: () => {
    for (const deg of [0, 30, -30, 90, 180]) {
      const a = deg * Math.PI / 180;
      eq(cls(hand('open', { angle: a })), G.OPEN_PALM, `open@${deg}`); eq(cls(hand('curl', { angle: a })), G.CLOSED_FIST, `fist@${deg}`);
    }
  } },
  { id: 'G-09', name: 'Aspect-ratio correction (16:9 frame, rotated 90 degrees)', fn: () => {
    const a = 16 / 9, r = Math.PI / 2;
    eq(cls(hand('open', { aspect: a, angle: r }), { aspect: a }), G.OPEN_PALM, 'open');
    eq(cls(hand('curl', { aspect: a, angle: r }), { aspect: a }), G.CLOSED_FIST, 'fist');
  } },
  { id: 'G-10', name: 'Seeded landmark jitter (+-3% of hand size): >=95% correct over 300 samples each', fn: () => {
    const rand = seeded(7); let o = 0, f = 0;
    for (let i = 0; i < 300; i++) {
      if (cls(hand('open', { noise: 0.03, rand })) === G.OPEN_PALM) o++;
      if (cls(hand('curl', { noise: 0.03, rand })) === G.CLOSED_FIST) f++;
    }
    ok(o >= 285 && f >= 285, `open ${o}/300, fist ${f}/300`);
  } },
  { id: 'G-11', name: 'Invalid thresholds fall back to defaults; fist>=open rejected', fn: () => {
    for (const t of [null, {}, { openRatio: NaN }, { openRatio: -1 }, { fistRatio: 'a' }, { openRatio: 1, fistRatio: 2 }]) {
      const s = sanitizeThresholds(t); ok(s.fistRatio < s.openRatio && s.minHandSize >= 0, JSON.stringify(t));
    }
    eq(sanitizeThresholds({}).openRatio, DEFAULT_THRESHOLDS.openRatio);
    eq(cls(hand('open'), { thresholds: { openRatio: NaN } }), G.OPEN_PALM);
  } },
  { id: 'G-12', name: 'Sensitivity mapping: monotonic, clamped, keeps a gap, NaN-safe', fn: () => {
    const lo = sensitivityToThresholds(0), hi = sensitivityToThresholds(1);
    ok(hi.openRatio < lo.openRatio && hi.fistRatio > lo.fistRatio, 'monotonic'); ok(hi.fistRatio < lo.openRatio && hi.fistRatio < hi.openRatio, 'gap');
    eq(sensitivityToThresholds(5).openRatio, hi.openRatio, 'clamp'); eq(sensitivityToThresholds(NaN).openRatio, sensitivityToThresholds(0.5).openRatio, 'NaN');
    for (const s of [0, 0.5, 1]) { const th = sensitivityToThresholds(s); eq(cls(hand('open'), { thresholds: th }), G.OPEN_PALM); eq(cls(hand('curl'), { thresholds: th }), G.CLOSED_FIST); }
  } },
  { id: 'S-01', name: 'Smoother ignores a 50 ms flicker', fn: () => {
    const s = new GestureSmoother({ holdMs: 120 }); s.update(G.OPEN_PALM, 0); s.update(G.OPEN_PALM, 200);
    eq(s.update(G.CLOSED_FIST, 216), G.OPEN_PALM); eq(s.update(G.CLOSED_FIST, 250), G.OPEN_PALM); eq(s.update(G.OPEN_PALM, 266), G.OPEN_PALM);
  } },
  { id: 'S-02', name: 'Smoother accepts a sustained change after holdMs (boundary exact)', fn: () => {
    const s = new GestureSmoother({ holdMs: 120 }); s.update(G.OPEN_PALM, 0); s.update(G.OPEN_PALM, 130);
    eq(s.update(G.CLOSED_FIST, 1000), G.OPEN_PALM); eq(s.update(G.CLOSED_FIST, 1119), G.OPEN_PALM); eq(s.update(G.CLOSED_FIST, 1120), G.CLOSED_FIST);
  } },
  { id: 'S-03', name: 'UNKNOWN needs the longer unknownHoldMs; invalid labels count as UNKNOWN', fn: () => {
    const s = new GestureSmoother({ holdMs: 100, unknownHoldMs: 300 }); s.update(G.OPEN_PALM, 0); s.update(G.OPEN_PALM, 120);
    eq(s.update('garbage', 1000), G.OPEN_PALM); eq(s.update(undefined, 1299), G.OPEN_PALM); eq(s.update(G.UNKNOWN, 1300), G.UNKNOWN);
  } },
  { id: 'S-04', name: 'Smoother invalid options use defaults; reset() clears state', fn: () => {
    const s = new GestureSmoother({ holdMs: -5, unknownHoldMs: NaN }); eq(s.holdMs, 120); eq(s.unknownHoldMs, 300);
    s.update(G.OPEN_PALM, 0); s.update(G.OPEN_PALM, 200); eq(s.stable, G.OPEN_PALM); s.reset(); eq(s.stable, G.UNKNOWN);
  } },
  { id: 'A-01', name: 'Associator keeps slots when MediaPipe output order is swapped', fn: () => {
    const a = new HandAssociator(); const L = { x: 0.25, y: 0.5 }, R = { x: 0.75, y: 0.5 };
    const f1 = a.associate([{ center: L, label: 'Left' }, { center: R, label: 'Right' }], 0);
    const f2 = a.associate([{ center: { x: 0.76, y: 0.5 }, label: 'Right' }, { center: { x: 0.26, y: 0.5 }, label: 'Left' }], 33);
    eq(f2[0], f1[1], 'right hand'); eq(f2[1], f1[0], 'left hand'); ok(f1[0] !== f1[1], 'distinct slots');
  } },
  { id: 'A-02', name: 'Associator follows hands even when handedness labels flip', fn: () => {
    const a = new HandAssociator(); const f1 = a.associate([{ center: { x: 0.2, y: 0.5 }, label: 'Left' }, { center: { x: 0.8, y: 0.5 }, label: 'Right' }], 0);
    const f2 = a.associate([{ center: { x: 0.21, y: 0.5 }, label: 'Right' }, { center: { x: 0.79, y: 0.5 }, label: 'Left' }], 33);
    eq(f2[0], f1[0]); eq(f2[1], f1[1]);
  } },
  { id: 'A-03', name: 'A hand that disappears frees its slot after the timeout; new hand reuses it', fn: () => {
    const a = new HandAssociator({ matchTimeoutMs: 500 }); const [s0] = a.associate([{ center: { x: 0.3, y: 0.5 } }], 0);
    const [s1] = a.associate([{ center: { x: 0.9, y: 0.2 } }], 2000); ok(s1 >= 0, 'got a slot'); ok(typeof s0 === 'number', 'first slot');
    const two = a.associate([{ center: { x: 0.9, y: 0.2 } }, { center: { x: 0.1, y: 0.8 } }], 2033); ok(two[0] !== two[1] && two.every((v) => v >= 0), 'two distinct slots');
  } },
  { id: 'A-04', name: 'Second hand appearing next to a tracked hand gets the other slot', fn: () => {
    const a = new HandAssociator(); const [s0] = a.associate([{ center: { x: 0.5, y: 0.5 } }], 0);
    const r = a.associate([{ center: { x: 0.5, y: 0.5 } }, { center: { x: 0.9, y: 0.5 } }], 33); eq(r[0], s0); ok(r[1] >= 0 && r[1] !== s0, 'other slot');
  } },
  { id: 'E-01', name: 'State machine: IDLE -> DETECTED -> CHARGING -> ACTIVE', fn: () => {
    const fx = new HandEffectState(FXCFG); eq(fx.state, FX.IDLE); let t = 0;
    t = run(fx, G.PARTIALLY_OPEN, 50, t); eq(fx.state, FX.DETECTED); t = run(fx, G.OPEN_PALM, 100, t); eq(fx.state, FX.CHARGING);
    ok(fx.charge > 0 && fx.charge < 1, 'charge in progress'); t = run(fx, G.OPEN_PALM, 1100, t); eq(fx.state, FX.ACTIVE); eq(fx.charge, 1);
  } },
  { id: 'E-02', name: 'Charge uses elapsed time: 30 fps and 120 fps reach the same charge', fn: () => {
    const a = new HandEffectState(FXCFG), b = new HandEffectState(FXCFG); run(a, G.OPEN_PALM, 600, 0, 33); run(b, G.OPEN_PALM, 600, 0, 8);
    ok(Math.abs(a.charge - b.charge) < 0.08, `${a.charge} vs ${b.charge}`);
  } },
  { id: 'E-03', name: 'Closed fist releases: FADING then DETECTED, charge reset', fn: () => {
    const fx = new HandEffectState(FXCFG); let t = run(fx, G.OPEN_PALM, 700, 0); t = run(fx, G.CLOSED_FIST, 16, t); eq(fx.state, FX.FADING); eq(fx.reason, 'release');
    t = run(fx, G.CLOSED_FIST, 500, t); eq(fx.state, FX.DETECTED); eq(fx.charge, 0); eq(fx.alpha, 0);
  } },
  { id: 'E-04', name: 'Cooldown prevents re-charging immediately after a release', fn: () => {
    const fx = new HandEffectState(FXCFG); let t = run(fx, G.OPEN_PALM, 500, 0); t = run(fx, G.CLOSED_FIST, 450, t);
    t = run(fx, G.OPEN_PALM, 32, t); eq(fx.state, FX.DETECTED, 'still cooling down'); t = run(fx, G.OPEN_PALM, 600, t); eq(fx.state, FX.CHARGING);
  } },
  { id: 'E-05', name: 'PARTIALLY_OPEN and UNKNOWN hold the charge (no sudden change)', fn: () => {
    const fx = new HandEffectState(FXCFG); let t = run(fx, G.OPEN_PALM, 500, 0); const c = fx.charge;
    t = run(fx, G.PARTIALLY_OPEN, 300, t); eq(fx.charge, c); t = run(fx, G.UNKNOWN, 300, t); eq(fx.charge, c); eq(fx.state, FX.CHARGING);
  } },
  { id: 'E-06', name: 'Brief tracking loss (< lostGraceMs) keeps the effect; long loss fades and cleans up', fn: () => {
    const fx = new HandEffectState(FXCFG); let t = run(fx, G.OPEN_PALM, 500, 0); t = run(fx, null, 100, t); eq(fx.state, FX.CHARGING, 'grace');
    t = run(fx, G.OPEN_PALM, 50, t); eq(fx.state, FX.CHARGING); t = run(fx, null, 250, t); eq(fx.state, FX.FADING); eq(fx.reason, 'lost');
    t = run(fx, null, 400, t); eq(fx.state, FX.IDLE); eq(fx.charge, 0); eq(fx.alpha, 0);
  } },
  { id: 'E-07', name: 'Two effect states are independent', fn: () => {
    const a = new HandEffectState(FXCFG), b = new HandEffectState(FXCFG); let t = 0;
    for (let i = 0; i < 40; i++) { t += 16; a.update(t, 16, G.OPEN_PALM); b.update(t, 16, G.PARTIALLY_OPEN); }
    eq(a.state, FX.CHARGING); eq(b.state, FX.DETECTED); eq(b.charge, 0);
    for (let i = 0; i < 40; i++) { t += 16; a.update(t, 16, G.CLOSED_FIST); b.update(t, 16, G.OPEN_PALM); }
    ok(a.state !== FX.CHARGING, 'a left charging'); eq(b.state, FX.CHARGING); ok(b.charge > 0, 'b charges');
  } },
  { id: 'C-01', name: 'Config: invalid overrides ignored with warnings', fn: () => {
    const { config, warnings } = resolveConfig({ effect: { chargeMs: -5, bogus: 1, releaseMs: 900 }, nope: {}, particles: 'x' });
    eq(config.effect.chargeMs, DEFAULTS.effect.chargeMs); eq(config.effect.releaseMs, 900); ok(warnings.length >= 3, `warnings=${warnings.length}`);
  } },
];

export function runSuite() {
  return TESTS.map((t) => { try { t.fn(); return { id: t.id, name: t.name, pass: true, detail: '' }; } catch (e) { return { id: t.id, name: t.name, pass: false, detail: e.message }; } });
}
