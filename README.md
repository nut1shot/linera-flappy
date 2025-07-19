# 🐦 Linera Flappy

A pixel-style Flappy Bird–inspired web game powered by the [Linera blockchain](https://linera.dev). This game showcases decentralized gaming with real-time leaderboards, tournament systems, and secure authentication using blockchain technology.

![Linera Flappy Game](./web-frontend/public/assets/background.png)

## 🎮 Game Features

### Practice Mode

- **Free Play**: Tap, click, or press `Space` to flap and avoid pipes
- **Global Leaderboard**: Compete with players worldwide on a decentralized leaderboard
- **Personal Best Tracking**: Your highest scores are stored on-chain
- **Real-time Ranking**: See your position among all players

### Tournament Mode

- **Time-Limited Competitions**: Join tournaments with start/end times
- **Live Leaderboards**: Real-time tournament rankings during active competitions
- **Automatic Management**: Tournaments auto-start and auto-end based on schedule
- **Tournament History**: Track your performance across multiple tournaments

### Authentication & Security

- **Blockchain-Based Auth**: Secure login using Linera chain IDs
- **Role-Based Access**: Admin and Player roles with different permissions
- **Session Management**: Persistent sessions with configurable expiration
- **Password Security**: SHA-256 hashing with salt for user credentials

### Admin Features (Admin Role Only)

- **Tournament Creation**: Create tournaments with custom schedules and descriptions
- **Tournament Management**: Start, end, update, and delete tournaments
- **Tournament Pinning**: Pin important tournaments for priority display
- **User Management**: Monitor player activity and leaderboard statistics

## 🛠 Tech Stack

### Frontend

- **Canvas API** for pixel-perfect game rendering
- **Modular JavaScript (ESM)** with clean architecture
- **Custom Pixel Art Loading UI** with Linera branding
- **Responsive Design** with mobile optimization
- **Press Start 2P Font** for retro gaming aesthetic

### Blockchain Integration

- **Linera WebAssembly Client** for blockchain interactions
- **Cross-Chain Messaging** for distributed leaderboard system
- **Smart Contract State Management** with practice and tournament modes
- **Secure Admin Operations** using chain-based authentication

### Development Tools

- **Vite** for modern development and build tooling
- **pnpm** for efficient package management
- **Rust** for smart contract development
- **GraphQL** for blockchain queries and mutations

## 🏗 Architecture

### Smart Contract (Rust)

```
src/
├── contract.rs     # Main contract logic with all operations
├── service.rs      # GraphQL service layer
├── state.rs        # Application state management
└── lib.rs          # ABI definitions and message types
```

### Frontend (JavaScript)

```
web-frontend/src/
├── main.js                     # Application orchestration
├── game/
│   ├── GameEngine.js          # Core game loop and rendering
│   ├── GameState.js           # Application state management
│   └── ...
├── ui/
│   ├── GameUI.js              # DOM manipulation and events
│   ├── TournamentModal.js     # Tournament interface
│   └── ...
├── auth/
│   └── AuthManager.js         # User authentication
├── blockchain/
│   └── LineraClient.js        # Blockchain operations
├── components/
│   ├── LoadingSpinner.js      # Pixel art loading UI
│   └── LoadingSpinner.css     # Loading component styles
├── constants/
│   └── GameConstants.js       # Configuration settings
└── utils/
    ├── LoadingManager.js      # Loading state management
    ├── TimeUtils.js           # Time formatting utilities
    └── DOMUtils.js            # DOM helper functions
```

## 🚀 Getting Started

### Prerequisites

- **Rust 1.85.0** (specified in rust-toolchain.toml)
- **Node.js 18+**
- **pnpm** package manager
- **Linera CLI** for blockchain deployment
- **Chrome/Brave Browser** (for WASM + audio support)

### Development Setup

#### 1. Clone and Install

```bash
git clone <repository-url>
cd linera-flappy
```

#### 2. Smart Contract Development

```bash
# Build contract and service binaries
cargo build --release --target wasm32-unknown-unknown

# Run tests
cargo test

# Format and lint
cargo fmt
cargo clippy
```

#### 3. Frontend Development

```bash
cd web-frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Configuration

Create `web-frontend/.env`:

```env
VITE_APP_ID=<your-app-id>
VITE_APP_URL=http://localhost:8079
VITE_LEADERBOARD_CHAIN_ID=<your-leaderboard-chain-id>
VITE_LEADERBOARD_CHAIN_URL=http://localhost:8080
```

**Example Configuration:**

```env
VITE_APP_ID=feb62cdbb9a7faa4e4dc5c8070d8def995e9b72393abd0170b5a83d796abba2f
VITE_APP_URL=http://localhost:8079
VITE_LEADERBOARD_CHAIN_ID=8e2dc984a00a8e778f6666c2751a48df99dee050cb310f4223cd5a4c78968d73
VITE_LEADERBOARD_CHAIN_URL=http://localhost:8080
```

### Blockchain Deployment

#### 1. Setup Local Network

```bash
# Start local Linera network
./dev_1-start-network.sh

# Setup wallet
./dev_2-setup-wallet.sh
```

#### 2. Deploy Application

```bash
# Deploy smart contract with admin user
./dev_3-deploy.sh
```

#### 3. Test Deployment

```bash
# Test GraphQL operations
./test-graphql-simple.sh
```

## 🎯 Game Modes

### Practice Mode

- **Purpose**: Free play for skill improvement
- **Leaderboard**: Global top 100 players
- **Scoring**: Personal best tracking with rank display
- **Access**: Available to all authenticated users

### Tournament Mode

- **Purpose**: Competitive time-limited events
- **Phases**: Registration → Active → Ended
- **Features**: Live leaderboards, participant tracking, automated management
- **Access**: Join tournaments during registration or active phases

## 🔐 Authentication System

### User Roles

- **Player**: Access to practice mode, tournament participation, leaderboard viewing
- **Admin**: All player permissions plus tournament management and user oversight

### Security Features

- **Chain-Based Sessions**: Each browser session gets unique Linera chain ID
- **Cryptographic Security**: Chain IDs cannot be forged or replicated
- **Audit Trail**: Admin actions logged with chain ID and timestamp
- **Automatic Expiration**: New browser session = new authentication required

### Default Admin Account

- **Username**: `admin`
- **Password**: `admin_password_hash_change_me`
- **⚠️ Important**: Change password in production deployment!

## 📊 Cross-Chain Architecture

### Distributed Leaderboard System

- **Player Chains**: Store individual user data and game history
- **Leaderboard Chain**: Aggregates global statistics and tournament data
- **Message Types**: `UpdatePracticeBest`, `SubmitTournamentScore`, `TournamentUpdate`

### Data Flow

1. **Player Action**: User submits score on their chain
2. **Local Processing**: Player chain validates and stores score
3. **Cross-Chain Message**: Best scores sent to leaderboard chain
4. **Global Update**: Leaderboard chain updates rankings and statistics

## 🎨 UI/UX Features

### Pixel Art Loading System

- **Custom Linera Branding**: Pixel art "LINERA FLAPPY" logo
- **Context-Aware Colors**: Different themes for different operations
- **Smooth Animations**: GPU-accelerated pixel art effects
- **Mobile Responsive**: Adapts to different screen sizes

### Retro Gaming Aesthetic

- **Press Start 2P Font**: Authentic retro typography
- **Pixel Perfect Rendering**: Sharp graphics at all zoom levels
- **Classic Sound Effects**: Wing flap, collision, and point sounds
- **Scanline Effects**: Optional CRT-style visual effects

## 📁 Project Structure

```
linera-flappy/
├── src/                    # Rust smart contract
├── web-frontend/           # JavaScript frontend
│   ├── public/assets/      # Game sprites and sounds
│   ├── src/               # Source code modules
│   └── index.html         # Main HTML file
├── dev_*.sh               # Development scripts
└── README.md              # This file
```

## 🧪 Testing

### Smart Contract Tests

```bash
cargo test --verbose
```

### Frontend Testing

```bash
cd web-frontend
pnpm test
```

### Integration Testing

```bash
# Test complete workflow
./test-graphql-simple.sh
```

## 🚀 Deployment

### Local Development

1. Run blockchain network: `./dev_1-start-network.sh`
2. Setup wallet: `./dev_2-setup-wallet.sh`
3. Deploy contract: `./dev_3-deploy.sh`
4. Start frontend: `cd web-frontend && pnpm dev`

### Production Deployment

1. **Smart Contract**: Deploy to Linera mainnet/testnet
2. **Frontend**: Deploy to Vercel, Netlify, or similar platform
3. **Environment**: Update `.env` with production URLs and IDs
4. **Admin Setup**: Change default admin password

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙌 Credits

- **Built by**: [@nut1shot](https://github.com/nut1shot)
- **Powered by**: [Linera Blockchain](https://linera.dev)
- **Inspired by**: Classic Flappy Bird game
- **Font**: Press Start 2P by CodeMan38

## 🔗 Links

- [Linera Documentation](https://linera.dev/developers)
- [Linera GitHub](https://github.com/linera-io/linera-protocol)
- [Game Demo](https://linera-flappy-game.vercel.app) (when deployed)

---

_Ready to flap your way to blockchain glory? 🐦⛓️_
