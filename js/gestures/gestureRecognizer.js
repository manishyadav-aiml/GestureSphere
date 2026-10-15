// Geometry-based gesture classification. MediaPipe supplies landmarks; this module applies
// simple rules (no trained model). For each of 4 fingers:
//   ratio = dist(wrist, fingertip) / dist(wrist, finger knuckle)
// An extended finger has a ratio well above 1, a curled finger has a ratio near or below 1.
// Using a ratio makes the test independent of hand size, distance and rotation.
import { FINGERS, LM, isValidLandmarks, dist, handLength } from '../tracking/landmarkUtils.js';

export const GESTURE = Object.freeze({
  OPEN_PALM: 'OPEN_PALM', CLOSED_FIST: 'CLOSED_FIST', PARTIALLY_OPEN: 'PARTIALLY_OPEN', UNKNOWN: 'UNKNOWN',
});

export const DEFAULT_THRESHOLDS = Object.freeze({ openRatio: 1.55, fistRatio: 1.1, minHandSize: 0.02 });

export function sanitizeThresholds(t) {
  const d = DEFAULT_THRESHOLDS;
  const o = t && typeof t === 'object' ? t : {};
  let openRatio = Number.isFinite(o.openRatio) && o.openRatio > 0 ? o.openRatio : d.openRatio;
  let fistRatio = Number.isFinite(o.fistRatio) && o.fistRatio > 0 ? o.fistRatio : d.fistRatio;
  if (fistRatio >= openRatio) { openRatio = d.openRatio; fistRatio = d.fistRatio; }
  const minHandSize = Number.isFinite(o.minHandSize) && o.minHandSize >= 0 ? o.minHandSize : d.minHandSize;
  return { openRatio, fistRatio, minHandSize };
}

// s in 0..1 (higher = more permissive). The two thresholds always keep a gap (max fist 1.2 < min open 1.4).
export function sensitivityToThresholds(s) {
  const v = Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 0.5;
  return { openRatio: 1.7 - 0.3 * v, fistRatio: 1.0 + 0.2 * v, minHandSize: DEFAULT_THRESHOLDS.minHandSize };
}

export function fingerExtensionRatios(lm, aspect = 1) {
  const wrist = lm[LM.WRIST];
  return FINGERS.map(([mcp, , , tip]) => {
    const base = dist(wrist, lm[mcp], aspect);
    return base > 1e-6 ? dist(wrist, lm[tip], aspect) / base : NaN;
  });
}

function result(gesture, extra) { return { gesture, ratios: [], extended: 0, curled: 0, reason: '', ...extra }; }

export function classifyGesture(lm, opts = {}) {
  const th = sanitizeThresholds(opts.thresholds);
  const aspect = Number.isFinite(opts.aspect) && opts.aspect > 0 ? opts.aspect : 1;
  if (!isValidLandmarks(lm)) return result(GESTURE.UNKNOWN, { reason: 'invalid landmarks' });
  if (handLength(lm, aspect) < th.minHandSize) return result(GESTURE.UNKNOWN, { reason: 'hand too small' });
  const ratios = fingerExtensionRatios(lm, aspect);
  if (ratios.some((r) => !Number.isFinite(r))) return result(GESTURE.UNKNOWN, { reason: 'degenerate geometry' });
  const extended = ratios.filter((r) => r >= th.openRatio).length;
  const curled = ratios.filter((r) => r <= th.fistRatio).length;
  let gesture = GESTURE.PARTIALLY_OPEN;
  if (extended >= 4 || (extended === 3 && curled === 0)) gesture = GESTURE.OPEN_PALM;
  else if (curled >= 4 || (curled === 3 && extended === 0)) gesture = GESTURE.CLOSED_FIST;
  return result(gesture, { ratios, extended, curled });
}
