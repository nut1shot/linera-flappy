// Compatibility layer for the refactored game
// This file maintains backward compatibility while using the new modular structure
// The original game.js has been backed up to game.js.backup

import "./main.js";

// Export any functions that might be used externally
export { LineraClient } from "./blockchain/LineraClient.js";
export { TournamentModal } from "./ui/TournamentModal.js";
export { GameEngine } from "./game/GameEngine.js";
export { GameState } from "./game/GameState.js";
export { GameUI } from "./ui/GameUI.js";

