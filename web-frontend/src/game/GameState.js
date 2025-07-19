import { TimeUtils } from "../utils/TimeUtils.js";

export class GameState {
  constructor() {
    // Core game state
    this.playerName = "";
    this.chainId = "";
    this.leaderboard = [];
    this.myRank = null;
    this.isGameConfigured = false;

    // Authentication state
    this.isAuthenticated = false;
    this.authUser = null;

    // Mode and screen management
    this.currentGameMode = null; // 'practice' or 'tournament'
    this.currentScreen = "initial-loading";
    this.userRole = "player";
    this.isAdmin = false;

    // Blockchain client (set after initialization)
    this.blockchainClient = null;

    // Loading state
    this.initialLoadingComplete = false;
    this.loadingSteps = [
      { text: "Loading game assets..." },
      { text: "Loading chain..." },
      { text: "Setting up game..." },
    ];
    this.currentLoadingStep = 0;

    // Tournament state
    this.tournaments = [];
    this.activeTournament = null;
    this.tournamentRefreshInterval = null;

    // Practice mode state
    this.practiceScores = [];
    this.practiceBest = 0;
    this.practiceGamesPlayed = 0;

    // Tournament mode state
    this.tournamentBest = 0;

    // Event listeners
    this.listeners = {
      screenChange: [],
      modeChange: [],
      playerNameChange: [],
      leaderboardUpdate: [],
      tournamentUpdate: [],
      authStateChange: [],
    };
  }

  // Configuration methods
  setBlockchainClient(blockchainClient) {
    this.blockchainClient = blockchainClient;
  }

  // Event system
  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  // Screen management
  setCurrentScreen(screen) {
    const oldScreen = this.currentScreen;
    this.currentScreen = screen;
    this.emit("screenChange", { from: oldScreen, to: screen });
  }

  getCurrentScreen() {
    return this.currentScreen;
  }

  // Mode management
  setGameMode(mode) {
    const oldMode = this.currentGameMode;
    this.currentGameMode = mode;
    this.emit("modeChange", { from: oldMode, to: mode });
  }

  getGameMode() {
    return this.currentGameMode;
  }

  // Player management
  setPlayerName(name) {
    const oldName = this.playerName;
    this.playerName = name;
    this.emit("playerNameChange", { from: oldName, to: name });
  }

  getPlayerName() {
    return this.playerName;
  }

  setChainId(chainId) {
    this.chainId = chainId;
  }

  getChainId() {
    return this.chainId;
  }

  // User role management
  setUserRole(role) {
    this.userRole = role;
    this.isAdmin = role === "ADMIN";
  }

  getUserRole() {
    return this.userRole;
  }

  isAdminUser() {
    return this.isAdmin;
  }

  // Authentication state management
  setAuthenticatedUser(user) {
    this.isAuthenticated = true;
    this.authUser = user;
    this.playerName = user.username;
    this.userRole = user.role;
    this.isAdmin = user.role === "ADMIN";
    this.emit("authStateChange", { authenticated: true, user });
  }

  clearAuthenticatedUser() {
    this.isAuthenticated = false;
    this.authUser = null;
    this.playerName = "";
    this.userRole = "player";
    this.isAdmin = false;
    this.emit("authStateChange", { authenticated: false, user: null });
  }

