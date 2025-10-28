# Publishing to Private Git Repository

## ✅ Private Repo Works Great!

**Benefits:**
- Internal tool for Google/k8s-config-connector work
- Not exposed publicly
- Still easy to install with authentication

---

## Step 1: Create Private GitHub Repo

### On GitHub:

1. Go to: https://github.com/new
2. Settings:
   - **Name:** `kcc-mcp-server`
   - **Description:** "MCP server for k8s-config-connector contributions (internal)"
   - **Visibility:** ⭐ **Private**
   - **Don't initialize** with README

3. Click "Create repository"

---

## Step 2: Push Code

```bash
cd /home/fcurrie/Projects/kcc-mcp-server

# Initialize git (if not already)
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: Initial release of KCC MCP Server

- 12 MCP tools for k8s-config-connector contributions
- Resource detection and migration tools
- Field addition capabilities
- AI attribution blocking
- Gemini CLI extension support"

# Add your private GitHub remote
git remote add origin https://github.com/fcurrie/kcc-mcp-server.git

# Push to GitHub
git push -u origin main
```

---

## Step 3: Installation from Private Repo

### Option A: Using GitHub Personal Access Token (Recommended)

#### Create Token (One Time):

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Gemini CLI - KCC MCP Server"
4. Scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

#### Install Extension:

```bash
# Set your token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxx"

# Install (Gemini CLI will use GITHUB_TOKEN automatically)
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

Or install with token in URL:

```bash
npx @google/gemini-cli extensions install https://${GITHUB_TOKEN}@github.com/fcurrie/kcc-mcp-server.git
```

### Option B: Using SSH (If You Have SSH Key Set Up)

```bash
# Install via SSH
npx @google/gemini-cli extensions install git@github.com:fcurrie/kcc-mcp-server.git
```

**Note:** This requires your SSH key to be added to GitHub.

---

## Step 4: Verify Installation

```bash
# Check it's installed
npx @google/gemini-cli extensions list

# Should show:
# ✓ kcc-contributor (1.0.0)
#  Source: https://github.com/fcurrie/kcc-mcp-server.git (Type: git)
```

---

## For Other Team Members

### One-Time Setup:

1. **Get GitHub Personal Access Token:**
   ```bash
   # Ask admin for repo access, then:
   # Create token at: https://github.com/settings/tokens
   # Scope: repo (private repositories)

   export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxx"

   # Add to ~/.bashrc for permanence
   echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxx"' >> ~/.bashrc
   ```

2. **Set KCC Environment:**
   ```bash
   export GOOGLE_API_KEY="your-gemini-key"
   export KCC_REPO_PATH="/path/to/k8s-config-connector"
   export KCC_AUTHOR_NAME="Your Name"
   export KCC_AUTHOR_EMAIL="you@google.com"

   # Add to ~/.bashrc
   echo 'export KCC_REPO_PATH="/path/to/k8s-config-connector"' >> ~/.bashrc
   echo 'export KCC_AUTHOR_NAME="Your Name"' >> ~/.bashrc
   echo 'export KCC_AUTHOR_EMAIL="you@google.com"' >> ~/.bashrc
   ```

### Install Extension:

```bash
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

### Use It:

```bash
npx @google/gemini-cli chat

# Try:
"Check if ComputeURLMap needs migration"
```

---

## Updating the Extension

### You (as maintainer):

