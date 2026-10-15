# Testing report

Environment of the build: Linux sandbox, Node v22.22.2, **no browser, no webcam, no network**.

## Executed and verified
| What | How | Result |
|---|---|---|
| Gesture rules, smoothing, hand association, effect state machine, config validation | `tests/gestureTestSuite.js` run under Node (same ES modules the browser uses) | **28/28 passed** (one test, E-04, initially failed because of a timing mistake in the *test*; the test was corrected and the suite rerun) |
| Syntax of all 18 JS files (17 modules + test suite) | `node --check` | No errors |
| Module linking | Every module (including `main.js`) imported in Node: all `import` names/paths resolve | OK |
| HTML references, DOM ids used by `main.js` | Script: CSS/JS paths exist, all ids exist in `index.html` | OK (30 ids) |
| Drawing code and particle pool | Controller + renderer run against a recording **mock** canvas: two hands, charge, release, loss | No exceptions; particles never exceeded the cap (140); everything cleaned up after hand loss |

## NOT verified (no browser/webcam here)
Webcam start/stop and stream release, permission/no-camera/in-use messages, MediaPipe download and initialization (the pinned CDN version `0.4.1675469240` was not fetched), real hand tracking quality, gesture accuracy on real hands (thresholds untuned), two-hand independence with real hands, visual appearance of the orb, real FPS, fullscreen, resize, optional video mode. All manual tests M-01…M-16 in `tests/gesture-tests.md` are **NOT RUN**.

## Limits of the synthetic tests
Landmarks are generated from an idealized hand model, so they prove the logic is self-consistent (scale, rotation, aspect, jitter), not that real MediaPipe output behaves the same. The 3% jitter test uses a seeded generator. `tests/gesture-tests.html` (browser version of the same suite) has not been opened in a browser.

## Known defects / risks
None known from the executed tests. Likely first-run adjustments: gesture thresholds (use the Sensitivity slider), orb lift/size (`effect.liftFactor`, `effect.radiusFactor`).
