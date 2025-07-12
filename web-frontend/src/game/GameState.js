import { TimeUtils } from '../utils/TimeUtils.js';

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

    // Loading state
    this.initialLoadingComplete = false;
    this.loadingSteps = [
      { text: "Loading game assets..." },
      { text: "Connecting to blockchain..." },
      { text: "Setting up game..." },
    ];
    this.currentLoadingStep = 0;

    // Tournament state
    this.tournaments = [];
    this.activeTournament = null;
    this.tournamentRefreshInterval = null;

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
    this.isAdmin = role === "admin";
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
    this.isAdmin = user.role === 'admin';
    this.emit('authStateChange', { authenticated: true, user });
  }

  clearAuthenticatedUser() {
    this.isAuthenticated = false;
    this.authUser = null;
    this.playerName = "";
    this.userRole = "player";
    this.isAdmin = false;
    this.emit('authStateChange', { authenticated: false, user: null });
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
    // TODO: Replace with blockchain call
    // const tournaments = await this.blockchainClient.getTournaments();
    
    // For now, load from localStorage or initialize empty
    const storedTournaments = localStorage.getItem('tournaments');
    const tournaments = storedTournaments ? JSON.parse(storedTournaments) : [];
    
    // Update tournament statuses based on current time
    const updatedTournaments = tournaments.map(tournament => {
      tournament.status = TimeUtils.getTournamentStatus(tournament.startTime, tournament.endTime);
      tournament.timeLeft = this.calculateTimeLeft(tournament.endTime);
      return tournament;
    });
    
    this.setTournaments(updatedTournaments);
    return updatedTournaments;
  }

  async createTournament(tournamentData) {
    // TODO: Replace with blockchain call
    // const result = await this.blockchainClient.createTournament(tournamentData);
    
    // For now, store in localStorage
    const tournaments = this.getTournaments();
    const newTournament = {
      ...tournamentData,
      id: Date.now(),
      playerCount: 0,
      maxScore: 0,
      players: [],
      createdAt: TimeUtils.getCurrentTimestamp(),
      createdBy: this.playerName,
      pinned: false
    };
    
    tournaments.push(newTournament);
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    this.setTournaments(tournaments);
    
    return newTournament;
  }

  async joinTournament(tournamentId) {
    // TODO: Replace with blockchain call
    // const result = await this.blockchainClient.joinTournament(tournamentId);
    
    const tournaments = this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (tournament && tournament.status === "Active") {
      if (!tournament.players.includes(this.playerName)) {
        tournament.players.push(this.playerName);
        tournament.playerCount = tournament.players.length;
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        this.setTournaments(tournaments);
      }
    }
    
    return tournament;
  }

  async submitTournamentScore(tournamentId, score) {
    // TODO: Replace with blockchain call
    // const result = await this.blockchainClient.submitTournamentScore(tournamentId, score);
    
    const tournaments = this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (tournament && tournament.status === "Active") {
      if (score > tournament.maxScore) {
        tournament.maxScore = score;
      }
      
      // Update player's best score in tournament
      if (!tournament.playerScores) {
        tournament.playerScores = {};
      }
      
      if (!tournament.playerScores[this.playerName] || score > tournament.playerScores[this.playerName]) {
        tournament.playerScores[this.playerName] = score;
      }
      
      localStorage.setItem('tournaments', JSON.stringify(tournaments));
      this.setTournaments(tournaments);
    }
    
    return tournament;
  }

  async deleteTournament(tournamentId) {
    // TODO: Replace with blockchain call
    // const result = await this.blockchainClient.deleteTournament(tournamentId);
    
    const tournaments = this.getTournaments();
    const filteredTournaments = tournaments.filter(t => t.id !== tournamentId);
    
    localStorage.setItem('tournaments', JSON.stringify(filteredTournaments));
    this.setTournaments(filteredTournaments);
    
    return true;
  }

  async toggleTournamentPin(tournamentId) {
    // TODO: Replace with blockchain call when implemented
    // const result = await this.blockchainClient.toggleTournamentPin(tournamentId);
    
    const tournaments = this.getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (tournament) {
      tournament.pinned = !tournament.pinned;
      tournament.lastModified = TimeUtils.getCurrentTimestamp();
      
      localStorage.setItem('tournaments', JSON.stringify(tournaments));
      this.setTournaments(tournaments);
      
      return tournament;
    }
    
    throw new Error('Tournament not found');
  }

  calculateTimeLeft(endTime) {
    return TimeUtils.calculateTimeLeftShort(endTime);
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
    if (data.isAuthenticated !== undefined) this.isAuthenticated = data.isAuthenticated;
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
