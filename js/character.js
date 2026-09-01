class PixelCharacter {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.frame = 0;
    this.frameTimer = 0;
    this.isWalking = false;
    this.facingRight = true;
    this.y = 0;
    this.targetY = 0;
    this.scale = options.scale ?? 2;
    this.patrolMode = options.patrolMode ?? false;

    this.walkSpeed = 0.12;
    this.idleBob = 0;

    this.palette = {
      skin: "#ffcd75",
      hair: "#262b44",
      shirt: "#41a6f6",
      pants: "#68386c",
      shoes: "#0f1020",
      accent: "#38b764",
    };
  }

  setTargetY(y) {
    this.targetY = y;
    this.isWalking = Math.abs(this.y - this.targetY) > 1;
  }

  setFacingRight(right) {
    this.facingRight = right;
  }

  update(dt) {
    if (this.patrolMode) {
      this.isWalking = true;
      this.frameTimer += dt;
      if (this.frameTimer > 90) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }
      return;
    }

    const diff = this.targetY - this.y;
    if (Math.abs(diff) > 0.5) {
      this.y += diff * this.walkSpeed;
      this.isWalking = true;
      this.frameTimer += dt;
      if (this.frameTimer > 100) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }
    } else {
      this.y = this.targetY;
      this.isWalking = false;
      this.frame = 0;
      this.idleBob = Math.sin(Date.now() / 500) * 1;
    }
  }

  draw() {
    const ctx = this.ctx;
    const s = this.scale;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.palette;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h - 4 + (this.isWalking ? 0 : this.idleBob));
    if (!this.facingRight) ctx.scale(-1, 1);

    const legOffset = this.isWalking ? [0, 2, 0, -2][this.frame] : 0;

    this.pixel(ctx, -4, 10 + legOffset, 3, 5, p.shoes, s);
    this.pixel(ctx, 1, 10 - legOffset, 3, 5, p.shoes, s);

    this.pixel(ctx, -5, 6, 4, 5, p.pants, s);
    this.pixel(ctx, 1, 6, 4, 5, p.pants, s);

    this.pixel(ctx, -5, 1, 10, 6, p.shirt, s);
    this.pixel(ctx, -4, -7, 8, 8, p.skin, s);
    this.pixel(ctx, -4, -9, 8, 3, p.hair, s);
    this.pixel(ctx, -5, -8, 2, 2, p.hair, s);
    this.pixel(ctx, 3, -8, 2, 2, p.hair, s);

    this.pixel(ctx, -2, -4, 2, 2, "#f4f4f4", s);
    this.pixel(ctx, 2, -4, 2, 2, "#f4f4f4", s);
    this.pixel(ctx, -1, -3, 1, 1, p.shoes, s);
    this.pixel(ctx, 3, -3, 1, 1, p.shoes, s);

    if (!this.isWalking) {
      this.pixel(ctx, 6, 2, 2, 2, p.accent, s);
    }

    ctx.restore();
  }

  pixel(ctx, x, y, w, h, color, s) {
    ctx.fillStyle = color;
    ctx.fillRect(x * s, y * s, w * s, h * s);
  }
}
