# GestureSphere

### Bringing Hand Gestures to Life in Real Time.

**Control interactive energy effects using nothing but your hands.**

GestureSphere is a browser-based, webcam-powered hand-tracking application that transforms hand gestures into interactive visual effects. Open your palm to charge a glowing, Rasengan-inspired energy orb, then close your fist to trigger its release animation.

Built with JavaScript, MediaPipe Hands, and HTML5 Canvas, GestureSphere explores touchless interaction through computer vision, gesture recognition, and real-time graphics.

---

## 📌 Project Overview

| Property | Details |
|---|---|
| Project Name | GestureSphere |
| Tagline | Bringing Hand Gestures to Life in Real Time. |
| Project Type | Computer Vision and Interactive Graphics |
| Platform | Web Browser |
| Frontend | HTML5, CSS3, JavaScript |
| Hand Tracking | MediaPipe Hands |
| Graphics Rendering | HTML5 Canvas 2D |
| Backend | Not required for core functionality |
| Camera Access | Browser Webcam API |
| Processing | Primarily client-side |
| Architecture | Modular JavaScript application |

---

## ✨ Features

### 1. Real-Time Hand Tracking

- Detects and tracks up to two hands using MediaPipe Hands.
- Uses 21 landmarks for each detected hand.
- Displays hand movements through visual feedback.
- Supports interactive effects controlled by hand gestures.
- Provides tracking information through the application's status panel.

### 2. Gesture Recognition

GestureSphere recognizes hand poses and uses them to control the visual effects.

| Gesture | Action |
|---|---|
| Open Palm | Displays and charges the energy orb |
| Closed Fist | Triggers the release or fading animation |
| Partially Open Hand | Maintains the current charge state |
| Unknown Gesture | Avoids unnecessary state changes |

Gesture recognition uses geometric measurements derived from hand landmarks. Time-based smoothing helps reduce unstable transitions between recognized gestures.

### 3. Interactive Visual Effects

- Procedurally rendered energy orb.
- Glowing visual effects.
- Charge-dependent visual intensity.
- Animated particles and energy effects.
- Release bursts and smooth fading transitions.
- Independent visual states for two detected hands.

### 4. Customization and Controls

Depending on the controls implemented in the current version, users can:

- Start or stop the webcam.
- Enable or disable the hand-landmark skeleton.
- Toggle glow and particle effects.
- Enable mirrored camera viewing.
- Adjust gesture sensitivity.
- Enter fullscreen mode.
- Reset the current visual state.
- Monitor detected hands and recognized gestures.
- View available performance statistics.

### 5. Optional Video Orb

GestureSphere supports an optional video-based orb mode.

The optional video asset is expected at:

`assets/rasengan.mp4`

The video file is required only if the video-based orb mode is enabled and depends on that asset. The procedural visual effect does not inherently require a video file.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling, layout, and animations |
| JavaScript ES Modules | Application logic and modular architecture |
| MediaPipe Hands | Hand landmark detection and tracking |
| Canvas 2D API | Real-time visual rendering |
| MediaDevices API | Webcam access |
| `requestAnimationFrame` | Animation and rendering loop |
| jsDelivr CDN | Delivery of external library resources |

The project uses vanilla JavaScript and does not require a frontend framework or build system for its core functionality.

---

## 📂 Project Structure

The project follows a modular structure that separates application logic, visual styling, assets, documentation, and tests.

```text
GestureSphere/
│
├── index.html
├── README.md
├── .gitignore
│
├── assets/
│   └── rasengan.mp4          # Optional video asset
│
├── css/
│   └── stylesheets and visual styling
│
├── js/
│   ├── main.js               # Application entry point
│   ├── rasenganController.js # Energy effect controller
│   └── supporting modules    # Other application modules
│
├── docs/
│   └── Project documentation
│
└── tests/
    └── Test files and related resources
```

**Note:** This is a representative overview. Exact filenames and subfolders may differ depending on the files present in your local project. Existing filenames should remain unchanged unless the corresponding code references are updated as well.

---

## 🚀 Getting Started

Follow these steps to run GestureSphere locally.

