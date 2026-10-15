# GestureSphere 🌀

### Control a Rasengan-Inspired Energy Orb with Hand Gestures

GestureSphere is a browser-based computer vision project that lets you interact with an animated energy orb using your webcam and hand gestures.

Open your palm to charge the orb and make a fist to trigger its release effect. The application combines hand landmark detection, gesture recognition, particle effects, and Canvas-based rendering to create an interactive experience.

**No special hardware is required beyond a compatible webcam and computer.**

<p align="center">
  <a href="https://manishyadav-aiml.github.io/GestureSphere/">
    <strong>🚀 Live Demo</strong>
  </a>
  &nbsp; | &nbsp;
  <a href="https://github.com/manishyadav-aiml/GestureSphere">
    <strong>💻 Source Code</strong>
  </a>
</p>

---

## 📌 Table of Contents

- [Features](#-features)
- [How It Works](#-how-it-works)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Controls and Gestures](#-controls-and-gestures)
- [Privacy and Permissions](#-privacy-and-permissions)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Known Limitations](#-known-limitations)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [Credits and Inspiration](#-credits-and-inspiration)
- [Author](#-author)
- [License and Copyright](#-license-and-copyright)

---

## ✨ Features

### 🖐️ Hand Tracking and Gesture Recognition

- Real-time hand landmark detection using MediaPipe Hands.
- Gesture recognition based on detected hand landmarks.
- Open-palm interaction for charging the energy orb.
- Fist interaction for releasing the orb.
- Support for tracking up to two hands, depending on the configuration and tracking conditions.
- Gesture smoothing and hand association to help maintain consistent interactions.

### ⚡ Interactive Visual Effects

- Rasengan-inspired energy orb.
- Animated charging and release effects.
- Particle and glow effects.
- Per-hand charge indicators.
- Canvas-based visual rendering.
- Optional video-based orb effect.

### 🎮 Application Controls

The interface provides controls for supported application actions, including:

- Starting and stopping the camera.
- Resetting effects.
- Entering fullscreen mode.
- Toggling mirrored camera view.
- Adjusting gesture sensitivity.
- Controlling available visual effects, including glow and particles.
- Enabling or disabling the optional video orb.
- Viewing tracking and performance information through FPS counters.

### 🧪 Testing Support

- Browser-based gesture logic test suite.
- Synthetic landmark inputs for testing supported logic.
- Manual testing checklist.
- Modular camera, tracking, gesture, rendering, and effect components.

---

## 🔄 How It Works

GestureSphere processes webcam input through a series of modules.

```text
Webcam
  |
  v
Camera Manager
  |
  v
MediaPipe Hand Tracking
  |
  v
Hand Landmark Processing
  |
  v
Gesture Recognition
  |
  v
Gesture Smoothing and Hand Association
  |
  v
Hand and Effect State Management
  |
  v
Energy Effects and Particle System
  |
  v
Canvas Rendering
  |
  v
Interactive Energy Orb
```

### How Gesture Recognition Works

MediaPipe Hands detects landmarks representing important points on the hand, such as fingertips and joints.

The gesture recognition module examines the positions and relationships of these landmarks to identify hand poses. Recognized gestures are then used to update the corresponding effect state, while gesture smoothing helps reduce unstable changes between detections.

The implementation is available in:

```text
js/gestures/gestureRecognizer.js
js/gestures/gestureSmoother.js
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and animations |
| JavaScript ES Modules | Application logic |
| Canvas 2D | Rendering visual effects |
| MediaPipe Hands | Hand landmark detection |
| Web APIs | Camera access and browser functionality |
| Python HTTP Server | Local development |
| Git | Version control |
| GitHub | Source code hosting |
| GitHub Pages | Website deployment |

---

## 📁 Project Structure

The project separates camera handling, tracking, gesture recognition, visual effects, rendering, and interface controls into individual modules.

```text
GestureSphere/
|
|-- index.html
|-- README.md
|-- .gitignore
|
|-- assets/
|   |-- rasengan.mp4       # Optional; not included by default
|
|-- css/
|   |-- animations.css
|   |-- style.css
|
|-- docs/
|   |-- architecture.md
|   |-- testing-report.md
|
|-- js/
|   |-- main.js
|   |-- config.js
|   |
|   |-- camera/
|   |   |-- cameraManager.js
|   |
|   |-- effects/
|   |   |-- energyEffects.js
|   |   |-- handEffectState.js
|   |   |-- particleSystem.js
|   |   |-- rasenganController.js
|   |   |-- videoOrb.js
|   |
|   |-- gestures/
|   |   |-- gestureRecognizer.js
|   |   |-- gestureSmoother.js
|   |
|   |-- rendering/
|   |   |-- canvasRenderer.js
|   |
|   |-- tracking/
|   |   |-- handAssociator.js
|   |   |-- handTracker.js
|   |   |-- landmarkUtils.js
|   |
|   |-- ui/
|       |-- controls.js
|       |-- settingsPanel.js
|       |-- statusPanel.js
|
|-- tests/
    |-- gesture-tests.html
    |-- gesture-tests.md
    |-- gestureTestSuite.js
```

**Optional video asset:** `assets/rasengan.mp4` is excluded from Git tracking by the project's `.gitignore`. If the video-based effect requires this file, you must supply a compatible video asset separately.

---

## 🚀 Getting Started

### Prerequisites

You will need:

- A computer running Windows, macOS, or Linux.
- A modern browser such as Google Chrome or Microsoft Edge.
- A working webcam.
- Python installed on your computer.
- An internet connection when external libraries or models need to be downloaded.

Node.js and npm are not required for the current vanilla JavaScript setup.

### Step 1: Download the Repository

If you already have GestureSphere on your computer, open the existing project folder and continue to Step 2.

Otherwise, clone the repository:

```bash
git clone https://github.com/manishyadav-aiml/GestureSphere.git
```

Enter the project directory:

```bash
cd GestureSphere
```

### Step 2: Start the Local Server

Run the appropriate command from the project root directory, where `index.html` is located.

**Windows PowerShell:**

```powershell
py -m http.server 8000
```

If the `py` command is unavailable, try:

```powershell
python -m http.server 8000
```

**macOS or Linux:**

```bash
python3 -m http.server 8000
```

Keep the terminal open while using the application.

### Step 3: Open the Application

Open your browser and visit:

http://localhost:8000

Alternatively, use the deployed version:

https://manishyadav-aiml.github.io/GestureSphere/

### Step 4: Allow Camera Access

Grant camera permission when your browser requests it.

Position your hand within the camera frame and try the gestures described in the Controls and Gestures section.

### Step 5: Stop the Local Server

When you finish testing, return to the terminal and press:

```text
Ctrl + C
```

This stops the local development server.

---

## 🎮 Controls and Gestures

### Hand Gestures

| Gesture | Intended Action |
|---|---|
| Open palm | Charge the energy orb |
| Closed fist | Trigger the release effect |
| Move your hand | Change the tracked hand position and associated interaction |

Gesture recognition may be affected by lighting, camera quality, hand orientation, and hand visibility.

### Keyboard Shortcuts

Verify the exact mappings in `js/ui/controls.js` before relying on these shortcuts.

| Key | Intended Action |
|---|---|
| `S` | Start or stop the camera — verify |
| `R` | Reset effects — verify |
| `F` | Toggle fullscreen — verify |
| `K` | Show or hide the hand skeleton — verify |

**Important:** Remove the word "verify" only after confirming that the corresponding keyboard shortcut is implemented and performs the stated action. Remove any shortcut that is not supported by the current code.

### On-Screen Controls

The interface includes controls for supported actions, including:

- Start and Stop.
- Reset.
- Fullscreen.
- Mirrored camera view.
- Gesture sensitivity.
- Glow and particle effects.
- Optional video orb.

The interface also displays per-hand charge indicators and FPS counters.

---

## 🔒 Privacy and Permissions

GestureSphere uses webcam input for hand tracking and interactive visual effects.

The application is designed to process camera frames locally in the browser. The application is not intended to upload webcam video to a server. External libraries and models may be downloaded from a CDN.

Camera access requires browser permission.

For transparency:

- Grant camera access only when you intend to use the application.
- Use the application's Stop control when you want to stop camera access through the interface.
- Review the source code and browser Network panel to inspect network activity.
- Remember that external libraries and models may make network requests even when webcam frames are processed locally.

The exact network behavior depends on the code and external dependencies used by the deployed version.

---

## 🧪 Testing

GestureSphere includes a browser-based test suite for supported gesture-related logic.

### Run the Automated Tests

Start the local server from the project root:

```powershell
py -m http.server 8000
```

Open the test page:

http://localhost:8000/tests/gesture-tests.html

Follow the instructions displayed on the page.

### What the Tests Cover

The test suite uses synthetic landmarks to test supported logic, which may include:

- Gesture recognition rules.
- Gesture smoothing.
- Hand association.
- Effect state transitions.

These tests do not require a live webcam.

### Test Results

The test suite was run locally during development, and the results were reported as passing.

An exact test count, browser version, and execution date have not been recorded in this README, so no numerical pass rate is claimed.

Synthetic landmark tests do not independently establish real-world hand-tracking accuracy or performance across devices.

### Manual Testing Checklist

After making changes, verify the following:

- [ ] The application loads.
- [ ] Camera permission can be granted.
- [ ] The camera starts successfully.
- [ ] An open palm triggers the charging interaction.
- [ ] A fist triggers the release interaction.
- [ ] Available visual effects render correctly.
- [ ] Camera stop and restart work.
- [ ] Reset and other controls work as intended.
- [ ] Reloading the page does not prevent the application from starting.
- [ ] The browser console has no unexpected errors.
- [ ] The deployed website works after publishing changes.

For additional information, see:

- `tests/gesture-tests.md`
- `docs/testing-report.md`

---

## 🛠️ Troubleshooting

### Camera Does Not Start

1. Confirm that your webcam is connected and working.
2. Check the browser's site permissions and allow camera access.
3. Close other applications that may be using the webcam.
4. Reload the page.
5. Check the browser console for errors.

### Hand Tracking Is Unstable

- Improve the lighting.
- Keep your hand fully visible.
- Avoid very fast movements.
- Try a different hand position or camera distance.
- Avoid conditions that make your hand difficult to distinguish from the background.

### Visual Effects Do Not Appear

1. Confirm that the application has loaded successfully.
2. Check whether hand tracking is active.
3. Try the supported gestures again.
4. Inspect the browser console for JavaScript errors.
5. If the video orb is enabled, verify that the required video asset exists.

### The Website Works Locally but Not on GitHub Pages

Check that:

- The intended files have been committed and pushed.
- JavaScript imports use valid paths.
- File and folder capitalization is correct.
- Required external libraries and models load successfully.
- GitHub Pages has finished publishing the update.

### Port 8000 Is Already in Use

Start the server on another port:

```powershell
py -m http.server 8001
```

Then visit:

http://localhost:8001

---

## ⚠️ Known Limitations

- Hand tracking depends on lighting, camera quality, and hand visibility.
- Fast movements and partially hidden fingers may affect gesture recognition.
- Performance can vary between computers and browsers.
- External library or model downloads may require an internet connection.
- The optional video orb requires a compatible video asset if enabled.
- Synthetic landmark tests cannot guarantee accurate recognition in every real-world situation.

---

## 🌐 Deployment

GestureSphere is hosted on GitHub Pages.

- **Live Demo:** https://manishyadav-aiml.github.io/GestureSphere/
- **Source Code:** https://github.com/manishyadav-aiml/GestureSphere

### Publishing Future Changes

1. Make changes in your existing project folder.
2. Run the application locally and test the updated functionality.
3. Review the files you intend to commit.
4. Commit and push the changes to the existing GitHub repository.
5. Wait for GitHub Pages to publish the update.
6. Open the live website and verify the changes.

Camera access requires a secure context, such as HTTPS or localhost.

---

## 🔮 Future Improvements

Potential future enhancements include:

- Additional hand gestures and interactions.
- More energy effects and particle styles.
- Further tracking and rendering optimizations.
- Improved accessibility and user guidance.
- Expanded automated test coverage.
- Better feedback when a gesture cannot be recognized.

These are potential enhancements, not claims that the features are already implemented.

---

## 🎨 Credits and Inspiration

GestureSphere is an independent fan-inspired technical project based on the visual concept of the Rasengan from *Naruto*.

The project references the following community projects and technology:

- [strawluck/naruto-rasengan](https://github.com/strawluck/naruto-rasengan)
- [gprem09/naruto](https://github.com/gprem09/naruto)
- [MediaPipe](https://github.com/google-ai-edge/mediapipe)

Please review the original projects' licenses and attribution requirements before reusing their code or assets.

*Naruto* and its associated characters and concepts belong to their respective rights holders. GestureSphere is a fan-inspired project and is not an official Naruto product.

---

## 👨‍💻 Author

**GitHub:** [manishyadav-aiml](https://github.com/manishyadav-aiml)

Explore the source code to learn about browser-based computer vision, gesture recognition, modular JavaScript, and interactive graphics.

---

## 📄 License and Copyright

Copyright © 2026 Manish Kumar Yadav. All rights reserved, to the extent applicable to code and other materials owned by the copyright holder.

No license is granted for copying, modifying, redistributing, or otherwise reusing the project's original materials without permission from the relevant copyright holder.

Public availability on GitHub does not, by itself, grant permission to reuse copyrighted code.

Third-party libraries, code, models, videos, and other assets remain subject to their respective licenses, terms, and rights. This notice does not override those terms or claim ownership of third-party materials.