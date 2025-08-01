import { GAME_CONFIG, UI_CONFIG } from "../constants/GameConstants.js";

export class GameUI {
  constructor() {
    this.elements = {};
    this.callbacks = {};
    this.isInitialized = false;
    this.userRole = "player";
  }

  initialize() {
    if (this.isInitialized) return;

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.cacheElements();
        this.setupEventListeners();
        this.setupMobileOptimizations();
      });
    } else {
      this.cacheElements();
      this.setupEventListeners();
      this.setupMobileOptimizations();
    }

    this.isInitialized = true;
  }

  cacheElements() {
    // Game elements
    this.elements.canvas = document.getElementById("gameCanvas");
    this.elements.startBtn = document.getElementById("startBtn");
    this.elements.restartBtn = document.getElementById("restartBtn");
    this.elements.playerBest = document.getElementById("player-best");
    this.elements.chainId = document.getElementById("chain-id");

    // Screen elements
    this.elements.initialLoadingScreen = document.getElementById(
      "initial-loading-screen"
    );
    this.elements.authScreen = document.getElementById("auth-screen");
    this.elements.modeSelectionScreen = document.getElementById(
      "mode-selection-screen"
    );
    this.elements.gameScreen = document.getElementById("game-screen");
    this.elements.tournamentScreen =
      document.getElementById("tournament-screen");

    // Loading elements
    this.elements.loadingSteps = document.getElementById("loading-steps");
    this.elements.loadingProgress = document.getElementById("loading-progress");
    this.elements.loadingPercentage =
      document.getElementById("loading-percentage");

    // Auth modal elements
    this.elements.authModal = document.getElementById("auth-modal");
    this.elements.authForm = document.getElementById("auth-form");
    this.elements.authBtn = document.getElementById("auth-btn");
    this.elements.passwordToggles =
      document.querySelectorAll(".password-toggle");

    // Mode selection elements
    this.elements.practiceBtn = document.getElementById("practice-mode-btn");
    this.elements.tournamentBtn = document.getElementById(
      "tournament-mode-btn"
    );

    // Tournament elements
    this.elements.tournamentList = document.getElementById("tournament-list");
    this.elements.backToModeBtn = document.getElementById("back-to-mode-btn");

    // Leaderboard elements
    this.elements.leaderboardEntries = document.getElementById(
      "leaderboard-entries"
    );
    this.elements.myPosition = document.getElementById("my-position");
    this.elements.myRank = document.getElementById("my-rank");
    this.elements.myScore = document.getElementById("my-score");

    // Admin elements
    this.elements.adminPanel = document.getElementById("admin-panel");
    this.elements.createTournamentBtn = document.getElementById(
      "create-tournament-btn"
    );
    this.elements.manageTournamentsBtn = document.getElementById(
      "manage-tournaments-btn"
    );

    // Additional elements
    this.elements.retryButton = document.getElementById("retry-button");
    this.elements.changeModeBtn = document.getElementById("change-mode-btn");
    this.elements.logoutBtn = document.getElementById("logout-btn");
    this.elements.closeTournamentLeaderboardBtn = document.getElementById(
      "close-tournament-leaderboard"
    );
    this.elements.closeTournamentLeaderboardFooterBtn = document.getElementById(
      "close-tournament-leaderboard-footer"
    );
  }

  setupEventListeners() {
    // Game controls
    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener("click", () =>
        this.emit("startGame")
      );
    }

    if (this.elements.restartBtn) {
      this.elements.restartBtn.addEventListener("click", () =>
        this.emit("restartGame")
      );
    }

    // Auth modal
    if (this.elements.authBtn) {
      this.elements.authBtn.addEventListener("click", () => this.emit("login"));
    }

    // Password toggles
    this.elements.passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const fieldId = toggle.id.replace("toggle-", "");
        this.emit("togglePassword", fieldId);
      });
    });

    // Enter key handlers for auth form
    const authInputs = document.querySelectorAll("#auth-form input");
    authInputs.forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.emit("login");
      });
    });

    // Mode selection
    if (this.elements.practiceBtn) {
      this.elements.practiceBtn.addEventListener("click", () =>
        this.emit("selectPracticeMode")
      );
    }

    if (this.elements.tournamentBtn) {
      this.elements.tournamentBtn.addEventListener("click", () =>
        this.emit("selectTournamentMode")
      );
    }

    // Tournament navigation
    if (this.elements.backToModeBtn) {
      this.elements.backToModeBtn.addEventListener("click", () =>
        this.emit("backToModeSelection")
      );
    }

    // Additional event listeners
    if (this.elements.retryButton) {
      this.elements.retryButton.addEventListener("click", () =>
        this.emit("retryConnection")
      );
    }

    if (this.elements.changeModeBtn) {
      this.elements.changeModeBtn.addEventListener("click", () =>
        this.emit("changeMode")
      );
    }

    if (this.elements.logoutBtn) {
      this.elements.logoutBtn.addEventListener("click", () =>
        this.emit("logout")
      );
    }

    if (this.elements.createTournamentBtn) {
      this.elements.createTournamentBtn.addEventListener("click", () =>
        this.emit("createTournament")
      );
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () =>
        this.emit("refreshLeaderboard")
      );
    }

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.emit("jump");
      }
    });

    // Canvas click/touch for jump
    if (this.elements.canvas) {
      this.elements.canvas.addEventListener("click", () => this.emit("jump"));
      this.elements.canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.emit("jump");
      });
    }
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  // Screen management
  showScreen(screenName) {
    // Hide all screens
    const screens = [
      "initial-loading-screen",
      "auth-screen",
      "mode-selection-screen",
      "game-screen",
      "tournament-screen",
      "tournament-creation",
    ];

    screens.forEach((screen) => {
      const element = document.getElementById(screen);
      if (element) {
        element.style.display = "none";
      }
    });

    // Show requested screen
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
      // Use appropriate display style based on screen type
      if (screenName === "game-screen") {
        targetScreen.style.display = "flex";
      } else {
        targetScreen.style.display = "flex";
      }
    }

  }

  // Loading UI
  updateLoadingStep(stepIndex, status = "active") {
    const steps = this.elements.loadingSteps?.children;
    if (!steps || stepIndex >= steps.length) return;

    // Reset all steps
    for (let i = 0; i < steps.length; i++) {
      steps[i].className = "loading-step";
      if (i < stepIndex) {
        steps[i].classList.add("completed");
      } else if (i === stepIndex) {
        steps[i].classList.add(status);
      }
    }
  }

  updateLoadingProgress(percentage, text) {
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = `${percentage}%`;
      this.elements.loadingProgress.style.transition = "width 0.3s ease";
    }

    if (this.elements.loadingPercentage) {
      this.elements.loadingPercentage.textContent = `${Math.round(
        percentage
      )}%`;
    }

    // Update the main loading text
    const loadingTextElement = document.getElementById("loading-text");
    if (loadingTextElement && text) {
      loadingTextElement.textContent = text;
    }
  }

  // Username modal
  showAuthModal() {
    if (this.elements.authScreen) {
      this.elements.authScreen.style.display = "flex";
    }
  }

  hideAuthModal() {
    if (this.elements.authScreen) {
      this.elements.authScreen.style.display = "none";
    }
  }

  updatePlayerInfo(user) {
    const playerNameElement = document.getElementById("player-name");
    const playerRoleElement = document.getElementById("player-role");

    if (playerNameElement) {
      playerNameElement.textContent = user.username;
    }

    if (playerRoleElement) {
      playerRoleElement.textContent =
        user.role === "ADMIN" ? "Admin" : "Player";
    }
  }

  clearPlayerInfo() {
    const playerNameElement = document.getElementById("player-name");
    const playerRoleElement = document.getElementById("player-role");

    if (playerNameElement) {
      playerNameElement.textContent = "Loading...";
    }

    if (playerRoleElement) {
      playerRoleElement.textContent = "Player";
    }
  }

  // Game UI updates
  updatePlayerBest(best) {
    if (this.elements.playerBest) {
      this.elements.playerBest.textContent = best;
    }
  }

  updatePlayerRank(rank) {
    const playerRankElement = document.getElementById("player-rank");
    if (playerRankElement) {
      playerRankElement.textContent = rank > 0 ? `#${rank}` : "-";
    }
  }

  updateChainId(chainId) {
    if (this.elements.chainId) {
      this.elements.chainId.textContent = chainId;
    }
  }

  showRestartButton() {
    if (this.elements.restartBtn) {
      this.elements.restartBtn.classList.add("show");
    }
  }

  hideRestartButton() {
    if (this.elements.restartBtn) {
      this.elements.restartBtn.classList.remove("show");
    }
  }

  showStartButton() {
    if (this.elements.startBtn) {
      this.elements.startBtn.classList.add("show");
    }
  }

  hideStartButton() {
    if (this.elements.startBtn) {
      this.elements.startBtn.classList.remove("show");
    }
  }

  // Tournament UI
  renderTournamentList(tournaments) {
    if (!this.elements.tournamentList) return;
    

    if (tournaments.length === 0) {
      this.elements.tournamentList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <div class="empty-state-title">No Tournaments Available</div>
          <div class="empty-state-description">
            ${
              this.userRole === "ADMIN"
                ? "Create the first tournament to get started!"
                : "Check back later for upcoming tournaments."
            }
          </div>
        </div>
      `;
      return;
    }

    // Sort tournaments with pinned priority
    const sortedTournaments = tournaments.sort((a, b) => {
      // Primary sort: pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Secondary sort: status priority
      const statusPriority = { ACTIVE: 3, REGISTRATION: 2, ENDED: 1 };
      const statusDiff =
        (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      // Tertiary sort: creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    this.elements.tournamentList.innerHTML = sortedTournaments
      .map((tournament) => {
        const cardClass =
          "tournament-card " +
          tournament.status.toLowerCase().replace(/\s+/g, "-");
        const isAdmin = this.userRole === "ADMIN";

        return `
        <div class="${cardClass}${tournament.pinned ? " pinned" : ""}">
          ${
            isAdmin
              ? `
            <div class="tournament-admin-controls">
              <button data-tournament-id="${tournament.id}" class="admin-icon-btn pin-icon-btn ${
                  tournament.pinned ? "pinned" : ""
                }" data-action="pin">
                ${tournament.pinned ? "📍" : "📌"}
              </button>
              <button data-tournament-id="${tournament.id}" class="admin-icon-btn edit-icon-btn" data-action="edit">
                ✏️
              </button>
              <button data-tournament-id="${tournament.id}" class="admin-icon-btn delete-icon-btn" data-action="delete">
                🗑️
              </button>
            </div>
          `
              : ""
          }
          <div class="tournament-name">${tournament.name}</div>
          <div class="tournament-meta">
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value">${tournament.status}</span>
            </div>
            <div class="info-item players-info">
              <span class="label">Players:</span>
              <span class="value players-count">${tournament.playerCount}</span>
            </div>
            <div class="info-item">
              <span class="label">Best Score:</span>
              <span class="value">${tournament.maxScore}</span>
            </div>
            <div class="info-item">
              <span class="label">Ends:</span>
              <span class="value">${this.formatTournamentDate(tournament.endTime)}</span>
            </div>
          </div>
          <div class="tournament-card-actions">
            ${
              tournament.status === "REGISTRATION" || tournament.status === "ACTIVE"
                ? `
              <button data-tournament-id="${tournament.id}" class="tournament-action-btn join-btn" data-action="join">
                JOIN TOURNAMENT
              </button>
            `
                : ""
            }
            <button data-tournament-id="${tournament.id}" class="tournament-action-btn view-btn" data-action="view">
              VIEW LEADERBOARD
            </button>
          </div>
        </div>
      `;
      })
      .join("");
      
    // Add event listeners for tournament action buttons
    this.setupTournamentActionListeners();
  }

  setupTournamentActionListeners() {
    // Admin action buttons
    document.querySelectorAll('.admin-icon-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const tournamentId = e.target.getAttribute('data-tournament-id');
        const action = e.target.getAttribute('data-action');
        
        if (action === 'pin') {
          this.emit('toggleTournamentPin', tournamentId);
        } else if (action === 'edit') {
          this.emit('editTournament', tournamentId);
        } else if (action === 'delete') {
          this.emit('deleteTournament', tournamentId);
        }
      });
    });

    // User action buttons
    document.querySelectorAll('.tournament-action-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const tournamentId = e.target.getAttribute('data-tournament-id');
        const action = e.target.getAttribute('data-action');
        
        if (action === 'join') {
          this.emit('joinTournament', tournamentId);
        } else if (action === 'view') {
          this.emit('viewTournamentLeaderboard', tournamentId);
        }
      });
    });
  }

  // Leaderboard UI
  updateLeaderboard(leaderboard) {
    if (!this.elements.leaderboardEntries) return;

    this.elements.leaderboardEntries.innerHTML = leaderboard
      .map(
        (entry, index) => `
      <div class="leaderboard-entry ${
        entry.isCurrentPlayer ? "current-player" : ""
      }">
        <div class="entry-rank">#${index + 1}</div>
        <div class="entry-player">${
          entry.username || entry.playerName || "Unknown"
        }</div>
        <div class="entry-score">${entry.score}</div>
      </div>
    `
      )
      .join("");
  }

  updateMyPosition(rank, score) {
    if (this.elements.myRank) {
      this.elements.myRank.textContent = `#${rank}`;
    }

    if (this.elements.myScore) {
      this.elements.myScore.textContent = score;
    }

    if (this.elements.myPosition) {
      this.elements.myPosition.style.display = rank ? "flex" : "none";
    }
  }

  // Admin UI
  updateUIBasedOnRole(role) {
    this.userRole = role;
    const isAdmin = role === "ADMIN";


    // Update admin panel if it exists
    if (this.elements.adminPanel) {
      this.elements.adminPanel.style.display = isAdmin ? "block" : "none";
    }

    // Update player role display
    const roleEl = document.getElementById("player-role");
    if (roleEl) {
      roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
      roleEl.className = "value " + role;
    }

    // Update player name with admin badge
    const nameEl = document.getElementById("player-name");
    if (nameEl) {
      if (isAdmin && !nameEl.textContent.includes("👑")) {
        nameEl.innerHTML += ' <span class="admin-badge">👑</span>';
      } else if (!isAdmin && nameEl.textContent.includes("👑")) {
        nameEl.innerHTML = nameEl.textContent.replace(" 👑", "");
      }
    }

    // Show/hide all admin-only elements
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach((el) => {
      el.style.display = isAdmin ? "block" : "none";
    });
  }

  // Utility methods
  showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = "block";
    }
  }

  hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = "none";
    }
  }

  addClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add(className);
    }
  }

  removeClass(elementId, className) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove(className);
    }
  }

  setText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  setHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  }

  // Game mode UI updates
  updateGameModeDisplay(mode) {
    const currentModeElement = document.getElementById("current-mode");
    const tournamentInfoPanel = document.getElementById("tournament-info");
    const leaderboardTitle = document.getElementById("leaderboard-title");

    if (currentModeElement) {
      currentModeElement.textContent =
        mode === "practice" ? "Practice" : "Tournament";
      currentModeElement.className = `mode-value ${mode}`;
    }

    if (tournamentInfoPanel) {
      tournamentInfoPanel.style.display =
        mode === "tournament" ? "block" : "none";
    }

    if (leaderboardTitle) {
      leaderboardTitle.textContent =
        mode === "practice" ? "Top Players" : "Tournament Leaderboard";
    }
  }

  updateTournamentInfo(tournament) {
    if (!tournament) return;

    const tournamentName = document.getElementById("tournament-name");
    const tournamentStatus = document.getElementById("tournament-status");
    const tournamentTimeLeft = document.getElementById("tournament-time-left");
    const tournamentPlayers = document.getElementById("tournament-players");

    if (tournamentName) tournamentName.textContent = tournament.name;
    if (tournamentStatus) {
      tournamentStatus.textContent = tournament.status;
      tournamentStatus.className = `value status-${tournament.status.toLowerCase()}`;
    }
    if (tournamentTimeLeft)
      tournamentTimeLeft.textContent = tournament.timeLeft;
    if (tournamentPlayers)
      tournamentPlayers.textContent = tournament.playerCount;
  }

  // Mobile optimization methods
  setupMobileOptimizations() {
    this.preventMobileZoom();
    this.handleOrientationChange();
    this.optimizeCanvasForMobile();
    this.addMobileTouchTargets();
  }

  preventMobileZoom() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      { passive: false }
    );

    // Prevent pinch zoom
    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  handleOrientationChange() {
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.optimizeCanvasForMobile();
        this.emit("orientationChanged");
      }, 100);
    });
  }

  optimizeCanvasForMobile() {
    if (!this.elements.canvas) return;

    const canvas = this.elements.canvas;

    // Keep original game dimensions for consistent gameplay
    const gameWidth = GAME_CONFIG.CANVAS.BASE_WIDTH;
    const gameHeight = GAME_CONFIG.CANVAS.BASE_HEIGHT;
    const aspectRatio = gameHeight / gameWidth;

    // Detect device type and get appropriate scaling config
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= UI_CONFIG.MOBILE_BREAKPOINT;
    
    const scaleConfig = isMobile ? 
      GAME_CONFIG.CANVAS.MOBILE_SCALE : 
      GAME_CONFIG.CANVAS.DESKTOP_SCALE;

    // Calculate maximum allowed dimensions with enhanced scaling
    const maxWidthByViewport = viewportWidth * (scaleConfig.MAX_VIEWPORT_WIDTH_PERCENT / 100);
    const maxWidthByScale = gameWidth * scaleConfig.MAX_SCALE_MULTIPLIER;
    const maxHeightByViewport = viewportHeight * (scaleConfig.MAX_VIEWPORT_HEIGHT_PERCENT / 100);
    
    const maxWidth = Math.min(maxWidthByViewport, maxWidthByScale);
    const maxHeight = maxHeightByViewport;

    // Start with width-based sizing
    const initialDisplayWidth = Math.min(maxWidth, gameWidth * scaleConfig.MAX_SCALE_MULTIPLIER);
    let displayWidth = initialDisplayWidth;
    let displayHeight = displayWidth * aspectRatio;
    
    // If height exceeds available space, scale down based on height
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight / aspectRatio;
    }

    // Ensure minimum readable size - use fixed minimums to avoid viewport scaling issues
    const minWidthFallback = isMobile ? Math.min(viewportWidth * 0.6, 400) : 350; // Fixed 350px minimum for desktop
    const minWidth = Math.max(scaleConfig.MIN_WIDTH, minWidthFallback);
    
    if (displayWidth < minWidth) {
      displayWidth = minWidth;
      displayHeight = displayWidth * aspectRatio;
      
      // Final check: if still too tall, compromise
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight / aspectRatio;
      }
    }

    // Always keep game canvas at original size for consistent game logic
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    // Only scale the display size via CSS
    canvas.style.width = Math.round(displayWidth) + "px";
    canvas.style.height = Math.round(displayHeight) + "px";

    // Add responsive canvas class for CSS targeting
    canvas.classList.toggle('mobile-canvas', isMobile);

    // Don't scale the context - let CSS handle the scaling
    // This preserves game coordinate system



    // Notify game engine of display scale for input handling
    this.emit("canvasScaleChanged", {
      scaleX: displayWidth / gameWidth,
      scaleY: displayHeight / gameHeight,
    });
  }

  addMobileTouchTargets() {
    // Add mobile-friendly CSS classes to improve touch targets
    const touchElements = [
      ...document.querySelectorAll("button"),
      ...document.querySelectorAll(".admin-icon-btn"),
      ...document.querySelectorAll(".close-modal-btn"),
      ...document.querySelectorAll(".tournament-action-btn"),
    ];

    touchElements.forEach((element) => {
      element.classList.add("mobile-touch-target");
    });
  }

  // Check if device is mobile
  isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  }

  // Helper method to format tournament dates
  formatTournamentDate(timestamp) {
    if (!timestamp) return 'Not set';
    
    try {
      // Handle different timestamp formats
      let date;
      if (typeof timestamp === 'string') {
        // Try parsing as ISO string first
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        // Handle different timestamp formats
        if (timestamp > 1000000000 && timestamp < 10000000000) { 
          // This is a Unix timestamp in seconds (between 2001 and 2286)
          date = new Date(timestamp * 1000);
        } else if (timestamp > 1000000000000 && timestamp < 10000000000000) {
          // This is a Unix timestamp in milliseconds (between 2001 and 2286)
          date = new Date(timestamp);
        } else if (timestamp > 1000000000000000) {
          // This is a Unix timestamp in microseconds (16+ digits)
          date = new Date(timestamp / 1000); // Convert microseconds to milliseconds
        } else {
          // For other numbers, try different interpretations
          const asSeconds = new Date(timestamp * 1000);
          const asMilliseconds = new Date(timestamp);
          const asMicroseconds = new Date(timestamp / 1000);
          
          // Check which one gives a reasonable date (between 1970 and 2100)
          const minDate = new Date('1970-01-01');
          const maxDate = new Date('2100-01-01');
          
          if (asMicroseconds >= minDate && asMicroseconds <= maxDate) {
            date = asMicroseconds;
          } else if (asSeconds >= minDate && asSeconds <= maxDate) {
            date = asSeconds;
          } else if (asMilliseconds >= minDate && asMilliseconds <= maxDate) {
            date = asMilliseconds;
          } else {
            // Neither interpretation works, return the raw number with error
            console.error('Cannot interpret timestamp:', timestamp);
            return `Invalid (${timestamp})`;
          }
        }
      } else {
        return 'Invalid date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, 'timestamp:', timestamp);
      return 'Invalid date';
    }
  }
}
