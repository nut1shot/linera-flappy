/**
 * Loading Manager - Centralized loading state management
 * Handles different types of loading states throughout the app
 */

import { LoadingSpinner, globalLoadingSpinner } from '../components/LoadingSpinner.js';

export class LoadingManager {
  constructor() {
    this.activeLoaders = new Map();
    this.loadingQueue = [];
  }

  /**
   * Show blockchain connection loading
   */
  async showBlockchainLoading() {
    const spinner = LoadingSpinner.show(
      'Initializing Linera client...',
      'blockchain'
    );
    
    // Animate through connection steps
    await spinner.animateProgress([
      'Initializing Linera client...',
      'Creating wallet...',
      'Claiming chain from faucet...',
      'Setting up application...',
      'Connection established!'
    ], 1200);
    
    return spinner;
  }

  /**
   * Show tournament loading
   */
  showTournamentLoading() {
    return LoadingSpinner.show(
      'Loading tournament data...',
      'tournament'
    );
  }

  /**
   * Show score submission loading
   * @param {string} mode - 'practice' or 'tournament'
   */
  showScoreSubmissionLoading(mode = 'practice') {
    return LoadingSpinner.show(
      'Submitting score...',
      'score'
    );
  }

  /**
   * Show leaderboard refresh loading
   */
  showLeaderboardLoading() {
    return LoadingSpinner.show(
      'Refreshing leaderboard...',
      'leaderboard'
    );
  }

  /**
   * Show authentication loading
   */
  async showAuthLoading() {
    const spinner = LoadingSpinner.show(
      'Authenticating user...',
      'auth'
    );
    
    await spinner.animateProgress([
      'Authenticating user...',
      'Verifying credentials...',
      'Setting up session...',
      'Authentication complete!'
    ], 1000);
    
    return spinner;
  }

  /**
   * Show wallet setup loading
   */
  async showWalletLoading() {
    const spinner = LoadingSpinner.show(
      'Setting up wallet...',
      'wallet'
    );
    
    await spinner.animateProgress([
      'Setting up wallet...',
      'Generating key pair...',
      'Configuring security...',
      'Wallet ready!'
    ], 1200);
    
    return spinner;
  }

  /**
   * Show tournament join loading
   */
  async showTournamentJoinLoading() {
    const spinner = LoadingSpinner.show(
      'Joining tournament...',
      'tournament'
    );
    
    await spinner.animateProgress([
      'Joining tournament...',
      'Verifying eligibility...',
      'Updating participant list...',
      'Successfully joined!'
    ], 1000);
    
    return spinner;
  }

  /**
   * Show generic loading with custom message
   * @param {string} message - Loading message
   * @param {string} context - Loading context
   */
  showCustomLoading(message, context = 'default') {
    return LoadingSpinner.show(message, context);
  }

  /**
   * Hide all active loaders
   */
  hideAll() {
    this.activeLoaders.forEach(spinner => {
      spinner.hide();
    });
    this.activeLoaders.clear();
  }
}

// Export singleton instance
export const loadingManager = new LoadingManager();

/**
 * Convenience functions for common loading scenarios
 */
export const Loading = {
  // Blockchain operations
  blockchain: () => loadingManager.showBlockchainLoading(),
  wallet: () => loadingManager.showWalletLoading(),
  auth: () => loadingManager.showAuthLoading(),
  
  // Game operations
  tournament: () => loadingManager.showTournamentLoading(),
  joinTournament: () => loadingManager.showTournamentJoinLoading(),
  scoreSubmission: (mode) => loadingManager.showScoreSubmissionLoading(mode),
  leaderboard: () => loadingManager.showLeaderboardLoading(),
  
  // Generic
  custom: (message, context) => loadingManager.showCustomLoading(message, context),
  hide: (spinner) => spinner?.hide(),
  hideAll: () => loadingManager.hideAll()
};

/**
 * Decorator function to wrap async functions with loading
 * @param {Function} fn - Async function to wrap
 * @param {string} loadingType - Type of loading to show
 * @param {string} customMessage - Custom loading message
 */
export function withLoading(fn, loadingType = 'default', customMessage = null) {
  return async function(...args) {
    let spinner;
    
    try {
      // Show appropriate loading
      switch (loadingType) {
        case 'blockchain':
          spinner = await Loading.blockchain();
          break;
        case 'tournament':
          spinner = Loading.tournament();
          break;
        case 'score':
          spinner = await Loading.scoreSubmission(args[0]);
          break;
        case 'leaderboard':
          spinner = Loading.leaderboard();
          break;
        case 'auth':
          spinner = await Loading.auth();
          break;
        default:
          spinner = Loading.custom(customMessage || 'Loading...', loadingType);
      }
      
      // Execute the function
      const result = await fn.apply(this, args);
      
      return result;
    } finally {
      // Hide loading
      if (spinner) {
        setTimeout(() => spinner.hide(), 500); // Small delay to show completion
      }
    }
  };
}