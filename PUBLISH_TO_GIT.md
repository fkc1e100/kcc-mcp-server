# Publishing to Git Repository - Quick Guide

## ✅ Preparation Complete!

Files ready for Git:
- ✅ `.gitignore` created (excludes node_modules, dist, etc.)
- ✅ `gemini-extension.json` updated (uses environment variables)
- ✅ All documentation included
- ✅ Tests and examples included

---

## Step-by-Step Publishing

### 1. Create GitHub Repository

Go to: https://github.com/new

Settings:
- **Name:** `kcc-mcp-server`
- **Description:** "MCP server for k8s-config-connector contributions with Gemini CLI"
- **Public or Private:** Your choice
- **Don't initialize** with README (we have one)

### 2. Initialize and Push

```bash
cd /home/fcurrie/Projects/kcc-mcp-server

# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: Initial release of KCC MCP Server

- 12 MCP tools for k8s-config-connector contributions
- Resource detection (find, detect type, migration status)
- Migration tools (plan, scaffold types/identity/controller/mockgcp)
- Field addition tools (add field, generate mapper)
- Git operations (commit with AI attribution blocking, status)
- Gemini CLI extension support
- Complete documentation and examples
- Test suite included"

# Add your GitHub remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/kcc-mcp-server.git

# Push to GitHub
git push -u origin main
```

### 3. Test Installation from Git

```bash
# Uninstall local version
npx @google/gemini-cli extensions uninstall kcc-contributor

# Install from your GitHub repo
npx @google/gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git

# Verify it works
npx @google/gemini-cli extensions list
```

---

## For Other Users (Installation Instructions)

Add this to your README.md:

```markdown
## Installation

### Prerequisites

1. **Gemini CLI:**
   ```bash
   npm install -g @google/gemini-cli
   ```

2. **Gemini API Key:**
   - Get from: https://makersuite.google.com/app/apikey
   - Set it: `export GOOGLE_API_KEY="your-key"`

3. **Environment Variables:**
   ```bash
   export KCC_REPO_PATH="/path/to/k8s-config-connector"
   export KCC_AUTHOR_NAME="Your Name"
   export KCC_AUTHOR_EMAIL="you@example.com"
   ```

   Or add to `~/.bashrc`:
   ```bash
   echo 'export KCC_REPO_PATH="/path/to/k8s-config-connector"' >> ~/.bashrc
   echo 'export KCC_AUTHOR_NAME="Your Name"' >> ~/.bashrc
   echo 'export KCC_AUTHOR_EMAIL="you@example.com"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Install Extension

```bash
npx @google/gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git
```

### Use It

```bash
npx @google/gemini-cli chat
```

Try these prompts:
- "Check if ComputeURLMap needs migration"
- "Find the EdgeCacheService resource files"
- "What's the migration status for ComputeURLMap?"

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

## Optional: GitHub Releases

For versioned releases:

### Create a Release

```bash
# Tag the version
git tag -a v1.0.0 -m "Release v1.0.0

First stable release with:
- 12 MCP tools
- Field addition support
- Migration workflow
- AI attribution blocking
- Gemini CLI integration"

# Push the tag
git push origin v1.0.0
```

### On GitHub

1. Go to: https://github.com/YOUR_USERNAME/kcc-mcp-server/releases
2. Click "Create a new release"
3. Select tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from tag message
6. Click "Publish release"

### Users Can Install Specific Version

```bash
# Latest
gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git

# Specific version
gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git#v1.0.0
```

---

## File Checklist

Before pushing, make sure these files are included:

### Required
- [x] `package.json` - Dependencies and build config
- [x] `gemini-extension.json` - Extension manifest
- [x] `tsconfig.json` - TypeScript config
- [x] `.gitignore` - Ignore build artifacts
- [x] `README.md` - Main documentation
- [x] `LICENSE` - Apache 2.0 license
- [x] `src/` - All TypeScript source files
- [x] `test/` - Test files

### Documentation (Highly Recommended)
- [x] `START_HERE.md` - Quick start guide
- [x] `GEMINI_CLI_USAGE.md` - Usage examples
- [x] `GEMINI_SETUP_COMPLETE.md` - Setup explanation
- [x] `GIT_REPO_SETUP.md` - This file
- [x] `CHOOSE_YOUR_PATH.md` - Testing options
- [x] `INTEGRATION_COMPLETE.md` - Technical summary

### Optional
- [ ] `CONTRIBUTING.md` - Contribution guidelines
- [ ] `CHANGELOG.md` - Version history
- [ ] `.github/workflows/` - CI/CD
- [ ] Examples directory

---

## Post-Publishing

### Update Documentation

Update any local paths in documentation to use the GitHub URL:

```bash
# Old (local install)
gemini-cli extensions link /home/fcurrie/Projects/kcc-mcp-server

# New (Git install)
gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git
```

### Share With Users

Your users only need to:

1. **Set environment variables** (once):
   ```bash
   export GOOGLE_API_KEY="..."
   export KCC_REPO_PATH="/path/to/k8s-config-connector"
   export KCC_AUTHOR_NAME="..."
   export KCC_AUTHOR_EMAIL="..."
   ```

2. **Install extension** (one command):
   ```bash
   gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git
   ```

3. **Use it**:
   ```bash
   gemini-cli chat
   ```

**Much simpler than the manual setup!**

---

## Updates and Maintenance

### Pushing Updates

```bash
# Make changes
npm run build

# Commit
git add .
git commit -m "feat: Add new feature X"

# Push
git push

# Tag if it's a release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### Users Update

```bash
# Update to latest
gemini-cli extensions update kcc-contributor

# Or update all extensions
gemini-cli extensions update --all
```

---

## Summary

**✅ Recommended: Git Repository**

**Why:**
- Official Gemini CLI pattern
- Easy install/update for users
- Version control built-in
- No NPM publishing needed
- One command installation

**Next Step:**
1. Create GitHub repo
2. Run the commands above
3. Test the install from Git
4. Share with users!

**Installation will be:**
```bash
gemini-cli extensions install https://github.com/YOUR_USERNAME/kcc-mcp-server.git
```

That's it! Much simpler than local setup.
