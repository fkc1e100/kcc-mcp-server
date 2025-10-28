# KCC MCP Server - Project Summary

## What We Built

A Model Context Protocol (MCP) server that helps contributors add fields to k8s-config-connector resources while **enforcing strict attribution rules**.

## Location

```
/home/fcurrie/Projects/kcc-mcp-server/
```

## Key Features

### 1. **Enforced Attribution Rules** 🔒
The server **automatically blocks** any commits containing AI attribution:
- No "Claude", "Gemini", "Anthropic", "OpenAI" mentions
- No "Co-Authored-By: AI" lines
- No AI-generated markers

**This is NON-NEGOTIABLE and applies to everyone.**

### 2. **Simplified Workflow** ⚡
Add a field in ~5 tool calls instead of ~10 manual steps:

```
kcc_find_resource → kcc_add_field → kcc_generate_mapper → kcc_git_commit
```

### 3. **User-Configurable** 👤
Works with any contributor's git identity:
- Reads from config file, environment variables, or git config
- Validates identity before committing
- Each user sets their own name/email

### 4. **Smart Validation** 🛡️
- Validates proto paths
- Checks conventional commit format
- Ensures git config matches expectations
- Provides clear error messages

## Tools Provided

| Tool | Purpose |
|------|---------|
| `kcc_find_resource` | Locate types, controller, mapper, test fixtures |
| `kcc_add_field` | Add field with proper proto annotation |
| `kcc_generate_mapper` | Regenerate KRM ↔ Proto mapper |
| `kcc_git_commit` | Create commit (blocks AI attribution) |
| `kcc_git_status` | Get current git status |

## Example Use Case

**Task**: Add `defaultCustomErrorResponsePolicy` to `ComputeURLMap`

**Traditional Approach** (10+ steps):
1. Find types file manually
2. Add field with proto annotation
3. Run generate-mapper script
4. Update test fixtures (create.yaml)
5. Update test fixtures (update.yaml)
6. Run make fmt
7. Check git status
8. Stage files
9. Create commit
10. Remember to NOT add AI attribution

**With MCP Server** (4 tool calls):
1. `kcc_find_resource("ComputeURLMap")` ✅
2. `kcc_add_field(...)` ✅
3. `kcc_generate_mapper("ComputeURLMap")` ✅
4. `kcc_git_commit("feat: Add field")` ✅ (AI attribution automatically blocked)

## Project Structure

```
kcc-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── config.ts             # Configuration management
│   ├── git-validator.ts      # Attribution enforcement
│   └── tools/
│       ├── find-resource.ts  # Resource location
│       ├── add-field.ts      # Field addition
│       └── generate-mapper.ts # Mapper generation
├── examples/
│   └── computeurlmap-example.md  # Complete walkthrough
├── test/
│   └── (test scripts)
├── dist/                     # Compiled JavaScript (built)
├── package.json
├── tsconfig.json
├── README.md                 # Main documentation
└── INSTALL.md                # Installation guide
```

## Installation

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
npm install
npm run build
```

Create config:
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