### Prerequisites

You need:

- A Windows, macOS, or Linux computer.
- A modern web browser such as Google Chrome, Microsoft Edge, or Firefox.
- A working webcam.
- Python installed, or another local HTTP server.
- An internet connection if the application loads external libraries from a CDN.

Python is used only to serve the project locally. The application's core functionality does not require a Python backend.

### Step 1: Open the Project

Open the project folder in Visual Studio Code.

Make sure the folder you open contains:

- `index.html`
- `css/`
- `js/`
- `assets/`
- `README.md`

### Step 2: Open the Terminal

In VS Code, select:

**Terminal → New Terminal**

Make sure the terminal is inside the project directory containing `index.html`.

### Step 3: Start the Local Web Server

Run the following command in the terminal:

```powershell
py -m http.server 8000
```

If the `py` command is unavailable but Python is installed, try:

```powershell
python -m http.server 8000
```

Keep the terminal open while using the application.

### Step 4: Open GestureSphere

Open your browser and visit:

http://localhost:8000

The application should load from your local project.

**Important:** Open the local server address rather than opening `index.html` directly. Serving the application over HTTP helps browser camera permissions and JavaScript modules work correctly.

### Step 5: Allow Camera Access

When prompted by the browser:

1. Select **Allow** for camera access.
2. Position your hands within the webcam frame.
3. Wait for the hand-tracking model to initialize.
4. Try opening your palm and closing your fist.

You should see the visual effects respond to recognized gestures.

### Step 6: Stop the Server

When you finish testing, return to the VS Code terminal and press:

```text
Ctrl + C
```

This stops the local web server.

---

## 🖐️ How to Use GestureSphere

### Basic Interaction

**1. Start the camera**

Launch the application and grant webcam permission.

**2. Show your open palm**

Hold your palm toward the camera. The application should recognize the gesture and display or charge the energy orb.

**3. Close your fist**

Close your hand into a fist. The application should trigger the configured release or fading animation.

**4. Try both hands**

Position both hands within the camera frame. Each hand should control its corresponding effect independently when both hands are detected and tracked successfully.

**5. Explore the controls**

Use the available interface controls to experiment with visual effects, gesture sensitivity, camera mirroring, and other supported settings.

### Tips for Better Tracking

- Keep your hands inside the camera frame.
- Use sufficient, even lighting.
- Avoid placing your hands too close to the camera.
- Keep the background reasonably uncluttered.
- Move your hands at a moderate speed.
- Ensure your webcam is not being exclusively used by another application.

---

## 🏗️ Application Architecture

GestureSphere follows a client-side application architecture.

### Processing Flow

```text
Webcam
   |
   v
Camera Frame Capture
   |
   v
MediaPipe Hands
   |
   v
Hand Landmark Detection
   |
   v
Gesture Recognition
   |
   v
Gesture State Management
   |
   v
Visual Effect Controller
   |
   v
Canvas Rendering
   |
   v
Interactive Visual Output
```

### Component Responsibilities

**1. User Interface**

The HTML and CSS define the application's layout, controls, visual presentation, and status information.

**2. Camera Input**

The browser's MediaDevices API provides webcam access after the user grants permission.

**3. Hand Tracking**

MediaPipe Hands processes camera frames to estimate hand landmarks.

**4. Gesture Recognition**

Application logic interprets landmark positions to determine the recognized hand pose.

**5. Effect Management**

The effect controller manages the visual state associated with recognized gestures.

**6. Rendering**

The Canvas 2D API renders the interactive orb, particles, and other visual effects.

**7. Animation Loop**

`requestAnimationFrame` coordinates continuous rendering and animation updates.

---

## 🔒 Privacy and Security

GestureSphere is designed to run primarily in the browser without requiring a dedicated application backend.

### Camera Permission

- The browser requests permission before allowing webcam access.
- Users can deny or revoke camera permission through their browser settings.
- The camera should be used only while the application requires it.

### Client-Side Processing

The application's hand-tracking pipeline is intended to process camera frames locally in the browser.

The project does not require a custom backend to perform its core gesture recognition and visual rendering.

