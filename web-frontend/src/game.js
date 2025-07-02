// === Tournament Leaderboard Modal Functions ===
function showTournamentLeaderboardModal(tournament) {
  // Update modal header
  document.getElementById("tournament-leaderboard-title").textContent =
    tournament.name + " - Leaderboard";

  // Update tournament info
  document.getElementById("modal-tournament-name").textContent =
    tournament.name;
  document.getElementById("modal-tournament-status").textContent =
    tournament.status;
  document.getElementById("modal-tournament-players").textContent =
    tournament.playerCount;

  // Update status styling
  const statusEl = document.getElementById("modal-tournament-status");
  statusEl.className = "meta-value";
  if (tournament.status === "Active") {
    statusEl.classList.add("status-active");
  } else if (tournament.status === "Ending Soon") {
    statusEl.classList.add("status-ending-soon");
  } else {
    statusEl.classList.add("status-ended");
  }

  // Calculate and update time left
  updateModalTournamentTimer(tournament);

  // Update statistics
  updateTournamentStatistics(tournament);

  // Load tournament leaderboard data
  loadTournamentLeaderboardData(tournament);

  // Show modal
  tournamentLeaderboardModal.style.display = "flex";

  // Set up join button
  setupJoinTournamentButton(tournament);
}

function hideTournamentLeaderboardModal() {
  tournamentLeaderboardModal.style.display = "none";
}

function updateModalTournamentTimer(tournament) {
  if (!tournament.endTime) {
    document.getElementById("modal-tournament-time-left").textContent =
      "No end time";
    return;
  }

  const now = new Date().getTime();
  const endTime = new Date(tournament.endTime).getTime();
  const timeLeft = endTime - now;

  if (timeLeft > 0) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById("modal-tournament-time-left").textContent =
      days + "d " + hours + "h " + minutes + "m";
  } else {
    document.getElementById("modal-tournament-time-left").textContent = "Ended";
  }
}

function updateTournamentStatistics(tournament) {
  // No longer needed - stats panel removed
}

function generateTournamentStats(tournament) {
  // No longer needed - stats panel removed
  return null;
}

function loadTournamentLeaderboardData(tournament) {
  // Show loading state
  tournamentLeaderboardEntries.innerHTML = `
    <div class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading tournament leaderboard...</div>
    </div>
  `;

  // Simulate API call with timeout
  setTimeout(() => {
    const leaderboardData = generateTournamentLeaderboardData(tournament);
    renderTournamentLeaderboardEntries(leaderboardData);
    updateMyTournamentPosition(leaderboardData);
  }, 1000);
}

function generateTournamentLeaderboardData(tournament) {
  // Generate simplified mock leaderboard data
  const mockPlayers = [
    {
      name: "TournamentKing",
      score: tournament.maxScore,
      isCurrentPlayer: false,
    },
    {
      name: "FlappyPro",
      score: Math.floor(tournament.maxScore * 0.92),
      isCurrentPlayer: false,
    },
    {
      name: "BirdMaster",
      score: Math.floor(tournament.maxScore * 0.85),
      isCurrentPlayer: false,
    },
    {
      name: "SkyHighAce",
      score: Math.floor(tournament.maxScore * 0.78),
      isCurrentPlayer: false,
    },
    { name: playerName, score: best, isCurrentPlayer: true },
    {
      name: "WingCommander",
      score: Math.floor(tournament.maxScore * 0.65),
      isCurrentPlayer: false,
    },
    {
      name: "FeatherFall",
      score: Math.floor(tournament.maxScore * 0.58),
      isCurrentPlayer: false,
    },
    {
      name: "CloudDancer",
      score: Math.floor(tournament.maxScore * 0.52),
      isCurrentPlayer: false,
    },
    {
      name: "StormFlyer",
      score: Math.floor(tournament.maxScore * 0.45),
      isCurrentPlayer: false,
    },
    {
      name: "ThunderWing",
      score: Math.floor(tournament.maxScore * 0.38),
      isCurrentPlayer: false,
    },
    {
      name: "LightningBird",
      score: Math.floor(tournament.maxScore * 0.32),
      isCurrentPlayer: false,
    },
    {
      name: "CrystalFly",
      score: Math.floor(tournament.maxScore * 0.28),
      isCurrentPlayer: false,
    },
  ];

  // Sort by score descending
  return mockPlayers.sort((a, b) => b.score - a.score);
}

function renderTournamentLeaderboardEntries(leaderboardData) {
  if (!leaderboardData || leaderboardData.length === 0) {
    tournamentLeaderboardEntries.innerHTML = `
      <div class="leaderboard-loading">
        <div class="loading-text">No players in this tournament yet</div>
      </div>
    `;
    return;
  }

  const entriesHTML = leaderboardData
    .map((player, index) => {
      const rank = index + 1;
      let entryClass = "tournament-leaderboard-entry";

      if (player.isCurrentPlayer) {
        entryClass += " current-player";
      }

      if (rank === 1) entryClass += " rank-1";
      else if (rank === 2) entryClass += " rank-2";
      else if (rank === 3) entryClass += " rank-3";

      let playerBadge = "";
      if (rank === 1) playerBadge = "🥇";
      else if (rank === 2) playerBadge = "🥈";
      else if (rank === 3) playerBadge = "🥉";
      else if (player.isCurrentPlayer) playerBadge = "👤";

      return `
      <div class="${entryClass}">
        <div class="entry-rank">#${rank}</div>
        <div class="entry-player">
          <span class="entry-player-name">${player.name}</span>
          ${
            playerBadge
              ? `<span class="entry-player-badge">${playerBadge}</span>`
              : ""
          }
        </div>
        <div class="entry-score">${player.score}</div>
      </div>
    `;
    })
    .join("");

  tournamentLeaderboardEntries.innerHTML = entriesHTML;
}

