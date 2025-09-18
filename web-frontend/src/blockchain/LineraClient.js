import * as linera from "@linera/client";
import { PrivateKey } from "@linera/signer";
import { ethers } from "ethers";

export class LineraClient {
  static instance = null;

  constructor() {
    // Singleton pattern
    if (LineraClient.instance) {
      return LineraClient.instance;
    }
    LineraClient.instance = this;

    // Storage keys for persistence
    this.STORAGE_KEYS = {
      CHAIN_ID: "linera_chain_id",
      WALLET_DATA: "linera_wallet_data",
      WALLET_SERIALIZED: "linera_wallet_serialized",
    };

    this.APP_ID = import.meta.env.VITE_APP_ID;
    this.APP_URL = import.meta.env.VITE_APP_URL;
    this.LEADERBOARD_CHAIN_ID = import.meta.env.VITE_LEADERBOARD_CHAIN_ID;
    this.LEADERBOARD_CHAIN_BASE_URL =
      import.meta.env.VITE_LEADERBOARD_CHAIN_URL;
    this.counter = null;
    this.wallet = null;
    this.client = null;
    this.faucet = null;
    this.chainId = "";
    this.mnemonic = "";
    this.leaderboardClient = null;
    this.isInitialized = false;

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
    if (!this.LEADERBOARD_CHAIN_BASE_URL) {
      throw new Error(
        "VITE_LEADERBOARD_CHAIN_URL is not configured in .env file"
      );
    }

    // Construct full leaderboard chain URL
    this.LEADERBOARD_CHAIN_FULL_URL = `${this.LEADERBOARD_CHAIN_BASE_URL}/chains/${this.LEADERBOARD_CHAIN_ID}/applications/${this.APP_ID}`;
  }

  async initialize() {
    try {
      // Always reinitialize on refresh to avoid stale state
      this.isInitialized = false;
      this.client = null;
      this.wallet = null;
      this.counter = null;
      this.faucet = null;

      // Initialize the Linera library
      await linera.default();

      // For development with faucet, we can't persist wallets across sessions
      // But we can avoid the expensive chain claiming process if the current session
      // already has a working setup

      // Check if we already have a working setup in the current session
      if (
        this.isInitialized &&
        this.client &&
        this.wallet &&
        this.counter &&
        this.chainId
      ) {
        return {
          chainId: this.chainId,
          counter: this.counter,
        };
      }

      // Create faucet
      this.faucet = await new linera.Faucet(this.APP_URL);
      console.log("faucet", this.APP_URL);
      this.mnemonic =
        this.getMnemonic() || ethers.Wallet.createRandom().mnemonic.phrase;
      const signer = PrivateKey.fromMnemonic(this.mnemonic);
      console.log("signer", signer);
      this.wallet = await this.faucet.createWallet();
      console.log("wallet", this.wallet);
      const owner = await signer.address();
      console.log("owner", owner);
      this.chainId = await this.faucet.claimChain(this.wallet, owner);
      console.log("chainId", this.chainId);
      this.client = await new linera.Client(this.wallet, signer);
      console.log("client", this.client);

      this.counter = await this.client.frontend().application(this.APP_ID);
      console.log("counter", this.counter);

      this.saveChainId();

      // Mark as initialized
      this.isInitialized = true;

      // Store globally for backwards compatibility
      window.gameWallet = this.wallet;
      window.gameClient = this.client;
      window.gameFaucet = this.faucet;

      // Make clear storage available for debugging
      window.clearLineraStorage = () => this.reset();
      return {
        chainId: this.chainId,
        counter: this.counter,
      };
    } catch (error) {
      console.error("Failed to initialize Linera client:", error);
      throw error;
    }
  }

  /**
   * Reset the LineraClient state completely
   * This should be called on logout to prevent chain creation errors
   */
  async reset() {
    // Clear all instance variables
    this.counter = null;
    this.wallet = null;
    this.client = null;
    this.faucet = null;
    this.chainId = "";
    this.leaderboardClient = null;
    this.isInitialized = false;

    // Clear global variables
    if (typeof window !== "undefined") {
      window.gameWallet = null;
      window.gameClient = null;
      window.gameFaucet = null;
      window.counter = null;
    }

    // Clear stored data in localStorage
    try {
      localStorage.removeItem(this.STORAGE_KEYS.CHAIN_ID);
      localStorage.removeItem(this.STORAGE_KEYS.WALLET_DATA);
      localStorage.removeItem(this.STORAGE_KEYS.WALLET_SERIALIZED);
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }

    window.location.reload();
  }

  // ==========================================
  // STORAGE PERSISTENCE METHODS
  // ==========================================

