// Owns the webcam MediaStream.
// Camera frames stay in the browser and are not uploaded by this module.
//
// start(config): requests camera access and waits for video readiness.
// stop(): cancels pending startup and releases all camera tracks.
//
// Compatible with GestureSphere's existing main.js interface.

export const CAMERA_ERRORS = {
  PERMISSION: 'PERMISSION_DENIED',
  NOT_FOUND: 'NO_CAMERA',
  IN_USE: 'IN_USE',
  INSECURE: 'INSECURE_CONTEXT',
  UNSUPPORTED: 'UNSUPPORTED',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  PLAY_FAILED: 'PLAY_FAILED',
  UNKNOWN: 'UNKNOWN',
};

export class CameraError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
  }
}

// Converts browser errors into understandable messages.
function mapError(error) {
  const name = error?.name || '';

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return new CameraError(
        CAMERA_ERRORS.PERMISSION,
        'Camera permission was denied. Click the camera icon in Chrome’s address bar, allow camera access, then press Start again.'
      );

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return new CameraError(
        CAMERA_ERRORS.NOT_FOUND,
        'No camera was found. Connect a webcam and press Start again.'
      );

    case 'NotReadableError':
    case 'TrackStartError':
      return new CameraError(
        CAMERA_ERRORS.IN_USE,
        'The camera may be in use by another app or browser tab. Close other apps using the camera and try again.'
      );

    case 'OverconstrainedError':
      return new CameraError(
        CAMERA_ERRORS.UNKNOWN,
        'The camera cannot satisfy the requested video settings. Try another camera or adjust the camera resolution.'
      );

    case 'AbortError':
      return new CameraError(
        CAMERA_ERRORS.UNKNOWN,
        'The camera operation was interrupted. Press Start again.'
      );

    default:
      return new CameraError(
        CAMERA_ERRORS.UNKNOWN,
        `Could not start the camera: ${error?.message || name || 'unknown error'}.`
      );
  }
}

function codedError(code, message) {
  return new CameraError(code, message);
}

