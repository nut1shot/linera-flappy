# linera-flappy

Flappy game on Linera blockchain

# Setting Up

export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

FAUCET_PORT=8079
FAUCET_URL=http://localhost:$FAUCET_PORT

# https://faucet.testnet-babbage.linera.net [Testnet]

linera_spawn linera net up --with-faucet --faucet-port $FAUCET_PORT

linera wallet init --faucet $FAUCET_URL

linera wallet request-chain --faucet $FAUCET_URL

# Build

cargo build --release --target wasm32-unknown-unknown

# Publish

linera publish-and-create \
 target/wasm32-unknown-unknown/release/counter\_{contract,service}.wasm \
 --json-argument "1"

# Using web frontend

cd web-frontend

pnpm install

pnpm dev
