# KCC MCP Server

Model Context Protocol (MCP) server for contributing to Google Cloud Platform's [k8s-config-connector](https://github.com/GoogleCloudPlatform/k8s-config-connector).

This MCP server provides AI assistants with tools to:
- **Add fields** to existing direct controller resources
- **Migrate resources** from Terraform-based to direct controller architecture
- **Create commits** with enforced attribution rules (NO AI attribution)

## Features

✅ **12 MCP Tools** for k8s-config-connector contributions
✅ **Universal AI Attribution Blocking** - enforces human-only commit authorship
✅ **Resource Detection** - automatically determines controller type
✅ **Migration Planning** - 7-phase workflow for Terraform → Direct migration
✅ **Code Scaffolding** - generates boilerplate for types, controller, MockGCP
✅ **Proto Annotations** - maintains KRM ↔ GCP proto mappings

## Quick Start

### Installation with Gemini CLI (Recommended)

```bash
# Install from GitHub
npx @google/gemini-cli extensions install https://github.com/fkc1e100/kcc-mcp-server.git

# Run setup
cd ~/.gemini/extensions/kcc-contributor
./setup-config.sh

# Start using it
npx @google/gemini-cli chat
```

### Manual Installation

```bash
# Clone or copy this repository
cd kcc-mcp-server

# Install dependencies
npm install

# Build
npm run build
```

### Configuration

**Option 1: Interactive Setup (Easiest)**

Run the setup script after installation:

```bash
./setup-config.sh
```

This creates `~/.config/kcc-mcp-server/config.json` with your settings.

**Option 2: Manual Config File**

Create `~/.config/kcc-mcp-server/config.json`:

```json
{
  "git": {
    "author_name": "Your Name",
    "author_email": "you@example.com"
  },
  "kcc_repo_path": "/path/to/k8s-config-connector"
}
```

**Option 3: Environment Variables**

```bash
export KCC_REPO_PATH="/path/to/k8s-config-connector"
export KCC_AUTHOR_NAME="Your Name"
export KCC_AUTHOR_EMAIL="you@example.com"
```

### Usage with Gemini CLI

```bash
# Start chat session
npx @google/gemini-cli chat
# or
gemini --yolo

# Check MCP server status
/mcp list

# Should show:
# 🟢 kccServer (from kcc-contributor) - Ready (12 tools)
```

**Example prompts:**
```
Check if ComputeURLMap needs migration
```
```
Find the EdgeCacheService resource files
```
```
Add a new field called routeMethods to EdgeCacheService
```

See [GEMINI_CLI_USAGE.md](GEMINI_CLI_USAGE.md) for more examples.

### Verifying Installation

After installation, verify the MCP server is connected:

```bash
npx @google/gemini-cli chat
```

Then in the chat:
```
/mcp list
```

You should see:
```
🟢 kccServer (from kcc-contributor) - Ready (12 tools)
  Tools:
  - kcc_add_field
  - kcc_detect_controller_type
  - kcc_find_resource
  - kcc_generate_mapper
  - kcc_git_commit
  - kcc_git_status
  - kcc_migration_status
  - kcc_plan_migration
  - kcc_scaffold_controller
  - kcc_scaffold_identity
  - kcc_scaffold_mockgcp
  - kcc_scaffold_types
```

