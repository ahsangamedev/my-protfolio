class NavWalker {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.track = canvas.parentElement;
    this.bubble = document.getElementById("nav-speech-bubble");
    this.textEl = document.getElementById("nav-speech-text");

    this.sprite = new RunSpriteSheet();
    this.x = -32;
    this.speed = 0.09;
    this.frame = 0;
    this.frameTimer = 0;
    this.applyResponsiveScale();

    this.state = "running";
    this.hasPausedThisLap = false;
    this.pauseTimer = 0;
    this.pauseDuration = 2600;

    this.messages = [
      "please hire me",
      "my resume is also here",
      "cant wait to get hired",
      "love money",
      "you are handsome",
    ];
    this.messageIndex = 0;
  }

  applyResponsiveScale() {
    const w = window.innerWidth;
    if (w <= 480) {
      this.scale = 1.5;
    } else if (w <= 768) {
      this.scale = 1.75;
    } else {
      this.scale = 2;
    }
    this.charWidth = RunSpriteSheet.FRAME_W * this.scale;
  }

  getScreenWidth() {
    return window.visualViewport?.width ?? window.innerWidth;
  }

  update(dt) {
    if (this.state === "pausing") {
      this.pauseTimer -= dt;
      this.frame = 0;
      this.updateBubblePosition();

      if (this.pauseTimer <= 0) {
        this.state = "running";
        this.hideBubble();
        this.messageIndex = (this.messageIndex + 1) % this.messages.length;
      }

      this.canvas.style.left = `${this.x}px`;
      this.draw();
      return;
    }

    this.x += this.speed * dt;

    const screenW = this.getScreenWidth();
    const centerX = screenW / 2 - this.charWidth / 2;

    if (!this.hasPausedThisLap && this.x >= centerX) {
      this.x = centerX;
      this.state = "pausing";
      this.pauseTimer = this.pauseDuration;
      this.hasPausedThisLap = true;
      this.showBubble(this.messages[this.messageIndex]);
      this.canvas.style.left = `${this.x}px`;
      this.draw();
      return;
    }

    if (this.x > screenW + this.charWidth) {
      this.x = -this.charWidth;
      this.hasPausedThisLap = false;
    }

    this.frameTimer += dt;
    if (this.frameTimer > 70) {
      this.frame = (this.frame + 1) % RunSpriteSheet.FRAME_COUNT;
      this.frameTimer = 0;
    }

    this.canvas.style.left = `${this.x}px`;
  }

  draw() {
    this.sprite.draw(this.ctx, this.frame, 0, 0, this.scale);
  }

  showBubble(text) {
    if (!this.bubble || !this.textEl) return;
    this.textEl.textContent = text;
    this.bubble.classList.remove("hidden");
    this.updateBubblePosition();
  }

  hideBubble() {
    if (!this.bubble) return;
    this.bubble.classList.add("hidden");
  }

  updateBubblePosition() {
    if (!this.bubble || this.bubble.classList.contains("hidden")) return;

    const screenW = this.getScreenWidth();
    const mouthX = this.x + this.charWidth * 0.72;
    const padding = Math.min(100, screenW * 0.12);
    const clampedX = Math.max(padding, Math.min(screenW - padding, mouthX));

    this.bubble.style.left = `${clampedX}px`;
    this.bubble.style.top = window.innerWidth <= 480 ? "-4px" : "-8px";
  }

  resetPosition() {
    this.applyResponsiveScale();
    this.x = -this.charWidth;
    this.hasPausedThisLap = false;
    this.state = "running";
    this.hideBubble();
  }
}