function updateMyTournamentPosition(leaderboardData) {
  const myPosition =
    leaderboardData.findIndex((player) => player.isCurrentPlayer) + 1;
  const myPositionEl = document.getElementById("my-tournament-position");

  if (myPosition > 0) {
    const myData = leaderboardData[myPosition - 1];
    document.querySelector(".position-rank").textContent = `#${myPosition}`;
    document.querySelector(
      ".position-score"
    ).textContent = `${myData.score} points`;
    myPositionEl.style.display = "flex";
  } else {
    myPositionEl.style.display = "none";
  }
}

function setupJoinTournamentButton(tournament) {
  const joinBtn = joinTournamentFromModalBtn;

  if (tournament.status === "Ended") {
    joinBtn.textContent = "TOURNAMENT ENDED";
    joinBtn.disabled = true;
    joinBtn.style.opacity = "0.5";
    joinBtn.style.cursor = "not-allowed";
  } else {
    joinBtn.textContent = "JOIN TOURNAMENT";
    joinBtn.disabled = false;
    joinBtn.style.opacity = "1";
    joinBtn.style.cursor = "pointer";
  }
}

function joinTournamentFromModal() {
  // Find current tournament from modal
  const tournamentName = document.getElementById(
    "modal-tournament-name"
  ).textContent;
  const tournament = tournaments.find((t) => t.name === tournamentName);

  if (tournament) {
    hideTournamentLeaderboardModal();
    selectTournament(tournament.id);
  }
}

function refreshTournamentLeaderboard() {
  const tournamentName = document.getElementById(
    "modal-tournament-name"
  ).textContent;
  const tournament = tournaments.find((t) => t.name === tournamentName);

  if (tournament) {
    loadTournamentLeaderboardData(tournament);
  }
}

// === Leaderboard Filter Functions ===
function setupLeaderboardFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked button
      btn.classList.add("active");

      // Apply filter
      const filter = btn.dataset.filter;
      applyLeaderboardFilter(filter);
    });
  });
}

function applyLeaderboardFilter(filter) {
  const entries = document.querySelectorAll(".tournament-leaderboard-entry");

  entries.forEach((entry, index) => {
    let shouldShow = true;

    switch (filter) {
      case "top10":
        shouldShow = index < 10;
        break;
      case "friends":
        // Mock friends filter - in real implementation, check if player is friend
        shouldShow =
          entry.classList.contains("current-player") || Math.random() > 0.7;
        break;
      case "all":
      default:
        shouldShow = true;
        break;
    }

    entry.style.display = shouldShow ? "grid" : "none";
  });
}
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

// === Game State ===
let count = 0;
let best = 0;
let bird = new Bird(canvas, ctx);
let pipes = [];
let frame = 0;
let gameOver = false;
let counter;
let showInstructions = true;
let startGame = false;
let playerName = "";
let chainId = "";
let leaderboard = [];
let myRank = null;
let isGameConfigured = false;

// === Game Loop Control System ===
let gameLoopId = null;
let isGameLoopRunning = false;

// === Mode System ===
let currentGameMode = null; // 'practice' or 'tournament'
let currentScreen = "initial-loading";
let userRole = "player";
let isAdmin = false;
let tournaments = [];
let currentTournament = null;
let tournamentTimer = null;

// === Initial Loading State ===
let initialLoadingComplete = false;
let loadingSteps = [
  { text: "Initializing Linera client..." },
  { text: "Creating wallet..." },
  { text: "Claiming chain..." },
  { text: "Setting up game..." },
  { text: "Ready to play!" },
];

// === DOM Elements ===
const initialLoadingScreen = document.getElementById("initial-loading");
const usernameModal = document.getElementById("username-modal");
const modeSelectionScreen = document.getElementById("mode-selection");
const tournamentListScreen = document.getElementById("tournament-list");
const tournamentCreationScreen = document.getElementById("tournament-creation");
const tournamentLeaderboardModal = document.getElementById(
  "tournament-leaderboard-modal"
);
const mainGameContainer = document.getElementById("main-container");
const mainTitle = document.getElementById("main-title");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const refreshBtn = document.getElementById("refreshBtn");

// Tournament leaderboard modal elements
const closeTournamentLeaderboardBtn = document.getElementById(
  "close-tournament-leaderboard"
);
const closeTournamentLeaderboardFooterBtn = document.getElementById(
  "close-tournament-leaderboard-footer"
);
const joinTournamentFromModalBtn = document.getElementById(
  "join-tournament-from-modal"
);
const refreshTournamentLeaderboardBtn = document.getElementById(
  "refresh-tournament-leaderboard"
);
const tournamentLeaderboardEntries = document.getElementById(
  "tournament-leaderboard-entries"
);