If you see `🔴 kccServer - Disconnected`, see [Troubleshooting](#troubleshooting) below.

### Usage with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "kcc-contributor": {
      "command": "node",
      "args": ["/path/to/kcc-mcp-server/dist/index.js"],
      "env": {
        "KCC_REPO_PATH": "/path/to/k8s-config-connector"
      }
    }
  }
}
```

## Available Tools

### Resource Detection (3 tools)

#### `kcc_find_resource`
Locate files for a KCC resource (types, controller, mapper, test fixtures).

**Parameters:**
- `resource` (string): Resource name (e.g., "EdgeCacheService")

#### `kcc_detect_controller_type`
Detect if a resource uses direct controller or Terraform-based controller.

**Parameters:**
- `resource` (string): Resource name

**Returns:**
```json
{
  "type": "terraform",
  "migration_needed": true,
  "service": "compute",
  "version": "v1beta1"
}
```

#### `kcc_migration_status`
Get migration status for a resource (shows which phases are complete).

**Parameters:**
- `resource` (string): Resource name

**Returns:**
```json
{
  "resource": "ComputeURLMap",
  "overall_progress": "2/7 phases",
  "current_phase": { "number": 2, "name": "API Types", "status": "not_started" },
  "next_action": "Use kcc_scaffold_types to create API types file",
  "can_add_fields": false
}
```

### Migration Tools (5 tools)

#### `kcc_plan_migration`
Create a detailed 7-phase migration plan for migrating a Terraform-based resource to direct controller.

**Parameters:**
- `resource` (string): Resource name

#### `kcc_scaffold_types`
Generate API types file (Phase 2 of migration).

**Parameters:**
- `resource`, `service`, `version`, `proto_package`, `proto_message`, `description` (optional)

#### `kcc_scaffold_identity`
Generate identity handler file (Phase 3 of migration).

**Parameters:**
- `resource`, `service`, `version`, `resource_name_format`

#### `kcc_scaffold_controller`
Generate controller file (Phase 5 of migration).

**Parameters:**
- `resource`, `service`, `version`, `proto_package`, `proto_message`

#### `kcc_scaffold_mockgcp`
Generate MockGCP server file (Phase 6 of migration).

**Parameters:**
- `resource`, `service`, `proto_package`, `proto_message`, `resource_name_format`

### Field Addition (2 tools)

#### `kcc_add_field`
Add a field to an existing direct controller with proper proto annotations.

**Parameters:**
```json
{
  "resource": "EdgeCacheService",
  "field_name": "RouteMethods",
  "field_type": "array",
  "proto_path": "google.cloud.networkservices.v1.EdgeCacheService.routing.route_rule.route_methods",
  "parent_type": "ComputeURLMapSpec",
  "description": "HTTP methods to match for routing"
}
```

#### `kcc_generate_mapper`
Regenerate KRM ↔ Proto mapper after adding fields.

**Parameters:**
- `resource` (string): Resource name

### Git Operations (2 tools)

#### `kcc_git_commit`
Create git commit with enforced rules: blocks AI attribution, uses your git identity, validates message format.

**Parameters:**
```json
{
  "message": "feat(networkservices): Add routeMethods to EdgeCacheService\n\nAdds support for HTTP method-based routing.",
  "files": ["apis/networkservices/v1alpha1/edgecacheservice_types.go"]
}
```

**Validation:**
- ✅ Blocks AI attribution (Claude, Anthropic, Gemini, OpenAI, etc.)
- ✅ Validates conventional commit format (feat:, fix:, chore:, etc.)
- ✅ Uses your configured git identity

#### `kcc_git_status`
Get current git status.

**No parameters required.**

## Example Workflows

### Example 1: Add Field to Existing Direct Controller

**Scenario:** Add `routeMethods` field to EdgeCacheService

```typescript
// 1. Find the resource
kcc_find_resource({ resource: "EdgeCacheService" })

// 2. Add the field
kcc_add_field({
  resource: "EdgeCacheService",
  field_name: "RouteMethods",
  field_type: "array",
  proto_path: "google.cloud.networkservices.v1.EdgeCacheService.routing.route_rule.route_methods",
  description: "HTTP methods to match for routing"
})

// 3. Regenerate mapper
kcc_generate_mapper({ resource: "EdgeCacheService" })

// 4. Commit changes
kcc_git_commit({
  message: "feat(networkservices): Add routeMethods to EdgeCacheService\n\nAdds support for HTTP method-based routing."
})
```

### Example 2: Migrate Terraform Resource to Direct Controller

**Scenario:** Migrate ComputeURLMap from Terraform to direct controller

```typescript
// 1. Detect controller type
kcc_detect_controller_type({ resource: "ComputeURLMap" })
// Returns: { type: "terraform", migration_needed: true }

