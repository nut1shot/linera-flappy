import { TimeUtils } from '../utils/TimeUtils.js';
import { Loading } from '../utils/LoadingManager.js';

export class TournamentModal {
  constructor(lineraClient = null) {
    this.tournamentLeaderboardModal = null;
    this.tournamentLeaderboardEntries = null;
    this.joinTournamentFromModalBtn = null;
    this.tournaments = [];
    this.playerName = "";
    this.best = 0;
    this.lineraClient = lineraClient;
    this.currentTournament = null; // Store the currently displayed tournament
    
    this.initializeElements();
  }

  initializeElements() {
    // These will be set by the main game when DOM is ready
    this.tournamentLeaderboardModal = document.getElementById("tournament-leaderboard-modal");
    this.tournamentLeaderboardEntries = document.getElementById("tournament-leaderboard-entries");
    this.joinTournamentFromModalBtn = document.getElementById("join-tournament-from-modal-btn");
  }

  setGameData(tournaments, playerName, best) {
    this.tournaments = tournaments;
    this.playerName = playerName;
    this.best = best;
  }

  async showTournamentLeaderboardModal(tournament) {
    // Store the current tournament for use in modal actions
    this.currentTournament = tournament;
    
    // Show Linera loading for tournament data
    const spinner = Loading.tournament();
    
    try {
      // Update modal header
      document.getElementById("tournament-leaderboard-title").textContent =
        tournament.name + " - Leaderboard";

      // Update tournament info
      document.getElementById("modal-tournament-name").textContent = tournament.name;
      document.getElementById("modal-tournament-status").textContent = tournament.status;
      
      // Show loading for player count initially
      document.getElementById("modal-tournament-players").textContent = "Loading...";

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
      this.updateModalTournamentTimer(tournament);

      // Update loading message for leaderboard data
      spinner.updateMessage('Loading tournament leaderboard...');

      // Load tournament leaderboard data and player count
      await this.loadTournamentLeaderboardData(tournament);

      // Show modal
      this.tournamentLeaderboardModal.style.display = "flex";

      // Set up join button
      await this.setupJoinTournamentButton(tournament);
      
    } finally {
      // Hide loading spinner
      spinner.hide();
    }
  }

  hideTournamentLeaderboardModal() {
    this.tournamentLeaderboardModal.style.display = "none";
  }

  updateModalTournamentTimer(tournament) {
    if (!tournament.endTime) {
      document.getElementById("modal-tournament-time-left").textContent = "No end time";
      return;
    }

    // Convert microseconds to milliseconds for JavaScript Date
    const endTimeMs = tournament.endTime / 1000;
    const endDate = new Date(endTimeMs);
    const timeLeft = TimeUtils.calculateTimeLeft(endDate);
    document.getElementById("modal-tournament-time-left").textContent = timeLeft;
  }


  async loadTournamentLeaderboardData(tournament) {
    // Show loading state
    this.tournamentLeaderboardEntries.innerHTML = `
      <div class="leaderboard-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading tournament leaderboard...</div>
      </div>
    `;

    try {
      // Get real tournament leaderboard data from blockchain
      const leaderboardData = await this.fetchTournamentLeaderboard(tournament);
      this.renderTournamentLeaderboardEntries(leaderboardData);
      this.updateMyTournamentPosition(leaderboardData);
      
      // Update player count based on actual leaderboard data
      document.getElementById("modal-tournament-players").textContent = leaderboardData.length;
    } catch (error) {
      console.error("Failed to load tournament leaderboard:", error);
      this.tournamentLeaderboardEntries.innerHTML = `
        <div class="leaderboard-loading">
          <div class="loading-text">Failed to load leaderboard. Try refreshing.</div>
        </div>
      `;
      document.getElementById("modal-tournament-players").textContent = "Error";
    }
  }

  async fetchTournamentLeaderboard(tournament) {
    if (!this.lineraClient) {
      throw new Error("LineraClient not available");
    }

    try {
      // Fetch tournament leaderboard from blockchain
      const response = await this.lineraClient.fetchTournamentLeaderboard(tournament.id);
      
      if (!response || !Array.isArray(response)) {
        console.warn("Invalid leaderboard response, using empty array");
        return [];
      }

      // Transform blockchain data to match expected format
      return response.map((entry, index) => ({
        name: entry.username,
        score: entry.score,
        rank: entry.rank || (index + 1),
        isCurrentPlayer: entry.username === this.playerName
      }));
    } catch (error) {
      console.error("Error fetching tournament leaderboard:", error);
      throw error;
    }
  }


