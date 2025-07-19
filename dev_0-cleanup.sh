#!/bin/bash
# Development Environment Cleanup Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Cleaning up Linera Flappy development environment...${NC}"

# Load configuration if it exists
CONFIG_FILE="./tmp/dev-config.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "Loading configuration..."
    
    NETWORK_PID=$(jq -r '.networkPid // empty' "$CONFIG_FILE")
    PLAYER_SERVICE_PID=$(jq -r '.playerServicePid // empty' "$CONFIG_FILE")
    LEADERBOARD_SERVICE_PID=$(jq -r '.leaderboardServicePid // empty' "$CONFIG_FILE")
    
    # Kill services
    if [ ! -z "$PLAYER_SERVICE_PID" ] && [ "$PLAYER_SERVICE_PID" != "null" ]; then
        echo "Stopping player service (PID: $PLAYER_SERVICE_PID)..."
        kill $PLAYER_SERVICE_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$LEADERBOARD_SERVICE_PID" ] && [ "$LEADERBOARD_SERVICE_PID" != "null" ]; then
        echo "Stopping leaderboard service (PID: $LEADERBOARD_SERVICE_PID)..."
        kill $LEADERBOARD_SERVICE_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$NETWORK_PID" ] && [ "$NETWORK_PID" != "null" ]; then
        echo "Stopping Linera network (PID: $NETWORK_PID)..."
        kill $NETWORK_PID 2>/dev/null || true
    fi
fi

# Kill any processes on common ports
echo "Killing processes on development ports..."
lsof -ti:8079 | xargs kill -9 2>/dev/null || true  # Faucet
lsof -ti:8080 | xargs kill -9 2>/dev/null || true  # Player service
lsof -ti:8081 | xargs kill -9 2>/dev/null || true  # Leaderboard service

# Kill any linera processes
echo "Stopping any remaining Linera processes..."
pkill -f "linera" 2>/dev/null || true

# Clean up temporary files
echo "Cleaning up temporary files..."
if [ -d "./tmp" ]; then
    rm -rf ./tmp/*
    echo "Cleared ./tmp directory"
fi

# Reset frontend environment
echo "Resetting frontend environment..."
if [ -f "web-frontend/.env" ]; then
    cat > "web-frontend/.env" << EOF
VITE_APP_ID=your_app_id_here
VITE_APP_URL=http://localhost:8080
VITE_LEADERBOARD_CHAIN_ID=your_leaderboard_chain_id_here
EOF
    echo "Reset web-frontend/.env to template"
fi

sleep 2

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo
echo -e "${YELLOW}📋 What was cleaned:${NC}"
echo "- Stopped all Linera network processes"
echo "- Stopped GraphQL services" 
echo "- Killed processes on ports 8079, 8080, 8081"
echo "- Cleared temporary files"
echo "- Reset frontend environment file"
echo
echo -e "${BLUE}🚀 To restart development:${NC}"
echo "./dev-setup.sh"