// 2. Check migration status
kcc_migration_status({ resource: "ComputeURLMap" })
// Shows: 2/7 phases complete, next: scaffold types

// 3. Get detailed migration plan
kcc_plan_migration({ resource: "ComputeURLMap" })
// Returns: 7 phases with specific tasks

// 4. Phase 2: Scaffold API types
kcc_scaffold_types({
  resource: "ComputeURLMap",
  service: "compute",
  version: "v1beta1",
  proto_package: "google.cloud.compute.v1",
  proto_message: "UrlMap"
})

// 5. Phase 3: Scaffold identity handler
kcc_scaffold_identity({
  resource: "ComputeURLMap",
  service: "compute",
  version: "v1beta1",
  resource_name_format: "projects/{project}/global/urlMaps/{urlMap}"
})

// 6. Phase 4: Generate mapper
kcc_generate_mapper({ resource: "ComputeURLMap" })

// 7. Phase 5: Scaffold controller
kcc_scaffold_controller({
  resource: "ComputeURLMap",
  service: "compute",
  version: "v1beta1",
  proto_package: "google.cloud.compute.v1",
  proto_message: "UrlMap"
})

// 8. Phase 6: Scaffold MockGCP
kcc_scaffold_mockgcp({
  resource: "ComputeURLMap",
  service: "compute",
  proto_package: "google.cloud.compute.v1",
  proto_message: "UrlMap",
  resource_name_format: "projects/{project}/global/urlMaps/{urlMap}"
})

// 9. Manually create test fixtures (Phase 7)
// ... create YAML files in pkg/test/resourcefixture/testdata/

// 10. Commit the migration
kcc_git_commit({
  message: "feat(compute)!: Migrate ComputeURLMap to direct controller\n\nMigrates from Terraform-based to direct controller architecture.\n\nBREAKING CHANGE: Resource moves from terraform to direct controller."
})
```

## Testing

```bash
# Test field addition tools
npm test