  renderTournamentLeaderboardEntries(leaderboardData) {
    if (!leaderboardData || leaderboardData.length === 0) {
      this.tournamentLeaderboardEntries.innerHTML = `
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

    this.tournamentLeaderboardEntries.innerHTML = entriesHTML;
  }

  updateMyTournamentPosition(leaderboardData) {
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

  async setupJoinTournamentButton(tournament) {
    const joinBtn = this.joinTournamentFromModalBtn;

    // Same condition as Available Tournaments: Show button only for REGISTRATION or ACTIVE status
    if (tournament.status === "REGISTRATION" || tournament.status === "ACTIVE") {
      joinBtn.style.display = "block";
      joinBtn.textContent = "JOIN TOURNAMENT";
      joinBtn.disabled = false;
      joinBtn.style.opacity = "1";
      joinBtn.style.cursor = "pointer";
      
      // Set up click handler
      joinBtn.onclick = () => this.joinTournamentFromModal();
    } else {
      joinBtn.style.display = "none";
    }
  }

  async joinTournamentFromModal() {
    const joinBtn = this.joinTournamentFromModalBtn;
    
    // Prevent multiple clicks
    if (joinBtn.disabled) {
      return;
    }
    
    // Show Linera join tournament loading
    const spinner = await Loading.joinTournament();
    
    // Show loading state on button
    joinBtn.disabled = true;
    joinBtn.textContent = "JOINING...";
    joinBtn.style.opacity = "0.6";
    joinBtn.style.cursor = "not-allowed";
    
    try {
      // Use the stored current tournament
      const tournament = this.currentTournament;

      if (tournament) {
        
        // Update loading message
        spinner.updateMessage('Verifying tournament eligibility...');
        
        // Emit event for main game to handle
        window.dispatchEvent(new CustomEvent('tournamentSelected', { 
          detail: { tournamentId: tournament.id } 
        }));
        
        // Update loading message for success
        spinner.updateMessage('Successfully joined tournament!');
        
        // Reset button state after successful join
        joinBtn.disabled = false;
        joinBtn.textContent = "JOIN TOURNAMENT";
        joinBtn.style.opacity = "1";
        joinBtn.style.cursor = "pointer";
        
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Hide modal
        this.hideTournamentLeaderboardModal();
      } else {
        throw new Error("No tournament currently displayed in modal");
      }
    } catch (error) {
      console.error("Failed to join tournament:", error);
      // Reset button on error
      joinBtn.disabled = false;
      joinBtn.textContent = "JOIN TOURNAMENT";
      joinBtn.style.opacity = "1";
      joinBtn.style.cursor = "pointer";
      alert("Failed to join tournament. Please try again.");
    } finally {
      // Hide loading spinner
      spinner.hide();
    }
  }

  async refreshTournamentLeaderboard() {
    const refreshBtn = document.getElementById("refresh-tournament-leaderboard");
    
    // Show Linera leaderboard loading
    const spinner = Loading.leaderboard();
    
    try {
      // Show loading state on button
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "Refreshing...";
        refreshBtn.style.opacity = "0.6";
      }
      
      // Use the stored current tournament
      const tournament = this.currentTournament;

      if (tournament) {
        
        // Update loading message
        spinner.updateMessage('Fetching latest tournament data...');
        
        await this.loadTournamentLeaderboardData(tournament);
        
        // Update loading message for success
        spinner.updateMessage('Leaderboard updated successfully!');
        
        
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } else {
        console.warn("No tournament currently displayed in modal for refresh");
        throw new Error("No tournament currently displayed in modal");
      }
    } catch (error) {
      console.error("Failed to refresh tournament leaderboard:", error);
      alert("Failed to refresh leaderboard. Please try again.");
    } finally {
      // Reset button state
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "🔄";
        refreshBtn.style.opacity = "1";
      }
      
      // Hide loading spinner
      spinner.hide();
    }
  }
}