export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.onEnded = null;

    this.state = 'stopped';

    // Invalidates pending startup operations when Stop is pressed.
    this._startToken = 0;

    this._endedHandler = null;
    this._startupAbort = null;
  }

  static isSupported() {
    return Boolean(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  get active() {
    return this.stream !== null;
  }

  get size() {
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight,
    };
  }

  async start(config = {}) {
    // Prevent multiple simultaneous starts.
    if (this.state === 'starting' || this.state === 'running') {
      return this.size;
    }

    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext
    ) {
      throw codedError(
        CAMERA_ERRORS.INSECURE,
        'Camera access requires a secure page. Open the app using http://localhost:8000 or HTTPS.'
      );
    }

    if (!CameraManager.isSupported()) {
      throw codedError(
        CAMERA_ERRORS.UNSUPPORTED,
        'This browser does not support webcam access. Use an up-to-date version of Google Chrome.'
      );
    }

    this.state = 'starting';

    const token = ++this._startToken;
    let pendingStream = null;

    try {
      // Ask for camera permission only when Start is pressed.
      pendingStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            ideal: config.idealWidth ?? config.width ?? 1280,
          },
          height: {
            ideal: config.idealHeight ?? config.height ?? 720,
          },
          facingMode: 'user',
        },
        audio: false,
      });

      // Stop was pressed while the permission request was pending.
      if (token !== this._startToken) {
        pendingStream.getTracks().forEach((track) => track.stop());

        throw codedError(
          CAMERA_ERRORS.CANCELLED,
          'Camera startup was cancelled.'
        );
      }

      this.stream = pendingStream;

      this.video.srcObject = pendingStream;

      this._endedHandler = () => {
        // Ignore events from an old stream.
        if (this.stream !== pendingStream) return;

        this.stop();

        if (typeof this.onEnded === 'function') {
          this.onEnded();
        }
      };

      pendingStream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', this._endedHandler);
      });

      // Wait for video metadata and playback.
      await this._waitForVideo(
        token,
        Number(config.startTimeoutMs) > 0
          ? Number(config.startTimeoutMs)
          : 15000
      );

      if (token !== this._startToken) {
        throw codedError(
          CAMERA_ERRORS.CANCELLED,
          'Camera startup was cancelled.'
        );
      }

      this.state = 'running';

      return this.size;
    } catch (error) {
      // Release a stream obtained during a cancelled or failed start.
      if (pendingStream && this.stream !== pendingStream) {
        pendingStream.getTracks().forEach((track) => track.stop());
      }

      if (token === this._startToken) {
        this._release();
      }

      if (
        error instanceof CameraError &&
        error.code === CAMERA_ERRORS.CANCELLED
      ) {
        throw error;
      }

      // Preserve errors that already have useful camera classifications.
      if (error instanceof CameraError) {
        throw error;
      }

      throw mapError(error);
    }
  }

  async _waitForVideo(token, timeoutMs) {
    const video = this.video;

    const abortController = new AbortController();
    this._startupAbort = abortController;

    try {
      await new Promise((resolve, reject) => {
        let settled = false;

        const finish = (error = null) => {
          if (settled) return;

          settled = true;

          clearTimeout(timer);

          video.removeEventListener(
            'loadedmetadata',
            onReady
          );

          video.removeEventListener(
            'error',
            onError
          );

          abortController.signal.removeEventListener(
            'abort',
            onAbort
          );

          if (error) {
            reject(error);
          } else {
            resolve();
          }
        };

        const onReady = () => {
          finish();
        };

        const onError = () => {
          finish(
            codedError(
              CAMERA_ERRORS.PLAY_FAILED,
              'The camera started, but the video element reported an error.'
            )
          );
        };

        const onAbort = () => {
          finish(
            codedError(
              CAMERA_ERRORS.CANCELLED,
              'Camera startup was cancelled.'
            )
          );
        };

        const timer = setTimeout(() => {
          finish(
            codedError(
              CAMERA_ERRORS.TIMEOUT,
              'The camera took too long to start. Close other apps using it and try again.'
            )
          );
        }, timeoutMs);

        video.addEventListener(
          'loadedmetadata',
          onReady
        );

        video.addEventListener(
          'error',
          onError
        );

        abortController.signal.addEventListener(
          'abort',
          onAbort
        );

        // Check again after registering listeners to avoid missing
        // metadata that became available immediately before setup.
        if (video.readyState >= 1) {
          finish();
        } else if (token !== this._startToken) {
          finish(
            codedError(
              CAMERA_ERRORS.CANCELLED,
              'Camera startup was cancelled.'
            )
          );
        }
      });

      if (token !== this._startToken) {
        throw codedError(
          CAMERA_ERRORS.CANCELLED,
          'Camera startup was cancelled.'
        );
      }

      await video.play();

      if (token !== this._startToken) {
        throw codedError(
          CAMERA_ERRORS.CANCELLED,
          'Camera startup was cancelled.'
        );
      }
    } catch (error) {
      if (error instanceof CameraError) {
        throw error;
      }

      throw new CameraError(
        CAMERA_ERRORS.PLAY_FAILED,
        `The camera started, but the video could not play: ${error?.message || 'unknown error'}.`
      );
    } finally {
      if (this._startupAbort === abortController) {
        this._startupAbort = null;
      }
    }
  }

  _release() {
    const stream = this.stream;
    this.stream = null;

    if (stream) {
      stream.getTracks().forEach((track) => {
        if (this._endedHandler) {
          track.removeEventListener(
            'ended',
            this._endedHandler
          );
        }

        track.stop();
      });
    }

    this._endedHandler = null;

    this.video.pause();
    this.video.srcObject = null;

    this.state = 'stopped';
  }

  stop() {
    // Invalidate pending start() operations.
    this._startToken++;

    // Immediately wake up a startup waiting for video metadata.
    if (this._startupAbort) {
      this._startupAbort.abort();
      this._startupAbort = null;
    }

    this._release();
  }
}