/**
 * Linera Loading Spinner Component
 * A beautiful, branded loading UI using the Linera logo
 */
export class LoadingSpinner {
  constructor() {
    this.element = null;
    this.currentMessage = '';
    this.isVisible = false;
  }

  /**
   * Create the loading spinner HTML structure
   * @param {string} message - Loading message to display
   * @param {string} context - Loading context (blockchain, tournament, score, etc.)
   * @returns {HTMLElement} The loading spinner element
   */
  create(message = 'Loading...', context = 'default') {
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'linera-loading-overlay';
    loadingSpinner.innerHTML = `
      <div class="linera-loading-container">
        <div class="linera-logo-spinner ${context}">
          <!-- Pixel Art LINERA Logo -->
          <div class="pixel-logo-container">
            <!-- LINERA Text in Pixel Style -->
            <div class="pixel-text-linera">
              <div class="pixel-letter" data-letter="L">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="I">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="N">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="E">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="R">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="A">
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
            </div>
            
            <!-- FLAPPY Text in Pixel Style -->
            <div class="pixel-text-flappy">
              <div class="pixel-letter" data-letter="F">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="L">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="A">
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="P">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="P">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                </div>
              </div>
              
              <div class="pixel-letter" data-letter="Y">
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
                <div class="pixel-row">
                  <div class="pixel off"></div>
                  <div class="pixel off"></div>
                  <div class="pixel on"></div>
                  <div class="pixel off"></div>
                </div>
              </div>
            </div>
            
            <!-- Pixel Art Blockchain Animation -->
            <div class="pixel-blockchain">
              <div class="pixel-block block-1">
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel active"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
              </div>
              
              <div class="pixel-connection">
                <div class="connection-pixel"></div>
                <div class="connection-pixel"></div>
                <div class="connection-pixel"></div>
              </div>
              
              <div class="pixel-block block-2">
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel active"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
              </div>
              
              <div class="pixel-connection">
                <div class="connection-pixel"></div>
                <div class="connection-pixel"></div>
                <div class="connection-pixel"></div>
              </div>
              
              <div class="pixel-block block-3">
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel active"></div>
                  <div class="block-pixel"></div>
                </div>
                <div class="pixel-block-row">
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                  <div class="block-pixel"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="loading-text-container">
          <p class="loading-message" id="loading-message">${message}</p>
          <div class="loading-progress">
            <div class="progress-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.element = loadingSpinner;
    this.currentMessage = message;
    return loadingSpinner;
  }

  /**
   * Get context-specific title
   * @param {string} context - Loading context
   * @returns {string} Context title
   */
  getContextTitle(context) {
    const titles = {
      blockchain: 'LINERA FLAPPY',
      tournament: 'LINERA FLAPPY',
      score: 'LINERA FLAPPY',
      leaderboard: 'LINERA FLAPPY',
      auth: 'LINERA FLAPPY',
      wallet: 'LINERA FLAPPY',
      default: 'LINERA FLAPPY'
    };
    return titles[context] || titles.default;
  }

  /**
   * Show the loading spinner
   * @param {string} message - Loading message
   * @param {string} context - Loading context
   * @param {HTMLElement} container - Container to append to (defaults to body)
   */
  show(message = 'Loading...', context = 'default', container = document.body) {
    if (this.isVisible) {
      this.updateMessage(message);
      return;
    }

    const spinner = this.create(message, context);
    
    container.appendChild(spinner);
    this.isVisible = true;

    // Trigger animation
    requestAnimationFrame(() => {
      spinner.classList.add('visible');
    });
  }

  /**
   * Hide the loading spinner
   */
  hide() {
    if (!this.isVisible || !this.element) return;

    this.element.classList.add('hiding');
    
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      this.isVisible = false;
    }, 300);
  }

  /**
   * Update the loading message
   * @param {string} message - New message
   */
  updateMessage(message) {
    if (!this.element) return;
    
    const messageEl = this.element.querySelector('#loading-message');
    if (messageEl) {
      messageEl.textContent = message;
      this.currentMessage = message;
    }
  }

  /**
   * Update loading progress with animated messages
   * @param {Array} messages - Array of progress messages
   * @param {number} interval - Interval between messages (ms)
   */
  async animateProgress(messages, interval = 1500) {
    for (let i = 0; i < messages.length; i++) {
      this.updateMessage(messages[i]);
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  /**
   * Static method to create and show a loading spinner
   * @param {string} message - Loading message
   * @param {string} context - Loading context
   * @param {HTMLElement} container - Container element
   * @returns {LoadingSpinner} The spinner instance
   */
  static show(message, context, container) {
    const spinner = new LoadingSpinner();
    spinner.show(message, context, container);
    return spinner;
  }
}

// Export singleton instance for convenience
export const globalLoadingSpinner = new LoadingSpinner();