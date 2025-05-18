export class Pipe {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = canvas.width;
    this.width = 52;
    this.gap = 140;
    this.top = Math.random() * (canvas.height - this.gap - 100);
    this.bottom = this.top + this.gap;
    this.speed = 1.5;
    this.passed = false;

    this.topImage = new Image();
    this.topImage.src = "/assets/pipe-top.png";

    this.bottomImage = new Image();
    this.bottomImage.src = "/assets/pipe-bottom.png";
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    this.ctx.drawImage(
      this.topImage,
      this.x,
      this.top - this.topImage.height,
      this.width,
      this.topImage.height
    );
    this.ctx.drawImage(
      this.bottomImage,
      this.x,
      this.bottom,
      this.width,
      this.canvas.height - this.bottom
    );
  }

  collides(bird) {
    const inPipeX =
      bird.x + bird.width > this.x && bird.x < this.x + this.width;

    const hitTop = bird.y < this.top;
    const hitBottom = bird.y + bird.height > this.bottom;

    return inPipeX && (hitTop || hitBottom);
  }
}