However, external libraries may be downloaded from a CDN, and browser or network activity may involve third-party services. Review the dependencies and network requests before making broader privacy claims.

### Data Collection

The project does not need a user account or application database for its core functionality.

Do not assume that analytics, logging, or third-party requests are absent without checking the implementation and its dependencies.

### Security Recommendations

Before deploying the project publicly:

- Use HTTPS for hosted deployments.
- Review third-party JavaScript dependencies.
- Keep dependencies updated.
- Avoid collecting or transmitting camera data unnecessarily.
- Validate any future user-supplied input.
- Never place API keys or secrets in frontend JavaScript.
- Review the application's Content Security Policy.
- Confirm that camera access stops when it is no longer needed.

---

## 🌐 Browser Compatibility

GestureSphere requires browser support for its camera, JavaScript, and rendering functionality.

| Requirement | Purpose |
|---|---|
| JavaScript ES Modules | Loads modular application code |
| MediaDevices API | Accesses the webcam |
| Canvas 2D API | Renders visual effects |
| `requestAnimationFrame` | Drives animation |
| WebAssembly support, where required by dependencies | Supports relevant computer-vision components |
| HTTPS or localhost | Supports secure browser camera access |

A recent version of Google Chrome or Microsoft Edge is a good starting point.

Actual performance and compatibility depend on the browser, device hardware, operating system, and external dependencies.

---

## ⚙️ Configuration

The project may expose configuration options through its JavaScript modules.

For example, the application may use a configuration object such as:

```javascript
window.RASENGAN_CONFIG
```

The exact options depend on the existing implementation.

Before changing configuration values:

1. Locate the configuration object in the JavaScript files.
2. Review the available properties.
3. Check where each property is used.
4. Change one value at a time.
5. Reload the application and verify the result.

Avoid renaming internal identifiers simply to match the new project branding. Names such as `RASENGAN_CONFIG` and `rasenganController.js` can remain unchanged if the existing application depends on them.

---

## 🧪 Testing and Validation

Test the application after making code or configuration changes.

### Functional Test Checklist

| Test | Expected Result |
|---|---|
| Application loads | The main interface appears without a fatal error |
| Camera permission granted | Webcam access can initialize |
| Camera permission denied | The application does not receive camera frames |
| Open-palm gesture | The configured orb charging behavior activates |
| Closed-fist gesture | The configured release or fading behavior activates |
| Hand leaves the frame | Tracking and visual effects respond appropriately |
| Two hands detected | Both hands can control independent effects |
| Visual controls | Available controls produce their intended changes |
| Camera stopped | Camera processing stops when the application is designed to stop it |
| Page refreshed | The application can be initialized again |

### Browser Developer Tools

If something does not work:

1. Open GestureSphere in your browser.
2. Press `F12`.
3. Open the **Console** tab.
4. Look for red error messages.
5. Open the **Network** tab if external resources fail to load.
6. Check the webcam permission settings if camera initialization fails.

A successful test should be based on actual execution rather than assumptions.

---

## 🐛 Troubleshooting

### The Website Shows a Directory Listing

**Possible cause:** The server was started from the wrong directory.

**Solution:**

1. Stop the server with `Ctrl + C`.
2. Open the project folder containing `index.html`.
3. Start the server again:

```powershell
py -m http.server 8000
```

4. Visit:

http://localhost:8000

### The Camera Does Not Start

Check that:

- Browser camera permission is enabled.
- The correct webcam is selected.
- Another application is not blocking camera access.
- You are accessing the application through `localhost` or a suitable HTTPS deployment.
- The browser console does not report camera or initialization errors.

### Hand Tracking Does Not Work

Try the following:

- Improve lighting.
- Keep your hands within the camera frame.
- Wait for the tracking model to initialize.
- Check whether external library resources loaded successfully.
- Review the browser console for errors.

### The Visual Effect Does Not Respond to Gestures

Check that:

- Hand landmarks are being detected.
- The gesture recognition logic is running.
- The expected DOM elements and canvas are present.
- The effect controller is initialized.
- No JavaScript errors are preventing updates.

### An External Library Fails to Load

