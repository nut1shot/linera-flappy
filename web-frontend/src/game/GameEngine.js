import { Bird } from "../bird.js";
import { Pipe } from "../pipe.js";
import { GAME_CONFIG } from "../constants/GameConstants.js";

export class GameEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.baseWidth = GAME_CONFIG.CANVAS.BASE_WIDTH;
    this.baseHeight = GAME_CONFIG.CANVAS.BASE_HEIGHT;
    this.displayScaleX = 1;
    this.displayScaleY = 1;
    
    // Game state
    this.bird = new Bird(canvas, ctx);
    this.pipes = [];
    this.frame = 0;
    this.gameOver = false;
    this.count = 0;
    this.best = 0;
    this.showInstructions = true;
    this.startGame = false;
    this.gameStarted = false; // Controls if the game can be played
    
    // Game loop control
    this.gameLoopId = null;
    this.isGameLoopRunning = false;
    
    // Load images
    this.bgImage = new Image();
    this.bgImage.src = "/assets/background.png";
    
    this.baseImage = new Image();
    this.baseImage.src = "/assets/base.png";
    
    this.gameOverImage = new Image();
    this.gameOverImage.src = "/assets/gameover.png";
    
    // Track image loading
    this.imagesLoaded = 0;
    this.totalImages = 3;
    
    this.bgImage.onload = () => {
      this.imagesLoaded++;
    };
    
    this.baseImage.onload = () => {
      this.imagesLoaded++;
    };
    
    this.gameOverImage.onload = () => {
      this.imagesLoaded++;
    };
    
    // Load audio
    this.audioJump = new Audio("/assets/wing.wav");
    this.audioPoint = new Audio("/assets/point.wav");
    this.audioHit = new Audio("/assets/hit.wav");
    
    // Callbacks
    this.onScoreUpdate = null;
    this.onGameOver = null;
    this.onHighScore = null;
    this.currentScreen = "game-screen";
    this.initialLoadingComplete = true;
    this.myRank = null;
  }

  setCallbacks(callbacks) {
    this.onScoreUpdate = callbacks.onScoreUpdate;
    this.onGameOver = callbacks.onGameOver;
    this.onHighScore = callbacks.onHighScore;
  }

  setGameState(currentScreen, initialLoadingComplete) {
    this.currentScreen = currentScreen;
    this.initialLoadingComplete = initialLoadingComplete;
  }

  setBest(best) {
    this.best = best;
  }

  setMyRank(rank) {
    this.myRank = rank;
  }

  setDisplayScale(scaleX, scaleY) {
    this.displayScaleX = scaleX;
    this.displayScaleY = scaleY;
  }

  startGameLoop() {
    if (this.isGameLoopRunning) {
      return;
    }

    this.isGameLoopRunning = true;

    if (this.currentScreen === "game-screen" && this.initialLoadingComplete) {
      this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  stopGameLoop() {
    this.isGameLoopRunning = false;

    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async gameLoop() {
    this.gameLoopId = null;

    if (
      !this.isGameLoopRunning ||
      this.currentScreen !== "game-screen" ||
      !this.initialLoadingComplete
    ) {
      return;
    }

    this.drawBackground();

    if (this.count > 0) {
      this.ctx.font = "bold 20px 'Press Start 2P', cursive";
      this.ctx.fillStyle = "#fff";
      this.ctx.textAlign = "center";
      this.ctx.lineWidth = 3;
      this.ctx.fillText(this.count, this.canvas.width / 2, 40);
    }

    if (!this.startGame) {
      // Draw bird in initial position
      this.bird.draw();
      
      // Draw base
      this.drawBase();
      
      // Draw instructions
      this.ctx.font = "bold 10px 'Press Start 2P', cursive";
      this.ctx.fillStyle = "#fff";
      this.ctx.textAlign = "center";
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 2;
      
      const text = "TAP or PRESS SPACE to FLY";
      const textY = this.canvas.height / 4;
      this.ctx.strokeText(text, this.canvas.width / 2, textY);
      this.ctx.fillText(text, this.canvas.width / 2, textY);

      if (this.isGameLoopRunning && this.currentScreen === "game-screen") {
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
      }
      return;
    }

    this.bird.update();
    this.bird.draw();

    if (this.frame % GAME_CONFIG.PIPES.SPAWN_INTERVAL === 0) {
      this.pipes.push(new Pipe(this.canvas, this.ctx));
    }

    this.pipes.forEach((pipe) => {
      pipe.update();
      pipe.draw();

      if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true;
        this.count++;
        this.audioPoint.play();
        
        if (this.onScoreUpdate) {
          this.onScoreUpdate(this.count);
        }
      }

      if (pipe.collides(this.bird)) {
        this.gameOver = true;
        this.audioHit.play();
      }
    });

    this.pipes = this.pipes.filter((p) => p.x + p.width > 0);

    this.drawBase();

    if (this.showInstructions) {
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 10px 'Press Start 2P', cursive";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "TAP or PRESS SPACE to FLY",
        this.canvas.width / 2,
        this.canvas.height / 4
      );
    }

    if (!this.gameOver) {
      if (this.isGameLoopRunning && this.currentScreen === "game-screen") {
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
      }
    } else {
      let isNewHighScore = false;
      if (this.count > this.best) {
        this.best = this.count;
        isNewHighScore = true;
        
        if (this.onHighScore) {
          await this.onHighScore(this.best);
        }
      }

      this.drawGameOver();
      
      if (this.onGameOver) {
        this.onGameOver(this.count, this.best, isNewHighScore);
      }

      this.stopGameLoop();
    }

    this.frame++;
  }

  drawBackground() {
    if (this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
      this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback: draw a simple background color
      this.ctx.fillStyle = "#70c5ce";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawBase() {
    if (this.baseImage.complete && this.baseImage.naturalWidth !== 0) {
      this.ctx.drawImage(this.baseImage, 0, this.canvas.height - GAME_CONFIG.UI.BASE_HEIGHT, this.canvas.width, GAME_CONFIG.UI.BASE_HEIGHT);
    } else {
      // Fallback: draw a simple base color
      this.ctx.fillStyle = "#dedf30";
      this.ctx.fillRect(0, this.canvas.height - GAME_CONFIG.UI.BASE_HEIGHT, this.canvas.width, GAME_CONFIG.UI.BASE_HEIGHT);
    }
  }

  drawGameOver() {
    const imgWidth = 192;
    const imgHeight = 42;
    const x = (this.canvas.width - imgWidth) / 2;
    const y = this.canvas.height / 3 - imgHeight;
    this.ctx.drawImage(this.gameOverImage, x, y, imgWidth, imgHeight);

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 14px 'Press Start 2P', cursive";
    this.ctx.textAlign = "center";
    this.ctx.fillText("SCORE: " + this.count, this.canvas.width / 2, y + imgHeight + 40);

    if (this.best) {
      this.ctx.fillText("BEST: " + this.best, this.canvas.width / 2, y + imgHeight + 70);
    }

    if (this.myRank) {
      this.ctx.font = "bold 12px 'Press Start 2P', cursive";
      this.ctx.fillText("RANK: #" + this.myRank, this.canvas.width / 2, y + imgHeight + 100);
    }
  }

  resetGameState() {
    this.bird = new Bird(this.canvas, this.ctx);
    this.pipes = [];
    this.frame = 0;
    this.gameOver = false;
    this.count = 0;
    this.showInstructions = true;
    this.startGame = false;
    this.gameStarted = false; // Reset game control flag

    this.clearCanvas();
    
    // Render initial state immediately
    this.renderInitialState();
  }

  renderInitialState() {
    // Draw the initial game screen with background, base, and bird
    this.drawBackground();
    
    // Draw instructions text
    if (this.showInstructions) {
      this.ctx.font = "bold 16px 'Press Start 2P', cursive";
      this.ctx.fillStyle = "#fff";
      this.ctx.textAlign = "center";
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 2;
      
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2 - 50;
      
      this.ctx.strokeText("CLICK TO START", centerX, centerY);
      this.ctx.fillText("CLICK TO START", centerX, centerY);
      
      this.ctx.strokeText("SPACE or CLICK to JUMP", centerX, centerY + 30);
      this.ctx.fillText("SPACE or CLICK to JUMP", centerX, centerY + 30);
    }
    
    // Draw bird in initial position
    this.bird.draw();
    
    // Draw base
    this.drawBase();
  }

  handleJump() {
    // Only allow jumping if the game has been started via the start button
    if (this.gameStarted) {
      if (!this.startGame) {
        this.startGame = true;
        this.showInstructions = false;
      }
      this.bird.jump();
      this.audioJump.play();
    }
  }

  // Method to enable game controls (called by start button)
  enableGameControls() {
    this.gameStarted = true;
    this.startGame = true;
    this.showInstructions = false;
  }

  getScore() {
    return this.count;
  }

  getBest() {
    return this.best;
  }

  isGameRunning() {
    return this.startGame && !this.gameOver;
  }

  isGameOverState() {
    return this.gameOver;
  }
}