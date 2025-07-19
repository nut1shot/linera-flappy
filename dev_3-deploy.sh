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

# Kill any processes on common ports
echo "Killing processes on development ports..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true  # Player service
lsof -ti:8081 | xargs kill -9 2>/dev/null || true  # Leaderboard service

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

# Deploy application with user
echo "Deploying application with admin user..."
APP_ID=$(linera --with-wallet 1 publish-and-create \
  target/wasm32-unknown-unknown/release/flappy_{contract,service}.wasm \
  --json-argument '{
    "player_name": "LEADERBOARD_CHAIN",
    "admin_username": "xxx",
    "admin_hash": "xxx"
  }')

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

# Update dev-config.json with complete configuration
echo -e "${YELLOW}💾 Step 3: Updating configuration...${NC}"

# Check if previous steps completed
if [ ! -f "tmp/dev-config.json" ]; then
    echo -e "${RED}❌ Previous steps not completed. Run ./dev_1-start-network.sh and ./dev_2-setup-wallet.sh first${NC}"
    exit 1
fi

# Extract chain IDs from existing config
LEADERBOARD_CHAIN=$(grep -o '"leaderboardChainId": "[^"]*"' tmp/dev-config.json | cut -d'"' -f4)
PLAYER_CHAIN=$(grep -o '"playerChainId": "[^"]*"' tmp/dev-config.json | cut -d'"' -f4)
EXISTING_NETWORK_PID=$(grep -o '"networkPid": [0-9]*' tmp/dev-config.json | cut -d':' -f2 | tr -d ' ')

# If networkPid is empty, set a placeholder
if [ -z "$EXISTING_NETWORK_PID" ]; then
    EXISTING_NETWORK_PID="null"
fi

# Create complete config with all deployment info
cat > tmp/dev-config.json << EOF
{
  "step": 3,
  "networkPid": $EXISTING_NETWORK_PID,
  "faucetUrl": "$FAUCET_URL",
  "faucetPort": $FAUCET_PORT,
  "leaderboardChainId": "$LEADERBOARD_CHAIN",
  "playerChainId": "$PLAYER_CHAIN",
  "appId": "$APP_ID",
  "walletPath1": "$LINERA_WALLET_1",
  "walletPath2": "$LINERA_WALLET_2",
  "storagePath1": "$LINERA_STORAGE_1",
  "storagePath2": "$LINERA_STORAGE_2",
  "leaderboardServiceUrl": "http://localhost:8080",
  "playerServiceUrl": "http://localhost:8081",
  "leaderboardServicePid": $LEADERBOARD_SERVICE_PID,
  "playerServicePid": $PLAYER_SERVICE_PID,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Update frontend .env
echo "Updating frontend configuration..."
cat > "web-frontend/.env" << EOF
VITE_APP_ID=$APP_ID
VITE_APP_URL=http://localhost:8079
VITE_LEADERBOARD_CHAIN_ID=$LEADERBOARD_CHAIN
VITE_LEADERBOARD_CHAIN_URL=http://localhost:8080
EOF

echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "Player Chain: $PLAYER_CHAIN"
echo "Leaderboard Chain: $LEADERBOARD_CHAIN"
echo "App ID: $APP_ID"
echo
echo -e "${BLUE}👤 Admin Credentials:${NC}"
echo "Username: admin"
echo "Password Hash: admin_password_hash_change_me"
echo -e "${YELLOW}⚠️  IMPORTANT: Change admin password in production!${NC}"
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
echo -e "${BLUE}🧪 Testing:${NC}"
echo "Run GraphQL tests: ./test-graphql-simple.sh"
echo "Start frontend: cd web-frontend && pnpm dev"
echo
echo -e "${BLUE}💡 Admin Login Test:${NC}"
echo "GraphQL Mutation: loginOrRegister(username: \"admin\", hash: \"admin_password_hash_change_me\", requesterChainId: \"$LEADERBOARD_CHAIN\")"
echo "GraphQL Query: loginResultFor(chainId: \"$LEADERBOARD_CHAIN\") { success user { username role } }"
echo
echo -e "${GREEN}✅ Ready for development!${NC}"