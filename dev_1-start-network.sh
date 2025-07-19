#!/bin/bash
# Restart Linera network and faucet

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Restarting Linera Network...${NC}"

# Set up environment
export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

FAUCET_PORT=8079
FAUCET_URL="http://localhost:$FAUCET_PORT"

# Kill any existing network processes
echo "Stopping existing network processes..."
pkill -f "linera net up" || true
lsof -ti:$FAUCET_PORT | xargs kill -9 2>/dev/null || true
sleep 3

# Start the network
echo "Starting Linera network with faucet..."
nohup linera net up --with-faucet --faucet-port $FAUCET_PORT > tmp/network.log 2>&1 &
NETWORK_PID=$!
disown $NETWORK_PID

echo "Waiting for network to start..."
sleep 10

# Check if faucet is responding with retries
for i in {1..30}; do
    if curl -s "$FAUCET_URL" > /dev/null; then
        echo -e "${GREEN}✅ Faucet is responding${NC}"
        break
    fi
    echo "Waiting for faucet... (attempt $i/30)"
    sleep 2
done

if ! curl -s "$FAUCET_URL" > /dev/null; then
    echo -e "${RED}❌ Failed to start faucet${NC}"
    exit 1
fi

# Create/update dev-config.json with network info
echo -e "${YELLOW}💾 Step 1: Updating configuration...${NC}"
mkdir -p tmp

cat > tmp/dev-config.json << EOF
{
  "step": 1,
  "networkPid": $NETWORK_PID,
  "faucetUrl": "$FAUCET_URL",
  "faucetPort": $FAUCET_PORT,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Network started successfully${NC}"
echo "Faucet: $FAUCET_URL"
echo "Network PID: $NETWORK_PID"
echo "Log: tmp/network.log"
echo
echo -e "${BLUE}📋 Next Step:${NC}"
echo "Run: ./dev_2-setup-wallet.sh"