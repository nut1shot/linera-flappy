#!/bin/bash
# Simple GraphQL test script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing GraphQL APIs (Simple)${NC}"

# Load configuration from dev-config.json
CONFIG_FILE="./tmp/dev-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found. Run ./dev-setup.sh first${NC}"
    exit 1
fi

# Extract values from config (without jq dependency)
LEADERBOARD_CHAIN_ID=$(grep -o '"leaderboardChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
PLAYER_CHAIN_ID=$(grep -o '"playerChainId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
APP_ID=$(grep -o '"appId": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)

echo -e "${BLUE}📋 Configuration:${NC}"
echo "Leaderboard Chain ID: $LEADERBOARD_CHAIN_ID"
echo "Player Chain ID: $PLAYER_CHAIN_ID"
echo "App ID: $APP_ID"
echo

# Test leaderboard chain
echo -e "${YELLOW}🧪 Testing Leaderboard Chain GraphQL...${NC}"
LEADERBOARD_URL="http://localhost:8080/chains/$LEADERBOARD_CHAIN_ID/applications/$APP_ID"
echo "URL: $LEADERBOARD_URL"

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "query { value }"}' \
    "$LEADERBOARD_URL" 2>/dev/null || echo "ERROR")

if [ "$response" = "ERROR" ] || [ -z "$response" ]; then
    echo -e "${RED}❌ Leaderboard GraphQL request failed${NC}"
    echo "URL: $LEADERBOARD_URL"
else
    echo -e "${GREEN}✅ Leaderboard GraphQL response:${NC}"
    echo "$response"
fi

echo

# Test player chain
echo -e "${YELLOW}🧪 Testing Player Chain GraphQL...${NC}"
PLAYER_URL="http://localhost:8081/chains/$PLAYER_CHAIN_ID/applications/$APP_ID"
echo "URL: $PLAYER_URL"

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "query { value }"}' \
    "$PLAYER_URL" 2>/dev/null || echo "ERROR")

if [ "$response" = "ERROR" ] || [ -z "$response" ]; then
    echo -e "${RED}❌ Player GraphQL request failed${NC}"
    echo "URL: $PLAYER_URL"
else
    echo -e "${GREEN}✅ Player GraphQL response:${NC}"
    echo "$response"
fi

echo

# Test admin login
echo -e "${YELLOW}🧪 Testing Admin Login...${NC}"
admin_login_mutation='{
  "query": "mutation { loginOrRegister(username: \"admin\", hash: \"admin_password_hash_change_me\", requesterChainId: \"'$LEADERBOARD_CHAIN_ID'\") }"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$admin_login_mutation" \
    "$LEADERBOARD_URL" 2>/dev/null || echo "ERROR")

if [ "$response" = "ERROR" ] || [ -z "$response" ]; then
    echo -e "${RED}❌ Admin login mutation failed${NC}"
else
    echo -e "${GREEN}✅ Admin login mutation response:${NC}"
    echo "$response"
fi

echo

# Test admin login result
echo -e "${YELLOW}🧪 Testing Admin Login Result...${NC}"
admin_result_query='{
  "query": "query { loginResultFor(chainId: \"'$LEADERBOARD_CHAIN_ID'\") { success isNewUser message user { username role createdAt } } }"
}'

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$admin_result_query" \
    "$LEADERBOARD_URL" 2>/dev/null || echo "ERROR")

if [ "$response" = "ERROR" ] || [ -z "$response" ]; then
    echo -e "${RED}❌ Admin login result query failed${NC}"
else
    echo -e "${GREEN}✅ Admin login result response:${NC}"
    echo "$response"
fi

echo
echo -e "${BLUE}🔗 URLs for manual testing:${NC}"
echo "Leaderboard: $LEADERBOARD_URL"
echo "Player: $PLAYER_URL"
echo
echo -e "${BLUE}💡 Admin Login Commands:${NC}"
echo "1. Login Mutation:"
echo "   $admin_login_mutation"
echo "2. Check Result Query:"
echo "   $admin_result_query"