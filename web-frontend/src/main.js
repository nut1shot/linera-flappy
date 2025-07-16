import { LineraClient } from "./blockchain/LineraClient.js";
import { TournamentModal } from "./ui/TournamentModal.js";
import { GameEngine } from "./game/GameEngine.js";
import { GameState } from "./game/GameState.js";
import { GameUI } from "./ui/GameUI.js";
import { AuthManager } from "./auth/AuthManager.js";
import { TimeUtils } from "./utils/TimeUtils.js";
import { TOURNAMENT_CONFIG } from "./constants/GameConstants.js";

class FlappyGame {
  constructor() {
    // Initialize modules
    this.authManager = new AuthManager();
    this.lineraClient = new LineraClient();
    this.tournamentModal = new TournamentModal();
    this.gameState = new GameState();
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
      jump: () => this.handleJump(),
      canvasScaleChanged: (data) => this.handleCanvasScaleChange(data)
    });

    // Game engine callbacks
    this.gameEngine.setCallbacks({
      onScoreUpdate: (score) => this.handleScoreUpdate(score),
      onGameOver: (score, best, isNewHighScore) => this.handleGameOver(score, best, isNewHighScore),
      onHighScore: (score) => this.handleHighScore(score)
    });

    // Game state callbacks
    this.gameState.addEventListener('screenChange', (data) => {
      // Stop game loop when leaving game screen to prevent multiple loops
      if (data.from === "game-screen" && data.to !== "game-screen") {
        this.gameEngine.stopGameLoop();
      }
      
      this.gameUI.showScreen(data.to);
      this.gameEngine.setGameState(data.to, this.gameState.isInitialLoadingComplete());
      
      // Update admin UI whenever screen changes
      if (this.gameState.isAdminUser()) {
        this.gameUI.updateUIBasedOnRole("admin");
      }
    });

    this.gameState.addEventListener('playerNameChange', (data) => {
      this.tournamentModal.setGameData(
        this.gameState.getTournaments(),
        data.to,
        this.gameEngine.getBest()
      );
    });

    this.gameState.addEventListener('leaderboardUpdate', (leaderboard) => {
      this.gameUI.updateLeaderboard(leaderboard);
    });

    this.gameState.addEventListener('tournamentUpdate', (tournaments) => {
      this.gameUI.renderTournamentList(tournaments);
    });

    this.gameState.addEventListener('modeChange', (data) => {
      this.gameUI.updateGameModeDisplay(data.to);
    });

    this.gameState.addEventListener('authStateChange', (data) => {
      if (data.authenticated) {
        this.gameUI.updatePlayerInfo(data.user);
        if (data.user.role === 'admin') {
          this.gameUI.updateUIBasedOnRole('admin');
        }
      } else {
        this.gameUI.clearPlayerInfo();
      }
    });
  }

  setupEventListeners() {
    // Tournament selection event
    window.addEventListener('tournamentSelected', (event) => {
      this.selectTournament(event.detail.tournamentId);
    });

    // Global functions for onclick handlers (backward compatibility)

    window.selectTournament = async (tournamentId) => {
      await this.selectTournament(tournamentId);
    };

    window.joinTournamentFromModal = () => {
      this.tournamentModal.joinTournamentFromModal();
    };

    window.refreshTournamentLeaderboard = () => {
      this.tournamentModal.refreshTournamentLeaderboard();
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
        const tournament = await this.gameState.toggleTournamentPin(tournamentId);
        console.log(`Tournament ${tournament.pinned ? 'pinned' : 'unpinned'} successfully`);
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

    window.viewTournamentLeaderboard = (tournamentId) => {
      const tournament = this.gameState.getTournaments().find(t => t.id === tournamentId);
      if (tournament) {
        this.tournamentModal.showTournamentLeaderboardModal(tournament);
      }
    };
  }

  async startLoadingProcess() {
    console.log("Starting loading process...");
    
    const steps = this.gameState.getLoadingSteps();
    
    for (let i = 0; i < steps.length; i++) {
      this.gameState.setCurrentLoadingStep(i);
      this.gameUI.updateLoadingStep(i, "active");
      
      const progress = ((i + 1) / steps.length) * 100;
      this.gameUI.updateLoadingProgress(progress, steps[i].text);
      
      try {
        switch (i) {
          case 0: // Load game assets
            await this.loadGameAssets();
            break;
          case 1: // Connect to blockchain
            await this.initializeLineraClient();
            break;
          case 2: // Set up game
            await this.setupGame();
            this.finishLoading();
            break;
        }
        
        this.gameUI.updateLoadingStep(i, "completed");
        await this.delay(200); // Faster transitions
        
      } catch (error) {
        console.error(`Loading step ${i} failed:`, error);
        this.gameUI.updateLoadingStep(i, "error");
        
        // Show error UI for blockchain connection failures
        if (i === 1) { // Blockchain connection step
          const appUrl = import.meta.env.VITE_APP_URL || 'Not configured';
          const appId = import.meta.env.VITE_APP_ID || 'Not configured';
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
        await this.delay(500);
      }
    }
  }

  async loadGameAssets() {
    // Wait for images to load
    const images = ['background.png', 'base.png', 'bird.png', 'gameover.png', 'pipe-top.png', 'pipe-bottom.png'];
    const promises = images.map(img => {
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
    
    // If admin flag is set in GameState, update UI
    if (this.gameState.isAdminUser()) {
      this.gameUI.updateUIBasedOnRole("admin");
    }
  }

  finishLoading() {
    this.gameState.setInitialLoadingComplete(true);
    this.gameUI.updateLoadingProgress(100, "Ready to play!");
    
    // Check for existing session first
    setTimeout(() => {
      this.checkExistingSession();
    }, 500);
  }

  showLoadingError(message) {
    // Show error UI
    const errorElement = document.getElementById("loading-error");
    const errorMessage = document.getElementById("error-message");
    
    if (errorElement && errorMessage) {
      // Use innerHTML for multi-line messages, but escape HTML to prevent XSS
      const escapedMessage = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
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

  handleGameOver(score, best, isNewHighScore) {
    this.gameUI.updatePlayerBest(best);
    this.gameUI.showRestartButton();
    
    if (isNewHighScore) {
      console.log("New high score!", best);
    }
    
    console.log(`Game over! Score: ${score}, Best: ${best}`);
  }

  async handleHighScore(score) {
    try {
      await this.submitScoreToLeaderboard(score);
      
      // If in tournament mode, also submit to tournament
      const activeTournament = this.gameState.getActiveTournament();
      if (activeTournament && activeTournament.status === "Active") {
        await this.gameState.submitTournamentScore(activeTournament.id, score);
      }
    } catch (error) {
      console.error("Failed to submit high score:", error);
    }
  }

  // Authentication management
  checkExistingSession() {
    const sessionUser = this.authManager.loadSession();
    if (sessionUser && this.authManager.isSessionValid()) {
      // User has valid session, proceed to game
      this.gameState.setAuthenticatedUser(sessionUser);
      this.gameState.setCurrentScreen("mode-selection-screen");
    } else {
      // Show auth screen
      this.gameState.setCurrentScreen("auth-screen");
      this.gameUI.showAuthModal();
    }
  }

  async handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      this.showAuthError('Please enter both username and password');
      return;
    }

    try {
      const user = await this.authManager.login(username, password);
      this.gameState.setAuthenticatedUser(user);
      this.gameUI.hideAuthModal();
      this.gameState.setCurrentScreen("mode-selection-screen");
      this.clearAuthError();
    } catch (error) {
      this.showAuthError(error.message);
    }
  }

  async handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (!username || !password || !confirmPassword) {
      this.showRegisterError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      this.showRegisterError('Passwords do not match');
      return;
    }

    try {
      await this.authManager.createUser(username, password);
      const user = await this.authManager.login(username, password);
      this.gameState.setAuthenticatedUser(user);
      this.gameUI.hideAuthModal();
      this.gameState.setCurrentScreen("mode-selection-screen");
      this.clearRegisterError();
    } catch (error) {
      this.showRegisterError(error.message);
    }
  }

  showLogin() {
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-title').textContent = 'Welcome Back!';
    this.clearAuthError();
    this.clearRegisterError();
  }

  showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'flex';
    document.getElementById('auth-title').textContent = 'Create Account';
    this.clearAuthError();
    this.clearRegisterError();
  }

  togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = document.getElementById(`toggle-${fieldId.replace('-', '-')}`);
    
    if (field.type === 'password') {
      field.type = 'text';
      toggle.textContent = '🙈';
    } else {
      field.type = 'password';
      toggle.textContent = '👁';
    }
  }

  showAuthError(message) {
    const errorDiv = document.getElementById('auth-validation');
    const errorMessage = document.getElementById('auth-validation-message');
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
  }

  clearAuthError() {
    document.getElementById('auth-validation').style.display = 'none';
  }

  showRegisterError(message) {
    const errorDiv = document.getElementById('register-validation');
    const errorMessage = document.getElementById('register-validation-message');
    errorMessage.textContent = message;
    errorDiv.style.display = 'block';
  }

  clearRegisterError() {
    document.getElementById('register-validation').style.display = 'none';
  }

  logout() {
    this.authManager.logout();
    this.gameState.clearAuthenticatedUser();
    this.gameState.setCurrentScreen("auth-screen");
    this.gameUI.showAuthModal();
    this.showLogin();
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
    const tournamentNameInput = document.getElementById("tournament-name-input");
    const tournamentDescription = document.getElementById("tournament-description");

    if (tournamentNameInput) tournamentNameInput.value = "";
    if (tournamentDescription) tournamentDescription.value = "";
    if (durationPreset) durationPreset.value = "";

    // Set default start date/time to now
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (startDateInput) startDateInput.value = today;
    if (startTimeInput) startTimeInput.value = currentTime;

    // Set default end date/time to 24 hours later
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
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
        if (preset && startDateInput && startTimeInput && endDateInput && endTimeInput) {
          const startDate = new Date(startDateInput.value + 'T' + startTimeInput.value);
          let endDate;

          switch (preset) {
            case '1hour':
              endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
              break;
            case '6hours':
              endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
              break;
            case '1day':
              endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
              break;
            case '3days':
              endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
              break;
            case '1week':
              endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            default:
              return;
          }

          endDateInput.value = endDate.toISOString().split('T')[0];
          endTimeInput.value = endDate.toTimeString().slice(0, 5);
        }
      };
      
      durationPreset.addEventListener('change', presetHandler);
      this.tournamentFormListeners.push({ element: durationPreset, event: 'change', handler: presetHandler });
    }

    // Handle form submission
    if (form) {
      const submitHandler = (e) => {
        e.preventDefault();
        this.handleTournamentCreation();
      };
      
      form.addEventListener('submit', submitHandler);
      this.tournamentFormListeners.push({ element: form, event: 'submit', handler: submitHandler });
    }

    // Handle cancel button
    if (cancelBtn) {
      const cancelHandler = () => {
        this.gameState.setCurrentScreen("tournament-screen");
      };
      
      cancelBtn.addEventListener('click', cancelHandler);
      this.tournamentFormListeners.push({ element: cancelBtn, event: 'click', handler: cancelHandler });
    }
  }

  async handleTournamentCreation() {
    // Get form values
    const tournamentName = document.getElementById("tournament-name-input").value.trim();
    const description = document.getElementById("tournament-description").value.trim();
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
    const startDateTime = new Date(startDate + 'T' + startTime);
    const endDateTime = new Date(endDate + 'T' + endTime);
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
      prizePool: this.calculatePrizePool("open")
    };

    try {
      // Create tournament (will be stored in localStorage for now)
      await this.gameState.createTournament(tournamentData);
      
      // Show success message
      alert(`Tournament "${tournamentName}" created successfully!`);

      // Return to tournament screen
      this.gameState.setCurrentScreen("tournament-screen");
    } catch (error) {
      console.error("Failed to create tournament:", error);
      alert("Failed to create tournament. Please try again.");
    }
  }

  calculateTimeLeft(endTime) {
    return TimeUtils.calculateTimeLeft(endTime);
  }

  calculatePrizePool(category) {
    return TOURNAMENT_CONFIG.PRIZE_POOLS[category] || TOURNAMENT_CONFIG.PRIZE_POOLS.open;
  }

  // Mode selection
  selectPracticeMode() {
    // Reset game state before entering practice mode
    this.gameEngine.stopGameLoop();
    this.gameEngine.resetGameState();
    
    this.gameState.setGameMode("practice");
    this.gameState.setCurrentScreen("game-screen");
    this.gameUI.showStartButton();
    this.gameUI.hideRestartButton();
    this.gameUI.updateGameModeDisplay("practice");
    
    // Optimize canvas for current device
    this.gameUI.optimizeCanvasForMobile();
    
    // Start the game loop to show the initial state
    this.gameEngine.startGameLoop();
  }

  selectTournamentMode() {
    this.gameState.setGameMode("tournament");
    this.gameState.setCurrentScreen("tournament-screen");
    this.refreshTournaments();
    
    // Update admin UI in case it wasn't updated before
    if (this.gameState.isAdminUser()) {
      this.gameUI.updateUIBasedOnRole("admin");
    }
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
    await this.gameState.loadTournaments();
  }

  async selectTournament(tournamentId) {
    const tournament = this.gameState.getTournaments().find(t => t.id === tournamentId);
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
      } catch (error) {
        console.error("Failed to join tournament:", error);
        alert("Failed to join tournament. Please try again.");
      }
    }
  }

  // Blockchain integration
  async submitScoreToLeaderboard(score) {
    try {
      if (!this.gameState.getPlayerName()) {
        console.log("No player name set, skipping score submission");
        return;
      }

      // Setup game if not already done
      if (!this.gameState.isGameConfigurationComplete()) {
        await this.lineraClient.setupGame(this.gameState.getPlayerName());
        this.gameState.setGameConfigured(true);
      }

      // Submit score
      await this.lineraClient.submitScore(score);
      
      // Request updated leaderboard
      await this.lineraClient.requestLeaderboard();
      
      // Get updated leaderboard
      const leaderboardResponse = await this.lineraClient.getLeaderboard();
      const leaderboard = leaderboardResponse.data.topLeaderboard || [];
      
      // Update game state
      this.gameState.setLeaderboard(leaderboard);
      
      // Find player's rank
      const playerRank = leaderboard.findIndex(entry => 
        entry.playerName === this.gameState.getPlayerName()
      ) + 1;
      
      if (playerRank > 0) {
        this.gameState.setMyRank(playerRank);
        this.gameEngine.setMyRank(playerRank);
        this.gameUI.updateMyPosition(playerRank, score);
      }
      
      console.log("Score submitted successfully");
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing game...");
  new FlappyGame();
});