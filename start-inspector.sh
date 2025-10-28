#!/bin/bash

# Start MCP Inspector for visual testing
# This provides a web UI to test all MCP tools

set -e

cd /home/fcurrie/Projects/kcc-mcp-server

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Starting MCP Inspector for KCC MCP Server             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Set environment
export KCC_REPO_PATH="/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
export KCC_AUTHOR_NAME="Frank Currie"
export KCC_AUTHOR_EMAIL="fcurrie@google.com"

# Check if inspector is installed
if ! command -v mcp-inspector &> /dev/null; then
    echo "Installing MCP Inspector..."
    npm install -g @modelcontextprotocol/inspector
    echo ""
fi

echo "Environment configured:"
echo "  Repo: $KCC_REPO_PATH"
echo "  Author: $KCC_AUTHOR_NAME <$KCC_AUTHOR_EMAIL>"
echo ""
echo "Starting MCP Inspector..."
echo "  - Web UI will open at http://localhost:5173"
echo "  - You can test all 12 tools interactively"
echo ""
echo "Available tools:"
echo "  • kcc_find_resource"
echo "  • kcc_detect_controller_type"
echo "  • kcc_migration_status"
echo "  • kcc_plan_migration"
echo "  • kcc_scaffold_types"
echo "  • kcc_scaffold_identity"
echo "  • kcc_scaffold_controller"
echo "  • kcc_scaffold_mockgcp"
echo "  • kcc_add_field"
echo "  • kcc_generate_mapper"
echo "  • kcc_git_commit"
echo "  • kcc_git_status"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the inspector
npx @modelcontextprotocol/inspector node dist/index.js