// Initial loading elements
const loadingText = document.getElementById("loading-text");
const loadingProgress = document.getElementById("loading-progress");
const loadingPercentage = document.getElementById("loading-percentage");
const loadingError = document.getElementById("loading-error");
const retryButton = document.getElementById("retry-button");

// Username modal elements
const usernameInput = document.getElementById("username-input");
const usernameValidation = document.getElementById("username-validation");
const validationMessage = document.getElementById("validation-message");
const randomNameBtn = document.getElementById("random-name-btn");
const confirmNameBtn = document.getElementById("confirm-name-btn");

// Mode selection buttons
const practiceModeBtn = document.getElementById("practice-mode-btn");
const tournamentModeBtn = document.getElementById("tournament-mode-btn");
const backToModeBtn = document.getElementById("back-to-mode-btn");
const changeModeBtn = document.getElementById("change-mode-btn");
const createTournamentBtn = document.getElementById("create-tournament-btn");

// Tournament creation form elements
const tournamentForm = document.getElementById("tournament-form");
const cancelTournamentBtn = document.getElementById("cancel-tournament");
const durationPreset = document.getElementById("duration-preset");

// === Game Loop Functions ===

function startGameLoop() {
  if (isGameLoopRunning) {
    console.log("Game loop already running");
    return;
  }

  console.log("Starting game loop");
  isGameLoopRunning = true;

  if (currentScreen === "game" && initialLoadingComplete) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

function stopGameLoop() {
  console.log("Stopping game loop");
  isGameLoopRunning = false;

  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function gameLoop() {
  gameLoopId = null;

  if (
    !isGameLoopRunning ||
    currentScreen !== "game" ||
    !initialLoadingComplete
  ) {
    console.log("Game loop stopped:", {
      isRunning: isGameLoopRunning,
      screen: currentScreen,
      loaded: initialLoadingComplete,
    });
    return;
  }

  drawBackground();

  if (count > 0) {
    ctx.font = "bold 20px 'Press Start 2P', cursive";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.fillText(count, canvas.width / 2, 40);
  }

  if (!startGame) {
    ctx.font = "bold 10px 'Press Start 2P', cursive";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(
      "TAP or PRESS SPACE to FLY",
      canvas.width / 2,
      canvas.height / 4
    );

    if (isGameLoopRunning && currentScreen === "game") {
      gameLoopId = requestAnimationFrame(gameLoop);
    }
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
    if (isGameLoopRunning && currentScreen === "game") {
      gameLoopId = requestAnimationFrame(gameLoop);
    }
  } else {
    if (count > best) {
      best = count;
      await submitScoreToLeaderboard();
    }

    drawGameOver();
    document.getElementById("player-best").innerText = best;
    restartBtn.classList.add("show");

    stopGameLoop();
  }

  frame++;
}

// === Game State Reset Functions ===
function resetGameState() {
  console.log("Resetting complete game state");

  bird = new Bird(canvas, ctx);
  pipes = [];
  frame = 0;
  gameOver = false;
  count = 0;
  showInstructions = true;
  startGame = false;

  clearCanvas();

  restartBtn.classList.remove("show");
  startBtn.classList.remove("show");

  document.getElementById("player-best").innerText = best;

  console.log("Game state reset complete");
}

function resetModeState() {
  currentGameMode = null;
  currentTournament = null;

  if (tournamentTimer) {
    clearInterval(tournamentTimer);
    tournamentTimer = null;
  }

  console.log("Mode state reset");
}

// === Initial Loading Functions ===
function updateLoadingStep(stepIndex, status = "active") {
  const stepEl = document.getElementById("step-" + stepIndex);
  if (!stepEl) return;

  for (let i = 0; i < stepIndex; i++) {
    const prevStep = document.getElementById("step-" + i);
    if (prevStep) {
      prevStep.className = "step completed";
      prevStep.querySelector(".step-icon").textContent = "✓";
    }
  }

  if (status === "active") {
    stepEl.className = "step active";
    stepEl.querySelector(".step-icon").textContent = "→";
  } else if (status === "completed") {
    stepEl.className = "step completed";
    stepEl.querySelector(".step-icon").textContent = "✓";
  }
}

function updateLoadingProgress(percentage, text) {
  loadingProgress.style.width = percentage + "%";
  loadingPercentage.textContent = Math.round(percentage) + "%";
  loadingText.textContent = text;
}

function showLoadingError(message) {
  loadingError.style.display = "block";
  document.getElementById("error-message").textContent = message;
}

function hideLoadingError() {
  loadingError.style.display = "none";
}

async function performInitialLoading() {
  try {
    hideLoadingError();
    let totalProgress = 0;
    const progressPerStep = 100 / loadingSteps.length;

    for (let i = 0; i < loadingSteps.length; i++) {
      const step = loadingSteps[i];
      updateLoadingStep(i, "active");
      updateLoadingProgress(totalProgress, step.text);

      if (i === 0) {
        await linera.default();
      } else if (i === 1) {
        const faucet = await new linera.Faucet(import.meta.env.VITE_APP_URL);
        window.gameWallet = await faucet.createWallet();
        window.gameClient = await new linera.Client(window.gameWallet);
        window.gameFaucet = faucet;
      } else if (i === 2) {
        chainId = await window.gameFaucet.claimChain(window.gameClient);
        document.getElementById("chain-id").innerText = chainId;
        counter = await window.gameClient
          .frontend()
          .application(COUNTER_APP_ID);
      } else if (i === 3) {
        await showUsernameModal();
        await getUserRole();
        await setupGame();
      } else if (i === 4) {
        count = 0;
        showInstructions = true;
        initialLoadingComplete = true;
      }

      totalProgress += progressPerStep;
      updateLoadingStep(i, "completed");
    }

    updateLoadingProgress(100, "Ready to play!");

    setTimeout(() => {
      showScreen("mode-selection");
    }, 1000);
  } catch (error) {
    console.error("Initial loading failed:", error);
    showLoadingError("Connection failed: " + error.message);
  }
}

// === Username Modal Functions ===
function showUsernameModal() {
  return new Promise((resolve) => {
    usernameModal.style.display = "flex";
    usernameInput.value = "";
    usernameInput.focus();
    updateConfirmButton();

    window.usernameResolve = resolve;
  });
}

function hideUsernameModal() {
  usernameModal.style.display = "none";
}

function validateUsername(username) {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, message: "Name is required" };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 20) {
    return { valid: false, message: "Name must be 20 characters or less" };
  }

  const validPattern = /^[a-zA-Z0-9\s\-_\.]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, message: "Name contains invalid characters" };
  }

  return { valid: true, message: "" };
}

