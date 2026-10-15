// Central configuration. To override values without editing this file, define
// window.RASENGAN_CONFIG = { section: { key: value } } before main.js loads.
// Invalid overrides are ignored and reported in CONFIG_WARNINGS.

export const DEFAULTS = Object.freeze({
  // Folder that contains hands.js and the model files. To work offline, copy the
  // @mediapipe/hands npm package files to vendor/mediapipe-hands and use './vendor/mediapipe-hands'.
  mediapipeBaseUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240',
  camera: { width: 1280, height: 720 },
  tracking: {
    maxHands: 2, modelComplexity: 1,
    minDetectionConfidence: 0.6, minTrackingConfidence: 0.6,
    scriptTimeoutMs: 20000, staleResultMs: 500, maxConsecutiveErrors: 3,
  },
  gesture: { holdMs: 120, unknownHoldMs: 300 },
  association: { maxJump: 0.45, matchTimeoutMs: 700, labelBonus: 0.75 },
  effect: {
    chargeMs: 2500, releaseMs: 650, lostGraceMs: 250, lostFadeMs: 500,
    releaseCooldownMs: 600, appearMs: 250,
    liftFactor: 1.35, radiusFactor: 0.8, minRadius: 28, maxRadius: 220,
    positionSmoothing: 14,
  },
  particles: { perHand: 140, minRate: 20, maxRate: 140 },
  video: { src: 'assets/rasengan.mp4', checkTimeoutMs: 4000 },
});

export function resolveConfig(overrides, defaults = DEFAULTS) {
  const warnings = [];
  const out = {};
  for (const [k, v] of Object.entries(defaults)) out[k] = (v && typeof v === 'object') ? { ...v } : v;
  if (!overrides || typeof overrides !== 'object') return { config: out, warnings };
  for (const [k, v] of Object.entries(overrides)) {
    if (!(k in defaults)) { warnings.push(`Unknown config section "${k}" ignored.`); continue; }
    if (defaults[k] && typeof defaults[k] === 'object') {
      if (!v || typeof v !== 'object') { warnings.push(`Config "${k}" must be an object.`); continue; }
      for (const [k2, v2] of Object.entries(v)) {
        if (!(k2 in defaults[k])) { warnings.push(`Unknown config key "${k}.${k2}" ignored.`); continue; }
        const d = defaults[k][k2];
        if (typeof d === 'number' && !(Number.isFinite(v2) && v2 >= 0)) { warnings.push(`Config "${k}.${k2}" must be a number >= 0; using ${d}.`); continue; }
        if (typeof d === 'string' && (typeof v2 !== 'string' || !v2)) { warnings.push(`Config "${k}.${k2}" must be a non-empty string.`); continue; }
        out[k][k2] = v2;
      }
    } else if (typeof v === typeof defaults[k] && v) out[k] = v;
    else warnings.push(`Config "${k}" has an invalid value; using default.`);
  }
  return { config: out, warnings };
}

const resolved = resolveConfig(globalThis.RASENGAN_CONFIG);
export const CONFIG = resolved.config;
export const CONFIG_WARNINGS = resolved.warnings;
