#!/bin/bash

# Quick test script for KCC MCP Server with Gemini-style interactions
# This simulates how Gemini would interact with the MCP server

set -e

cd /home/fcurrie/Projects/kcc-mcp-server

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Testing KCC MCP Server (Gemini-Compatible)            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set environment
export KCC_REPO_PATH="/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
export KCC_AUTHOR_NAME="Frank Currie"
export KCC_AUTHOR_EMAIL="fcurrie@google.com"

echo -e "${BLUE}Environment:${NC}"
echo "  Repo: $KCC_REPO_PATH"
echo "  Author: $KCC_AUTHOR_NAME <$KCC_AUTHOR_EMAIL>"
echo ""

# Function to call MCP tool
call_tool() {
    local tool_name=$1
    local args_json=$2

    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Testing: $tool_name${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

    # Create the MCP request
    local request=$(cat <<EOF
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "$tool_name",
    "arguments": $args_json
  }
}
EOF
)

    echo "Request:"
    echo "$args_json" | jq .
    echo ""

    # Call the tool (using the built server)
    local response=$(echo "$request" | node dist/index.js 2>&1 | grep -v "^✅\|^📁\|^👤\|^🚀")

    echo "Response:"
    echo "$response" | jq -r '.result.content[0].text // .error.message // .' 2>/dev/null || echo "$response"
    echo ""
}

# Test 1: Find EdgeCacheService (direct controller)
call_tool "kcc_find_resource" '{"resource": "EdgeCacheService"}'

# Test 2: Detect ComputeURLMap controller type (Terraform)
call_tool "kcc_detect_controller_type" '{"resource": "ComputeURLMap"}'

# Test 3: Get migration status for ComputeURLMap
call_tool "kcc_migration_status" '{"resource": "ComputeURLMap"}'

# Test 4: Get git status
call_tool "kcc_git_status" '{}'

# Test 5: Find ComputeURLMap (to show it's Terraform-based)
call_tool "kcc_find_resource" '{"resource": "ComputeURLMap"}'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}All tests complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Install Google AI CLI: npm install -g @google/generative-ai-cli"
echo "  2. Set API key: export GOOGLE_API_KEY='your-key'"
echo "  3. Configure MCP: See GEMINI_CLI_SETUP.md"
echo "  4. Start chat: google-ai chat --mcp"
echo ""
echo "Or use the MCP Inspector for visual testing:"
echo "  npm install -g @modelcontextprotocol/inspector"
echo "  mcp-inspector node dist/index.js"
echo ""
