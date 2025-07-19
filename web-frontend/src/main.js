import { LineraClient } from "./blockchain/LineraClient.js";
import { TournamentModal } from "./ui/TournamentModal.js";
import { GameEngine } from "./game/GameEngine.js";
import { GameState } from "./game/GameState.js";
import { GameUI } from "./ui/GameUI.js";
import { AuthManager } from "./auth/AuthManager.js";
import { TimeUtils } from "./utils/TimeUtils.js";
import { TOURNAMENT_CONFIG } from "./constants/GameConstants.js";
import { Loading } from "./utils/LoadingManager.js";

class FlappyGame {
  constructor() {
    // Initialize modules
    this.lineraClient = new LineraClient();
    this.authManager = new AuthManager(this.lineraClient);
    this.tournamentModal = new TournamentModal(this.lineraClient);
    this.gameState = new GameState();
    this.gameState.setBlockchainClient(this.lineraClient); // Set blockchain client
    this.gameUI = new GameUI();

    // Canvas setup
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gameEngine = new GameEngine(this.canvas, this.ctx);

    // Initialize
    this.initialize();
  }

  initialize() {
    console.log("Initializing Flappy Game...");

    // Initialize UI
    this.gameUI.initialize();

    // Set up callbacks
    this.setupCallbacks();

    // Set up event listeners
    this.setupEventListeners();

    // Show initial loading screen
    this.gameState.setCurrentScreen("initial-loading-screen");

    // Start loading process
    this.startLoadingProcess();
  }

  setupCallbacks() {
    // Game UI callbacks
    this.gameUI.setCallbacks({
      startGame: () => this.startGame(),
      restartGame: () => this.restartGame(),
      login: () => this.handleLogin(),
      register: () => this.handleRegister(),
      showLogin: () => this.showLogin(),
      showRegister: () => this.showRegister(),
      togglePassword: (fieldId) => this.togglePasswordVisibility(fieldId),
      logout: () => this.logout(),
      selectPracticeMode: () => this.selectPracticeMode(),
      selectTournamentMode: () => this.selectTournamentMode(),
      backToModeSelection: () => this.backToModeSelection(),
      retryConnection: () => this.retryConnection(),
      changeMode: () => this.changeMode(),
      createTournament: () => this.createTournament(),
      joinTournament: (tournamentId) => this.joinTournament(tournamentId),
      viewTournamentLeaderboard: (tournamentId) =>
        this.viewTournamentLeaderboard(tournamentId),
      toggleTournamentPin: (tournamentId) =>
        this.toggleTournamentPin(tournamentId),
      editTournament: (tournamentId) => this.editTournament(tournamentId),
      updateTournament: (tournamentId, updates) =>
        this.updateTournament(tournamentId, updates),
      deleteTournament: (tournamentId) => this.deleteTournament(tournamentId),
      jump: () => this.handleJump(),
      canvasScaleChanged: (data) => this.handleCanvasScaleChange(data),
    });

    // Game engine callbacks
    this.gameEngine.setCallbacks({
      onScoreUpdate: (score) => this.handleScoreUpdate(score),
      onGameOver: (score, best, isNewHighScore) =>
        this.handleGameOver(score, best, isNewHighScore),
      onHighScore: (score) => this.handleHighScore(score),
    });

    // Game state callbacks
    this.gameState.addEventListener("screenChange", (data) => {
      // Stop game loop when leaving game screen to prevent multiple loops
      if (data.from === "game-screen" && data.to !== "game-screen") {
        this.gameEngine.stopGameLoop();
      }

      this.gameUI.showScreen(data.to);
      this.gameEngine.setGameState(
        data.to,
        this.gameState.isInitialLoadingComplete()
      );

      // Admin UI is updated via authStateChange event
    });

    this.gameState.addEventListener("playerNameChange", (data) => {
      this.tournamentModal.setGameData(
        this.gameState.getTournaments(),
        data.to,
        this.gameEngine.getBest()
      );
    });

    this.gameState.addEventListener("leaderboardUpdate", (leaderboard) => {
      this.gameUI.updateLeaderboard(leaderboard);
    });

    this.gameState.addEventListener("tournamentUpdate", (tournaments) => {
      this.gameUI.renderTournamentList(tournaments);
    });

    this.gameState.addEventListener("modeChange", (data) => {
      this.gameUI.updateGameModeDisplay(data.to);
    });

    this.gameState.addEventListener("authStateChange", (data) => {
      if (data.authenticated) {
        this.gameUI.updatePlayerInfo(data.user);
        if (data.user.role === "ADMIN") {
          this.gameUI.updateUIBasedOnRole("ADMIN");
        }
      } else {
        this.gameUI.clearPlayerInfo();
      }
    });
  }

