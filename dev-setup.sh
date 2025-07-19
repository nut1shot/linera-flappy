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
FAUCET_URL="http://localhost:$FAUCET_PORT"
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

# Step 1: Start local Linera network
echo -e "${YELLOW}🌐 Step 1: Starting local Linera network...${NC}"
echo "Starting linera net with faucet on port $FAUCET_PORT"

# Kill any existing processes on the port
lsof -ti:$FAUCET_PORT | xargs kill -9 2>/dev/null || true

# Start the network in background
nohup linera net up --with-faucet --faucet-port $FAUCET_PORT > tmp/network.log 2>&1 &
LINERA_PID=$!

echo "Waiting for network to start..."
sleep 10

# Check if network is running with retries
for i in {1..30}; do
    if curl -s "$FAUCET_URL" > /dev/null; then
        echo -e "${GREEN}✅ Faucet is responding${NC}"
        break
    fi
    echo "Waiting for faucet... (attempt $i/30)"
    sleep 2
done

if ! curl -s "$FAUCET_URL" > /dev/null; then
    echo -e "${RED}❌ Failed to start Linera network/faucet${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Linera network started successfully${NC}"

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

# Step 4: Build contract
echo -e "${YELLOW}🔨 Step 4: Building contract...${NC}"
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract built successfully${NC}"

# Step 5: Deploy contracts
echo -e "${YELLOW}🚀 Step 5: Deploying contracts...${NC}"

# Deploy application
echo "Deploying application..."
APP_ID=$(linera --with-wallet 1 publish-and-create \
  target/wasm32-unknown-unknown/release/flappy_{contract,service}.wasm \
  --json-argument '"LEADERBOARD_CHAIN"')

echo "Waiting for Deploying application..."
sleep 5

echo "Deployment APP_ID:"
echo "$APP_ID"

if [ -z "$APP_ID" ]; then
  echo -e "${RED}❌ Failed to extract app ID${NC}"
  exit 1
fi

# Step 6: Start services
echo -e "${YELLOW}🌐 Step 6: Starting GraphQL services...${NC}"

# Set default to leaderboard chain and start service  
echo "Setting default to leaderboard chain and starting service on port 8080..."
nohup linera --with-wallet 1 service --port 8080 > "$TMP_DIR/leaderboard-service.log" 2>&1 &
LEADERBOARD_SERVICE_PID=$!
disown $LEADERBOARD_SERVICE_PID

# Set default to player chain and start service
echo "Setting default to player chain and starting service on port 8081..."
nohup linera --with-wallet 2 service --port 8081 > "$TMP_DIR/player-service.log" 2>&1 &
PLAYER_SERVICE_PID=$!
disown $PLAYER_SERVICE_PID

# Wait for services to start
sleep 5

# Step 7: Save configuration
echo -e "${YELLOW}💾 Step 7: Saving configuration...${NC}"

cat > "$TMP_DIR/dev-config.json" << EOF
{
  "playerChainId": "$PLAYER_CHAIN",
  "leaderboardChainId": "$LEADERBOARD_CHAIN", 
  "appId": "$APP_ID",
  "faucetUrl": "$FAUCET_URL",
  "leaderboardServiceUrl": "http://localhost:8080",
  "playerServiceUrl": "http://localhost:8081",
  "networkPid": $LINERA_PID,
  "playerServicePid": $PLAYER_SERVICE_PID,
  "leaderboardServicePid": $LEADERBOARD_SERVICE_PID
}
EOF

# Update frontend .env
echo "Updating frontend configuration..."
cat > "web-frontend/.env" << EOF
VITE_APP_ID=$APP_ID
VITE_APP_URL=http://localhost:8079
VITE_LEADERBOARD_CHAIN_ID=$LEADERBOARD_CHAIN
EOF

echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "Player Chain: $PLAYER_CHAIN"
echo "Leaderboard Chain: $LEADERBOARD_CHAIN"
echo "App ID: $APP_ID"
echo
echo -e "${BLUE}🌐 Services Running:${NC}"
echo "Faucet: $FAUCET_URL"
echo "Leaderboard GraphQL: http://localhost:8080"
echo "Player GraphQL: http://localhost:8081"
echo
echo -e "${BLUE}📝 Service Logs:${NC}"
echo "Leaderboard service: $TMP_DIR/leaderboard-service.log"
echo "Player service: $TMP_DIR/player-service.log"
echo
echo -e "${BLUE}🔧 Service Management:${NC}"
echo "Services are running in background with nohup and will persist after script ends"
echo "To check if services are running: lsof -i :8080 -i :8081"
echo "To view logs: tail -f $TMP_DIR/leaderboard-service.log"
echo "To stop services: ./dev-cleanup.sh"
echo
echo -e "${YELLOW}🧪 Next Steps:${NC}"
echo "1. Run GraphQL tests: ./test-graphql.sh"
echo "2. Start frontend: cd web-frontend && pnpm dev"
echo "3. View service logs: tail -f $TMP_DIR/*.log"
echo "4. Stop all services: ./dev-cleanup.sh"
echo
echo -e "${GREEN}✅ Ready for development!${NC}"
echo -e "${GREEN}✅ Services will continue running after this script ends${NC}"