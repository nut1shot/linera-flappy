/**
 * Loading Integration Examples
 * 
 * This file shows how to integrate the Linera Loading Spinner
 * into the existing Flappy Bird game codebase
 */

import { Loading, withLoading } from '../utils/LoadingManager.js';
import '../components/LoadingSpinner.css';

/**
 * EXAMPLE 1: Blockchain Initialization (main.js)
 * Replace the current initialization loading with branded Linera loading
 */
export class EnhancedMainGame {
  async initializeBlockchain() {
    const spinner = await Loading.blockchain();
    
    try {
      // Existing blockchain initialization code
      const result = await this.lineraClient.initialize();
      
      // Small delay to show completion message
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return result;
    } finally {
      spinner.hide();
    }
  }

  // Using the decorator approach
  @withLoading('blockchain')
  async initializeBlockchainWithDecorator() {
    return await this.lineraClient.initialize();
  }
}

/**
 * EXAMPLE 2: Tournament Operations
 */
export class EnhancedTournamentModal {
  async showTournamentLeaderboardModal(tournament) {
    const spinner = Loading.tournament();
    
    try {
      // Store tournament
      this.currentTournament = tournament;
      
      // Load tournament data
      await this.loadTournamentLeaderboardData(tournament);
      
      // Show modal
      this.tournamentLeaderboardModal.style.display = "flex";
      
    } finally {
      spinner.hide();
    }
  }

  async joinTournamentFromModal() {
    const spinner = await Loading.joinTournament();
    
    try {
      const tournament = this.currentTournament;
      
      if (tournament) {
        window.dispatchEvent(new CustomEvent('tournamentSelected', { 
          detail: { tournamentId: tournament.id } 
        }));
        
        setTimeout(() => {
          this.hideTournamentLeaderboardModal();
        }, 500);
      }
    } catch (error) {
      console.error("Failed to join tournament:", error);
      throw error;
    } finally {
      spinner.hide();
    }
  }
}

/**
 * EXAMPLE 3: Score Submission with Context-Aware Loading
 */
export class EnhancedGameManager {
  async handleGameOver(score, best, isNewHighScore) {
    const gameMode = this.gameState.getGameMode();
    const activeTournament = this.gameState.getActiveTournament();
    
    // Tournament score submission
    if (activeTournament && activeTournament.status === "Active") {
      const spinner = await Loading.scoreSubmission('tournament');
      
      try {
        await this.gameState.submitTournamentScore(activeTournament.id, score);
        await this.loadTournamentLeaderboard(activeTournament.id);
      } finally {
        spinner.hide();
      }
    } 
    // Practice score submission
    else if (gameMode === "practice") {
      const spinner = await Loading.scoreSubmission('practice');
      
      try {
        await this.loadPracticeLeaderboard();
      } finally {
        spinner.hide();
      }
    }

    // Rest of game over logic...
  }
}

/**
 * EXAMPLE 4: Authentication with Branded Loading
 */
export class EnhancedAuthManager {
  async login(username, password) {
    const spinner = await Loading.auth();
    
    try {
      const hash = await this.hashPassword(password);
      await this.lineraClient.loginOrRegister(username, hash);
      const result = await this.lineraClient.getLoginResult();
      
      if (result.success) {
        this.gameState.setAuthenticatedUser(result.user);
      }
      
      return result;
    } finally {
      spinner.hide();
    }
  }
}

/**
 * EXAMPLE 5: Leaderboard Refresh
 */
export class EnhancedLeaderboardManager {
  async refreshLeaderboard() {
    const gameMode = this.gameState.getGameMode();
    const spinner = Loading.leaderboard();
    
    try {
      if (gameMode === "practice") {
        await this.loadPracticeLeaderboard();
      } else if (gameMode === "tournament") {
        const activeTournament = this.gameState.getActiveTournament();
        if (activeTournament && activeTournament.id) {
          await this.loadTournamentLeaderboard(activeTournament.id);
        }
      }
    } finally {
      spinner.hide();
    }
  }
}

/**
 * EXAMPLE 6: Integration with existing HTML elements
 */
export class LoadingIntegrationHelper {
  /**
   * Replace existing loading elements with Linera loading
   */
  static replaceExistingLoading() {
    // Find existing loading elements
    const existingLoaders = document.querySelectorAll(
      '.loading-spinner, .tournament-leaderboard-loading, .leaderboard-loading'
    );
    
    existingLoaders.forEach(loader => {
      const context = this.detectLoadingContext(loader);
      const message = this.getLoadingMessage(loader);
      
      // Replace with Linera loading
      const spinner = Loading.custom(message, context);
      
      // Hide when original would hide
      const observer = new MutationObserver(() => {
        if (loader.style.display === 'none' || !loader.offsetParent) {
          spinner.hide();
          observer.disconnect();
        }
      });
      
      observer.observe(loader, { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
    });
  }

  static detectLoadingContext(element) {
    if (element.closest('.tournament-leaderboard-modal')) return 'tournament';
    if (element.closest('.leaderboard')) return 'leaderboard';
    if (element.querySelector('.loading-text')?.textContent.includes('blockchain')) return 'blockchain';
    return 'default';
  }

  static getLoadingMessage(element) {
    const textEl = element.querySelector('.loading-text');
    return textEl?.textContent || 'Loading...';
  }
}

/**
 * EXAMPLE 7: CSS Integration with existing styles
 */
export const integrationCSS = `
/* Add this to your main CSS file to integrate with existing loading styles */

/* Hide existing loading spinners when using Linera loading */
.use-linera-loading .loading-spinner,
.use-linera-loading .tournament-leaderboard-loading,
.use-linera-loading .leaderboard-loading {
  display: none !important;
}

/* Ensure Linera loading appears above game canvas */
.linera-loading-overlay {
  z-index: 10001; /* Higher than canvas z-index */
}

/* Match game's color scheme */
.linera-loading-overlay {
  background: rgba(30, 30, 30, 0.9); /* Match game background */
}

/* Mobile optimizations for the game */
@media (max-width: 768px) {
  .linera-loading-container {
    padding: 1rem;
    max-width: 300px;
  }
}
`;

/**
 * EXAMPLE 8: Auto-initialization
 */
export function initializeLineraLoading() {
  // Add CSS to head
  const style = document.createElement('style');
  style.textContent = integrationCSS;
  document.head.appendChild(style);
  
  // Add class to body for conditional hiding
  document.body.classList.add('use-linera-loading');
  
  // Replace existing loading elements
  LoadingIntegrationHelper.replaceExistingLoading();
  
  console.log('✅ Linera Loading UI initialized');
}

/**
 * Usage Instructions:
 * 
 * 1. Import the CSS in your main HTML:
 *    <link rel="stylesheet" href="src/components/LoadingSpinner.css">
 * 
 * 2. Initialize in your main.js:
 *    import { initializeLineraLoading } from './examples/LoadingIntegration.js';
 *    initializeLineraLoading();
 * 
 * 3. Use throughout your app:
 *    import { Loading } from './utils/LoadingManager.js';
 *    
 *    // For blockchain operations
 *    const spinner = await Loading.blockchain();
 *    // ... do blockchain work
 *    spinner.hide();
 * 
 * 4. Or use the decorator approach:
 *    @withLoading('tournament')
 *    async loadTournaments() {
 *      // Your existing code
 *    }
 */