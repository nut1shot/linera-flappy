/**
 * Game Constants - Centralized configuration for the Flappy Bird game
 *
 * This file contains all hardcoded values used throughout the application
 * to improve maintainability and make configuration changes easier.
 */

export const GAME_CONFIG = {
  // Canvas and display settings
  CANVAS: {
    BASE_WIDTH: 288,
    BASE_HEIGHT: 512,
    WIDTH: 288,
    HEIGHT: 512,
    BACKGROUND_COLOR: "#70c5ce",
  },

  // Bird physics and behavior
  BIRD: {
    WIDTH: 32,
    HEIGHT: 24,
    JUMP_STRENGTH: -6,
    GRAVITY: 0.3,
    MAX_FALL_SPEED: 8,
    STARTING_X: 50,
    STARTING_Y: 256,
  },

  // Pipe configuration
  PIPES: {
    WIDTH: 52,
    GAP: 140,
    SPEED: 1.5,
    SPAWN_INTERVAL: 120,
    MIN_HEIGHT: 50,
    MAX_HEIGHT: 350,
  },

  // Game mechanics
  GAME: {
    GROUND_HEIGHT: 112,
    SCROLL_SPEED: 1.5,
    SCORE_SOUND_INTERVAL: 100,
  },

  // UI and animation settings
  UI: {
    BASE_HEIGHT: 112,
    LOADING_STEP_DELAY: 200,
    TRANSITION_DELAY: 500,
    BUTTON_HOVER_DURATION: 200,
    MODAL_FADE_DURATION: 300,
  },
};

export const AUTH_CONFIG = {
  // Authentication settings
  SESSION: {
    DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    STORAGE_KEY: "flappy_session",
  },

  // Login security
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 6,
    MAX_USERNAME_LENGTH: 20,
  },

  // Password hashing
  SECURITY: {
    SALT_LENGTH: 32,
    HASH_ALGORITHM: "SHA-256",
  },

  // Storage keys
  STORAGE: {
    USERS_KEY: "flappy_users",
    SESSION_KEY: "flappy_session",
    LOGIN_ATTEMPTS_PREFIX: "login_attempts_",
  },
};

export const TOURNAMENT_CONFIG = {
  // Tournament settings
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,

  // Status definitions
  STATUS: {
    SCHEDULED: "Scheduled",
    ACTIVE: "Active",
    ENDED: "Ended",
    ENDING_SOON: "Ending Soon",
  },

  // Prize pools by category
  PRIZE_POOLS: {
    beginner: "100 LINERA",
    intermediate: "300 LINERA",
    advanced: "500 LINERA",
    pro: "1000 LINERA",
    open: "750 LINERA",
  },

  // Duration presets (in milliseconds)
  DURATION_PRESETS: {
    "1hour": 60 * 60 * 1000,
    "6hours": 6 * 60 * 60 * 1000,
    "1day": 24 * 60 * 60 * 1000,
    "3days": 3 * 24 * 60 * 60 * 1000,
    "1week": 7 * 24 * 60 * 60 * 1000,
  },

  // Sorting priorities
  STATUS_PRIORITY: {
    Active: 3,
    Scheduled: 2,
    Ended: 1,
  },
};

export const BLOCKCHAIN_CONFIG = {
  // Environment variables keys
  ENV_KEYS: {
    APP_URL: "VITE_APP_URL",
    APP_ID: "VITE_APP_ID",
  },

  // Default values for development
  DEFAULTS: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // GraphQL operation names
  OPERATIONS: {
    SETUP_GAME: "setupGame",
    INCREMENT: "increment",
    SET_BEST_AND_SUBMIT: "setBestAndSubmit",
    REQUEST_LEADERBOARD: "requestLeaderboard",
  },
};

export const UI_CONFIG = {
  // Screen identifiers
  SCREENS: {
    INITIAL_LOADING: "initial-loading-screen",
    AUTH: "auth-screen",
    MODE_SELECTION: "mode-selection-screen",
    GAME: "game-screen",
    TOURNAMENT: "tournament-screen",
    TOURNAMENT_CREATION: "tournament-creation",
  },

  // Element classes
  CLASSES: {
    ADMIN_ONLY: "admin-only",
    MOBILE_TOUCH_TARGET: "mobile-touch-target",
    TOURNAMENT_CARD: "tournament-card",
    TOURNAMENT_PINNED: "pinned",
  },

  // Mobile breakpoint
  MOBILE_BREAKPOINT: 768,
};

export const LOADING_CONFIG = {
  // Loading steps configuration
  STEPS: [
    { text: "Loading game assets..." },
    { text: "Loading chain..." },
    { text: "Setting up game..." },
  ],

  // Progress calculation
  STEP_DELAY: 200,
  PROGRESS_UPDATE_INTERVAL: 50,
};

// Audio file paths
export const AUDIO_CONFIG = {
  SOUNDS: {
    HIT: "/assets/hit.wav",
    POINT: "/assets/point.wav",
    WING: "/assets/wing.wav",
  },
};

// Default user accounts (removed hardcoded admin for security)
export const DEFAULT_ACCOUNTS = {
  // Admin accounts are now created during blockchain deployment
  // No hardcoded credentials in frontend
};