  setupEventListeners() {
    // Tournament selection event
    window.addEventListener("tournamentSelected", (event) => {
      this.selectTournament(event.detail.tournamentId);
    });

    // Refresh leaderboard button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshLeaderboard();
      });
    }

    // Global functions for onclick handlers (backward compatibility)

    window.selectTournament = async (tournamentId) => {
      await this.selectTournament(tournamentId);
    };

    window.joinTournamentFromModal = () => {
      this.tournamentModal.joinTournamentFromModal();
    };

    window.refreshTournamentLeaderboard = async () => {
      await this.tournamentModal.refreshTournamentLeaderboard();
    };

    window.hideTournamentLeaderboardModal = () => {
      this.tournamentModal.hideTournamentLeaderboardModal();
    };

    window.editTournament = (tournamentId) => {
      console.log("Edit tournament:", tournamentId);
      alert("Tournament editing feature coming soon!");
    };

    window.toggleTournamentPin = async (tournamentId) => {
      console.log("Toggle pin tournament:", tournamentId);
      try {
        const tournament = await this.gameState.toggleTournamentPin(
          tournamentId
        );
        console.log(
          `Tournament ${tournament.pinned ? "pinned" : "unpinned"} successfully`
        );
      } catch (error) {
        console.error("Failed to toggle tournament pin:", error);
        alert("Failed to update tournament. Please try again.");
      }
    };

    window.deleteTournament = async (tournamentId) => {
      console.log("Delete tournament:", tournamentId);
      if (confirm("Are you sure you want to delete this tournament?")) {
        try {
          await this.gameState.deleteTournament(tournamentId);
          alert("Tournament deleted successfully!");
        } catch (error) {
          console.error("Failed to delete tournament:", error);
          alert("Failed to delete tournament. Please try again.");
        }
      }
    };

    window.viewTournamentLeaderboard = async (tournamentId) => {
      const tournament = this.gameState
        .getTournaments()
        .find((t) => t.id === tournamentId);
      if (tournament) {
        await this.tournamentModal.showTournamentLeaderboardModal(tournament);
      }
    };
  }

  async startLoadingProcess() {
    // Create pixel art loading spinner for game initialization
    const spinner = Loading.custom(
      "Initializing LINERA FLAPPY...",
      "blockchain"
    );

    const steps = this.gameState.getLoadingSteps();

    for (let i = 0; i < steps.length; i++) {
      this.gameState.setCurrentLoadingStep(i);
      this.gameUI.updateLoadingStep(i, "active");

      // Update pixel loading message
      spinner.updateMessage(steps[i].text);

      try {
        switch (i) {
          case 0: // Load game assets
            spinner.updateMessage("Loading game assets...");
            await this.loadGameAssets();
            spinner.updateMessage("Game assets loaded!");
            break;
          case 1: // Connect to blockchain
            spinner.updateMessage("Loading Chain...");
            await this.initializeLineraClient();
            spinner.updateMessage("Blockchain connection established!");
            break;
          case 2: // Set up game
            spinner.updateMessage("Setting up game configuration...");
            await this.setupGame();
            spinner.updateMessage("Game setup complete!");
            this.finishLoading();
            break;
        }

        this.gameUI.updateLoadingStep(i, "completed");
        await this.delay(500); // Brief pause to show completion
      } catch (error) {
        console.error(`Loading step ${i} failed:`, error);
        this.gameUI.updateLoadingStep(i, "error");

        // Show error UI for blockchain connection failures
        if (i === 1) {
          // Blockchain connection step
          const appUrl = import.meta.env.VITE_APP_URL || "Not configured";
          const appId = import.meta.env.VITE_APP_ID || "Not configured";

          spinner.updateMessage("Blockchain connection failed!");
          await this.delay(1000);
          spinner.hide();

          const errorMsg = `Failed to connect to Linera blockchain.

Configuration:
• Service URL: ${appUrl}
• App ID: ${appId}

Please check:
1. Is the Linera service running?
2. Is the service URL correct in .env?
3. Is the App ID valid?
4. Check browser console for details.`;
          this.showLoadingError(errorMsg);
          return;
        }

        // Continue loading for other errors
        spinner.updateMessage("Error occurred, continuing...");
        await this.delay(500);
      }
    }

    // Show final success message and hide loading
    spinner.updateMessage("LINERA FLAPPY ready to play!");
    await this.delay(1000);
    spinner.hide();
  }

  async loadGameAssets() {
    // Wait for images to load
    const images = [
      "background.png",
      "base.png",
      "bird.png",
      "gameover.png",
      "pipe-top.png",
      "pipe-bottom.png",
    ];
    const promises = images.map((img) => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = resolve; // Continue even if image fails
        image.src = `/assets/${img}`;
      });
    });

    await Promise.all(promises);
  }

  async initializeLineraClient() {
    try {
      const result = await this.lineraClient.initialize();
      this.gameState.setChainId(result.chainId);
      this.gameUI.updateChainId(result.chainId);

      // Store for backward compatibility
      window.counter = result.counter;

      console.log("Linera client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Linera client:", error);
      throw error;
    }
  }

  async setupGame() {
    // Load tournaments from storage/blockchain
    await this.gameState.loadTournaments();

    // Set game as configured
    this.gameState.setGameConfigured(true);

    // Admin UI is updated via authStateChange event
  }

  finishLoading() {
    this.gameState.setInitialLoadingComplete(true);
    this.gameUI.updateLoadingProgress(100, "Ready to play!");

    // Check for existing session first
    setTimeout(async () => {
      await this.checkExistingSession();
    }, 500);
  }

  showLoadingError(message) {
    // Show error UI
    const errorElement = document.getElementById("loading-error");
    const errorMessage = document.getElementById("error-message");

    if (errorElement && errorMessage) {
      // Use innerHTML for multi-line messages, but escape HTML to prevent XSS
      const escapedMessage = message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      errorMessage.innerHTML = escapedMessage;
      errorElement.style.display = "block";
    }
  }

  // Game control methods
  startGame() {
    this.gameUI.hideStartButton();
    // Enable game controls and start the game
    this.gameEngine.enableGameControls();
  }

  restartGame() {
    this.gameEngine.resetGameState();
    this.gameUI.hideRestartButton();
    this.gameEngine.startGameLoop();
    // Immediately enable game controls for restart (no start button needed)
    this.gameEngine.enableGameControls();
  }

  handleJump() {
    if (this.gameState.getCurrentScreen() === "game-screen") {
      this.gameEngine.handleJump();
    }
  }

  handleCanvasScaleChange(data) {
    this.gameEngine.setDisplayScale(data.scaleX, data.scaleY);
  }

  handleScoreUpdate(score) {
    // Score updates are handled by the game engine
    console.log("Score updated:", score);
  }

  async handleGameOver(score, best, isNewHighScore) {
    // Submit tournament score on ALL game overs if in tournament mode
    const activeTournament = this.gameState.getActiveTournament();
    const gameMode = this.gameState.getGameMode();

    if (
      activeTournament &&
      (activeTournament.status === "ACTIVE" ||
        activeTournament.status === "Active")
    ) {
      // Only submit if player is actually participating in the tournament
      if (this.gameState.isPlayerInTournament(activeTournament.id)) {
        try {
          await this.gameState.submitTournamentScore(
            activeTournament.id,
            score
          );
          // Refresh tournament leaderboard to update best score display
          await this.loadTournamentLeaderboard(activeTournament.id);
        } catch (error) {
          console.error("Failed to submit tournament score:", error);
        }
      }
    } else if (gameMode === "practice") {
      // Refresh practice leaderboard after game over in practice mode
      try {
        await this.loadPracticeLeaderboard();
      } catch (error) {
        console.error("Failed to refresh practice leaderboard:", error);
      }
    }

    // Determine which best score to show based on game mode after score submission
    let currentBest;
    if (gameMode === "tournament" && activeTournament) {
      currentBest = this.gameState.getTournamentBest();
    } else {
      currentBest = this.gameState.getPracticeBest();
    }

    this.gameUI.updatePlayerBest(currentBest);
    this.gameUI.showRestartButton();

    if (isNewHighScore) {
      console.log("New high score!", currentBest);
    }

    console.log(
      `Game over! Score: ${score}, Best: ${currentBest}, Engine best: ${best}`
    );
  }

  async handleHighScore(score) {
    try {
      // Submit to practice mode leaderboard
      await this.submitScoreToLeaderboard(score);

      // Note: Tournament score submission is now handled in handleGameOver
      // to ensure ALL tournament scores are submitted, not just high scores
    } catch (error) {
      console.error("Failed to submit high score:", error);
    }
  }

  // Authentication management
  async checkExistingSession() {
    try {
      const sessionUser = await this.authManager.loadSession();
      if (sessionUser && this.authManager.isSessionValid()) {
        // User has valid session, proceed to game
        this.gameState.setAuthenticatedUser(sessionUser);

        // Setup blockchain game for existing session
        await this.setupBlockchainGame();

        this.gameState.setCurrentScreen("mode-selection-screen");
      } else {
        // Show auth screen
        this.gameState.setCurrentScreen("auth-screen");
        this.gameUI.showAuthModal();
      }
    } catch (error) {
      console.error("Failed to check existing session:", error);
      // Show auth screen on error
      this.gameState.setCurrentScreen("auth-screen");
      this.gameUI.showAuthModal();
    }
  }

  async handleLogin() {
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!username || !password) {
      this.showAuthError("Please enter both username and password");
      return;
    }

    // Show loading state
    this.setAuthLoadingState(true);
    this.clearAuthError();

    try {
      // Step 1: Authenticate user
      this.updateAuthLoadingMessage("Authenticating user...");
      const user = await this.authManager.login(username, password);
      this.gameState.setAuthenticatedUser(user);

      // Step 2: Setup blockchain game
      this.updateAuthLoadingMessage("Setting up blockchain game...");
      await this.setupBlockchainGame();

      // Step 3: Complete
      this.updateAuthLoadingMessage("Login successful!");

      // Hide loading and proceed
      this.setAuthLoadingState(false);
      this.gameUI.hideAuthModal();
      this.gameState.setCurrentScreen("mode-selection-screen");
    } catch (error) {
      this.setAuthLoadingState(false);
      this.showAuthError(error.message);
    }
  }

  async setupBlockchainGame() {
    try {
      const playerName = this.gameState.getPlayerName();

      if (!playerName) {
        console.error("Player name not set - cannot setup blockchain game");
        return;
      }

      console.log("Setting up blockchain game for player:", playerName);

      // Setup game with blockchain leaderboard
      await this.lineraClient.setupGame(playerName);

      // Mark game as configured
      this.gameState.setGameConfigured(true);

      console.log("Blockchain game setup completed for:", playerName);
    } catch (error) {
      console.error("Failed to setup blockchain game:", error);
      // Don't throw error - allow user to continue with limited functionality
    }
  }

  async handleRegister() {
    // Registration is now integrated into login - this method is deprecated
    // but kept for compatibility during transition
    console.warn("handleRegister is deprecated - use handleLogin instead");
    await this.handleLogin();
  }

  showLogin() {
    // Single form approach - no need to switch forms
    document.getElementById("auth-title").textContent =
      "Welcome to Linera Flappy!";
    this.clearAuthError();
  }

  showRegister() {
    // Single form approach - registration is handled by login
    document.getElementById("auth-title").textContent =
      "Welcome to Linera Flappy!";
    this.clearAuthError();
  }

  togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = document.getElementById(`toggle-${fieldId}`);

    if (field.type === "password") {
      field.type = "text";
      toggle.textContent = "🙈";
    } else {
      field.type = "password";
      toggle.textContent = "👁";
    }
  }

  showAuthError(message) {
    const errorDiv = document.getElementById("auth-validation");
    const errorMessage = document.getElementById("auth-validation-message");

    if (errorDiv && errorMessage) {
      errorMessage.textContent = message;
      errorDiv.style.display = "block";
      errorDiv.style.color = ""; // Reset to default error color
      errorDiv.style.backgroundColor = ""; // Reset to default error background
    }
  }

  clearAuthError() {
    document.getElementById("auth-validation").style.display = "none";
  }

  setAuthLoadingState(isLoading) {
    const authBtn = document.getElementById("auth-btn");
    const usernameInput = document.getElementById("auth-username");
    const passwordInput = document.getElementById("auth-password");

    if (isLoading) {
      // Disable form elements
      if (authBtn) {
        authBtn.disabled = true;
        authBtn.textContent = "Loading...";
        authBtn.classList.add("loading");
      }
      if (usernameInput) usernameInput.disabled = true;
      if (passwordInput) passwordInput.disabled = true;

      // Show loading message
      this.showAuthLoadingMessage("Connecting...");
    } else {
      // Enable form elements
      if (authBtn) {
        authBtn.disabled = false;
        authBtn.textContent = "Login / Register";
        authBtn.classList.remove("loading");
      }
      if (usernameInput) usernameInput.disabled = false;
      if (passwordInput) passwordInput.disabled = false;

      // Hide loading message
      this.hideAuthLoadingMessage();
    }
  }

  showAuthLoadingMessage(message) {
    const authValidation = document.getElementById("auth-validation");
    const authValidationMessage = document.getElementById(
      "auth-validation-message"
    );

    if (authValidation && authValidationMessage) {
      authValidationMessage.textContent = message;
      authValidation.style.display = "block";
      authValidation.style.color = "#4CAF50"; // Green for loading
      authValidation.style.backgroundColor = "#E8F5E8";
    }
  }

  updateAuthLoadingMessage(message) {
    const authValidationMessage = document.getElementById(
      "auth-validation-message"
    );
    if (authValidationMessage) {
      authValidationMessage.textContent = message;
    }
  }

  hideAuthLoadingMessage() {
    const authValidation = document.getElementById("auth-validation");
    if (authValidation) {
      authValidation.style.display = "none";
      authValidation.style.color = ""; // Reset color
      authValidation.style.backgroundColor = ""; // Reset background
    }
  }

  showRegisterError(message) {
    // Registration errors are now handled by showAuthError
    this.showAuthError(message);
  }

  clearRegisterError() {
    // Registration errors are now handled by clearAuthError
    this.clearAuthError();
  }

  logout() {
    
    // Clear authentication and game state
    this.authManager.logout();
    this.gameState.clearAuthenticatedUser();
    
    // Stop any running game loops
    this.gameEngine.stopGameLoop();
    this.gameEngine.resetGameState();
    
    // Reset UI elements
    this.gameUI.hideAuthModal();
    this.gameUI.hideStartButton();
    this.gameUI.hideRestartButton();
    
    // Reset loading state and restart the application
    this.gameState.setInitialLoadingComplete(false);
    this.gameState.setCurrentScreen("initial-loading-screen");
    
    // Restart the loading process with pixel art UI
    this.startLoadingProcess();
  }

  retryConnection() {
    // Hide error UI
    const errorElement = document.getElementById("loading-error");
    if (errorElement) {
      errorElement.style.display = "none";
    }

    // Restart the loading process
    this.gameState.setCurrentScreen("initial-loading-screen");
    this.gameState.setInitialLoadingComplete(false);
    this.startLoadingProcess();
  }

  changeMode() {
    // Stop the game loop and reset game state when changing mode
    this.gameEngine.stopGameLoop();
    this.gameEngine.resetGameState();
    this.gameUI.hideStartButton();
    this.gameUI.hideRestartButton();

    this.gameState.setCurrentScreen("mode-selection-screen");
  }

  createTournament() {
    if (!this.gameState.isAdminUser()) {
      alert("Only administrators can create tournaments.");
      return;
    }
    this.gameState.setCurrentScreen("tournament-creation");
    this.initializeTournamentForm();
  }

  initializeTournamentForm() {
    const form = document.getElementById("tournament-form");
    const cancelBtn = document.getElementById("cancel-tournament");
    const durationPreset = document.getElementById("duration-preset");
    const startDateInput = document.getElementById("start-date");
    const startTimeInput = document.getElementById("start-time");
    const endDateInput = document.getElementById("end-date");
    const endTimeInput = document.getElementById("end-time");

    // Clear all form fields
    if (form) {
      form.reset();
    }

    // Clear all input fields manually
    const tournamentNameInput = document.getElementById(
      "tournament-name-input"
    );
    const tournamentDescription = document.getElementById(
      "tournament-description"
    );

    if (tournamentNameInput) tournamentNameInput.value = "";
    if (tournamentDescription) tournamentDescription.value = "";
    if (durationPreset) durationPreset.value = "";

    // Set default start date/time to now
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (startDateInput) startDateInput.value = today;
    if (startTimeInput) startTimeInput.value = currentTime;

    // Set default end date/time to 24 hours later
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    const tomorrowTime = tomorrow.toTimeString().slice(0, 5);

    if (endDateInput) endDateInput.value = tomorrowDate;
    if (endTimeInput) endTimeInput.value = tomorrowTime;

    // Remove existing event listeners to prevent duplicates
    if (this.tournamentFormListeners) {
      this.tournamentFormListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }
    this.tournamentFormListeners = [];

    // Handle duration preset changes
    if (durationPreset) {
      const presetHandler = (e) => {
        const preset = e.target.value;
        if (
          preset &&
          startDateInput &&
          startTimeInput &&
          endDateInput &&
          endTimeInput
        ) {
          const startDate = new Date(
            startDateInput.value + "T" + startTimeInput.value
          );
          let endDate;

          switch (preset) {
            case "1hour":
              endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
              break;
            case "6hours":
              endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
              break;
            case "1day":
              endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
              break;
            case "3days":
              endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
              break;
            case "1week":
              endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            default:
              return;
          }

          endDateInput.value = endDate.toISOString().split("T")[0];
          endTimeInput.value = endDate.toTimeString().slice(0, 5);
        }
      };

      durationPreset.addEventListener("change", presetHandler);
      this.tournamentFormListeners.push({
        element: durationPreset,
        event: "change",
        handler: presetHandler,
      });
    }

    // Handle form submission
    if (form) {
      const submitHandler = (e) => {
        e.preventDefault();
        this.handleTournamentCreation();
      };

      form.addEventListener("submit", submitHandler);
      this.tournamentFormListeners.push({
        element: form,
        event: "submit",
        handler: submitHandler,
      });
    }

    // Handle cancel button
    if (cancelBtn) {
      const cancelHandler = () => {
        this.gameState.setCurrentScreen("tournament-screen");
      };

      cancelBtn.addEventListener("click", cancelHandler);
      this.tournamentFormListeners.push({
        element: cancelBtn,
        event: "click",
        handler: cancelHandler,
      });
    }
  }

  async handleTournamentCreation() {
    // Get form values
    const tournamentName = document
      .getElementById("tournament-name-input")
      .value.trim();
    const description = document
      .getElementById("tournament-description")
      .value.trim();
    const startDate = document.getElementById("start-date").value;
    const startTime = document.getElementById("start-time").value;
    const endDate = document.getElementById("end-date").value;
    const endTime = document.getElementById("end-time").value;

    // Validate required fields
    if (!tournamentName || !startDate || !startTime || !endDate || !endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validate dates
    const startDateTime = new Date(startDate + "T" + startTime);
    const endDateTime = new Date(endDate + "T" + endTime);
    const now = new Date();

    if (startDateTime <= now) {
      alert("Start date must be in the future.");
      return;
    }

    if (endDateTime <= startDateTime) {
      alert("End date must be after start date.");
      return;
    }

    // Create tournament object
    const tournamentData = {
      name: tournamentName,
      description: description || "General tournament",
      category: "open",
      status: "Scheduled",
      startTime: startDateTime,
      endTime: endDateTime,
      timeLeft: TimeUtils.calculateTimeLeft(endDateTime),
      prizePool: this.calculatePrizePool("open"),
    };

    const spinner = Loading.tournament();

    try {
      spinner.updateMessage("Creating new tournament...");

      // Create tournament (will be stored in localStorage for now)
      await this.gameState.createTournament(tournamentData);

      spinner.updateMessage("Tournament created successfully!");
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Show success message
      alert(`Tournament "${tournamentName}" created successfully!`);

      // Return to tournament screen
      this.gameState.setCurrentScreen("tournament-screen");
    } catch (error) {
      console.error("Failed to create tournament:", error);
      alert("Failed to create tournament. Please try again.");
    } finally {
      spinner.hide();
    }
  }

  calculateTimeLeft(endTime) {
    return TimeUtils.calculateTimeLeft(endTime);
  }

  calculatePrizePool(category) {
    return (
      TOURNAMENT_CONFIG.PRIZE_POOLS[category] ||
      TOURNAMENT_CONFIG.PRIZE_POOLS.open
    );
  }

  // Mode selection
  async selectPracticeMode() {
    // Reset game state before entering practice mode
    this.gameEngine.stopGameLoop();
    this.gameEngine.resetGameState();

    this.gameState.setGameMode("practice");
    this.gameState.setCurrentScreen("game-screen");
    this.gameUI.showStartButton();
    this.gameUI.hideRestartButton();
    this.gameUI.updateGameModeDisplay("practice");

    // Load practice leaderboard
    await this.loadPracticeLeaderboard();

    // Optimize canvas for current device
    this.gameUI.optimizeCanvasForMobile();

    // Start the game loop to show the initial state
    this.gameEngine.startGameLoop();
  }

  async loadPracticeLeaderboard() {
    try {
      // Get practice leaderboard from blockchain
      const practiceLeaderboard =
        await this.lineraClient.getPracticeLeaderboard();

      // Update game state with practice leaderboard
      this.gameState.setLeaderboard(practiceLeaderboard);

      // Find player's rank and best score in practice leaderboard
      const playerName = this.gameState.getPlayerName();
      const playerRank =
        practiceLeaderboard.findIndex(
          (entry) => entry.username === playerName
        ) + 1;

      if (playerRank > 0) {
        this.gameState.setMyRank(playerRank);
        this.gameEngine.setMyRank(playerRank);
        this.gameUI.updatePlayerRank(playerRank);

        // Get user's best score from leaderboard data
        const userEntry = practiceLeaderboard[playerRank - 1];
        const userBest = userEntry ? userEntry.score : 0;

        // Update game state and UI with best score
        this.gameState.setPracticeBest(userBest);
        this.gameUI.updatePlayerBest(userBest);
        this.gameEngine.setBest(userBest);
      } else {
        // User not on leaderboard - best score is 0, rank is 0 (shows as '-')
        this.gameState.setPracticeBest(0);
        this.gameUI.updatePlayerBest(0);
        this.gameUI.updatePlayerRank(0);
        this.gameEngine.setBest(0);
      }

      console.log("Practice leaderboard loaded successfully");
    } catch (error) {
      console.error("Failed to load practice leaderboard:", error);
      // Set empty leaderboard on error
      this.gameState.setLeaderboard([]);
      this.gameUI.updatePlayerBest(0);
      this.gameEngine.setBest(0);
    }
  }

  async loadTournamentLeaderboard(tournamentId) {
    try {
      // Get tournament leaderboard from blockchain
      const tournamentLeaderboard =
        await this.lineraClient.getTournamentLeaderboard(tournamentId);

      // Update game state with tournament leaderboard
      this.gameState.setLeaderboard(tournamentLeaderboard);

      // Find player's rank and best score in tournament leaderboard
      const playerName = this.gameState.getPlayerName();
      const playerRank =
        tournamentLeaderboard.findIndex(
          (entry) => entry.username === playerName
        ) + 1;

      if (playerRank > 0) {
        this.gameState.setMyRank(playerRank);
        this.gameEngine.setMyRank(playerRank);
        this.gameUI.updatePlayerRank(playerRank);

        // Get user's best score from tournament leaderboard data
        const userEntry = tournamentLeaderboard[playerRank - 1];
        const userBest = userEntry ? userEntry.score : 0;

        // Update game state and UI with best score (for tournament context)
        this.gameState.setTournamentBest(userBest);
        this.gameUI.updatePlayerBest(userBest);
        this.gameEngine.setBest(userBest);
      } else {
        // User not on tournament leaderboard - best score is 0, rank is 0 (shows as '-')
        this.gameState.setTournamentBest(0);
        this.gameUI.updatePlayerBest(0);
        this.gameUI.updatePlayerRank(0);
        this.gameEngine.setBest(0);
      }

      console.log("Tournament leaderboard loaded successfully");
    } catch (error) {
      console.error("Failed to load tournament leaderboard:", error);
      // Set empty leaderboard on error
      this.gameState.setLeaderboard([]);
      this.gameUI.updatePlayerBest(0);
      this.gameEngine.setBest(0);
    }
  }

  async loadPersonalPracticeStats() {
    try {
      // Get personal practice data from blockchain
      const practiceData = await this.lineraClient.getMyPracticeData();

      // Update game state with personal practice statistics
      this.gameState.setPracticeScores(practiceData.myPracticeScores);
      this.gameState.setPracticeBest(practiceData.myPracticeBest);

      // Update UI with practice best score
      this.gameUI.updatePlayerBest(practiceData.myPracticeBest);

      console.log("Personal practice statistics loaded successfully");
    } catch (error) {
      console.error("Failed to load personal practice statistics:", error);
      // Set empty statistics on error
      this.gameState.setPracticeScores([]);
      this.gameState.setPracticeBest(0);
      this.gameUI.updatePlayerBest(0);
    }
  }

  async refreshLeaderboard() {
    try {
      const gameMode = this.gameState.getGameMode();

      if (gameMode === "practice") {
        // Refresh practice leaderboard
        await this.loadPracticeLeaderboard();
        console.log("Practice leaderboard refreshed");
      } else if (gameMode === "tournament") {
        // Refresh tournament leaderboard for current tournament
        const activeTournament = this.gameState.getActiveTournament();
        if (activeTournament && activeTournament.id) {
          await this.loadTournamentLeaderboard(activeTournament.id);
          console.log("Tournament leaderboard refreshed");
        } else {
          console.warn("No active tournament to refresh leaderboard for");
        }
      } else {
        // Refresh legacy leaderboard
        await this.loadLegacyLeaderboard();
        console.log("Legacy leaderboard refreshed");
      }
    } catch (error) {
      console.error("Failed to refresh leaderboard:", error);
    }
  }

  async loadLegacyLeaderboard() {
    try {
      // Request updated leaderboard
      await this.lineraClient.requestLeaderboard();

      // Get updated leaderboard
      const leaderboardResponse = await this.lineraClient.getLeaderboard();
      const leaderboard = leaderboardResponse.data.topLeaderboard || [];

      // Update game state
      this.gameState.setLeaderboard(leaderboard);

      // Find player's rank
      const playerRank =
        leaderboard.findIndex(
          (entry) => entry.playerName === this.gameState.getPlayerName()
        ) + 1;

      if (playerRank > 0) {
        this.gameState.setMyRank(playerRank);
        this.gameEngine.setMyRank(playerRank);
      }

      console.log("Legacy leaderboard loaded successfully");
    } catch (error) {
      console.error("Failed to load legacy leaderboard:", error);
    }
  }

  selectTournamentMode() {
    this.gameState.setGameMode("tournament");
    this.gameState.setCurrentScreen("tournament-screen");
    this.refreshTournaments();

    // Admin UI is updated via authStateChange event
  }

  backToModeSelection() {
    // Stop the game loop and reset game state
    this.gameEngine.stopGameLoop();
    this.gameEngine.resetGameState();
    this.gameUI.hideStartButton();
    this.gameUI.hideRestartButton();

    this.gameState.setCurrentScreen("mode-selection-screen");
  }

  // Tournament management
  async refreshTournaments() {
    const spinner = Loading.tournament();

    try {
      spinner.updateMessage("Loading available tournaments...");
      await this.gameState.loadTournaments();

      spinner.updateMessage("Tournaments loaded successfully!");
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      spinner.hide();
    }
  }

  async selectTournament(tournamentId) {

    const tournament = this.gameState
      .getTournaments()
      .find((t) => t.id === tournamentId);


    if (tournament && tournament.status !== "Ended") {
      try {

        // Join tournament if not already joined
        await this.gameState.joinTournament(tournamentId);

        // Reset game state before entering tournament mode
        this.gameEngine.stopGameLoop();

        this.gameEngine.resetGameState();

        this.gameState.setActiveTournament(tournament);
        this.gameState.setGameMode("tournament");
        this.gameState.setCurrentScreen("game-screen");

        this.gameUI.showStartButton();
        this.gameUI.hideRestartButton();
        this.gameUI.updateGameModeDisplay("tournament");
        this.gameUI.updateTournamentInfo(tournament);

        // Optimize canvas for current device
        this.gameUI.optimizeCanvasForMobile();

        // Start the game loop to show the initial state
        this.gameEngine.startGameLoop();


        // Load tournament leaderboard (do this after starting the game loop)
        try {
          await this.loadTournamentLeaderboard(tournament.id);
        } catch (leaderboardError) {
          console.error(
            "Failed to load tournament leaderboard:",
            leaderboardError
          );
          // Game should still work even if leaderboard fails
        }

      } catch (error) {
        console.error("Failed to join tournament:", error);
        alert("Failed to join tournament. Please try again.");
      }
    } else {
    }
  }

  // Blockchain integration
  async submitScoreToLeaderboard(score) {
    try {
      if (!this.gameState.getPlayerName()) {
        console.log("No player name set, skipping score submission");
        return;
      }

      const gameMode = this.gameState.getGameMode();

      if (gameMode === "practice") {
        // Handle practice mode score submission
        await this.submitPracticeScore(score);
      } else if (gameMode === "tournament") {
        // Handle tournament mode score submission
        await this.submitTournamentScore(score);
      } else {
        // Fallback to legacy leaderboard system
        await this.submitLegacyScore(score);
      }

      console.log(`${gameMode || "legacy"} score submitted successfully`);
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }

  async submitPracticeScore(score) {
    const spinner = Loading.scoreSubmission("practice");
    try {
      spinner.updateMessage(`Submitting practice score: ${score}...`);

      // Submit practice score to blockchain
      await this.lineraClient.submitPracticeScore(
        this.gameState.getPlayerName(),
        score
      );

      spinner.updateMessage("Updating practice statistics...");

      // Update local practice statistics
      this.gameState.addPracticeScore(score);

      // Update best score locally if current score is better
      const currentBest = this.gameState.getPracticeBest();
      console.log("currentBest", currentBest);
      if (score > currentBest) {
        this.gameState.setPracticeBest(score);
        this.gameUI.updatePlayerBest(score);
      }

      spinner.updateMessage("Refreshing practice leaderboard...");

      // Get updated practice leaderboard
      const practiceLeaderboard =
        await this.lineraClient.getPracticeLeaderboard();

      // Update game state with practice leaderboard
      this.gameState.setLeaderboard(practiceLeaderboard);

      // Find player's rank in practice leaderboard
      const playerName = this.gameState.getPlayerName();
      const playerRank =
        practiceLeaderboard.findIndex(
          (entry) => entry.username === playerName
        ) + 1;

      if (playerRank > 0) {
        this.gameState.setMyRank(playerRank);
        this.gameEngine.setMyRank(playerRank);
        this.gameUI.updateMyPosition(playerRank, score);
        this.gameUI.updatePlayerRank(playerRank);
      } else {
        // User not on leaderboard - set rank to 0 (shows as '-')
        this.gameUI.updatePlayerRank(0);
      }

      spinner.updateMessage("Practice score submitted successfully!");
      console.log("Practice score submitted successfully");

      // Show success message briefly
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to submit practice score:", error);
      spinner.updateMessage("Failed to submit practice score");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw error;
    } finally {
      spinner.hide();
    }
  }

  async submitTournamentScore(score) {
    const activeTournament = this.gameState.getActiveTournament();
    if (activeTournament && this.gameState.getPlayerName()) {
      const spinner = Loading.scoreSubmission("tournament");
      try {
        spinner.updateMessage(`Submitting tournament score: ${score}...`);

        await this.lineraClient.submitTournamentScore(
          activeTournament.id,
          this.gameState.getPlayerName(),
          score
        );

        spinner.updateMessage("Updating tournament statistics...");

        // Update local tournament statistics
        this.gameState.addTournamentScore(activeTournament.id, score);

        spinner.updateMessage("Tournament score submitted successfully!");
        console.log(
          `Tournament score ${score} submitted for tournament ${activeTournament.id}`
        );

        // Show success message briefly
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (error) {
        console.error("Failed to submit tournament score:", error);
        spinner.updateMessage("Failed to submit tournament score");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        throw error;
      } finally {
        spinner.hide();
      }
    }
  }

  async submitLegacyScore(score) {
    // Legacy leaderboard system (keep for backward compatibility)
    // Game should already be set up at login, but check just in case
    if (!this.gameState.isGameConfigurationComplete()) {
      await this.setupBlockchainGame();
    }

    await this.lineraClient.submitScore(score);
    await this.lineraClient.requestLeaderboard();

    const leaderboardResponse = await this.lineraClient.getLeaderboard();
    const leaderboard = leaderboardResponse.data.topLeaderboard || [];

    this.gameState.setLeaderboard(leaderboard);

    const playerRank =
      leaderboard.findIndex(
        (entry) => entry.playerName === this.gameState.getPlayerName()
      ) + 1;

    if (playerRank > 0) {
      this.gameState.setMyRank(playerRank);
      this.gameEngine.setMyRank(playerRank);
      this.gameUI.updateMyPosition(playerRank, score);
    }
  }

  // Tournament management methods
  async joinTournament(tournamentId) {
    try {
      // First check if user is already a participant
      const playerName = this.gameState.getPlayerName();
      const isAlreadyParticipant =
        await this.lineraClient.isTournamentParticipant(
          tournamentId,
          playerName
        );

      if (!isAlreadyParticipant) {
        // Only attempt to join if not already a participant
        await this.gameState.joinTournament(tournamentId);
        console.log("Successfully joined tournament!");
      } else {
        console.log(
          "User is already a participant in this tournament, skipping join."
        );
      }

      // Find the tournament and offer to enter tournament mode
      const tournament = this.gameState
        .getTournaments()
        .find((t) => t.id === tournamentId);
      if (
        tournament &&
        (tournament.status === "ACTIVE" || tournament.status === "Active")
      ) {
        const message = isAlreadyParticipant
          ? "You are already in this tournament! Do you want to play in tournament mode now?"
          : "Successfully joined tournament! Do you want to play in tournament mode now?";
        const enterTournamentMode = confirm(message);
        if (enterTournamentMode) {
          // Reset game state before entering tournament mode
          this.gameEngine.stopGameLoop();
          this.gameEngine.resetGameState();

          // Set this tournament as active and enter tournament mode
          this.gameState.setActiveTournament(tournament);
          this.gameState.setGameMode("tournament");
          this.gameState.setCurrentScreen("game-screen");
          this.gameUI.showStartButton();
          this.gameUI.hideRestartButton();
          this.gameUI.updateGameModeDisplay("tournament");
          this.gameUI.updateTournamentInfo(tournament);

          // Optimize canvas for current device
          this.gameUI.optimizeCanvasForMobile();

          // Start the game loop to show the initial state
          this.gameEngine.startGameLoop();

          // Load tournament leaderboard (do this after starting the game loop)
          try {
            await this.loadTournamentLeaderboard(tournament.id);
          } catch (leaderboardError) {
            console.error(
              "Failed to load tournament leaderboard:",
              leaderboardError
            );
            // Game should still work even if leaderboard fails
          }
        } else {
          alert(
            "Tournament joined! You can select this tournament from the tournament list to play later."
          );
        }
      } else {
        alert("Successfully joined tournament!");
      }

      // Refresh tournament list to show updated participant count
      await this.refreshTournaments();
    } catch (error) {
      console.error("Failed to join tournament:", error);
      alert("Failed to join tournament. Please try again.");
    }
  }

  async viewTournamentLeaderboard(tournamentId) {
    const tournament = this.gameState
      .getTournaments()
      .find((t) => t.id === tournamentId);
    if (tournament) {
      // Use the tournament modal to show leaderboard
      await this.tournamentModal.showTournamentLeaderboardModal(tournament);
    }
  }

  async toggleTournamentPin(tournamentId) {
    if (!this.gameState.isAdminUser()) {
      alert("Only administrators can pin/unpin tournaments.");
      return;
    }

    try {
      await this.gameState.toggleTournamentPin(tournamentId);
      alert("Tournament pin status updated successfully!");
      // Refresh tournament list to show updated pin status
      await this.refreshTournaments();
    } catch (error) {
      console.error("Failed to toggle tournament pin:", error);
      alert("Failed to update tournament pin status. Please try again.");
    }
  }

  editTournament(tournamentId) {
    if (!this.gameState.isAdminUser()) {
      alert("Only administrators can edit tournaments.");
      return;
    }

    const tournament = this.gameState
      .getTournaments()
      .find((t) => t.id === tournamentId);
    if (!tournament) {
      alert("Tournament not found.");
      return;
    }

    // Simple prompt-based editing (can be enhanced with a proper form later)
    const newName = prompt("Enter new tournament name:", tournament.name);
    if (newName && newName.trim() !== tournament.name) {
      const newDescription = prompt(
        "Enter new tournament description:",
        tournament.description
      );

      const updates = {
        name: newName.trim(),
        description: newDescription
          ? newDescription.trim()
          : tournament.description,
      };

      this.updateTournament(tournamentId, updates);
    }
  }

  async updateTournament(tournamentId, updates) {
    if (!this.gameState.isAdminUser()) {
      alert("Only administrators can update tournaments.");
      return;
    }

    try {
      await this.gameState.updateTournament(tournamentId, updates);
      alert("Tournament updated successfully!");
      // Refresh tournament list to show updated data
      await this.refreshTournaments();
    } catch (error) {
      console.error("Failed to update tournament:", error);
      alert("Failed to update tournament. Please try again.");
    }
  }

  async deleteTournament(tournamentId) {
    if (!this.gameState.isAdminUser()) {
      alert("Only administrators can delete tournaments.");
      return;
    }

    if (confirm("Are you sure you want to delete this tournament?")) {
      try {
        await this.gameState.deleteTournament(tournamentId);
        alert("Tournament deleted successfully!");
        // Refresh tournament list to remove deleted tournament
        await this.refreshTournaments();
      } catch (error) {
        console.error("Failed to delete tournament:", error);
        alert("Failed to delete tournament. Please try again.");
      }
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing game...");
  new FlappyGame();
});
