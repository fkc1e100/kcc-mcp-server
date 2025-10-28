# Using KCC MCP Server with Gemini CLI ✅

The KCC MCP Server is now installed as a Gemini CLI extension!

## Installation Status

✅ **Extension Installed:** kcc-contributor (1.0.0)
✅ **MCP Server:** kccServer
✅ **All 12 Tools Available**

## Quick Start

### Set Your API Key

```bash
export GOOGLE_API_KEY="your-api-key-from-makersuite"
```

Get your key from: https://makersuite.google.com/app/apikey

### Start Gemini CLI

```bash
npx @google/gemini-cli chat
```

Or if you want to use a specific model:

```bash
npx @google/gemini-cli chat --model gemini-2.0-flash-exp
```

## Example Conversations

### Example 1: Check Migration Status

```
You: Check if ComputeURLMap needs migration to direct controller

Gemini: Let me check that for you...
[Calls kcc_detect_controller_type]

ComputeURLMap is currently using a Terraform-based controller
and needs migration to the direct controller architecture.

Current status:
- Type: terraform
- Service: compute
- Version: v1beta1
- Migration needed: true
```

### Example 2: Find Resource Files

```
You: Find the EdgeCacheService resource files

Gemini: I'll locate those files for you...
[Calls kcc_find_resource]

EdgeCacheService files found:
- Types: apis/networkservices/v1alpha1/edgecacheservice_types.go ✓
- Controller: pkg/controller/direct/networkservices/edgecacheservice_controller.go ✓
- Mapper: pkg/controller/direct/networkservices/mapper.generated.go ✓
- Test fixtures: Not found

This is a direct controller resource, ready for field additions.
```

### Example 3: Get Migration Plan

```
You: Create a detailed migration plan for ComputeURLMap

Gemini: I'll create a comprehensive migration plan...
[Calls kcc_plan_migration]

Here's the 7-phase migration plan for ComputeURLMap:

Phase 1: Proto Definitions (1-2 hours)
✓ Proto files exist
- Identify proto package: google.cloud.compute.v1
- Identify message name: UrlMap

Phase 2: API Types (4-6 hours)
- Create apis/compute/v1beta1/computeurlmap_types.go
- Define Spec struct with +kcc:proto= annotations
...

Next immediate action: Use kcc_scaffold_types to create the API types file.
```

### Example 4: Add a Field

```
You: I need to add the routeMethods field to EdgeCacheService.
     It's an array type and the proto path is
     google.cloud.networkservices.v1.EdgeCacheService.routing.route_rule.route_methods

Gemini: I'll help you add that field...
[Calls kcc_add_field]

✓ Field added to EdgeCacheService
✓ Proto annotation: +kcc:proto=google.cloud.networkservices.v1.EdgeCacheService.routing.route_rule.route_methods

Next steps:
1. Run kcc_generate_mapper to regenerate the mapper
2. Add test fixtures
3. Commit your changes
```

### Example 5: Check Git Status

```
You: What's the current git status?

Gemini: Let me check...
[Calls kcc_git_status]

Working tree status:
Modified files:
- apis/networkservices/v1alpha1/edgecacheservice_types.go

Untracked files: None

Ready to commit.
```

## Available Tools

All 12 tools are accessible through natural language:

### Resource Detection
- **kcc_find_resource** - "Find the EdgeCacheService files"
- **kcc_detect_controller_type** - "Check if ComputeURLMap is a direct controller"
- **kcc_migration_status** - "What's the migration status for ComputeURLMap?"

### Migration Planning
- **kcc_plan_migration** - "Create a migration plan for ComputeURLMap"
- **kcc_scaffold_types** - "Generate the API types for ComputeURLMap"
- **kcc_scaffold_identity** - "Create the identity handler for ComputeURLMap"
- **kcc_scaffold_controller** - "Generate the controller for ComputeURLMap"
- **kcc_scaffold_mockgcp** - "Create the MockGCP server for ComputeURLMap"

### Field Addition
- **kcc_add_field** - "Add routeMethods field to EdgeCacheService"
- **kcc_generate_mapper** - "Regenerate the mapper for EdgeCacheService"

### Git Operations
- **kcc_git_commit** - "Commit the changes with message: feat: Add routeMethods"
- **kcc_git_status** - "Show me the git status"

## Tips for Using Gemini CLI

### 1. Be Specific

✅ Good: "Check if ComputeURLMap needs migration to direct controller"
❌ Vague: "Tell me about ComputeURLMap"

### 2. Provide Context

✅ Good: "I need to add the routeMethods field (array type) to EdgeCacheService"
❌ Missing info: "Add a field to EdgeCacheService"

### 3. Follow Multi-Step Workflows

```
You: I want to migrate ComputeURLMap to direct controller

Gemini: Let me check the current status first...
[Calls kcc_migration_status]

I see it's at 2/7 phases. Let me create a detailed plan...
[Calls kcc_plan_migration]

Based on the plan, we should start with scaffolding the API types.
Shall I proceed with that?

You: Yes, please scaffold the types

Gemini: [Calls kcc_scaffold_types with appropriate parameters]
...
```

## Configuration

The extension uses these environment variables (from gemini-extension.json):

```json
{
  "KCC_REPO_PATH": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector",
  "KCC_AUTHOR_NAME": "Frank Currie",
  "KCC_AUTHOR_EMAIL": "fcurrie@google.com"
}
```

To change these, edit `/home/fcurrie/Projects/kcc-mcp-server/gemini-extension.json`

## Testing Without API Key

You can still test the MCP server works without using Gemini:

```bash
# Command-line test
cd /home/fcurrie/Projects/kcc-mcp-server
node test-gemini-client.js

# Visual inspector
./start-inspector.sh
```

## Troubleshooting

### Issue: "No API key found"
**Solution:** Set your API key:
```bash
export GOOGLE_API_KEY="your-key"
```

### Issue: "Extension not found"
**Solution:** Reinstall the extension:
```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./install-gemini-extension.sh
```

### Issue: "Tool returned error"
**Solution:** Check that KCC repo path is correct:
```bash
ls /home/fcurrie/Projects/kcc-resource-add/k8s-config-connector/apis/
```

### Issue: "Gemini doesn't call tools"
**Solution:** Be more specific in your prompt and mention what you want to check/do.

## Management Commands

### Check Extension Status
```bash
npx @google/gemini-cli extensions list
```

### Disable Extension
```bash
npx @google/gemini-cli extensions disable kcc-contributor
```

### Enable Extension
```bash
npx @google/gemini-cli extensions enable kcc-contributor
```

### Uninstall Extension
```bash
npx @google/gemini-cli extensions uninstall kcc-contributor
```

### Reinstall Extension
```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./install-gemini-extension.sh
```

## Advanced: Manual Testing

If you want to see the raw MCP protocol:

```bash
# List tools available
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"kcc_find_resource","arguments":{"resource":"EdgeCacheService"}}}' | node dist/index.js
```

## Next Steps

1. **Get API Key** - https://makersuite.google.com/app/apikey
2. **Set Environment** - `export GOOGLE_API_KEY="..."`
3. **Start Chat** - `npx @google/gemini-cli chat`
4. **Try Prompts** - See examples above

Enjoy using Gemini with KCC MCP tools! 🚀
