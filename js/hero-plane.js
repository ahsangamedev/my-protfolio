class HeroPlane {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.scale = window.innerWidth <= 768 ? 2 : 2.5;
    this.active = false;
    this.width = 0;
    this.height = 0;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = 0.05;
    this.propFrame = 0;
    this.propTimer = 0;
    this.smoke = [];
    this.maxSmoke = 40;
    this.padding = 52;

    this.palette = {
      body: "#41a6f6",
      bodyDark: "#262b44",
      wing: "#3a4466",
      cockpit: "#5dadec",
      window: "#f4f4f4",
      prop: "#e8e8e8",
      propBlur: "#9badb7",
      hub: "#68386c",
      stripe: "#38b764",
      smoke: "#9badb7",
    };

    this.resize();
    this.pickWaypoint();

    window.addEventListener("resize", () => this.resize());
    this.observeVisibility();
  }

  observeVisibility() {
    const section = document.getElementById("home");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        this.active = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
  }

  resize() {
    const section = document.getElementById("home");
    if (!section || !this.canvas) return;

    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.width = rect.width;
    this.height = rect.height;
    this.scale = window.innerWidth <= 768 ? 2 : 2.5;
    this.maxSmoke = window.innerWidth <= 768 ? 24 : 40;

    if (this.x === 0 && this.y === 0) {
      this.x = this.width * 0.7;
      this.y = this.height * 0.25;
    }

    this.x = this.clamp(this.x, this.padding, this.width - this.padding);
    this.y = this.clamp(this.y, this.padding, this.height - this.padding);
    this.pickWaypoint();
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  pickWaypoint() {
    if (!this.width || !this.height) return;

    this.targetX = this.padding + Math.random() * (this.width - this.padding * 2);
    this.targetY = this.padding + Math.random() * (this.height - this.padding * 2);
  }

  update(dt) {
    if (!this.active || !this.width || !this.height) return;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 36) {
      this.pickWaypoint();
      return;
    }

    const step = Math.min(this.speed * dt, dist);
    const nx = dx / dist;
    const ny = dy / dist;

    this.vx = nx * step / Math.max(dt, 1);
    this.vy = ny * step / Math.max(dt, 1);
    this.x += nx * step;
    this.y += ny * step;
    this.angle = Math.atan2(ny, nx);

    this.propTimer += dt;
    if (this.propTimer > 55) {
      this.propFrame = (this.propFrame + 1) % 4;
      this.propTimer = 0;
    }

    this.emitSmoke(dt);
    this.updateSmoke(dt);
  }

  emitSmoke(dt) {
    if (this.smoke.length >= this.maxSmoke) return;
    if (Math.random() > 0.55 + dt * 0.001) return;

    const tailDist = 16;
    const tailX = this.x - Math.cos(this.angle) * tailDist;
    const tailY = this.y - Math.sin(this.angle) * tailDist;
    const drift = 0.35;

    this.smoke.push({
      x: tailX + (Math.random() - 0.5) * 8,
      y: tailY + (Math.random() - 0.5) * 8,
      vx: -this.vx * drift + (Math.random() - 0.5) * 0.025,
      vy: -this.vy * drift + (Math.random() - 0.5) * 0.025 - 0.015,
      life: 1,
      size: 2 + Math.random() * 2,
    });
  }

  updateSmoke(dt) {
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const particle = this.smoke[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt * 0.0011;
      particle.size += dt * 0.0018;

      if (particle.life <= 0) {
        this.smoke.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    if (!this.active || !this.width || !this.height) return;

    this.drawSmoke(ctx);

    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(Date.now() / 380) * 1.5);
    ctx.rotate(this.angle);
    this.drawPlane(ctx);
    ctx.restore();
  }

  drawSmoke(ctx) {
    for (const particle of this.smoke) {
      const alpha = particle.life * 0.5;
      const size = Math.max(2, Math.round(particle.size));
      ctx.fillStyle = `rgba(155, 173, 183, ${alpha})`;
      ctx.fillRect(
        Math.round(particle.x - size / 2),
        Math.round(particle.y - size / 2),
        size,
        size
      );
    }
  }

  drawPlane(ctx) {
    const s = this.scale;
    const p = this.palette;
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.ceil(w * s), Math.ceil(h * s));
    };

    rect(-11, -1, 4, 2, p.bodyDark);
    rect(-10, -3, 3, 2, p.bodyDark);
    rect(-9, 2, 5, 2, p.wing);

    rect(-7, -2, 13, 5, p.body);
    rect(-7, -3, 11, 1, p.bodyDark);
    rect(-7, 3, 11, 1, p.bodyDark);

    rect(-1, 3, 9, 3, p.wing);
    rect(2, 3, 5, 1, p.stripe);

    rect(3, -1, 3, 2, p.cockpit);
    rect(4, -1, 2, 1, p.window);

    rect(5, 0, 2, 1, p.body);
    rect(7, 0, 1, 1, p.hub);

    this.drawPropeller(ctx, s, p);
  }

  drawPropeller(ctx, s, palette) {
    const cx = 8;
    const cy = 0;
    const blade = palette.prop;
    const blur = palette.propBlur;

    ctx.fillStyle = blade;

    if (this.propFrame === 0) {
      rectProp(ctx, cx, cy - 2, 4, 1, blade, s);
    } else if (this.propFrame === 1) {
      rectProp(ctx, cx + 1, cy - 3, 1, 5, blade, s);
    } else if (this.propFrame === 2) {
      for (let i = -2; i <= 2; i++) {
        rectProp(ctx, cx + i, cy + i, 1, 1, i % 2 === 0 ? blade : blur, s);
        rectProp(ctx, cx + i, cy - i, 1, 1, i % 2 === 0 ? blur : blade, s);
      }
    } else {
      for (let i = -2; i <= 2; i++) {
        rectProp(ctx, cx + i, cy - i, 1, 1, i % 2 === 0 ? blade : blur, s);
        rectProp(ctx, cx + i, cy + i, 1, 1, i % 2 === 0 ? blur : blade, s);
      }
    }

    ctx.fillStyle = palette.hub;
    rectProp(ctx, cx + 1, cy, 1, 1, palette.hub, s);
  }
}

function rectProp(ctx, x, y, w, h, color, s) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.ceil(w * s), Math.ceil(h * s));
}
