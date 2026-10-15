# Architecture

## Data flow (one frame)
```
getUserMedia ──> <video> ──(each new frame)──> MediaPipe Hands ──> onResults
   cameraManager                 handTracker                          main._onResults
onResults: validate landmarks -> handAssociator (stable slot per hand) -> gestureRecognizer
           (geometry) -> gestureSmoother (per slot) -> latest = {time, hands[{slot, lm, gesture}]}
requestAnimationFrame loop (main._loop, every display frame):
   latest -> computeAnchor (orb position/size) -> rasenganController.update
   (handEffectState + particles per slot) -> canvasRenderer (skeleton) -> rasenganController.render
```
Tracking runs at the model's pace (`Tracking FPS`); rendering runs every display frame (`Render FPS`). Results older than `tracking.staleResultMs` are ignored, so a stalled tracker looks like "no hands" rather than a frozen orb.

## Modules
| File | Responsibility |
|---|---|
| `config.js` | All tunables, validation of overrides (`window.RASENGAN_CONFIG`) |
| `camera/cameraManager.js` | getUserMedia, error mapping, releasing all tracks, "ended" detection |
| `tracking/handTracker.js` | Loads MediaPipe (pinned CDN version), init, one `send` at a time |
| `tracking/landmarkUtils.js` | Landmark indices, connections, validation, aspect-corrected distances |
| `tracking/handAssociator.js` | Stable slot per hand across frames |
| `gestures/gestureRecognizer.js` | Landmarks -> OPEN_PALM / CLOSED_FIST / PARTIALLY_OPEN / UNKNOWN |
| `gestures/gestureSmoother.js` | Time-based debouncing of labels |
| `effects/handEffectState.js` | Pure per-hand state machine |
| `effects/rasenganController.js` | One effect per slot, position smoothing, drawing order |
| `effects/particleSystem.js`, `energyEffects.js` | Pooled particles; procedural orb drawing |
| `effects/videoOrb.js` | Optional video mode with fallback |
| `rendering/canvasRenderer.js` | DPR-aware canvas sizing, skeleton |
| `ui/*` | Settings, status text, buttons/shortcuts |

## Gesture recognition (no new AI model)
MediaPipe provides the 21 landmarks. This app only applies rules: for index, middle, ring and pinky, `ratio = dist(wrist, tip) / dist(wrist, knuckle)`. Ratio >= `openRatio` = extended; <= `fistRatio` = curled. OPEN_PALM = 4 extended (or 3 extended and none curled); CLOSED_FIST = 4 curled (or 3 curled and none extended); anything else PARTIALLY_OPEN; invalid data or a tiny hand = UNKNOWN. Distances are relative to the same hand, so scale, distance and rotation largely cancel out. The thumb is ignored (unreliable in 2D). Default thresholds (1.55 / 1.10) come from hand proportions and synthetic tests, **not tuning on real hands**; the Sensitivity slider moves them (open 1.7→1.4, fist 1.0→1.2).

## Coordinate transforms
- MediaPipe landmarks are normalized (0..1) in the **unmirrored** video frame.
- The stage box has the same aspect ratio as the video (`--ar`), and the canvas is sized to that box in CSS pixels, so `px = x * canvasWidth`, `py = y * canvasHeight` — no cropping offsets.
- Mirroring is done by CSS `scaleX(-1)` on the video **and** canvas together, so the skeleton and orb always stay aligned with the picture. Nothing is drawn as text on the canvas.
- Distances for classification multiply x by `videoWidth / videoHeight` so a 16:9 frame does not distort rotated hands.
- Handedness: MediaPipe assumes a mirrored (selfie) input, but frames are fed unmirrored, so "Left/Right" labels can be swapped relative to the user's real hands. The app **never** uses them to decide which side a hand is on; they are only a weak hint (distance bonus) for matching.

## Hand association
Each detection (palm centre) is matched greedily to the nearest recently seen track (within `matchTimeoutMs`, closer than `maxJump`). Unmatched hands take a free slot. Array index is never treated as identity. **Limitations:** hands that cross or overlap quickly can swap slots; a hand that leaves and re-enters is a new hand unless it comes back within the timeout near its old position; a third hand is ignored.

## Effect state machine
`IDLE → DETECTED → CHARGING → ACTIVE`; fist → `FADING(release)` → `DETECTED`; hand lost > `lostGraceMs` → `FADING(lost)` → `IDLE`.
Charging uses elapsed milliseconds (`chargeMs`), never frame counts. PARTIALLY_OPEN / UNKNOWN hold the charge (neutral). After a release, `releaseCooldownMs` blocks re-charging so noisy landmarks cannot retrigger it. When a slot returns to IDLE its particles are cleared.

## Cleanup lifecycle
Stop: token bump (cancels a pending start), `cancelAnimationFrame`, all MediaStream tracks stopped, `video.srcObject = null`, effects/associator/smoothers reset, canvas cleared. Camera unplugged: track `ended` event → same cleanup + message. Page unload: `pagehide` → `destroy()` (also removes listeners, disconnects ResizeObserver, closes MediaPipe). The tracking loop is a single rAF chain guarded by `state === 'running'`, so duplicates cannot start.
