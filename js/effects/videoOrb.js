// OPTIONAL video mode. Only used if assets/rasengan.mp4 exists on the user's machine and plays.
// The video is NOT shipped with this project (copyright). Its background is not assumed to be
// transparent: it is drawn with the "screen" blend mode, which makes pure black disappear.
export class VideoOrb {
  constructor(cfg) { this.cfg = cfg; this.video = null; this.ready = false; }

  check() { // resolves true if the file loads, false otherwise (missing file, bad codec, timeout)
    return new Promise((resolve) => {
      const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      let done = false;
      const finish = (ok) => { if (done) return; done = true; clearTimeout(to); if (ok) { this.video = v; this.ready = true; } else { v.removeAttribute('src'); v.load(); } resolve(ok); };
      const to = setTimeout(() => finish(false), this.cfg.checkTimeoutMs);
      v.addEventListener('loadeddata', () => finish(true), { once: true });
      v.addEventListener('error', () => finish(false), { once: true });
      v.src = this.cfg.src; v.load();
    });
  }
  async play() { if (!this.ready) return false; try { await this.video.play(); return true; } catch (e) { this.ready = false; return false; } }
  pause() { if (this.video) this.video.pause(); }

  draw(ctx, x, y, size, alpha) {
    const v = this.video; if (!this.ready || !v || v.readyState < 2 || !v.videoWidth) return false;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = alpha;
    const h = size * v.videoHeight / v.videoWidth; ctx.drawImage(v, x - size / 2, y - h / 2, size, h); ctx.restore(); return true;
  }
}
