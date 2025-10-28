# Choose Your Testing Path 🎯

You have **3 options** to test the KCC MCP Server. Pick based on what you want to do:

---

## Option 1: Visual Testing (Easiest - No API Key Needed) 🎨

**Best for:** Seeing what's available, testing individual tools, debugging

### What You Do:

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./start-inspector.sh
```

### What Happens:

1. Terminal shows: `MCP Inspector running at http://localhost:5173`
2. Browser opens automatically
3. You see a web UI with:
   - List of all 12 tools on the left
   - Parameters panel (fill in values)
   - Results panel (see JSON responses)

### Try This:

1. Click `kcc_detect_controller_type`
2. Fill in: `{"resource": "ComputeURLMap"}`
3. Click "Call Tool"
4. See result: `{"type": "terraform", "migration_needed": true}`

**Status:** ✅ Ready to run now!

---

## Option 2: Command-Line Testing (Quick Validation) ⚡

**Best for:** Quick smoke test, CI/CD, scripting

### What You Do:

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
node test-gemini-client.js
```

### What Happens:

- Runs 6 automated tests
- Shows formatted JSON output
- Takes ~8 seconds
- No interaction needed

**Status:** ✅ Already tested this - works great!

---

## Option 3: Gemini Integration (Natural Language) 🤖

**Best for:** Using natural language, full AI assistance, production use

### Setup Steps:

#### 3a. Get Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### 3b. Install Python Package

```bash
pip install google-generativeai
```

#### 3c. Set API Key

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

Or add to ~/.bashrc permanently:

```bash
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

#### 3d. Run Interactive Shell

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
python3 gemini-interactive.py
```

### What Happens:

```
╔════════════════════════════════════════════════════════════════╗
║         Gemini + KCC MCP Server Interactive Shell             ║
╚════════════════════════════════════════════════════════════════╝

✅ MCP Server connected

You: Check if ComputeURLMap needs migration

Gemini: I'll check that for you...
TOOL: kcc_detect_controller_type
PARAMS: {"resource": "ComputeURLMap"}

📞 Calling kcc_detect_controller_type...

📊 Result:
{
  "resource": "ComputeURLMap",
  "type": "terraform",
  "migration_needed": true,
  "service": "compute",
  "version": "v1beta1"
}

You: What's the next step?

Gemini: Based on the result, ComputeURLMap needs migration...
```

**Status:** ⏳ Needs API key + `pip install`

---

## Side-by-Side Comparison

| Feature | Inspector | Command-Line | Gemini |
|---------|-----------|--------------|--------|
| **Setup Time** | 0 minutes | 0 minutes | 5 minutes |
| **API Key?** | ❌ No | ❌ No | ✅ Yes |
| **Visual UI?** | ✅ Yes | ❌ No | ❌ No |
| **Natural Language?** | ❌ No | ❌ No | ✅ Yes |
| **Interactive?** | ✅ Yes | ❌ No | ✅ Yes |
| **Best For** | Debugging | Validation | Production |

---

## My Recommendation

### Start Here (Right Now):

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./start-inspector.sh
```

This lets you:
- See all 12 tools visually
- Test each one interactively
- Understand what's available
- No setup required

### Then (If You Want Natural Language):

1. Get Gemini API key (5 min)
2. `pip install google-generativeai` (30 sec)
3. `export GOOGLE_API_KEY="..."` (10 sec)
4. `python3 gemini-interactive.py` (instant)

---

## Quick Reference Commands

### Visual Testing:
```bash
./start-inspector.sh
```

### Command-Line Testing:
```bash
node test-gemini-client.js
```

### Gemini Integration:
```bash
# Setup (once)
pip install google-generativeai
export GOOGLE_API_KEY="your-key"

# Run
python3 gemini-interactive.py
```

---

## What's Next?

Pick an option and follow the commands above. All 12 tools are working:

✅ kcc_find_resource
✅ kcc_detect_controller_type
✅ kcc_migration_status
✅ kcc_plan_migration
✅ kcc_scaffold_types
✅ kcc_scaffold_identity
✅ kcc_scaffold_controller
✅ kcc_scaffold_mockgcp
✅ kcc_add_field
✅ kcc_generate_mapper
✅ kcc_git_commit
✅ kcc_git_status

**Ready when you are!** 🚀