  saveChainId() {
    try {
      // Save chainId for display purposes
      localStorage.setItem(this.STORAGE_KEYS.CHAIN_ID, this.chainId);
      localStorage.setItem("MNEMONIC", this.mnemonic);
      // Save wallet data for manual persistence since Linera's built-in persistence
      // doesn't work in development faucet mode
      if (this.wallet) {
        try {
          // Store a flag indicating we have wallet data
          localStorage.setItem(this.STORAGE_KEYS.WALLET_DATA, "true");
        } catch (walletError) {
          console.warn("Failed to save wallet persistence flag:", walletError);
        }
      }
    } catch (error) {
      console.warn("Failed to save chainId:", error);
    }
  }

  clearWalletData() {
    // Clear localStorage
    localStorage.removeItem(this.STORAGE_KEYS.CHAIN_ID);
    localStorage.removeItem(this.STORAGE_KEYS.WALLET_DATA);

    // Reset instance state
    this.isInitialized = false;
    this.chainId = "";
    this.wallet = null;
    this.client = null;
    this.counter = null;
    this.faucet = null;
  }

  // Clear all Linera-related storage (use with caution)
  clearAllLineraStorage() {
    this.clearWalletData();

    // Clear IndexedDB that Linera uses
    try {
      const deleteDB = indexedDB.deleteDatabase("linera-storage");
      deleteDB.onsuccess = () => {};
      deleteDB.onerror = () => {};
    } catch (error) {}
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

  getMnemonic() {
    const res = localStorage.getItem("MNEMONIC");
    console.log("getMnemonic", res);
    return res;
  }

  getChainId() {
    return (
      this.chainId || localStorage.getItem(this.STORAGE_KEYS.CHAIN_ID) || ""
    );
  }

  getLeaderboardChainId() {
    return this.LEADERBOARD_CHAIN_ID;
  }

  getLeaderboardChainUrl() {
    return this.LEADERBOARD_CHAIN_FULL_URL;
  }

  getLeaderboardChainBaseUrl() {
    return this.LEADERBOARD_CHAIN_BASE_URL;
  }

  // Helper method to query leaderboard chain directly
  async queryLeaderboardChain(query) {
    try {
      const response = await fetch(this.LEADERBOARD_CHAIN_FULL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error("Failed to query leaderboard chain:", error);
      throw error;
    }
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  /**
   * Login or register user on leaderboard chain
   * @param {string} username - Username
   * @param {string} hash - Password hash
   * @returns {Promise} Login/register result
   */
  async loginOrRegister(username, hash) {
    const query = `
      mutation {
        loginOrRegister(
          username: "${username}",
          hash: "${hash}",
          requesterChainId: "${this.chainId}"
        )
      }
    `;

    try {
      await this.queryLeaderboardChain(query);
      return { success: true };
    } catch (error) {
      console.error("Failed to login/register:", error);
      throw error;
    }
  }

  /**
   * Get login result for current chain
   * @returns {Promise} Login result
   */
  async getLoginResult() {
    const query = `
      query {
        loginResultFor(chainId: "${this.chainId}") {
          success
          user {
            username
            role
            createdAt
            chainId
          }
          message
          isNewUser
        }
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return data.loginResultFor;
    } catch (error) {
      console.error("Failed to get login result:", error);
      throw error;
    }
  }

  /**
   * Get current user info
   * @returns {Promise} User info
   */
  async getCurrentUser() {
    const query = `
      query {
        isLoggedIn
        username
        userRole
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      if (data.isLoggedIn) {
        return {
          username: data.username,
          role: data.userRole,
          isLoggedIn: true,
        };
      }
      return { isLoggedIn: false };
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw error;
    }
  }

  // ==========================================
  // PRACTICE MODE METHODS
  // ==========================================

  /**
   * Submit practice score
   * @param {string} username - Username
   * @param {number} score - Score to submit
   * @returns {Promise} Submission result
   */
  async submitPracticeScore(username, score) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          submitPracticeScore(
            username: "${username}",
            score: ${score}
          )
        }
      `,
    };

    try {
      const response = await this.counter.query(JSON.stringify(queryObject));
      return response;
    } catch (error) {
      console.error("Failed to submit practice score:", error);
      throw error;
    }
  }

  /**
   * Get practice leaderboard
   * @returns {Promise} Practice leaderboard
   */
  async getPracticeLeaderboard() {
    const query = `
      query {
        practiceLeaderboard {
          username
          score
          chainId
          timestamp
        }
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return data.practiceLeaderboard;
    } catch (error) {
      console.error("Failed to get practice leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get my practice scores and best
   * @returns {Promise} My practice data
   */
  async getMyPracticeData() {
    const query = `
      query {
        myPracticeScores
        myPracticeBest
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return {
        myPracticeScores: data.myPracticeScores,
        myPracticeBest: data.myPracticeBest,
      };
    } catch (error) {
      console.error("Failed to get my practice data:", error);
      throw error;
    }
  }

  // ==========================================
  // TOURNAMENT BLOCKCHAIN METHODS
  // ==========================================
  // These methods are prepared for future blockchain implementation.
  // Currently using localStorage in GameState.js for development.

  /**
   * Create tournament on blockchain
   * @param {Object} tournamentData - Tournament data
   * @returns {Promise} Tournament creation result
   */
  async createTournament(tournamentData) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          createTournament(
            callerChainId: "${this.chainId}",
            name: "${tournamentData.name}",
            description: "${tournamentData.description}",
            startTime: ${
              tournamentData.startTime
                ? Math.floor(tournamentData.startTime.getTime() / 1000)
                : null
            },
            endTime: ${
              tournamentData.endTime
                ? Math.floor(tournamentData.endTime.getTime() / 1000)
                : null
            }
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to create tournament:", error);
      throw error;
    }
  }

  /**
   * Fetch tournaments from blockchain
   * @returns {Promise} Array of tournaments
   */
  async getTournaments() {
    const query = `
      query {
        tournaments {
          id
          name
          description
          status
          startTime
          endTime
          createdAt
          isPinned
          pinnedBy
          pinnedAt
        }
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      const tournaments = data.tournaments || [];

      // Fetch participant count and max score for each tournament
      const tournamentsWithCounts = await Promise.all(
        tournaments.map(async (tournament) => {
          let playerCount = 0;
          let maxScore = 0;

          try {
            const countQuery = `
              query {
                tournamentParticipantCount(tournamentId: "${tournament.id}")
              }
            `;
            const countData = await this.queryLeaderboardChain(countQuery);
            playerCount = countData.tournamentParticipantCount || 0;
          } catch (error) {
            console.warn(
              `Failed to get participant count for tournament ${tournament.id}:`,
              error
            );
          }

          // Fetch tournament leaderboard to get max score
          try {
            const leaderboardQuery = `
              query {
                tournamentLeaderboard(tournamentId: "${tournament.id}") {
                  score
                }
              }
            `;
            const leaderboardData = await this.queryLeaderboardChain(
              leaderboardQuery
            );
            const leaderboard = leaderboardData.tournamentLeaderboard || [];

            // Find the maximum score from the leaderboard
            if (leaderboard.length > 0) {
              maxScore = Math.max(...leaderboard.map((entry) => entry.score));
            }
          } catch (error) {
            console.warn(
              `Failed to get max score for tournament ${tournament.id}:`,
              error
            );
          }

          return {
            ...tournament,
            pinned: tournament.isPinned, // Map isPinned to pinned
            playerCount: playerCount, // Fetch actual participant count
            maxScore: maxScore, // Fetch actual max score from leaderboard
          };
        })
      );

      return tournamentsWithCounts;
    } catch (error) {
      console.error("Failed to get tournaments:", error);
      throw error;
    }
  }

  /**
   * Join tournament on blockchain
   * @param {string} tournamentId - Tournament ID
   * @param {string} username - Username
   * @returns {Promise} Join result
   */
  async joinTournament(tournamentId, username) {
    const query = `
      mutation {
        joinTournament(
          tournamentId: "${tournamentId}",
          username: "${username}"
        )
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return data;
    } catch (error) {
      console.error("Failed to join tournament:", error);
      throw error;
    }
  }

  /**
   * Submit tournament score to blockchain
   * @param {string} tournamentId - Tournament ID
   * @param {string} username - Username
   * @param {number} score - Player score
   * @returns {Promise} Score submission result
   */
  async submitTournamentScore(tournamentId, username, score) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          submitTournamentScore(
            tournamentId: "${tournamentId}",
            username: "${username}",
            score: ${score}
          )
        }
      `,
    };

    try {
      const response = await this.counter.query(JSON.stringify(queryObject));
      return response;
    } catch (error) {
      console.error("Failed to submit tournament score:", error);
      throw error;
    }
  }

  /**
   * Delete tournament from blockchain
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise} Deletion result
   */
  async deleteTournament(tournamentId) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          deleteTournament(
            callerChainId: "${this.chainId}",
            tournamentId: "${tournamentId}"
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      throw error;
    }
  }

  /**
   * Get tournament leaderboard from blockchain
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise} Tournament leaderboard
   */
  async getTournamentLeaderboard(tournamentId) {
    const query = `
      query {
        tournamentLeaderboard(tournamentId: "${tournamentId}") {
          username
          score
          rank
          chainId
          timestamp
        }
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return data.tournamentLeaderboard || [];
    } catch (error) {
      console.error("Failed to get tournament leaderboard:", error);
      throw error;
    }
  }

  /**
   * Alias for getTournamentLeaderboard for compatibility
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise} Tournament leaderboard
   */
  async fetchTournamentLeaderboard(tournamentId) {
    return this.getTournamentLeaderboard(tournamentId);
  }

  /**
   * Check if user is tournament participant
   * @param {string} tournamentId - Tournament ID
   * @param {string} username - Username
   * @returns {Promise} Boolean indicating participation
   */
  async isTournamentParticipant(tournamentId, username) {
    const query = `
      query {
        isTournamentParticipant(tournamentId: "${tournamentId}", username: "${username}")
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      return data.isTournamentParticipant || false;
    } catch (error) {
      console.error("Failed to check tournament participation:", error);
      return false;
    }
  }

  /**
   * Get tournaments the current user has joined
   * @returns {Promise} Array of tournaments user has joined
   */
  async getMyTournaments() {
    const query = `
      query {
        myTournaments {
          id
          name
          description
          status
          startTime
          endTime
          createdAt
          isPinned
          pinnedBy
          pinnedAt
        }
      }
    `;

    try {
      const data = await this.queryLeaderboardChain(query);
      const tournaments = data.myTournaments || [];

      // Fetch participant count and max score for each tournament
      const tournamentsWithCounts = await Promise.all(
        tournaments.map(async (tournament) => {
          let playerCount = 0;
          let maxScore = 0;

          try {
            const countQuery = `
              query {
                tournamentParticipantCount(tournamentId: "${tournament.id}")
              }
            `;
            const countData = await this.queryLeaderboardChain(countQuery);
            playerCount = countData.tournamentParticipantCount || 0;
          } catch (error) {
            console.warn(
              `Failed to get participant count for tournament ${tournament.id}:`,
              error
            );
          }

          // Fetch tournament leaderboard to get max score
          try {
            const leaderboardQuery = `
              query {
                tournamentLeaderboard(tournamentId: "${tournament.id}") {
                  score
                }
              }
            `;
            const leaderboardData = await this.queryLeaderboardChain(
              leaderboardQuery
            );
            const leaderboard = leaderboardData.tournamentLeaderboard || [];

            // Find the maximum score from the leaderboard
            if (leaderboard.length > 0) {
              maxScore = Math.max(...leaderboard.map((entry) => entry.score));
            }
          } catch (error) {
            console.warn(
              `Failed to get max score for tournament ${tournament.id}:`,
              error
            );
          }

          return {
            ...tournament,
            pinned: tournament.isPinned, // Map isPinned to pinned
            playerCount: playerCount, // Fetch actual participant count
            maxScore: maxScore, // Fetch actual max score from leaderboard
          };
        })
      );

      return tournamentsWithCounts;
    } catch (error) {
      console.error("Failed to get my tournaments:", error);
      return [];
    }
  }

  /**
   * Toggle tournament pin status on blockchain
   * @param {string} tournamentId - Tournament ID
   * @param {boolean} pin - Pin status (true to pin, false to unpin)
   * @returns {Promise} Toggle result
   */
  async toggleTournamentPin(tournamentId, pin) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          pinTournament(
            callerChainId: "${this.chainId}",
            tournamentId: "${tournamentId}",
            pin: ${pin}
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to toggle tournament pin:", error);
      throw error;
    }
  }

  /**
   * Start tournament on blockchain
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise} Start result
   */
  async startTournament(tournamentId) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          startTournament(
            callerChainId: "${this.chainId}",
            tournamentId: "${tournamentId}"
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to start tournament:", error);
      throw error;
    }
  }

