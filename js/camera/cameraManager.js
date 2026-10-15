// Owns the webcam MediaStream. Nothing is recorded or uploaded; frames only go to the local video element.
export class CameraError extends Error {
  constructor(code, message) { super(message); this.name = 'CameraError'; this.code = code; }
}

function mapError(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return new CameraError('PERMISSION_DENIED', 'Camera permission was denied. Click the camera icon in Chrome\'s address bar, allow access, then press Start again.');
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return new CameraError('NO_CAMERA', 'No camera was found. Connect a webcam and press Start again.');
  if (n === 'NotReadableError' || n === 'AbortError') return new CameraError('IN_USE', 'The camera is in use by another app or tab. Close it and press Start again.');
  return new CameraError('UNKNOWN', `Could not start the camera (${(e && e.message) || n || 'unknown error'}).`);
}

export class CameraManager {
  constructor(video) { this.video = video; this.stream = null; this.onEnded = null; this._ended = null; }

  static isSupported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  get active() { return this.stream !== null; }
  get size() { return { width: this.video.videoWidth, height: this.video.videoHeight }; }

  async start({ width, height }) {
    if (this.stream) return;
    if (!CameraManager.isSupported()) throw new CameraError('UNSUPPORTED', 'This browser does not support webcam access. Use a current version of Google Chrome and open the page via http://localhost:8000.');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: width }, height: { ideal: height }, facingMode: 'user' }, audio: false }); }
    catch (e) { throw mapError(e); }
    this.stream = stream;
    this._ended = () => { if (this.stream) { this.stop(); if (this.onEnded) this.onEnded(); } };
    stream.getTracks().forEach((t) => t.addEventListener('ended', this._ended));
    this.video.srcObject = stream;
    try {
      await this.video.play();
      if (this.video.readyState < 1) await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error('timeout')), 5000);
        this.video.addEventListener('loadedmetadata', () => { clearTimeout(to); res(); }, { once: true });
      });
    } catch (e) { this.stop(); throw new CameraError('PLAY_FAILED', 'The camera started but the video could not play. Press Start to try again.'); }
  }

  stop() {
    const s = this.stream; this.stream = null;
    if (s) s.getTracks().forEach((t) => { t.removeEventListener('ended', this._ended); t.stop(); });
    this._ended = null;
    this.video.pause(); this.video.srcObject = null;
  }
}
