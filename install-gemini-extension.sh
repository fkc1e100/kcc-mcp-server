#!/bin/bash

# Install KCC MCP Server as a Gemini CLI Extension
# This allows you to use: gemini-cli chat (and have access to all 12 KCC tools)

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Installing KCC MCP Server as Gemini CLI Extension           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if gemini-cli is installed
if ! npm list -g @google/gemini-cli >/dev/null 2>&1; then
    echo "❌ gemini-cli is not installed globally"
    echo ""
    echo "Install it with:"
    echo "  npm install -g @google/gemini-cli"
    echo ""
    echo "Or install temporarily with:"
    echo "  npx @google/gemini-cli extensions link /home/fcurrie/Projects/kcc-mcp-server"
    exit 1
fi

echo "✅ gemini-cli is installed"
echo ""

# Build the MCP server if needed
if [ ! -f "dist/index.js" ]; then
    echo "📦 Building MCP server..."
    npm run build
    echo ""
fi

echo "✅ MCP server built"
echo ""

# Link the extension
echo "🔗 Linking extension to gemini-cli..."
npx -y @google/gemini-cli extensions link /home/fcurrie/Projects/kcc-mcp-server

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  Installation Complete! ✅                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "You can now use the KCC MCP server with gemini-cli:"
echo ""
echo "  npx @google/gemini-cli chat"
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
echo "Try these prompts:"
echo "  'Check if ComputeURLMap needs migration'"
echo "  'Find the EdgeCacheService resource files'"
echo "  'What's the migration status for ComputeURLMap?'"
echo ""
echo "To uninstall:"
echo "  npx @google/gemini-cli extensions uninstall kcc-contributor"
echo ""
