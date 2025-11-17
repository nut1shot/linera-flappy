# 🐦 Linera Flappy - Smart Contract

A decentralized Flappy Bird game built on microchain [Linera blockchain](https://linera.dev)

## 🚀 Quick Start

```bash
# Build contract
cargo build --release --target wasm32-unknown-unknown

# Deploy to local network
./dev_1-start-network.sh
./dev_2-setup-wallet.sh
./dev_3-deploy.sh

# Test GraphQL API
./test-graphql-simple.sh
```

## 🎮 Features

### Anti-Cheat System

- **Proof-of-Play Verification**: 7 validation rules (timing, jumps, score consistency)
- **Session-Based Gaming**: Unique session IDs prevent replay attacks
- **Two-Layer Security**: Player chain (UX) + Leaderboard chain (validation)
- **Cross-Chain Messaging**: Session registration and score submission

### Game Modes

- **Practice Mode**: Global leaderboard (top 100), personal best tracking
- **Tournament Mode**: Time-limited competitions, live rankings, automated management

### Authentication

- **Chain-Based Sessions**: Secure login using Linera chain IDs
- **Role-Based Access**: Admin and Player roles
- **Password Security**: SHA-256 hashing with salt

## 🏗 Architecture

```
src/
├── contract.rs     # Game logic & anti-cheat validation
├── service.rs      # GraphQL queries
├── state.rs        # Application state
└── lib.rs          # Message types & ABI
```

### Anti-Cheat Validation Rules

1. **Session Timing**: 10-minute expiration
2. **Game Duration**: Min 1.2s per pipe, max 30s per pipe
3. **Score Consistency**: final_score == pipes_passed
4. **Jump Limits**: 5 base jumps + 10 per pipe
5. **Monotonicity**: Duration > 0
6. **Bounds**: Score ≤ 100 pipes
7. **Session Uniqueness**: No duplicate submissions

### Data Flow

```
Player Action → Session Start (Player Chain)
              → Game Play (Local)
              → Submit Proof (Player Chain)
              → Verify Proof (Leaderboard Chain)
              → Update Rankings
```

## 🔐 Security

- **Proof Verification**: 7-rule validation on leaderboard chain
- **Session Expiration**: 10-minute timeout prevents stale sessions
- **Cross-Chain Security**: Player chain for UX, leaderboard for validation
- **Admin Authentication**: Chain ID-based session validation

### Configuration

Frontend needs:
https://github.com/nut1shot/linera-flappy-game

**Built with**: [Linera Protocol](https://linera.dev) | **Author**: [@nut1shot](https://github.com/nut1shot)
