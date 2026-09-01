class RunSpriteSheet {
  static FRAME_W = 16;
  static FRAME_H = 16;
  static FRAME_COUNT = 6;

  constructor() {
    this.sheet = document.createElement("canvas");
    this.sheet.width = RunSpriteSheet.FRAME_W * RunSpriteSheet.FRAME_COUNT;
    this.sheet.height = RunSpriteSheet.FRAME_H;
    this.palette = {
      skin: "#ffcd75",
      hair: "#262b44",
      shirt: "#41a6f6",
      pants: "#68386c",
      shoes: "#0f1020",
    };
    this.build();
  }

  build() {
    const ctx = this.sheet.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.sheet.width, this.sheet.height);

    const legCycles = [
      [0, 2],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-1, 2],
    ];

    for (let i = 0; i < RunSpriteSheet.FRAME_COUNT; i++) {
      this.drawFrame(ctx, i * RunSpriteSheet.FRAME_W, legCycles[i], i);
    }
  }

  drawFrame(ctx, offsetX, [legL, legR], frameIndex) {
    const p = this.palette;
    const bob = frameIndex % 2;
    const base = 1;

    this.rect(ctx, offsetX + 4, base + 11 + legL - bob, 3, 4, p.shoes);
    this.rect(ctx, offsetX + 9, base + 11 + legR - bob, 3, 4, p.shoes);

    this.rect(ctx, offsetX + 3, base + 7 + legL - bob, 4, 4, p.pants);
    this.rect(ctx, offsetX + 9, base + 7 + legR - bob, 4, 4, p.pants);

    this.rect(ctx, offsetX + 3, base + 3 - bob, 10, 5, p.shirt);
    this.rect(ctx, offsetX + 4, base + 0 - bob, 8, 4, p.skin);
    this.rect(ctx, offsetX + 4, base - 1 - bob, 8, 2, p.hair);

    this.rect(ctx, offsetX + 5, base + 1 - bob, 2, 2, "#f4f4f4");
    this.rect(ctx, offsetX + 9, base + 1 - bob, 2, 2, "#f4f4f4");
    this.rect(ctx, offsetX + 6, base + 2 - bob, 1, 1, p.shoes);
    this.rect(ctx, offsetX + 10, base + 2 - bob, 1, 1, p.shoes);

    if (frameIndex % 3 === 0) {
      this.rect(ctx, offsetX + 12, base + 5 - bob, 2, 2, "#38b764");
    }
  }

  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  draw(ctx, frame, x, y, scale = 2) {
    const { FRAME_W, FRAME_H } = RunSpriteSheet;
    const idx = frame % RunSpriteSheet.FRAME_COUNT;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.sheet,
      idx * FRAME_W,
      0,
      FRAME_W,
      FRAME_H,
      x,
      y,
      FRAME_W * scale,
      FRAME_H * scale
    );
  }
}