function showUsernameValidation(message) {
  validationMessage.textContent = message;
  usernameValidation.style.display = "block";
}

function hideUsernameValidation() {
  usernameValidation.style.display = "none";
}

function updateConfirmButton() {
  const validation = validateUsername(usernameInput.value);

  if (validation.valid) {
    confirmNameBtn.disabled = false;
    hideUsernameValidation();
  } else {
    confirmNameBtn.disabled = true;
    if (usernameInput.value.trim()) {
      showUsernameValidation(validation.message);
    } else {
      hideUsernameValidation();
    }
  }
}

function generateRandomName() {
  const adjectives = [
    "Flying",
    "Soaring",
    "Swift",
    "Brave",
    "Epic",
    "Mighty",
    "Golden",
    "Silver",
    "Thunder",
    "Lightning",
    "Cosmic",
    "Stellar",
    "Blazing",
    "Frost",
    "Crystal",
    "Shadow",
    "Mystic",
    "Phoenix",
    "Dragon",
    "Eagle",
    "Falcon",
    "Hawk",
  ];

  const nouns = [
    "Bird",
    "Flyer",
    "Pilot",
    "Wing",
    "Feather",
    "Sky",
    "Cloud",
    "Star",
    "Champion",
    "Hero",
    "Master",
    "Legend",
    "Ace",
    "Pro",
    "King",
    "Queen",
    "Runner",
    "Jumper",
    "Glider",
    "Soarer",
    "Diver",
    "Racer",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return adjective + noun + number;
}

function confirmUsername() {
  const validation = validateUsername(usernameInput.value);

  if (!validation.valid) {
    showUsernameValidation(validation.message);
    usernameInput.focus();
    return;
  }

  playerName = usernameInput.value.trim();
  hideUsernameModal();

  if (window.usernameResolve) {
    window.usernameResolve();
    window.usernameResolve = null;
  }
}

// === Screen Management ===
function showScreen(screenName) {
  if (currentScreen === "game" && screenName !== "game") {
    stopGameLoop();
    resetGameState();
  }

  if (screenName === "mode-selection") {
    resetModeState();
    resetGameState();
  }

  if (
    tournamentTimer &&
    screenName !== "tournament-list" &&
    screenName !== "game"
  ) {
    clearInterval(tournamentTimer);
    tournamentTimer = null;
  }

  initialLoadingScreen.style.display = "none";
  modeSelectionScreen.style.display = "none";
  tournamentListScreen.style.display = "none";
  tournamentCreationScreen.style.display = "none";
  mainGameContainer.style.display = "none";
  mainTitle.style.display = "none";

  switch (screenName) {
    case "initial-loading":
      initialLoadingScreen.style.display = "flex";
      currentScreen = "initial-loading";
      break;
    case "mode-selection":
      modeSelectionScreen.style.display = "flex";
      mainTitle.style.display = "block";
      currentScreen = "mode-selection";
      break;
    case "tournament-list":
      tournamentListScreen.style.display = "flex";
      mainTitle.style.display = "block";
      currentScreen = "tournament-list";
      loadTournaments();
      break;
    case "tournament-creation":
      tournamentCreationScreen.style.display = "flex";
      mainTitle.style.display = "block";
      currentScreen = "tournament-creation";
      initializeTournamentForm();
      break;
    case "game":
      mainGameContainer.style.display = "flex";
      currentScreen = "game";
      updateGameModeUI();
      break;
  }
}

function updateGameModeUI() {
  const currentModeEl = document.getElementById("current-mode");
  const leaderboardTitleEl = document.getElementById("leaderboard-title");
  const tournamentInfoEl = document.getElementById("tournament-info");

  if (currentGameMode === "practice") {
    currentModeEl.textContent = "Practice";
    currentModeEl.className = "mode-value practice";
    leaderboardTitleEl.textContent = "Top Players";
    tournamentInfoEl.style.display = "none";
  } else if (currentGameMode === "tournament") {
    currentModeEl.textContent = "Tournament";
    currentModeEl.className = "mode-value tournament";
    leaderboardTitleEl.textContent = "Tournament Leaderboard";
    tournamentInfoEl.style.display = "block";
    updateTournamentInfo();
  }
}

function updateTournamentInfo() {
  if (!currentTournament) return;

  document.getElementById("tournament-name").textContent =
    currentTournament.name;
  document.getElementById("tournament-status").textContent =
    currentTournament.status;
  document.getElementById("tournament-players").textContent =
    currentTournament.playerCount;

  updateTournamentTimer();
}

function updateTournamentTimer() {
  if (!currentTournament || !currentTournament.endTime) return;

  const now = new Date().getTime();
  const endTime = new Date(currentTournament.endTime).getTime();
  const timeLeft = endTime - now;

  if (timeLeft > 0) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById("tournament-time-left").textContent =
      days + "d " + hours + "h " + minutes + "m";
  } else {
    document.getElementById("tournament-time-left").textContent = "Ended";
    if (tournamentTimer) {
      clearInterval(tournamentTimer);
      tournamentTimer = null;
    }
  }
}

