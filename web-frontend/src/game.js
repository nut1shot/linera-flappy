import * as linera from "@linera/client";
import { Bird } from "./bird.js";
import { Pipe } from "./pipe.js";

const COUNTER_APP_ID = import.meta.env.VITE_APP_ID;
const LEADERBOARD_CHAIN_ID = import.meta.env.VITE_LEADERBOARD_CHAIN_ID;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgImage = new Image();
bgImage.src = "/assets/background.png";

const baseImage = new Image();
baseImage.src = "/assets/base.png";

const gameOverImage = new Image();
gameOverImage.src = "/assets/gameover.png";

// === Audio ===
const audioJump = new Audio("/assets/wing.wav");
const audioPoint = new Audio("/assets/point.wav");
const audioHit = new Audio("/assets/hit.wav");

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
let playerName = "";
let chainId = "";
let leaderboard = [];
let myRank = null;
let isGameConfigured = false;

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
  ctx.fillText("Loading ...", canvas.width / 2, y - 10);
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

  // Show rank if available
  if (myRank) {
    ctx.font = "bold 12px 'Press Start 2P', cursive";
    ctx.fillText(`RANK: #${myRank}`, canvas.width / 2, y + imgHeight + 100);
  }
}

async function setupGame() {
  try {
    const setupQuery = `mutation { setupGame(leaderboardChainId: "${LEADERBOARD_CHAIN_ID}",leaderboardName: "${playerName}") }`;

    const queryObject = { query: setupQuery };
    console.log(JSON.stringify(queryObject));
    await counter.query(JSON.stringify(queryObject));
    console.log("Game setup completed with leaderboard:", LEADERBOARD_CHAIN_ID);
    isGameConfigured = true;
  } catch (error) {
    console.log("Game setup skipped:", error.message);
  }
}

async function getBest() {
  const response = await counter.query('{ "query": "query { best }" }');
  return JSON.parse(response).data.best;
}

async function fetchLeaderboard() {
  try {
    if (isGameConfigured) {
      const requestQuery = {
        query: "mutation { requestLeaderboard }",
      };
      await counter.query(JSON.stringify(requestQuery));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const leaderboardQuery = {
      query: `query {
        leaderboard {
          playerName
          score
          chainId
        }
        myRank
        playerName
        best
      }`,
    };

    const response = await counter.query(JSON.stringify(leaderboardQuery));
    const data = JSON.parse(response).data;

    console.log("Leaderboard data:", data);
    leaderboard = data.leaderboard || [];
    myRank = data.myRank;
    playerName = data.playerName;
    best = data.best;

    // Update UI
    document.getElementById("player-name").innerText = playerName;
    document.getElementById("player-best").innerText = best;
    document.getElementById("player-rank").innerText = myRank || "-";
    updateLeaderboardUI();
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
  }
}

function updateLeaderboardUI() {
  const leaderboardList = document.getElementById("leaderboard-list");

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<div class="loading">No scores yet!</div>';
    return;
  }

  leaderboardList.innerHTML = leaderboard
    .slice(0, 10)
    .map((entry, index) => {
      const rank = index + 1;
      let className = "leaderboard-entry";

      if (rank === 1) className += " gold";
      else if (rank === 2) className += " silver";
      else if (rank === 3) className += " bronze";

      if (entry.playerName === playerName) className += " current-player";

      return `
        <div class="${className}">
          <div class="rank">${rank}</div>
          <div class="player-name">${entry.playerName}</div>
          <div class="score">${entry.score}</div>
        </div>
      `;
    })
    .join("");
}

async function submitScoreToLeaderboard() {
  try {
    if (isGameConfigured) {
      await counter.query('{ "query": "mutation { setBestAndSubmit }" }');
      await fetchLeaderboard();
    }
  } catch (error) {
    console.error("Failed to submit score:", error);
  }
}

async function resetGame() {
  bird = new Bird(canvas, ctx);
  pipes = [];
  frame = 0;
  gameOver = false;
  best = await getBest();
  count = 0;
  showInstructions = true;

  document.getElementById("player-best").innerText = best;
}

let showLeaderboard = false;

async function gameLoop() {
  drawBackground();

  if (count > 0) {
    ctx.font = "bold 20px 'Press Start 2P', cursive";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.fillText(count, canvas.width / 2, 40);
  }

  if (isLoading) {
    loadingProgress = Math.min(loadingProgress + 0.01, 1);
    drawLoadingBar();
    requestAnimationFrame(gameLoop);
    frame++;
    return;
  }

  if (!startGame) {
    ctx.font = "bold 10px 'Press Start 2P', cursive";
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
      audioPoint.play();
      counter.query('{ "query": "mutation { increment(value: 1) }" }');
    }

    if (pipe.collides(bird)) {
      gameOver = true;
      audioHit.play();
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
    await submitScoreToLeaderboard();
    best = await getBest();
    document.getElementById("player-best").innerText = best;
    drawGameOver();
    restartBtn.classList.add("show");
  }

  frame++;
}

canvas.addEventListener("click", () => {
  if (isLoading || showLeaderboard) return;
  if (!gameOver) {
    bird.jump();
    audioJump.play();
    showInstructions = false;
  }
});

document.addEventListener("keydown", (e) => {
  if (isLoading) return;

  if (e.code === "Space" && !gameOver) {
    e.preventDefault();
    bird.jump();
    audioJump.play();
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

const refreshBtn = document.getElementById("refreshBtn");
refreshBtn.addEventListener("click", async () => {
  await fetchLeaderboard();
});

function promptPlayerName() {
  const name = prompt("Enter your name (max 20 characters):");
  if (name && name.trim()) {
    return name.trim().substring(0, 20);
  }
  return `Player${Math.floor(Math.random() * 1000)}`;
}

async function run() {
  await linera.default();

  const faucet = await new linera.Faucet(import.meta.env.VITE_APP_URL);
  const wallet = await faucet.createWallet();
  const client = await new linera.Client(wallet);

  chainId = await faucet.claimChain(client);
  document.getElementById("chain-id").innerText = chainId;
  counter = await client.frontend().application(COUNTER_APP_ID);
  playerName = promptPlayerName();

  await setupGame();
  await fetchLeaderboard();

  count = 0;
  isLoading = false;
  showInstructions = true;
  startBtn.classList.add("show");
}

window.addEventListener("load", () => {
  run();
  gameLoop();
});