If the project depends on CDN-hosted resources:

- Check your internet connection.
- Inspect the browser's Network tab.
- Verify that the dependency URL is correct.
- Check whether the CDN resource is blocked by a network or browser policy.

### The Optional Video Orb Does Not Appear

If the application is configured to use the video-based orb, verify that the expected file exists:

```text
assets/rasengan.mp4
```

Also check the browser console and Network tab for missing-file errors.

The video-based mode may not work until a compatible video asset is provided.

### The Application Is Slow

Performance depends on webcam resolution, tracking complexity, rendering workload, and device hardware.

Possible improvements include:

- Reducing unnecessary rendering work.
- Avoiding repeated creation of expensive objects inside animation loops.
- Optimizing particle counts.
- Reviewing camera resolution settings.
- Avoiding unnecessary DOM updates.
- Testing on a recent browser.

Make performance changes carefully and verify that gesture tracking still works correctly.

---

## 🚀 Deployment

GestureSphere can be hosted as a static website because its core functionality does not require a custom backend.

Possible hosting options include static-site hosting services such as:

- GitHub Pages
- Netlify
- Cloudflare Pages

Before deploying:

1. Confirm that the project works locally.
2. Check that all required files are included.
3. Verify relative paths to JavaScript, CSS, and assets.
4. Review third-party dependencies.
5. Test camera access on the hosted HTTPS website.
6. Confirm that no private information or secrets are included in the repository.
7. Test the application on the deployed URL.

**Important:** Hosting compatibility depends on the application's dependencies and configuration. Test the deployed version instead of assuming that every feature will work identically on every host.

---

## ⚠️ Known Limitations

- Gesture recognition can be affected by lighting, camera quality, hand position, and occlusion.
- Tracking performance depends on device hardware and browser capabilities.
- Rapid hand movements may temporarily reduce tracking stability.
- Visual effects may perform differently across devices.
- External CDN resources require network access unless dependencies are hosted locally.
- The optional video-based orb requires a compatible video asset.
- Gesture recognition is based on the implemented landmark logic and should not be treated as a general-purpose sign-language recognition system.
- The application is an interactive demonstration and is not intended for safety-critical control.

---

## 🔮 Future Improvements

Potential future enhancements include:

- Additional hand gestures and interaction modes.
- Improved gesture classification and smoothing.
- Customizable visual effects.
- User-adjustable rendering quality.
- Performance profiling and optimization.
- Better accessibility and keyboard controls.
- Additional visual themes and color settings.
- Offline support with locally hosted dependencies.
- Expanded automated testing.
- Improved error messages and camera status feedback.
- More detailed documentation and setup guidance.

These are potential improvements, not claims that the features are already implemented.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

A suggested contribution workflow:

1. Fork the repository.
2. Create a branch for your change.
3. Make a focused improvement.
4. Test the application locally.
5. Check the browser console for errors.
6. Submit a pull request describing the change.

For bug reports, include:

- A short description of the issue.
- Steps to reproduce it.
- Your browser and operating system.
- Relevant console errors.
- Screenshots or recordings when useful.

Do not include private information or camera recordings containing other people without their consent.

---

## 📄 License

Check the repository for a `LICENSE` file before redistributing or reusing the project.

If no license file is present, the project's reuse and redistribution permissions should not be assumed.

Third-party libraries, assets, and media may have separate license requirements. Review their terms before distributing the application.

---

## ⚖️ Disclaimer

GestureSphere is an independent interactive software project.

The Rasengan-inspired visual effect is a fan-inspired implementation for demonstration purposes. GestureSphere is not affiliated with or endorsed by the rights holders of Naruto or related franchises.

Any third-party trademarks, libraries, and assets remain the property of their respective owners.

---

## 👨‍💻 Project Summary

GestureSphere demonstrates how browser-based computer vision and real-time graphics can be combined to create a touchless interactive experience.

By connecting webcam input, hand landmark detection, gesture recognition, and Canvas-based rendering, the project explores an intuitive way to interact with digital visual effects using natural hand movements.

**GestureSphere — Bringing Hand Gestures to Life in Real Time.**