// === Mode Selection Handlers ===
function selectMode(mode) {
  if (!initialLoadingComplete) return;

  resetModeState();
  resetGameState();

  currentGameMode = mode;

  if (mode === "practice") {
    showScreen("game");
    setupPracticeMode();
  } else if (mode === "tournament") {
    showScreen("tournament-list");
  }
}

function setupPracticeMode() {
  console.log("Setting up practice mode");

  resetGameState();

  currentTournament = null;
  fetchLeaderboard();

  startBtn.classList.add("show");
  startGameLoop();

  console.log("Practice mode ready - click START to begin");
}

function selectTournament(tournamentId) {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament) {
    resetGameState();

    currentTournament = tournament;
    showScreen("game");
    setupTournamentMode();
  }
}

function setupTournamentMode() {
  console.log("Setting up tournament mode for:", currentTournament.name);

  resetGameState();

  fetchTournamentLeaderboard();
  startTournamentTimer();

  startBtn.classList.add("show");
  startGameLoop();

  console.log("Tournament mode ready - click START to begin");
}

function startTournamentTimer() {
  if (tournamentTimer) {
    clearInterval(tournamentTimer);
    tournamentTimer = null;
  }

  tournamentTimer = setInterval(() => {
    updateTournamentTimer();
  }, 60000);
}

// === Tournament Creation Functions ===
function initializeTournamentForm() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startDate = document.getElementById("start-date");
  const startTime = document.getElementById("start-time");
  const endDate = document.getElementById("end-date");
  const endTime = document.getElementById("end-time");

  startDate.value = tomorrow.toISOString().split("T")[0];
  startTime.value = now.toTimeString().slice(0, 5);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  endDate.value = dayAfter.toISOString().split("T")[0];
  endTime.value = now.toTimeString().slice(0, 5);

  document.getElementById("tournament-name-input").value = "";
  document.getElementById("tournament-description").value = "";
  document.getElementById("tournament-category").value = "open";
  document.getElementById("duration-preset").value = "";
}

function handleDurationPreset() {
  const preset = durationPreset.value;
  if (!preset) return;

  const startDate = document.getElementById("start-date");
  const startTime = document.getElementById("start-time");
  const endDate = document.getElementById("end-date");
  const endTime = document.getElementById("end-time");

  if (!startDate.value || !startTime.value) return;

  const startDateTime = new Date(startDate.value + "T" + startTime.value);
  let endDateTime = new Date(startDateTime);

  switch (preset) {
    case "1hour":
      endDateTime.setHours(endDateTime.getHours() + 1);
      break;
    case "6hours":
      endDateTime.setHours(endDateTime.getHours() + 6);
      break;
    case "1day":
      endDateTime.setDate(endDateTime.getDate() + 1);
      break;
    case "3days":
      endDateTime.setDate(endDateTime.getDate() + 3);
      break;
    case "1week":
      endDateTime.setDate(endDateTime.getDate() + 7);
      break;
  }

  endDate.value = endDateTime.toISOString().split("T")[0];
  endTime.value = endDateTime.toTimeString().slice(0, 5);
}

function validateTournamentForm() {
  const formData = getTournamentFormData();
  const errors = [];

  if (!formData.name.trim()) errors.push("Tournament name is required");
  if (!formData.category) errors.push("Category is required");
  if (!formData.startDate) errors.push("Start date is required");
  if (!formData.startTime) errors.push("Start time is required");
  if (!formData.endDate) errors.push("End date is required");
  if (!formData.endTime) errors.push("End time is required");

  if (formData.startDate && formData.endDate) {
    const start = new Date(
      formData.startDate + "T" + (formData.startTime || "00:00")
    );
    const end = new Date(
      formData.endDate + "T" + (formData.endTime || "00:00")
    );
    const now = new Date();

    if (start <= now) {
      errors.push("Start time must be in the future");
    }

    if (end <= start) {
      errors.push("End time must be after start time");
    }

    if (end.getTime() - start.getTime() < 60 * 60 * 1000) {
      errors.push("Tournament must be at least 1 hour long");
    }
  }

  return errors;
}

