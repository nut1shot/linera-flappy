# 🐦 Linera Flappy

A pixel-style Flappy Bird–inspired web game powered by the [Linera blockchain](https://linera.dev). This game showcases how real-time interactions and on-chain state can be combined to make fun and decentralized experiences.

![screenshot](./public/assets/preview.png)

## 🎮 Gameplay

- Tap, click, or press `Space` to flap
- Avoid pipes and survive as long as you can
- Global score is updated via a Linera microchain
- Game state is animated with sprites, audio, and real-time chain interaction

## 🛠 Tech Stack

- **Canvas API** for rendering
- **JavaScript (ESM)** modules
- **Linera client** for WebAssembly blockchain calls
- **Vite** for modern development tooling
- **Deployed on Vercel**

## 🚀 Live Demo

👉 [linera-flappy-game.vercel.app](https://linera-flappy-game.vercel.app)

## 📦 Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/)
- Node.js 18+
- Chrome or Brave (for WASM + audio autoplay)

### Install & Run Locally

```bash
pnpm install
pnpm dev
```

To build:

```bash
pnpm build
pnpm preview
```

## 🔗 Blockchain Integration

The game interacts with a Linera smart contract to store and fetch scores.

- Chain setup handled via Faucet
- Counter app deployed via Linera CLI
- Live chain ID shown in UI

### Environment Variables

Create a `.env` file:

```env
VITE_COUNTER_APP_URL=https://<your-linera-service>
VITE_COUNTER_APP_ID=<your-counter-app-id>
```

## 📁 Assets

- Sprites from Flappy Bird–style pixel art
- Sounds: `jump.wav`, `hit.wav`, `point.wav`
- Assets stored in `/public/assets/`

## 🙌 Credits

- Built by [@nut1shot](https://github.com/nut1shot)
- Uses Linera's WebAssembly SDK
- Inspired by classic Flappy Bird

## 🧪 License

MIT — feel free to fork, remix, and improve.
