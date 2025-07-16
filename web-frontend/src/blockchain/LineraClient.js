import * as linera from "@linera/client";

export class LineraClient {
  constructor() {
    this.APP_ID = import.meta.env.VITE_APP_ID;
    this.APP_URL = import.meta.env.VITE_APP_URL;
    this.LEADERBOARD_CHAIN_ID = import.meta.env.VITE_LEADERBOARD_CHAIN_ID;
    this.counter = null;
    this.wallet = null;
    this.client = null;
    this.faucet = null;
    this.chainId = "";

    // Validate required environment variables
    if (!this.APP_ID) {
      throw new Error("VITE_APP_ID is not configured in .env file");
    }
    if (!this.APP_URL) {
      throw new Error("VITE_APP_URL is not configured in .env file");
    }
    if (!this.LEADERBOARD_CHAIN_ID) {
      throw new Error(
        "VITE_LEADERBOARD_CHAIN_ID is not configured in .env file"
      );
    }
  }

  async initialize() {
    try {
      console.log("Initializing Linera client...");
      console.log("App URL:", this.APP_URL);
      console.log("App ID:", this.APP_ID);

      // Initialize the Linera library
      await linera.default();
      console.log("Linera library initialized");

      // Create faucet
      this.faucet = new linera.Faucet(this.APP_URL);
      console.log("Faucet created");

      // Create wallet
      this.wallet = await this.faucet.createWallet();
      console.log("Wallet created");

      // Create client with the wallet (await needed for proper initialization)
      this.client = await new linera.Client(this.wallet);
      console.log("Client created");

      // Claim chain using the client
      this.chainId = await this.faucet.claimChain(this.client);
      console.log("Chain claimed:", this.chainId);

      // Get the application frontend
      this.counter = await this.client
        .frontend()
        .application(this.APP_ID);
      console.log("Application frontend obtained");

      // Store globally for backwards compatibility
      window.gameWallet = this.wallet;
      window.gameClient = this.client;
      window.gameFaucet = this.faucet;

      return {
        chainId: this.chainId,
        counter: this.counter,
      };
    } catch (error) {
      console.error("Failed to initialize Linera client:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }

  async setupGame(playerName) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          setupGame(
            leaderboardChainId: "${this.LEADERBOARD_CHAIN_ID}",
            leaderboardName: "${playerName}"
          )
        }
      `,
    };

    try {
      const response = await this.counter.query(JSON.stringify(queryObject));
      console.log(
        "Game setup completed with leaderboard:",
        this.LEADERBOARD_CHAIN_ID
      );
      return response;
    } catch (error) {
      console.error("Failed to setup game:", error);
      throw error;
    }
  }

  async requestLeaderboard() {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const requestQuery = {
      query: `
        mutation {
          requestLeaderboard
        }
      `,
    };

    try {
      const response = await this.counter.query(JSON.stringify(requestQuery));
      return response;
    } catch (error) {
      console.error("Failed to request leaderboard:", error);
      throw error;
    }
  }

  async getLeaderboard() {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const leaderboardQuery = {
      query: `
        query {
          topLeaderboard {
            playerName
            score
            chainId
            timestamp
          }
        }
      `,
    };

    try {
      const response = await this.counter.query(
        JSON.stringify(leaderboardQuery)
      );
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      throw error;
    }
  }

  async submitScore(score) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          setBestAndSubmit(best: ${score})
        }
      `,
    };

    try {
      const response = await this.counter.query(JSON.stringify(queryObject));
      return response;
    } catch (error) {
      console.error("Failed to submit score:", error);
      throw error;
    }
  }

  getChainId() {
    return this.chainId;
  }

  getLeaderboardChainId() {
    return this.LEADERBOARD_CHAIN_ID;
  }

  // ==========================================
  // TOURNAMENT BLOCKCHAIN METHODS - TODO
  // ==========================================
  // These methods are prepared for future blockchain implementation.
  // Currently using localStorage in GameState.js for development.

  /**
   * TODO: Create tournament on blockchain
   * @param {Object} tournamentData - Tournament data
   * @returns {Promise} Tournament creation result
   */
  async createTournament(_tournamentData) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament creation");
  }

  /**
   * TODO: Fetch tournaments from blockchain
   * @returns {Promise} Array of tournaments
   */
  async getTournaments() {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament fetching");
  }

  /**
   * TODO: Join tournament on blockchain
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise} Join result
   */
  async joinTournament(_tournamentId) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament joining");
  }

  /**
   * TODO: Submit tournament score to blockchain
   * @param {number} tournamentId - Tournament ID
   * @param {number} score - Player score
   * @returns {Promise} Score submission result
   */
  async submitTournamentScore(_tournamentId, _score) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament score submission");
  }

  /**
   * TODO: Delete tournament from blockchain
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise} Deletion result
   */
  async deleteTournament(_tournamentId) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament deletion");
  }

  /**
   * TODO: Get tournament leaderboard from blockchain
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise} Tournament leaderboard
   */
  async getTournamentLeaderboard(_tournamentId) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error(
      "TODO: Implement blockchain tournament leaderboard fetching"
    );
  }

  /**
   * TODO: Toggle tournament pin status on blockchain
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise} Toggle result
   */
  async toggleTournamentPin(_tournamentId) {
    console.warn(
      "Tournament blockchain methods not implemented yet. Using localStorage."
    );
    throw new Error("TODO: Implement blockchain tournament pin toggle");
  }
}