function getTournamentFormData() {
  return {
    name: document.getElementById("tournament-name-input").value,
    description: document.getElementById("tournament-description").value,
    category: document.getElementById("tournament-category").value,
    startDate: document.getElementById("start-date").value,
    startTime: document.getElementById("start-time").value,
    endDate: document.getElementById("end-date").value,
    endTime: document.getElementById("end-time").value,
  };
}

async function createTournamentSubmit() {
  const errors = validateTournamentForm();
  if (errors.length > 0) {
    alert("Please fix the following errors:\\n\\n" + errors.join("\\n"));
    return;
  }

  const formData = getTournamentFormData();

  try {
    const newTournament = {
      id: tournaments.length + 1,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      status: "Upcoming",
      startTime: formData.startDate + "T" + formData.startTime + ":00Z",
      endTime: formData.endDate + "T" + formData.endTime + ":00Z",
      playerCount: 0,
      maxScore: 0,
      createdBy: playerName,
      createdAt: new Date().toISOString(),
    };

    tournaments.push(newTournament);

    alert("Tournament '" + formData.name + "' created successfully!");
    showScreen("tournament-list");
  } catch (error) {
    console.error("Failed to create tournament:", error);
    alert("Failed to create tournament. Please try again.");
  }
}

function createTournament() {
  if (!isAdmin) {
    alert("Only administrators can create tournaments.");
    return;
  }
  showScreen("tournament-creation");
}

// === Tournament Management ===
async function loadTournaments() {
  if (!initialLoadingComplete) return;

  try {
    tournaments = [
      {
        id: 1,
        name: "Summer Championship",
        status: "Active",
        startTime: "2025-06-20T00:00:00Z",
        endTime: "2025-07-01T23:59:59Z",
        playerCount: 42,
        maxScore: 85,
      },
      {
        id: 2,
        name: "Quick Challenge",
        status: "Ending Soon",
        startTime: "2025-06-24T00:00:00Z",
        endTime: "2025-06-26T23:59:59Z",
        playerCount: 18,
        maxScore: 67,
      },
      {
        id: 3,
        name: "Beginner's Cup",
        status: "Active",
        startTime: "2025-06-23T00:00:00Z",
        endTime: "2025-06-30T23:59:59Z",
        playerCount: 156,
        maxScore: 43,
      },
    ];

    renderTournamentList();
    updateTournamentStatus();
  } catch (error) {
    console.error("Failed to load tournaments:", error);
  }
}

function renderTournamentList() {
  const container = document.getElementById("tournament-list-container");

  if (tournaments.length === 0) {
    container.innerHTML = '<div class="loading">No tournaments available</div>';
    return;
  }

  container.innerHTML = tournaments
    .map((tournament) => {
      const cardClass =
        "tournament-card " +
        tournament.status.toLowerCase().replace(/\s+/g, "-");

      return (
        "<div class='" +
        cardClass +
        "'>" +
        (isAdmin
          ? "<div class='tournament-admin-controls'>" +
            "<button onclick='editTournament(" +
            tournament.id +
            ")' class='admin-icon-btn edit-icon-btn'>" +
            "✏️" +
            "</button>" +
            "<button onclick='deleteTournament(" +
            tournament.id +
            ")' class='admin-icon-btn delete-icon-btn'>" +
            "🗑️" +
            "</button>" +
            "</div>"
          : "") +
        "<div class='tournament-name'>" +
        tournament.name +
        "</div>" +
        "<div class='tournament-meta'>" +
        "<div class='info-item'>" +
        "<span class='label'>Status:</span>" +
        "<span class='value'>" +
        tournament.status +
        "</span>" +
        "</div>" +
        "<div class='info-item players-info'>" +
        "<span class='label'>Players:</span>" +
        "<span class='value players-count'>" +
        tournament.playerCount +
        "</span>" +
        "</div>" +
        "<div class='info-item'>" +
        "<span class='label'>Best Score:</span>" +
        "<span class='value'>" +
        tournament.maxScore +
        "</span>" +
        "</div>" +
        "<div class='info-item'>" +
        "<span class='label'>Ends:</span>" +
        "<span class='value'>" +
        new Date(tournament.endTime).toLocaleDateString() +
        "</span>" +
        "</div>" +
        "</div>" +
        "<div class='tournament-card-actions'>" +
        "<button onclick='selectTournament(" +
        tournament.id +
        ")' class='tournament-action-btn join-btn'>" +
        "JOIN TOURNAMENT" +
        "</button>" +
        "<button onclick='viewTournamentLeaderboard(" +
        tournament.id +
        ")' class='tournament-action-btn view-btn'>" +
        "VIEW LEADERBOARD" +
        "</button>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function updateTournamentStatus() {
  const activeTournaments = tournaments.filter(
    (t) => t.status === "Active"
  ).length;
  const endingSoon = tournaments.filter(
    (t) => t.status === "Ending Soon"
  ).length;
  const totalPlayers = tournaments.reduce((sum, t) => sum + t.playerCount, 0);

  if (document.getElementById("active-tournaments")) {
    document.getElementById("active-tournaments").textContent =
      activeTournaments;
  }
  if (document.getElementById("ending-soon")) {
    document.getElementById("ending-soon").textContent = endingSoon;
  }
  if (document.getElementById("total-players")) {
    document.getElementById("total-players").textContent = totalPlayers;
  }
}

// === Tournament Leaderboard Modal Functions ===
function viewTournamentLeaderboard(tournamentId) {
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament) {
    showTournamentLeaderboardModal(tournament);
  }
}

// === Admin Functions ===
function editTournament(tournamentId) {
  if (!isAdmin) return;
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament) {
    alert(
      "Editing tournament: " +
        tournament.name +
        "\\n\\nThis would open the tournament edit form."
    );
  }
}

function deleteTournament(tournamentId) {
  if (!isAdmin) return;
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament) {
    if (
      confirm(
        "Delete tournament '" +
          tournament.name +
          "'?\\n\\nThis action cannot be undone."
      )
    ) {
      tournaments = tournaments.filter((t) => t.id !== tournamentId);
      renderTournamentList();
      updateTournamentStatus();
    }
  }
}

