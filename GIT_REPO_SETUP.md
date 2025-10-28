# Publishing KCC MCP Server to Git Repository

## Recommended Setup

### 1. Create GitHub Repository

```bash
# On GitHub, create: kcc-mcp-server
# Then locally:

cd /home/fcurrie/Projects/kcc-mcp-server
git init
git add .
git commit -m "feat: Initial release of KCC MCP Server

- 12 MCP tools for k8s-config-connector contributions
- Field addition tools
- Migration tools for Terraform -> Direct controller
- AI attribution blocking
- Gemini CLI extension support"

git remote add origin https://github.com/fcurrie/kcc-mcp-server.git
git push -u origin main
```

### 2. Users Install From Git

**One command installation:**

```bash
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

That's it! Gemini CLI will:
- Clone the repo
- Run `npm install`
- Run `npm run build`
- Register the extension
- Enable it automatically

### 3. Users Update the Extension

```bash
npx @google/gemini-cli extensions update kcc-contributor
```

---

## Repository Structure (What to Include)

### Essential Files

```
kcc-mcp-server/
├── package.json                    # Dependencies
├── gemini-extension.json           # Extension manifest
├── tsconfig.json                   # TypeScript config
├── .gitignore                      # Ignore node_modules, dist
├── README.md                       # Main documentation
├── LICENSE                         # Apache 2.0
├── src/                            # Source code
│   ├── index.ts
│   ├── config.ts
│   ├── git-validator.ts
│   └── tools/
└── test/                           # Test files
```

### What to Include

✅ **Include:**
- All `.ts` source files
- `package.json`, `tsconfig.json`
- `gemini-extension.json`
- `README.md` with installation instructions
- `LICENSE` file
- `.gitignore` (ignore `dist/`, `node_modules/`)
- Documentation: `GEMINI_CLI_USAGE.md`, `START_HERE.md`
- Test files

❌ **Don't Include:**
- `node_modules/` (add to .gitignore)
- `dist/` (built on install)
- `.kcc-mcp-config.json` (user-specific)
- Local test output

---

## .gitignore File

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Config (user-specific)
.kcc-mcp-config.json

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## Update gemini-extension.json for Git Install

The current version has hardcoded paths:

```json
{
  "name": "kcc-contributor",
  "version": "1.0.0",
  "description": "KCC MCP Server for contributing to k8s-config-connector",
  "mcpServers": {
    "kccServer": {
      "command": "node",
      "args": ["${extensionPath}${/}dist${/}index.js"],
      "cwd": "${extensionPath}",
      "env": {
        "KCC_REPO_PATH": "${env:KCC_REPO_PATH}",
        "KCC_AUTHOR_NAME": "${env:KCC_AUTHOR_NAME}",
        "KCC_AUTHOR_EMAIL": "${env:KCC_AUTHOR_EMAIL}"
      }
    }
  }
}
```

**Note:** Use `${env:VAR_NAME}` to read from user's environment.

---

## Installation Instructions (for README.md)

```markdown
## Installation

### Prerequisites

1. Install Gemini CLI:
   ```bash
   npm install -g @google/gemini-cli
   ```

2. Get Gemini API Key:
   - Visit: https://makersuite.google.com/app/apikey
   - Create and copy your API key

3. Set environment variables:
   ```bash
   export GOOGLE_API_KEY="your-api-key"
   export KCC_REPO_PATH="/path/to/k8s-config-connector"
   export KCC_AUTHOR_NAME="Your Name"
   export KCC_AUTHOR_EMAIL="you@example.com"
   ```

### Install Extension

```bash
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

### Use It

```bash
npx @google/gemini-cli chat
```

Then ask:
- "Check if ComputeURLMap needs migration"
- "Find the EdgeCacheService resource files"

### Update

```bash
npx @google/gemini-cli extensions update kcc-contributor
```

### Uninstall

```bash
npx @google/gemini-cli extensions uninstall kcc-contributor
```
```

---

## Alternative: GitHub Releases

For more control over versions:

### 1. Tag Releases

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 2. Users Install Specific Version

```bash
# Latest
gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git

# Specific version
gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git#v1.0.0
```

---

## NPM Publishing (Not Recommended, But Possible)

If you still want to publish to NPM:

### 1. Update package.json

```json
{
  "name": "@fcurrie/kcc-mcp-server",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/fcurrie/kcc-mcp-server.git"
  },
  "bin": {
    "kcc-mcp-server": "dist/index.js"
  }
}
```

### 2. Publish

```bash
npm login
npm publish --access public
```

### 3. Users Install

```bash
# Still use git URL for gemini-cli
gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

**Note:** Even with NPM, Gemini CLI extensions install from Git, not NPM.

---

## Comparison

| Method | Install Command | Updates | Version Control | Recommended |
|--------|----------------|---------|-----------------|-------------|
| **Git** | `extensions install <git-url>` | Automatic | Yes | ✅ YES |
| **NPM** | N/A (still needs git) | Manual | Limited | ❌ NO |
| **Local Link** | `extensions link <path>` | Immediate | N/A | 🔧 Dev only |

---

## Recommended Action Plan

1. **Create .gitignore**
   ```bash
   cat > .gitignore << 'EOF'
   node_modules/
   dist/
   .kcc-mcp-config.json
   *.log
   .DS_Store
   EOF
   ```

2. **Update gemini-extension.json** (use env vars)
   ```json
   "env": {
     "KCC_REPO_PATH": "${env:KCC_REPO_PATH}",
     "KCC_AUTHOR_NAME": "${env:KCC_AUTHOR_NAME}",
     "KCC_AUTHOR_EMAIL": "${env:KCC_AUTHOR_EMAIL}"
   }
   ```

3. **Create GitHub repo**
   - Name: `kcc-mcp-server`
   - Public or Private (your choice)
   - Add Apache 2.0 license

4. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: Initial release"
   git remote add origin <github-url>
   git push -u origin main
   ```

5. **Test installation from Git**
   ```bash
   # Uninstall local version
   gemini-cli extensions uninstall kcc-contributor

   # Install from GitHub
   gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
   ```

---

## For Other Users

Once published, users just need:

```bash
# 1. Install gemini-cli
npm install -g @google/gemini-cli

# 2. Set environment
export GOOGLE_API_KEY="..."
export KCC_REPO_PATH="/path/to/k8s-config-connector"
export KCC_AUTHOR_NAME="Your Name"
export KCC_AUTHOR_EMAIL="you@example.com"

# 3. Install extension
gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git

# 4. Use it
gemini-cli chat
```

**Much simpler than manual setup!**

---

## Summary

**✅ Recommended:** Git Repository
- Official gemini-cli extension pattern
- Easy install/update
- Version control
- No NPM publishing needed

**❌ Not Recommended:** NPM Package
- Adds unnecessary complexity
- Still needs Git for installation
- Not the standard pattern

**🔧 Current (Local Link):** Good for development
- Immediate changes reflected
- But only works on your machine