```bash
cd /home/fcurrie/Projects/kcc-mcp-server

# Make changes
npm run build

# Commit and push
git add .
git commit -m "feat: Add new feature X"
git push

# Tag releases (optional but recommended)
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### Team members:

```bash
# Update to latest
npx @google/gemini-cli extensions update kcc-contributor
```

---

## Managing Access

### Add Team Members:

1. Go to: https://github.com/fcurrie/kcc-mcp-server/settings/access
2. Click "Add people"
3. Enter GitHub username
4. Select role:
   - **Read** - Can install and use
   - **Write** - Can also contribute
   - **Admin** - Full control

### Or Create Team:

1. If this is for a Google org, create a team
2. Add the team to the repo
3. Team members automatically get access

---

## Security Considerations

### ✅ Good Practices:

1. **Use Personal Access Tokens (PAT):**
   - Scoped to specific repos
   - Can be revoked anytime
   - Don't commit tokens to code

2. **Rotate Tokens Periodically:**
   - Create new token
   - Update `GITHUB_TOKEN` environment variable
   - Revoke old token

3. **Use SSH for Dev Work:**
   - More secure than HTTPS
   - No need to manage tokens for daily work

### ❌ Don't:

- Don't commit `GITHUB_TOKEN` to files
- Don't share tokens between people
- Don't use tokens with excessive permissions

---

## Alternative: Google-Internal Hosting

If this is for Google-internal use only, consider:

### Option 1: Google Cloud Source Repositories

```bash
# Create repo in Cloud Source Repositories
gcloud source repos create kcc-mcp-server

# Push to it
git remote add google https://source.developers.google.com/p/YOUR_PROJECT/r/kcc-mcp-server
git push google main

# Install (with Google Cloud auth)
gcloud auth application-default login
gemini-cli extensions install https://source.developers.google.com/p/YOUR_PROJECT/r/kcc-mcp-server
```

### Option 2: Internal GitHub Enterprise

If your org has GitHub Enterprise:

```bash
# Install from internal GitHub
gemini-cli extensions install https://github.internal.google.com/team/kcc-mcp-server.git
```

---

## Testing Private Repo Install

### Step 1: Uninstall Current (Local) Version

```bash
npx @google/gemini-cli extensions uninstall kcc-contributor
```

### Step 2: Set GitHub Token

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxx"
```

### Step 3: Install from Private Repo

```bash
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

### Step 4: Verify

```bash
# Check installation
npx @google/gemini-cli extensions list

# Test functionality
npx @google/gemini-cli chat
# Try: "Find the EdgeCacheService files"
```

---

## Troubleshooting Private Repos

### Issue: "Authentication failed"

**Solution:** Check your token:

```bash
# Verify token is set
echo $GITHUB_TOKEN

# Test token with GitHub API
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Should return your user info
```

### Issue: "Repository not found"

**Solutions:**
1. Verify repo URL is correct
2. Check you have access to the repo
3. Ensure token has `repo` scope

### Issue: "Permission denied (publickey)"

**Solution (for SSH):**
```bash
# Check SSH key
ssh -T git@github.com

# Should say: "Hi username! You've successfully authenticated"

# If not, add SSH key:
ssh-keygen -t ed25519 -C "you@google.com"
cat ~/.ssh/id_ed25519.pub
# Add to: https://github.com/settings/keys
```

---

## Documentation for Team

### In Your README.md:

```markdown
## Installation (Private Repository)

### Prerequisites

1. **GitHub Access:**
   - Request access to the private repo from @fcurrie
   - Create Personal Access Token: https://github.com/settings/tokens
     - Scope: `repo` (private repositories)
   - Set token: `export GITHUB_TOKEN="ghp_xxxxx"`

2. **Gemini API Key:**
   - Get from: https://makersuite.google.com/app/apikey
   - Set it: `export GOOGLE_API_KEY="your-key"`

3. **Environment:**
   ```bash
   export KCC_REPO_PATH="/path/to/k8s-config-connector"
   export KCC_AUTHOR_NAME="Your Name"
   export KCC_AUTHOR_EMAIL="you@google.com"
   ```

### Install

```bash
npx @google/gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

### Use

```bash
npx @google/gemini-cli chat
```

Try: "Check if ComputeURLMap needs migration"
```

---

## Summary

✅ **Private Repo Works Great!**

**Setup:**
1. Create private GitHub repo
2. Push code
3. Create Personal Access Token
4. Install with authentication

**Install Command:**
```bash
export GITHUB_TOKEN="ghp_xxxxx"
gemini-cli extensions install https://github.com/fcurrie/kcc-mcp-server.git
```

**Benefits:**
- ✅ Internal tool
- ✅ Access control
- ✅ Still easy to install
- ✅ Team collaboration

**Next:** Run the commands in "Step 2: Push Code" above!
