#!/bin/bash
# Check current development step and status

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Linera Flappy Development Status${NC}"
echo

CONFIG_FILE="./tmp/dev-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Development environment not set up${NC}"
    echo
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. ./dev_1-start-network.sh  - Start Linera network"
    echo "2. ./dev_2-setup-wallet.sh   - Set up wallets and chains"
    echo "3. ./dev_3-deploy.sh         - Deploy application and start services"
    exit 1
fi

# Read current step
CURRENT_STEP=$(grep -o '"step": [0-9]*' "$CONFIG_FILE" | cut -d':' -f2 | tr -d ' ')

echo -e "${GREEN}✅ Configuration found${NC}"
echo "Current step: $CURRENT_STEP/3"
echo

case $CURRENT_STEP in
    1)
        echo -e "${YELLOW}📋 Step 1 Complete: Network Started${NC}"
        NETWORK_PID=$(grep -o '"networkPid": [0-9]*' "$CONFIG_FILE" | cut -d':' -f2 | tr -d ' ')
        FAUCET_URL=$(grep -o '"faucetUrl": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        
        echo "Network PID: $NETWORK_PID"
        echo "Faucet URL: $FAUCET_URL"
        
        # Check if network is still running
        if [ "$NETWORK_PID" != "null" ] && [ -n "$NETWORK_PID" ] && kill -0 $NETWORK_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Network process running${NC}"
        else
            echo -e "${RED}❌ Network process stopped or PID unknown${NC}"
        fi
        
        # Check faucet
        if curl -s "$FAUCET_URL" > /dev/null; then
            echo -e "${GREEN}✅ Faucet responding${NC}"
        else
            echo -e "${RED}❌ Faucet not responding${NC}"
        fi
        
        echo
        echo -e "${YELLOW}📋 Next Step:${NC}"
        echo "./dev_2-setup-wallet.sh"
        ;;
        
    2)
        echo -e "${YELLOW}📋 Step 2 Complete: Wallets and Chains Set Up${NC}"
        LEADERBOARD_CHAIN=$(grep -o '"leaderboardChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        PLAYER_CHAIN=$(grep -o '"playerChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        
        echo "Leaderboard Chain: $LEADERBOARD_CHAIN"
        echo "Player Chain: $PLAYER_CHAIN"
        
        echo
        echo -e "${YELLOW}📋 Next Step:${NC}"
        echo "./dev_3-deploy.sh"
        ;;
        
    3)
        echo -e "${GREEN}🎉 Step 3 Complete: Full Development Environment Ready${NC}"
        
        # Extract all info
        LEADERBOARD_CHAIN=$(grep -o '"leaderboardChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        PLAYER_CHAIN=$(grep -o '"playerChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        APP_ID=$(grep -o '"appId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        FAUCET_URL=$(grep -o '"faucetUrl": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
        
        echo "App ID: $APP_ID"
        echo "Leaderboard Chain: $LEADERBOARD_CHAIN"
        echo "Player Chain: $PLAYER_CHAIN"
        echo
        
        # Check services
        echo -e "${YELLOW}🌐 Services Status:${NC}"
        
        if lsof -i :8079 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Faucet running on port 8079${NC}"
        else
            echo -e "${RED}❌ Faucet not running on port 8079${NC}"
        fi
        
        if lsof -i :8080 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Leaderboard service running on port 8080${NC}"
        else
            echo -e "${RED}❌ Leaderboard service not running on port 8080${NC}"
        fi
        
        if lsof -i :8081 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Player service running on port 8081${NC}"
        else
            echo -e "${RED}❌ Player service not running on port 8081${NC}"
        fi
        
        echo
        echo -e "${YELLOW}🧪 Available Commands:${NC}"
        echo "./test-graphql-simple.sh  - Test GraphQL APIs"
        echo "cd web-frontend && pnpm dev - Start frontend"
        echo "cargo test                - Run unit tests"
        echo "./dev-cleanup.sh          - Stop all services"
        
        echo
        echo -e "${BLUE}🔗 URLs:${NC}"
        echo "Faucet: $FAUCET_URL"
        echo "Leaderboard GraphQL: http://localhost:8080"
        echo "Player GraphQL: http://localhost:8081"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown step: $CURRENT_STEP${NC}"
        ;;
esac

echo
echo -e "${BLUE}📊 Development Workflow:${NC}"
echo "1. Code   → Edit Rust smart contract"
echo "2. Test   → cargo test (unit tests)"
echo "3. Deploy → ./dev_3-deploy.sh (redeploy only)"
echo "4. Test   → ./test-graphql-simple.sh"