  /**
   * End tournament on blockchain
   * @param {string} tournamentId - Tournament ID
   * @param {Array} results - Tournament results
   * @returns {Promise} End result
   */
  async endTournament(tournamentId, results) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          endTournament(
            callerChainId: "${this.chainId}",
            tournamentId: "${tournamentId}",
            results: ${JSON.stringify(results)}
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to end tournament:", error);
      throw error;
    }
  }

  /**
   * Update tournament on blockchain
   * @param {string} tournamentId - Tournament ID
   * @param {Object} updates - Tournament updates
   * @returns {Promise} Update result
   */
  async updateTournament(tournamentId, updates) {
    if (!this.counter) {
      throw new Error("Client not initialized");
    }

    const queryObject = {
      query: `
        mutation {
          updateTournament(
            callerChainId: "${this.chainId}",
            tournamentId: "${tournamentId}",
            name: ${updates.name ? `"${updates.name}"` : null},
            description: ${
              updates.description ? `"${updates.description}"` : null
            },
            startTime: ${updates.startTime || null},
            endTime: ${updates.endTime || null}
          )
        }
      `,
    };

    try {
      const response = await this.queryLeaderboardChain(queryObject.query);
      return response;
    } catch (error) {
      console.error("Failed to update tournament:", error);
      throw error;
    }
  }
}
