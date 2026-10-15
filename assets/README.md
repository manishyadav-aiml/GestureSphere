# Assets

This project needs **no assets** to run: the Rasengan is drawn procedurally with Canvas 2D (original code in this project).

## Optional: `assets/rasengan.mp4` (video orb mode)
- **Not included.** The clip used by the original `strawluck/naruto-rasengan` project is described there as a third-party asset; its licence is unknown and this project did not inspect it.
- *Naruto* and the Rasengan are the property of Masashi Kishimoto / Shueisha / their licensors. Do not redistribute or publish footage you do not have rights to.
- If you place your own file here for **local** use, tick "Video orb" in the app. If the file is missing or cannot play, the app says so and keeps using the procedural effect. (The first time you tick the option without the file, Chrome's console shows a harmless 404.)
- The video is drawn with the "screen" blend mode, so a **black** background disappears. A video with a non-black background will look wrong; this is not auto-detected.
- `assets/rasengan.mp4` is listed in `.gitignore` so it is not committed by accident.
