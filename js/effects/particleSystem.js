// Fixed-size particle pool for one orb (no allocation while running; count can never grow past `capacity`).
// Particles orbit the orb centre in "orb radius" units and spiral inwards while charging,
// or fly outwards during a release.
export class ParticleSystem {
  constructor(capacity) {
    this.n = Math.max(0, Math.floor(capacity)) || 0;
    this.angle = new Float32Array(this.n); this.rad = new Float32Array(this.n); this.omega = new Float32Array(this.n);
    this.life = new Float32Array(this.n); this.maxLife = new Float32Array(this.n); this.size = new Float32Array(this.n);
    this.cursor = 0; this.acc = 0; this.alive = 0;
  }
  clear() { this.life.fill(0); this.alive = 0; this.acc = 0; }

  update(dtMs, spawnRate, releasing) {
    const dt = dtMs / 1000;
    if (spawnRate > 0 && this.n) {
      this.acc += spawnRate * dt;
      while (this.acc >= 1) {
        this.acc -= 1;
        for (let k = 0; k < this.n; k++) { // find a free slot, starting after the last used one
          const i = (this.cursor + k) % this.n;
          if (this.life[i] <= 0) {
            this.angle[i] = Math.random() * 6.2832; this.rad[i] = 1.1 + Math.random() * 0.9; this.omega[i] = (2.5 + Math.random() * 3) * (Math.random() < 0.85 ? 1 : -1);
            this.maxLife[i] = this.life[i] = 0.6 + Math.random() * 0.8; this.size[i] = 0.8 + Math.random() * 1.6; this.cursor = i + 1; break;
          }
        }
      }
    } else this.acc = 0;
    let alive = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; this.angle[i] += this.omega[i] * dt * (releasing ? 0.5 : 1);
      this.rad[i] += (releasing ? 3.2 : -0.9) * dt;
      if (this.rad[i] < 0.12) this.life[i] = 0;
      if (this.life[i] > 0) alive++;
    }
    this.alive = alive;
  }

  draw(ctx, cx, cy, R, alpha) {
    if (!this.alive) return;
    ctx.fillStyle = '#bff6ff';
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      const a = this.life[i] / this.maxLife[i];
      ctx.globalAlpha = Math.min(1, a * 1.5) * alpha;
      const r = this.rad[i] * R;
      ctx.beginPath(); ctx.arc(cx + Math.cos(this.angle[i]) * r, cy + Math.sin(this.angle[i]) * r, this.size[i] * (0.6 + 0.4 * a) * Math.max(1, R / 60), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
