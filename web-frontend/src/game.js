import * as linera from "@linera/client";

const COUNTER_APP_ID = import.meta.env.VITE_COUNTER_APP_ID;

const milestones = [
  { value: 0, label: "Starting Point" },
  { value: 10, label: "Warm-Up" },
  { value: 40, label: "Halfway" },
  { value: 80, label: "Going Strong" },
  { value: 99, label: "Champion!" },
];

let count = 0;

function updateUI(score) {
  document.getElementById("count").innerText = score;

  let current = milestones[0];
  let next = null;
  for (let i = 0; i < milestones.length; i++) {
    if (score >= milestones[i].value) {
      current = milestones[i];
      next = milestones[i + 1] || null;
    }
  }

  document.getElementById("milestone-label").innerText = current.label;

  let percent = next
    ? ((score - current.value) / (next.value - current.value)) * 100
    : 100;
  document.getElementById("progress-fill").style.width =
    Math.min(percent, 100) + "%";
}

// Game logic
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

class Bird {
  constructor() {
    this.x = 60;
    this.y = canvas.height / 2;
    this.velocity = 0;
    this.gravity = 0.3;
    this.jumpStrength = -6;
    this.radius = 10;
  }

  jump() {
    this.velocity = this.jumpStrength;
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.y < 0) this.y = 0;
    if (this.y > canvas.height) this.y = canvas.height;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = "#ff2508";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Pipe {
  constructor() {
    this.x = canvas.width;
    this.width = 40;
    this.gap = 180;
    this.top = Math.random() * (canvas.height - this.gap - 50);
    this.bottom = this.top + this.gap;
    this.speed = 1.5;
    this.passed = false;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.fillStyle = "#888";
    ctx.fillRect(this.x, 0, this.width, this.top);
    ctx.fillRect(this.x, this.bottom, this.width, canvas.height - this.bottom);
  }

  collides(bird) {
    const inPipeX =
      bird.x + bird.radius > this.x &&
      bird.x - bird.radius < this.x + this.width;
    const hitTop = bird.y - bird.radius < this.top;
    const hitBottom = bird.y + bird.radius > this.bottom;
    return inPipeX && (hitTop || hitBottom);
  }
}

let bird = new Bird();
let pipes = [];
let frame = 0;
let gameOver = false;

function resetGame() {
  bird = new Bird();
  pipes = [];
  frame = 0;
  gameOver = false;
  count = 0;
  updateUI(count);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bird.update();
  bird.draw();

  if (frame % 120 === 0) {
    pipes.push(new Pipe());
  }

  pipes.forEach((pipe) => {
    pipe.update();
    pipe.draw();

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      count++;
      updateUI(count);
      counter.query('{ "query": "mutation { increment(value: 1) }" }');
    }

    if (pipe.collides(bird)) {
      gameOver = true;
    }
  });

  pipes = pipes.filter((p) => p.x + p.width > 0);

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    restartBtn.classList.add("show");
  }

  frame++;
}

const restartBtn = document.getElementById("restartBtn");

canvas.addEventListener("click", () => {
  if (gameOver) return;
  else {
    bird.jump();
  }
});

canvas.addEventListener("touchstart", () => {
  if (!gameOver) bird.jump();
});

let counter;

async function run() {
  await linera.default();
  const faucet = await new linera.Faucet(import.meta.env.VITE_COUNTER_APP_URL);
  const wallet = await faucet.createWallet();
  const client = await new linera.Client(wallet);
  document.getElementById("chain-id").innerText = await faucet.claimChain(
    client
  );
  counter = await client.frontend().application(COUNTER_APP_ID);

  const logs = document.getElementById("logs");
  client.onNotification((notification) => {
    const newBlock = notification.reason?.NewBlock;
    if (!newBlock) return;
    const entry = logs
      .getElementsByTagName("template")[0]
      .content.cloneNode(true);
    entry.querySelector(".height").textContent = newBlock.height;
    entry.querySelector(".hash").textContent = newBlock.hash;
    logs.insertBefore(entry, logs.firstChild);
  });

  const response = await counter.query('{ "query": "query { value }" }');
  count = JSON.parse(response).data.value;
  updateUI(count);
}

await run();
gameLoop();

restartBtn.addEventListener("click", () => {
  restartBtn.classList.remove("show");
  resetGame();
  gameLoop();
});
