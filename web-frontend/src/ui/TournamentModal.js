import { TimeUtils } from '../utils/TimeUtils.js';

export class TournamentModal {
  constructor() {
    this.tournamentLeaderboardModal = null;
    this.tournamentLeaderboardEntries = null;
    this.joinTournamentFromModalBtn = null;
    this.tournaments = [];
    this.playerName = "";
    this.best = 0;
    
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

  showTournamentLeaderboardModal(tournament) {
    // Update modal header
    document.getElementById("tournament-leaderboard-title").textContent =
      tournament.name + " - Leaderboard";

    // Update tournament info
    document.getElementById("modal-tournament-name").textContent = tournament.name;
    document.getElementById("modal-tournament-status").textContent = tournament.status;
    document.getElementById("modal-tournament-players").textContent = tournament.playerCount;

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

    // Statistics panel has been removed - no longer needed

    // Load tournament leaderboard data
    this.loadTournamentLeaderboardData(tournament);

    // Show modal
    this.tournamentLeaderboardModal.style.display = "flex";

    // Set up join button
    this.setupJoinTournamentButton(tournament);
  }

  hideTournamentLeaderboardModal() {
    this.tournamentLeaderboardModal.style.display = "none";
  }

  updateModalTournamentTimer(tournament) {
    if (!tournament.endTime) {
      document.getElementById("modal-tournament-time-left").textContent = "No end time";
      return;
    }

    const timeLeft = TimeUtils.calculateTimeLeft(tournament.endTime);
    document.getElementById("modal-tournament-time-left").textContent = timeLeft;
  }


  loadTournamentLeaderboardData(tournament) {
    // Show loading state
    this.tournamentLeaderboardEntries.innerHTML = `
      <div class="leaderboard-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading tournament leaderboard...</div>
      </div>
    `;

    // Simulate API call with timeout
    setTimeout(() => {
      const leaderboardData = this.generateTournamentLeaderboardData(tournament);
      this.renderTournamentLeaderboardEntries(leaderboardData);
      this.updateMyTournamentPosition(leaderboardData);
    }, 1000);
  }

  generateTournamentLeaderboardData(tournament) {
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
      { name: this.playerName, score: this.best, isCurrentPlayer: true },
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

  setupJoinTournamentButton(tournament) {
    const joinBtn = this.joinTournamentFromModalBtn;

    if (tournament.status === "Ended") {
      // Hide the join button completely for ended tournaments
      joinBtn.style.display = "none";
    } else {
      // Show and enable the join button for active tournaments
      joinBtn.style.display = "block";
      joinBtn.textContent = "JOIN TOURNAMENT";
      joinBtn.disabled = false;
      joinBtn.style.opacity = "1";
      joinBtn.style.cursor = "pointer";
    }
  }

  joinTournamentFromModal() {
    // Find current tournament from modal
    const tournamentName = document.getElementById(
      "modal-tournament-name"
    ).textContent;
    const tournament = this.tournaments.find((t) => t.name === tournamentName);

    if (tournament) {
      this.hideTournamentLeaderboardModal();
      // Emit event for main game to handle
      window.dispatchEvent(new CustomEvent('tournamentSelected', { 
        detail: { tournamentId: tournament.id } 
      }));
    }
  }

  refreshTournamentLeaderboard() {
    const tournamentName = document.getElementById(
      "modal-tournament-name"
    ).textContent;
    const tournament = this.tournaments.find((t) => t.name === tournamentName);

    if (tournament) {
      this.loadTournamentLeaderboardData(tournament);
    }
  }
}