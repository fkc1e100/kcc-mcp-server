# Start Here: KCC MCP Server with Gemini CLI

## ✅ Installation Complete!

Your KCC MCP Server is **installed and ready** as a Gemini CLI extension!

```bash
npx @google/gemini-cli extensions list
```

Output:
```
✓ kcc-contributor (1.0.0)
 MCP servers: kccServer
```

---

## 🚀 Quick Start (3 Steps)

### 1. Get API Key
https://makersuite.google.com/app/apikey

### 2. Set It
```bash
export GOOGLE_API_KEY="your-api-key-here"
```

### 3. Chat!
```bash
npx @google/gemini-cli chat
```

Then type:
```
Check if ComputeURLMap needs migration
```

**That's it!** All 12 KCC tools are available through natural language.

---

## 📚 Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| **GEMINI_SETUP_COMPLETE.md** | What was done, how it works | First - understand what happened |
| **GEMINI_CLI_USAGE.md** | Full usage guide with examples | When you're ready to use it |
| **CHOOSE_YOUR_PATH.md** | Compare testing methods | If you want alternatives |
| **README.md** | Complete technical reference | For details on all 12 tools |

---

## 🎯 What You Can Do Now

### Natural Language Queries

```bash
npx @google/gemini-cli chat
```

Then ask:
- "Check if ComputeURLMap needs migration"
- "Find the EdgeCacheService resource files"
- "What's the migration status for ComputeURLMap?"
- "Create a migration plan for ComputeURLMap"
- "Add routeMethods field to EdgeCacheService"

### All 12 Tools Available

**Resource Detection:**
- kcc_find_resource
- kcc_detect_controller_type
- kcc_migration_status

**Migration:**
- kcc_plan_migration
- kcc_scaffold_types
- kcc_scaffold_identity
- kcc_scaffold_controller
- kcc_scaffold_mockgcp

**Field Addition:**
- kcc_add_field
- kcc_generate_mapper

**Git:**
- kcc_git_commit (blocks AI attribution!)
- kcc_git_status

---

## 🔧 How It Works

Followed the **same pattern** as gke-mcp server:

1. **Extension Manifest** (`gemini-extension.json`)
   - Tells gemini-cli about the MCP server
   - Sets environment variables
   - Configures command to run

2. **Linked Installation**
   - Extension lives at: `/home/fcurrie/Projects/kcc-mcp-server`
   - Symlinked to: `~/.gemini/extensions/kcc-contributor/`
   - Changes are immediately reflected

3. **Native Integration**
   - No Python bridge needed
   - No manual stdio setup
   - Just works with `gemini-cli chat`

---

## 🎓 Example Session

```bash
$ export GOOGLE_API_KEY="your-key"
$ npx @google/gemini-cli chat

You: Check if ComputeURLMap needs migration

Gemini: Let me check that for you...
[Calls kcc_detect_controller_type]

Based on the results:
- ComputeURLMap is currently using a Terraform-based controller
- Migration to direct controller is needed
- Service: compute
- Version: v1beta1

Would you like me to check the migration status and create a plan?

You: Yes, check the status

Gemini: [Calls kcc_migration_status]

Current progress: 2/7 phases complete
✓ Phase 1: Proto Definitions
✗ Phase 2: API Types (not started)
✗ Phase 3: Identity Handler (not started)
✓ Phase 4: Mapper
✗ Phase 5: Controller (not started)
✗ Phase 6: MockGCP (not started)
✗ Phase 7: Test Fixtures (not started)

Next action: Use kcc_scaffold_types to create API types file.

Shall I create a detailed migration plan?

You: Yes please

Gemini: [Calls kcc_plan_migration]

Here's your comprehensive 7-phase migration plan...
[Shows detailed plan with tasks, time estimates, file paths]

Ready to start with Phase 2: Scaffolding API types?
```

---

## 🆚 Comparison: Testing Methods

| Method | Setup | Natural Language | Use Case |
|--------|-------|------------------|----------|
| **Gemini CLI** | ⭐ 1 min | ✅ Yes | Production use |
| **MCP Inspector** | ⭐ 0 min | ❌ No | Visual debugging |
| **Command Line** | ⭐ 0 min | ❌ No | Quick validation |

**Recommendation:** Use Gemini CLI for real work, Inspector for debugging.

---

## 🔄 If You Need to Rebuild

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
npm run build
# Extension automatically picks up changes!
```

---

## 🔍 Troubleshooting

### Can't find gemini-cli?
```bash
npm install -g @google/gemini-cli
```

### Extension not found?
```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./install-gemini-extension.sh
```

### API key issues?
```bash
export GOOGLE_API_KEY="your-key"
# Or add to ~/.bashrc permanently
```

### Tools not working?
Check repo path:
```bash
ls /home/fcurrie/Projects/kcc-resource-add/k8s-config-connector/apis/
```

---

## 📖 Learn More

- **How it works:** `GEMINI_SETUP_COMPLETE.md`
- **Usage examples:** `GEMINI_CLI_USAGE.md`
- **All tools reference:** `README.md`

---

## ⚡ TL;DR

```bash
# 1. Get API key from makersuite.google.com
export GOOGLE_API_KEY="your-key"

# 2. Start chatting
npx @google/gemini-cli chat

# 3. Try it
"Check if ComputeURLMap needs migration"
```

**That's it!** 🎉

Extension is installed, configured, and ready to use.
