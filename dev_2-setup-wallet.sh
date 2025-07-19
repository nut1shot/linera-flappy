#!/bin/bash
# Linera Flappy Development Setup Script

set -e

echo "🚀 Starting Linera Flappy Development Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set up the path and the helper function. From the root of Linera repository, this can be achieved as follows
# export PATH="$PWD/target/debug:$PATH"
# source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

# Configuration
FAUCET_PORT=8079
# FAUCET_URL="http://localhost:$FAUCET_PORT"
FAUCET_URL=https://faucet.testnet-babbage.linera.net
PROJECT_DIR=$(pwd)
TMP_DIR="$PROJECT_DIR/tmp"

echo -e "${BLUE}📁 Setting up directories...${NC}"
mkdir -p "$TMP_DIR"

# Set environment variables
export LINERA_WALLET_1="$TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$TMP_DIR/client_1.db"
export LINERA_WALLET_2="$TMP_DIR/wallet_2.json"
export LINERA_KEYSTORE_2="$TMP_DIR/keystore_2.json"
export LINERA_STORAGE_2="rocksdb:$TMP_DIR/client_2.db"

echo -e "${BLUE}🔧 Environment Variables:${NC}"
echo "LINERA_WALLET_1=$LINERA_WALLET_1"
echo "LINERA_STORAGE_1=$LINERA_STORAGE_1"
echo "LINERA_WALLET_2=$LINERA_WALLET_2"
echo "LINERA_STORAGE_2=$LINERA_STORAGE_2"
echo "FAUCET_URL=$FAUCET_URL"

# Step 2: Initialize wallet
echo -e "${YELLOW}👛 Step 2: Initializing wallet...${NC}"
if [ ! -f "$LINERA_WALLET_1" ]; then
    linera --with-wallet 1 wallet init --faucet "$FAUCET_URL"
else
    echo "Wallet 1 already exists, skipping initialization"
fi

if [ ! -f "$LINERA_WALLET_2" ]; then
    linera --with-wallet 2 wallet init --faucet "$FAUCET_URL"
else
    echo "Wallet 1 already exists, skipping initialization"
fi

# Step 3: Request chains
echo -e "${YELLOW}⛓️  Step 3: Requesting chains...${NC}"

# Request leaderboard chain  
LEADERBOARD_CHAIN_OUTPUT=($(linera --with-wallet 1 wallet request-chain --faucet $FAUCET_URL))
LEADERBOARD_CHAIN="${LEADERBOARD_CHAIN_OUTPUT[0]}"
echo "Leaderboard chain: $LEADERBOARD_CHAIN"

sleep 3

# Request player chain
PLAYER_CHAIN_INFO=($(linera --with-wallet 2 wallet request-chain --faucet $FAUCET_URL))
PLAYER_CHAIN="${PLAYER_CHAIN_INFO[0]}"
echo "Player chain: $PLAYER_CHAIN"

# Update dev-config.json with wallet and chain info
echo -e "${YELLOW}💾 Step 2: Updating configuration...${NC}"

# Check if config exists
if [ ! -f "tmp/dev-config.json" ]; then
    echo -e "${RED}❌ Network not started. Run ./dev_1-start-network.sh first${NC}"
    exit 1
fi

# Read existing config and add wallet info
EXISTING_NETWORK_PID=$(grep -o '"networkPid": [0-9]*' tmp/dev-config.json | cut -d':' -f2 | tr -d ' ')

# If networkPid is empty, set a placeholder
if [ -z "$EXISTING_NETWORK_PID" ]; then
    EXISTING_NETWORK_PID="null"
fi

cat > tmp/dev-config.json << EOF
{
  "step": 2,
  "networkPid": $EXISTING_NETWORK_PID,
  "faucetUrl": "$FAUCET_URL",
  "faucetPort": $FAUCET_PORT,
  "leaderboardChainId": "$LEADERBOARD_CHAIN",
  "playerChainId": "$PLAYER_CHAIN",
  "walletPath1": "$LINERA_WALLET_1",
  "walletPath2": "$LINERA_WALLET_2",
  "storagePath1": "$LINERA_STORAGE_1",
  "storagePath2": "$LINERA_STORAGE_2",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Wallets and chains configured successfully${NC}"
echo "Leaderboard Chain: $LEADERBOARD_CHAIN"
echo "Player Chain: $PLAYER_CHAIN"
echo
echo -e "${BLUE}📋 Next Step:${NC}"
echo "Run: ./dev_3-deploy.sh"