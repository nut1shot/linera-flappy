import * as linera from "@linera/client";
import { Bird } from "./bird.js";
import { Pipe } from "./pipe.js";

const COUNTER_APP_ID = import.meta.env.VITE_COUNTER_APP_ID;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgImage = new Image();
bgImage.src = "./src/assets/background.png";

const baseImage = new Image();
baseImage.src = "./src/assets/base.png";

const gameOverImage = new Image();
gameOverImage.src = "./src/assets/gameover.png";

let count = 0;
let best = 0;
let bird = new Bird(canvas, ctx);
let pipes = [];
let frame = 0;
let gameOver = false;
let counter;
let showInstructions = true;
let isLoading = true;
let startGame = false;
let loadingProgress = 0;

function drawBackground() {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function drawBase() {
  ctx.drawImage(baseImage, 0, canvas.height - 112, canvas.width, 112);
}

function drawLoadingBar() {
  const barWidth = 180;
  const barHeight = 12;
  const x = (canvas.width - barWidth) / 2;
  const y = canvas.height / 2;
  const progress = Math.min(loadingProgress, 1);

  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, barWidth, barHeight);

  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, barWidth * progress, barHeight);

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x, y, barWidth, barHeight);

  ctx.font = "bold 10px 'Press Start 2P', cursive";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.fillText("Loading chain...", canvas.width / 2, y - 10);
}

function drawGameOver() {
  const imgWidth = 192;
  const imgHeight = 42;
  const x = (canvas.width - imgWidth) / 2;
  const y = canvas.height / 3 - imgHeight;
  ctx.drawImage(gameOverImage, x, y, imgWidth, imgHeight);

  // Score and best
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px 'Press Start 2P', cursive";
  ctx.textAlign = "center";
  ctx.fillText(`SCORE: ${count}`, canvas.width / 2, y + imgHeight + 40);
  ctx.fillText(`BEST: ${best}`, canvas.width / 2, y + imgHeight + 70);
}

function resetGame() {
  bird = new Bird(canvas, ctx);
  pipes = [];
  frame = 0;
  gameOver = false;
  if (count > best) best = count;
  count = 0;
  showInstructions = true;
}

function gameLoop() {
  drawBackground();

  if (isLoading) {
    loadingProgress = Math.min(loadingProgress + 0.01, 1);
    drawLoadingBar();
    requestAnimationFrame(gameLoop);
    frame++;
    return;
  }

  if (!startGame) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.fillText(
      "TAP or PRESS SPACE to FLY",
      canvas.width / 2,
      canvas.height / 4
    );
    requestAnimationFrame(gameLoop);
    return;
  }

  bird.update();
  bird.draw();

  if (frame % 120 === 0) {
    pipes.push(new Pipe(canvas, ctx));
  }

  pipes.forEach((pipe) => {
    pipe.update();
    pipe.draw();

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      count++;
      counter.query('{ "query": "mutation { increment(value: 1) }" }');
    }

    if (pipe.collides(bird)) {
      gameOver = true;
    }
  });

  pipes = pipes.filter((p) => p.x + p.width > 0);

  drawBase();

  if (showInstructions) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.fillText(
      "TAP or PRESS SPACE to FLY",
      canvas.width / 2,
      canvas.height / 4
    );
  }

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    drawGameOver();
    restartBtn.classList.add("show");
  }

  frame++;
}

canvas.addEventListener("click", () => {
  if (isLoading) return;
  if (!gameOver) {
    bird.jump();
    showInstructions = false;
  }
});

document.addEventListener("keydown", (e) => {
  if (isLoading) return;
  if (e.code === "Space" && !gameOver) {
    e.preventDefault();
    bird.jump();
    showInstructions = false;
  }
});

const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", () => {
  restartBtn.classList.remove("show");
  resetGame();
  gameLoop();
});

const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {
  startBtn.classList.remove("show");
  startGame = true;
});

async function run() {
  await linera.default();
  const faucet = await new linera.Faucet(import.meta.env.VITE_COUNTER_APP_URL);
  const wallet = await faucet.createWallet();
  const client = await new linera.Client(wallet);
  document.getElementById("chain-id").innerText = await faucet.claimChain(
    client
  );
  counter = await client.frontend().application(COUNTER_APP_ID);

  const response = await counter.query('{ "query": "query { value }" }');
  count = JSON.parse(response).data.value;

  isLoading = false;
  showInstructions = true;
  startBtn.classList.add("show");
}

window.addEventListener("load", () => {
  run();
  gameLoop();
});
