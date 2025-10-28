# Installation Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- k8s-config-connector repository cloned locally

## Installation

### 1. Install Dependencies

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
npm install
```

### 2. Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. Configure

Create configuration file:

```bash
mkdir -p ~/.config/kcc-mcp-server

cat > ~/.config/kcc-mcp-server/config.json <<EOF
{
  "git": {
    "author_name": "Frank Currie",
    "author_email": "fcurrie@google.com"
  },
  "kcc_repo_path": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
}
EOF
```

**Or** use environment variables:

```bash
export KCC_AUTHOR_NAME="Frank Currie"
export KCC_AUTHOR_EMAIL="fcurrie@google.com"
export KCC_REPO_PATH="/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
```

**Or** rely on existing git config (will be auto-detected).

### 4. Test (Optional)

Verify the server works:

```bash
npm test
```

## Usage with Claude Desktop

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kcc-contributor": {
      "command": "node",
      "args": ["/home/fcurrie/Projects/kcc-mcp-server/dist/index.js"],
      "env": {
        "KCC_REPO_PATH": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
      }
    }
  }
}
```

### Linux

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kcc-contributor": {
      "command": "node",
      "args": ["/home/fcurrie/Projects/kcc-mcp-server/dist/index.js"],
      "env": {
        "KCC_REPO_PATH": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
      }
    }
  }
}
```

### Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## Verification

In Claude Desktop, you should see the following tools available:

- `kcc_find_resource` - Locate KCC resource files
- `kcc_add_field` - Add field with proto annotation
- `kcc_generate_mapper` - Regenerate mapper
- `kcc_git_commit` - Create commit (with AI attribution blocking)
- `kcc_git_status` - Get git status

## Usage Example

See `examples/computeurlmap-example.md` for a complete walkthrough of adding `defaultCustomErrorResponsePolicy` to `ComputeURLMap`.

## Troubleshooting

### Error: "Git author not configured"

**Solution**: Create config file or set environment variables (see step 3 above).

### Error: "KCC repository path not configured"

**Solution**: Set `KCC_REPO_PATH` environment variable or add to config file.

### Error: "Resource not found"

**Solution**: Ensure the resource exists and has a direct controller. The server only works with direct controllers, not Terraform-based controllers.

### MCP Server Not Showing in Claude

**Solution**:
1. Check that config file path is correct
2. Verify `dist/index.js` exists (run `npm run build`)
3. Restart Claude Desktop
4. Check Claude Desktop logs for errors

## Development Mode

To run the server in watch mode during development:

```bash
npm run dev
```

This will automatically rebuild on file changes.

## Configuration Reference

### Config File (`~/.config/kcc-mcp-server/config.json`)

```json
{
  "git": {
    "author_name": "Your Name",
    "author_email": "you@example.com"
  },
  "kcc_repo_path": "/path/to/k8s-config-connector",
  "rules": {
    "block_ai_attribution": true,
    "require_conventional_commits": true
  }
}
```

### Environment Variables

- `KCC_AUTHOR_NAME` - Git author name
- `KCC_AUTHOR_EMAIL` - Git author email
- `KCC_REPO_PATH` - Path to k8s-config-connector repository

### Priority

1. Environment variables (highest priority)
2. Config file
3. Git config (fallback, lowest priority)

## Next Steps

After installation:

1. Read `examples/computeurlmap-example.md` for a complete example
2. Try adding a field to a resource
3. Let the MCP server enforce git attribution rules automatically