// === User Role Management ===
async function getUserRole() {
  try {
    userRole = Math.random() < 0.2 ? "admin" : "player";
    isAdmin = userRole === "admin";
    updateUIBasedOnRole();
    return userRole;
  } catch (error) {
    console.log("Failed to get user role, defaulting to player:", error);
    userRole = "player";
    isAdmin = false;
    updateUIBasedOnRole();
    return userRole;
  }
}

function updateUIBasedOnRole() {
  const roleEl = document.getElementById("player-role");
  roleEl.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  roleEl.className = "value " + userRole;

  const nameEl = document.getElementById("player-name");
  if (isAdmin && !nameEl.textContent.includes("👑")) {
    nameEl.innerHTML += ' <span class="admin-badge">👑</span>';
  }

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin ? "block" : "none";
  });
}

// === Game Functions ===
function drawBackground() {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function drawBase() {
  ctx.drawImage(baseImage, 0, canvas.height - 112, canvas.width, 112);
}

function drawGameOver() {
  const imgWidth = 192;
  const imgHeight = 42;
  const x = (canvas.width - imgWidth) / 2;
  const y = canvas.height / 3 - imgHeight;
  ctx.drawImage(gameOverImage, x, y, imgWidth, imgHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px 'Press Start 2P', cursive";
  ctx.textAlign = "center";
  ctx.fillText("SCORE: " + count, canvas.width / 2, y + imgHeight + 40);

  if (best) ctx.fillText("BEST: " + best, canvas.width / 2, y + imgHeight + 70);

  if (myRank) {
    ctx.font = "bold 12px 'Press Start 2P', cursive";
    ctx.fillText("RANK: #" + myRank, canvas.width / 2, y + imgHeight + 100);
  }

  if (currentGameMode === "tournament" && currentTournament) {
    ctx.font = "bold 10px 'Press Start 2P', cursive";
    ctx.fillText(
      "Tournament: " + currentTournament.name,
      canvas.width / 2,
      y + imgHeight + 130
    );
  }
}

async function setupGame() {
  try {
    const setupQuery =
      'mutation { setupGame(leaderboardChainId: "' +
      LEADERBOARD_CHAIN_ID +
      '",leaderboardName: "' +
      playerName +
      '") }';
    const queryObject = { query: setupQuery };
    await counter.query(JSON.stringify(queryObject));
    console.log("Game setup completed with leaderboard:", LEADERBOARD_CHAIN_ID);
    isGameConfigured = true;
  } catch (error) {
    console.log("Game setup skipped:", error.message);
  }
}

async function fetchLeaderboard() {
  try {
    if (isGameConfigured) {
      const requestQuery = { query: "mutation { requestLeaderboard }" };
      counter.query(JSON.stringify(requestQuery));
    }

    const leaderboardQuery = {
      query:
        "query { leaderboard { playerName score chainId } myRank playerName best }",
    };

    const response = await counter.query(JSON.stringify(leaderboardQuery));
    const data = JSON.parse(response).data;

    console.log("Leaderboard data:", data);
    leaderboard = data.leaderboard || [];
    myRank = data.myRank;
    playerName = data.playerName;
    best = data.best;

    document.getElementById("player-name").innerText = playerName;
    document.getElementById("player-best").innerText = best;
    document.getElementById("player-rank").innerText = myRank || "-";
    updateLeaderboardUI();
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
  }
}

async function fetchTournamentLeaderboard() {
  if (!currentTournament) return;

  try {
    const tournamentLeaderboard = [
      { playerName: "TournamentKing", score: 85, chainId: "chain1" },
      { playerName: "FlappyPro", score: 78, chainId: "chain2" },
      { playerName: playerName, score: best, chainId: chainId },
      { playerName: "BirdMaster", score: 65, chainId: "chain3" },
      { playerName: "SkyHigh", score: 58, chainId: "chain4" },
    ].sort((a, b) => b.score - a.score);

    leaderboard = tournamentLeaderboard;
    myRank =
      tournamentLeaderboard.findIndex(
        (entry) => entry.playerName === playerName
      ) + 1;

    updateLeaderboardUI();
  } catch (error) {
    console.error("Failed to fetch tournament leaderboard:", error);
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

      return (
        "<div class='" +
        className +
        "'>" +
        "<div class='rank'>" +
        rank +
        "</div>" +
        "<div class='player-name'>" +
        entry.playerName +
        "</div>" +
        "<div class='score'>" +
        entry.score +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

async function submitScoreToLeaderboard() {
  try {
    if (isGameConfigured) {
      const setupQuery = "mutation { setBestAndSubmit(best: " + best + ") }";
      const queryObject = { query: setupQuery };
      await counter.query(JSON.stringify(queryObject));

      if (currentGameMode === "tournament") {
        fetchTournamentLeaderboard();
      } else {
        fetchLeaderboard();
      }
    }
  } catch (error) {
    console.error("Failed to submit score:", error);
  }
}

// === Event Handlers ===
canvas.addEventListener("click", () => {
  if (!initialLoadingComplete || currentScreen !== "game") return;
  if (!gameOver) {
    bird.jump();
    audioJump.play();
    showInstructions = false;
  }
});

document.addEventListener("keydown", (e) => {
  if (!initialLoadingComplete || currentScreen !== "game") return;

  if (e.code === "Space" && !gameOver) {
    e.preventDefault();
    bird.jump();
    audioJump.play();
    showInstructions = false;
  }
});

// === Button Event Listeners ===
restartBtn.addEventListener("click", () => {
  console.log("Restart button clicked");
  restartBtn.classList.remove("show");

  stopGameLoop();
  resetGameState();

  startGame = true;
  startGameLoop();

  console.log("Game restarted immediately!");
});

startBtn.addEventListener("click", () => {
  console.log("Start button clicked - mode:", currentGameMode);
  startBtn.classList.remove("show");

  stopGameLoop();
  resetGameState();

  startGame = true;
  startGameLoop();

  console.log("New game started!");
});

refreshBtn.addEventListener("click", async () => {
  console.log("Refresh leaderboard clicked");
  if (currentGameMode === "tournament") {
    fetchTournamentLeaderboard();
  } else {
    fetchLeaderboard();
  }
});

retryButton.addEventListener("click", () => {
  hideLoadingError();
  performInitialLoading();
});

// Mode selection event listeners
practiceModeBtn.addEventListener("click", () => {
  console.log("Practice mode selected");
  selectMode("practice");
});

tournamentModeBtn.addEventListener("click", () => {
  console.log("Tournament mode selected");
  selectMode("tournament");
});

backToModeBtn.addEventListener("click", () => {
  console.log("Back to mode selection");
  stopGameLoop();
  resetGameState();
  resetModeState();
  showScreen("mode-selection");
});

changeModeBtn.addEventListener("click", () => {
  console.log("Change mode clicked");
  stopGameLoop();
  resetGameState();
  resetModeState();
  showScreen("mode-selection");
});

createTournamentBtn.addEventListener("click", createTournament);

// Username modal event listeners
usernameInput.addEventListener("input", updateConfirmButton);

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    confirmUsername();
  }
});

randomNameBtn.addEventListener("click", () => {
  usernameInput.value = generateRandomName();
  updateConfirmButton();
  usernameInput.focus();
});

confirmNameBtn.addEventListener("click", confirmUsername);

// Tournament creation form event listeners
tournamentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  createTournamentSubmit();
});

cancelTournamentBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
    showScreen("tournament-list");
  }
});

durationPreset.addEventListener("change", handleDurationPreset);

document.getElementById("start-date").addEventListener("change", (e) => {
  const startDate = e.target.value;
  const endDateEl = document.getElementById("end-date");

  if (startDate && !endDateEl.value) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 1);
    endDateEl.value = start.toISOString().split("T")[0];
  }
});

document.getElementById("start-time").addEventListener("change", (e) => {
  const startTime = e.target.value;
  const endTimeEl = document.getElementById("end-time");

  if (startTime && !endTimeEl.value) {
    endTimeEl.value = startTime;
  }
});

// Tournament leaderboard modal event listeners
closeTournamentLeaderboardBtn.addEventListener(
  "click",
  hideTournamentLeaderboardModal
);
closeTournamentLeaderboardFooterBtn.addEventListener(
  "click",
  hideTournamentLeaderboardModal
);
joinTournamentFromModalBtn.addEventListener("click", joinTournamentFromModal);
refreshTournamentLeaderboardBtn.addEventListener(
  "click",
  refreshTournamentLeaderboard
);

// Close modal when clicking outside
tournamentLeaderboardModal.addEventListener("click", (e) => {
  if (e.target === tournamentLeaderboardModal) {
    hideTournamentLeaderboardModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    tournamentLeaderboardModal.style.display === "flex"
  ) {
    hideTournamentLeaderboardModal();
  }
});

// === Global Functions for onclick handlers ===
window.selectTournament = selectTournament;
window.viewTournamentLeaderboard = viewTournamentLeaderboard;
window.editTournament = editTournament;
window.deleteTournament = deleteTournament;

// === Cleanup and Performance ===
window.addEventListener("beforeunload", () => {
  stopGameLoop();
  if (tournamentTimer) {
    clearInterval(tournamentTimer);
    tournamentTimer = null;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isGameLoopRunning) {
    stopGameLoop();
    console.log("Game paused - tab not visible");
  } else if (
    !document.hidden &&
    currentScreen === "game" &&
    !isGameLoopRunning
  ) {
    startGameLoop();
    console.log("Game resumed - tab visible");
  }
});

async function run() {
  showScreen("initial-loading");
  performInitialLoading();
}

window.addEventListener("load", () => {
  run();
});