  getAuthenticatedUser() {
    return this.authUser;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Loading state management
  setInitialLoadingComplete(complete) {
    this.initialLoadingComplete = complete;
  }

  isInitialLoadingComplete() {
    return this.initialLoadingComplete;
  }

  setCurrentLoadingStep(step) {
    this.currentLoadingStep = step;
  }

  getCurrentLoadingStep() {
    return this.currentLoadingStep;
  }

  getLoadingSteps() {
    return this.loadingSteps;
  }

  // Game configuration
  setGameConfigured(configured) {
    this.isGameConfigured = configured;
  }

  isGameConfigurationComplete() {
    return this.isGameConfigured;
  }

  // Leaderboard management
  setLeaderboard(leaderboard) {
    this.leaderboard = leaderboard;
    this.emit("leaderboardUpdate", leaderboard);
  }

  getLeaderboard() {
    return this.leaderboard;
  }

  setMyRank(rank) {
    this.myRank = rank;
  }

  getMyRank() {
    return this.myRank;
  }

  // Practice mode management
  setPracticeScores(scores) {
    this.practiceScores = scores;
    this.practiceGamesPlayed = scores.length;
    this.practiceBest = scores.length > 0 ? Math.max(...scores) : 0;
  }

  getPracticeScores() {
    return this.practiceScores;
  }

  setPracticeBest(best) {
    this.practiceBest = best;
  }

  getPracticeBest() {
    return this.practiceBest;
  }

  setTournamentBest(best) {
    this.tournamentBest = best;
  }

  getTournamentBest() {
    return this.tournamentBest || 0;
  }

  addTournamentScore(score) {
    // Update tournament best score if this score is higher
    if (score > this.tournamentBest) {
      this.tournamentBest = score;
    }

    // For future enhancement, could also track all tournament scores
    // similar to practice scores if needed
    console.log(
      `Tournament score added: ${score}, best: ${this.tournamentBest}`
    );
  }

  getPracticeGamesPlayed() {
    return this.practiceGamesPlayed;
  }

  addPracticeScore(score) {
    this.practiceScores.push(score);
    this.practiceGamesPlayed++;
    if (score > this.practiceBest) {
      this.practiceBest = score;
    }
  }

  // Tournament management
  setTournaments(tournaments) {
    this.tournaments = tournaments;
    this.emit("tournamentUpdate", tournaments);
  }

  getTournaments() {
    return this.tournaments;
  }

  setActiveTournament(tournament) {
    this.activeTournament = tournament;
  }

  getActiveTournament() {
    return this.activeTournament;
  }

  // Check if player is participating in a tournament
  isPlayerInTournament(tournamentId) {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    return (
      tournament &&
      tournament.participants &&
      tournament.participants.includes(this.playerName)
    );
  }

  // Get all tournaments the player is participating in
  getPlayerTournaments() {
    return this.tournaments.filter(
      (tournament) =>
        tournament.participants &&
        tournament.participants.includes(this.playerName)
    );
  }

  setTournamentRefreshInterval(interval) {
    if (this.tournamentRefreshInterval) {
      clearInterval(this.tournamentRefreshInterval);
    }
    this.tournamentRefreshInterval = interval;
  }

  clearTournamentRefreshInterval() {
    if (this.tournamentRefreshInterval) {
      clearInterval(this.tournamentRefreshInterval);
      this.tournamentRefreshInterval = null;
    }
  }

  // Tournament management - prepared for blockchain integration
  async loadTournaments() {
    try {
      // Load tournaments from blockchain
      const tournaments = await this.blockchainClient.getTournaments();

      // Use blockchain status directly, just calculate time left
      const updatedTournaments = tournaments.map((tournament) => {
        tournament.timeLeft = this.calculateTimeLeft(tournament.endTime);
        return tournament;
      });

      this.setTournaments(updatedTournaments);
      return updatedTournaments;
    } catch (error) {
      console.error("Failed to load tournaments from blockchain:", error);
      // Fallback to localStorage for development
      const storedTournaments = localStorage.getItem("tournaments");
      const tournaments = storedTournaments
        ? JSON.parse(storedTournaments)
        : [];

      const updatedTournaments = tournaments.map((tournament) => {
        // For localStorage fallback, calculate status if missing
        if (!tournament.status) {
          tournament.status = TimeUtils.getTournamentStatus(
            tournament.startTime,
            tournament.endTime
          );
        }
        tournament.timeLeft = this.calculateTimeLeft(tournament.endTime);
        return tournament;
      });

      this.setTournaments(updatedTournaments);
      return updatedTournaments;
    }
  }

  async createTournament(tournamentData) {
    try {
      // Create tournament on blockchain
      const result = await this.blockchainClient.createTournament(
        tournamentData
      );

      // Reload tournaments from blockchain to get the updated list
      await this.loadTournaments();

      return result;
    } catch (error) {
      console.error("Failed to create tournament on blockchain:", error);

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const newTournament = {
        ...tournamentData,
        id: Date.now().toString(),
        playerCount: 0,
        maxScore: 0,
        players: [],
        createdAt: TimeUtils.getCurrentTimestamp(),
        createdBy: this.playerName,
        pinned: false,
      };

      tournaments.push(newTournament);
      localStorage.setItem("tournaments", JSON.stringify(tournaments));
      this.setTournaments(tournaments);

      return newTournament;
    }
  }

  async joinTournament(tournamentId) {
    try {
      // Join tournament on blockchain
      const result = await this.blockchainClient.joinTournament(
        tournamentId,
        this.playerName
      );

      // Reload tournaments from blockchain to get updated data
      await this.loadTournaments();

      console.log(`Successfully joined tournament: ${tournamentId}`);
      return result;
    } catch (error) {
      console.error("Failed to join tournament on blockchain:", error);

      // Check if the error is about already being joined
      if (
        error.message &&
        (error.message.includes("already joined") ||
          error.message.includes("User already joined this tournament"))
      ) {
        console.log("User already joined this tournament - proceeding anyway");
        return { success: true, alreadyJoined: true };
      }

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const tournament = tournaments.find((t) => t.id === tournamentId);

      if (
        tournament &&
        (tournament.status === "Active" || tournament.status === "REGISTRATION")
      ) {
        if (!tournament.players) {
          tournament.players = [];
        }
        if (!tournament.players.includes(this.playerName)) {
          tournament.players.push(this.playerName);
          tournament.playerCount = tournament.players.length;
          localStorage.setItem("tournaments", JSON.stringify(tournaments));
          this.setTournaments(tournaments);
        }
      }

      return tournament;
    }
  }

  async submitTournamentScore(tournamentId, score) {
    try {
      // Submit tournament score to blockchain
      const result = await this.blockchainClient.submitTournamentScore(
        tournamentId,
        this.playerName,
        score
      );

      // Reload tournaments from blockchain to get updated data
      await this.loadTournaments();

      console.log(
        `Tournament score submitted: ${score} for tournament ${tournamentId}`
      );
      return result;
    } catch (error) {
      console.error("Failed to submit tournament score to blockchain:", error);

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const tournament = tournaments.find((t) => t.id === tournamentId);

      if (tournament && tournament.status === "Active") {
        if (score > tournament.maxScore) {
          tournament.maxScore = score;
        }

        // Update player's best score in tournament
        if (!tournament.playerScores) {
          tournament.playerScores = {};
        }

        if (
          !tournament.playerScores[this.playerName] ||
          score > tournament.playerScores[this.playerName]
        ) {
          tournament.playerScores[this.playerName] = score;
        }

        localStorage.setItem("tournaments", JSON.stringify(tournaments));
        this.setTournaments(tournaments);
      }

      return tournament;
    }
  }

  async deleteTournament(tournamentId) {
    try {
      // Delete tournament on blockchain
      const result = await this.blockchainClient.deleteTournament(tournamentId);

      // Reload tournaments from blockchain to get updated list
      await this.loadTournaments();

      return result;
    } catch (error) {
      console.error("Failed to delete tournament on blockchain:", error);

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const filteredTournaments = tournaments.filter(
        (t) => t.id !== tournamentId
      );

      localStorage.setItem("tournaments", JSON.stringify(filteredTournaments));
      this.setTournaments(filteredTournaments);

      return true;
    }
  }

  async toggleTournamentPin(tournamentId) {
    try {
      // Get current tournament state to determine pin action
      const tournaments = this.getTournaments();
      const tournament = tournaments.find((t) => t.id === tournamentId);

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Toggle pin status on blockchain
      const newPinStatus = !tournament.pinned;
      const result = await this.blockchainClient.toggleTournamentPin(
        tournamentId,
        newPinStatus
      );

      // Reload tournaments from blockchain to get updated data
      await this.loadTournaments();

      return result;
    } catch (error) {
      console.error("Failed to toggle tournament pin on blockchain:", error);

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const tournament = tournaments.find((t) => t.id === tournamentId);

      if (tournament) {
        tournament.pinned = !tournament.pinned;
        tournament.lastModified = TimeUtils.getCurrentTimestamp();

        localStorage.setItem("tournaments", JSON.stringify(tournaments));
        this.setTournaments(tournaments);

        return tournament;
      }

      throw new Error("Tournament not found");
    }
  }

  async updateTournament(tournamentId, updates) {
    try {
      // Update tournament on blockchain
      const result = await this.blockchainClient.updateTournament(
        tournamentId,
        updates
      );

      // Reload tournaments from blockchain to get updated data
      await this.loadTournaments();

      return result;
    } catch (error) {
      console.error("Failed to update tournament on blockchain:", error);

      // Fallback to localStorage for development
      const tournaments = this.getTournaments();
      const tournament = tournaments.find((t) => t.id === tournamentId);

      if (tournament) {
        // Apply updates to tournament
        Object.assign(tournament, updates);
        tournament.lastModified = TimeUtils.getCurrentTimestamp();

        localStorage.setItem("tournaments", JSON.stringify(tournaments));
        this.setTournaments(tournaments);

        return tournament;
      }

      throw new Error("Tournament not found");
    }
  }

  calculateTimeLeft(endTime) {
    // Convert microseconds to milliseconds for time calculation
    const endTimeMs =
      endTime > 1000000000000000 ? endTime / 1000 : endTime * 1000;
    return TimeUtils.calculateTimeLeftShort(endTimeMs);
  }

  // State serialization for persistence
  serialize() {
    return {
      playerName: this.playerName,
      chainId: this.chainId,
      currentGameMode: this.currentGameMode,
      currentScreen: this.currentScreen,
      userRole: this.userRole,
      isGameConfigured: this.isGameConfigured,
      leaderboard: this.leaderboard,
      myRank: this.myRank,
      isAuthenticated: this.isAuthenticated,
      authUser: this.authUser,
    };
  }

  deserialize(data) {
    if (data.playerName) this.playerName = data.playerName;
    if (data.chainId) this.chainId = data.chainId;
    if (data.currentGameMode) this.currentGameMode = data.currentGameMode;
    if (data.currentScreen) this.currentScreen = data.currentScreen;
    if (data.userRole) this.setUserRole(data.userRole);
    if (data.isGameConfigured !== undefined)
      this.isGameConfigured = data.isGameConfigured;
    if (data.leaderboard) this.leaderboard = data.leaderboard;
    if (data.myRank) this.myRank = data.myRank;
    if (data.isAuthenticated !== undefined)
      this.isAuthenticated = data.isAuthenticated;
    if (data.authUser) this.authUser = data.authUser;
  }

  // Reset state
  reset() {
    this.playerName = "";
    this.chainId = "";
    this.leaderboard = [];
    this.myRank = null;
    this.isGameConfigured = false;
    this.currentGameMode = null;
    this.currentScreen = "initial-loading";
    this.userRole = "player";
    this.isAdmin = false;
    this.initialLoadingComplete = false;
    this.currentLoadingStep = 0;
    this.clearTournamentRefreshInterval();
    this.activeTournament = null;
    this.isAuthenticated = false;
    this.authUser = null;
  }
}