# Test migration tools
node test/test-migration-tools.js
```

**Test Results:**
```
✅ Test 1: Detect Controller Type - PASS
✅ Test 2: Get Migration Status - PASS
✅ Test 3: Plan Migration - PASS
✅ Test 4: Verify EdgeCacheService (Direct Controller) - PASS
```

## Troubleshooting

### kccServer shows as Disconnected

If `/mcp list` shows `🔴 kccServer - Disconnected`:

**1. Check config file exists:**
```bash
cat ~/.config/kcc-mcp-server/config.json
```

If missing, run the setup script:
```bash
cd ~/.gemini/extensions/kcc-contributor
./setup-config.sh
```

**2. Verify SDK version (must be 1.11.0+):**
```bash
cat ~/.gemini/extensions/kcc-contributor/package.json | grep "@modelcontextprotocol/sdk"
```

Should show: `"@modelcontextprotocol/sdk": "^1.11.0"`

If it shows `0.5.0` or older, update the extension:
```bash
npx @google/gemini-cli extensions uninstall kcc-contributor
npx @google/gemini-cli extensions install https://github.com/fkc1e100/kcc-mcp-server.git
```

**3. Test server manually:**
```bash
cd ~/.gemini/extensions/kcc-contributor
node dist/index.js
```

Should show:
```
✅ KCC MCP Server initialized
📁 Repository: /path/to/k8s-config-connector
👤 Author: Your Name <you@example.com>
🚀 KCC MCP Server running
```

**4. Check repository path is valid:**

Make sure the `kcc_repo_path` in your config points to a valid k8s-config-connector directory.

### Updating the Extension

To get the latest version:

**Option 1: Reinstall**
```bash
npx @google/gemini-cli extensions uninstall kcc-contributor
npx @google/gemini-cli extensions install https://github.com/fkc1e100/kcc-mcp-server.git
```

**Option 2: Manual update**
```bash
cd ~/.gemini/extensions/kcc-contributor
git pull origin main
npm install
```

Then restart Gemini CLI.

### Config File Not Found

If you see errors about config not found, create the config file:

```bash
mkdir -p ~/.config/kcc-mcp-server
cat > ~/.config/kcc-mcp-server/config.json << 'EOF'
{
  "git": {
    "author_name": "Your Name",
    "author_email": "you@example.com"
  },
  "kcc_repo_path": "/path/to/k8s-config-connector"
}
EOF
```

Replace the paths and details with your actual information.

## Migration Phases

The migration process consists of 7 phases:

1. **Proto Definitions** - Verify proto files exist
2. **API Types (KRM)** - Define Kubernetes resource types
3. **Identity Handler** - Implement resource name parsing
4. **Mapper Generation** - Generate KRM ↔ Proto conversions
5. **Controller Implementation** - Implement CRUD operations
6. **MockGCP Implementation** - Create mock GCP server for testing
7. **Test Fixtures** - Create YAML test fixtures

Each phase builds on the previous phase. Use `kcc_migration_status` to track progress.

## Critical Rules

### ⚠️ AI Attribution is BLOCKED

This server **ENFORCES** that only human contributors are credited in git commits. It will **REJECT** any commit message containing:

- AI assistant names (Claude, Gemini, GPT, etc.)
- AI company names (Anthropic, OpenAI, etc.)
- Co-Authored-By lines with AI emails
- Phrases like "Generated with", "AI-generated", etc.

This is a **NON-NEGOTIABLE** requirement for k8s-config-connector contributions.

### Conventional Commits

Commit messages must follow the conventional commits format:

```
<type>(<scope>): <subject>

<body>
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

**Example:**
```
feat(compute): Add defaultCustomErrorResponsePolicy to ComputeURLMap

Adds support for configuring custom error response policies
at the URL map level.
```

## Architecture

```
kcc-mcp-server/
├── src/
│   ├── index.ts              # MCP server implementation
│   ├── config.ts             # Configuration management
│   ├── git-validator.ts      # Git attribution enforcement
│   └── tools/
│       ├── find-resource.ts          # Resource file location
│       ├── detect-controller-type.ts # Controller type detection
│       ├── migration-status.ts       # Migration progress tracking
│       ├── plan-migration.ts         # Migration plan generation
│       ├── scaffold-types.ts         # API types scaffolding
│       ├── scaffold-identity.ts      # Identity handler scaffolding
│       ├── scaffold-controller.ts    # Controller scaffolding
│       ├── scaffold-mockgcp.ts       # MockGCP scaffolding
│       ├── add-field.ts              # Field addition
│       └── generate-mapper.ts        # Mapper generation
├── test/
│   ├── test-edgecacheservice.js      # Field addition tests
│   └── test-migration-tools.js       # Migration tools tests
└── README.md
```

## Configuration Priority

Configuration is loaded in this order (first found wins):

1. **Environment variables** (highest priority)
   - `KCC_REPO_PATH`, `KCC_AUTHOR_NAME`, `KCC_AUTHOR_EMAIL`
2. **Config file** (`~/.config/kcc-mcp-server/config.json`)
3. **Git config** (lowest priority, used as fallback for author name/email only)

## Resources

- [k8s-config-connector repo](https://github.com/GoogleCloudPlatform/k8s-config-connector)
- [Main development guide](https://github.com/GoogleCloudPlatform/k8s-config-connector/blob/master/docs/develop-resources/README.md)
- [Migration guide](https://github.com/GoogleCloudPlatform/k8s-config-connector/blob/master/docs/develop-resources/scenarios/migrate-tf-resource-alpha.md)

## License

Apache License 2.0 (following k8s-config-connector)

## Authors

- Frank Currie (fcurrie@google.com)
