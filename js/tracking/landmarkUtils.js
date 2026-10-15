// Helpers for MediaPipe hand landmarks (21 points, normalized x/y in 0..1 of the video frame).

export const LM = Object.freeze({ WRIST: 0, INDEX_MCP: 5, MIDDLE_MCP: 9, RING_MCP: 13, PINKY_MCP: 17 });

// [mcp, pip, dip, tip] for index, middle, ring, pinky. The thumb is excluded on purpose:
// its 2D geometry is too ambiguous for a reliable open/closed decision.
export const FINGERS = Object.freeze([[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]);

export const HAND_CONNECTIONS = Object.freeze([
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]);

export function isValidLandmarks(lm) {
  if (!Array.isArray(lm) || lm.length !== 21) return false;
  for (const p of lm) if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  return true;
}

// Distance in "frame-height units". x is multiplied by aspect (width/height) so distances
// are not distorted on non-square video.
export function dist(a, b, aspect = 1) { return Math.hypot((a.x - b.x) * aspect, a.y - b.y); }

// Wrist -> middle-finger knuckle: the hand-size reference used everywhere.
export function handLength(lm, aspect = 1) { return dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP], aspect); }

export function palmCenter(lm) {
  let x = 0, y = 0;
  for (const i of [0, 5, 9, 13, 17]) { x += lm[i].x; y += lm[i].y; }
  return { x: x / 5, y: y / 5 };
}
