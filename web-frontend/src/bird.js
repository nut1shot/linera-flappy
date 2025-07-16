export class Bird {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = 60;
    this.y = canvas.height / 2;
    this.velocity = 0;
    this.gravity = 0.3;
    this.jumpStrength = -6;
    this.width = 34;
    this.height = 24;
    this.image = new Image();
    this.image.src = "/assets/bird.png";
    this.baseHeight = 112;
  }

  jump() {
    this.velocity = this.jumpStrength;
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.y < 0) this.y = 0;
    if (this.y + this.height > this.canvas.height - this.baseHeight)
      this.y = this.canvas.height - this.baseHeight - this.height;
  }

  draw() {
    if (this.image.complete && this.image.naturalWidth !== 0) {
      this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      // Fallback: draw a simple rectangle
      this.ctx.fillStyle = "#ffcc00";
      this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}
