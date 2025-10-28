#!/bin/bash
# Setup script for KCC MCP Server configuration

set -e

echo "=== KCC MCP Server Configuration Setup ==="
echo ""

# Get KCC repository path
read -p "Enter path to k8s-config-connector repository: " KCC_REPO_PATH
if [ ! -d "$KCC_REPO_PATH" ]; then
  echo "Warning: Directory does not exist: $KCC_REPO_PATH"
  read -p "Continue anyway? (y/N): " continue
  if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
    exit 1
  fi
fi

# Get author name (default from git config)
GIT_NAME=$(git config user.name 2>/dev/null || echo "")
read -p "Enter your name [$GIT_NAME]: " AUTHOR_NAME
AUTHOR_NAME=${AUTHOR_NAME:-$GIT_NAME}

# Get author email (default from git config)
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
read -p "Enter your email [$GIT_EMAIL]: " AUTHOR_EMAIL
AUTHOR_EMAIL=${AUTHOR_EMAIL:-$GIT_EMAIL}

# Validate
if [ -z "$AUTHOR_NAME" ] || [ -z "$AUTHOR_EMAIL" ]; then
  echo "Error: Name and email are required"
  exit 1
fi

# Create config directory
CONFIG_DIR="$HOME/.config/kcc-mcp-server"
CONFIG_FILE="$CONFIG_DIR/config.json"

mkdir -p "$CONFIG_DIR"

# Create config file
cat > "$CONFIG_FILE" << EOF
{
  "git": {
    "author_name": "$AUTHOR_NAME",
    "author_email": "$AUTHOR_EMAIL"
  },
  "kcc_repo_path": "$KCC_REPO_PATH"
}
EOF

echo ""
echo "✅ Configuration saved to: $CONFIG_FILE"
echo ""
echo "Configuration:"
cat "$CONFIG_FILE"
echo ""
echo "You can now use the KCC MCP Server with Gemini CLI!"
echo ""
echo "Start Gemini CLI:"
echo "  npx @google/gemini-cli chat"
echo ""
echo "Check MCP servers:"
echo "  /mcp list"
