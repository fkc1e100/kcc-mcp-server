# Step-by-Step Walkthrough: Testing with Gemini

Follow these steps in order to test the KCC MCP Server with Gemini.

---

## ✅ Step 1: Prerequisites (DONE!)

- ✅ MCP Server built (`npm run build`)
- ✅ MCP Inspector installed
- ✅ Environment configured

---

## 🎨 Step 2: Test with MCP Inspector (Visual UI)

This gives you a web interface to test all tools interactively.

### Launch the Inspector

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
./start-inspector.sh
```

**OR manually:**

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
export KCC_REPO_PATH="/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector"
export KCC_AUTHOR_NAME="Frank Currie"
export KCC_AUTHOR_EMAIL="fcurrie@google.com"
npx @modelcontextprotocol/inspector node dist/index.js
```

### What You'll See

1. **Terminal output:**
   ```
   ✅ KCC MCP Server initialized
   📁 Repository: /home/fcurrie/Projects/kcc-resource-add/k8s-config-connector
   👤 Author: Frank Currie <fcurrie@google.com>
   🚀 KCC MCP Server running

   MCP Inspector running at http://localhost:5173
   ```

2. **Web browser will open** showing:
   - List of all 12 tools on the left
   - Parameters panel in the middle
   - Results panel on the right

### Try These Tests in the Inspector

Click on each tool and fill in the parameters:

#### Test 1: Find EdgeCacheService
- Tool: `kcc_find_resource`
- Parameters: `{"resource": "EdgeCacheService"}`
- Expected: Shows file paths for types, controller, mapper

#### Test 2: Detect ComputeURLMap Type
- Tool: `kcc_detect_controller_type`
- Parameters: `{"resource": "ComputeURLMap"}`
- Expected: Shows `"type": "terraform"`, `"migration_needed": true`

#### Test 3: Get Migration Status
- Tool: `kcc_migration_status`
- Parameters: `{"resource": "ComputeURLMap"}`
- Expected: Shows `"overall_progress": "2/7 phases"`

#### Test 4: Check Git Status
- Tool: `kcc_git_status`
- Parameters: `{}`
- Expected: Shows current git status

---

## 🔧 Step 3: Test with Command Line (Already Working!)

We already tested this - it works perfectly:

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
node test-gemini-client.js
```

This runs all 6 tests automatically and shows JSON output.

---

## 🤖 Step 4: Integrate with Gemini API

Now let's connect this to Gemini so you can use natural language.

### Option A: Use Claude Desktop (Works Now!)

Claude Desktop has native MCP support. Configure it and use Claude to interact with the tools:

1. **Edit Claude Desktop config:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration:**
   ```json
   {
     "mcpServers": {
       "kcc-contributor": {
         "command": "node",
         "args": ["/home/fcurrie/Projects/kcc-mcp-server/dist/index.js"],
         "env": {
           "KCC_REPO_PATH": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector",
           "KCC_AUTHOR_NAME": "Frank Currie",
           "KCC_AUTHOR_EMAIL": "fcurrie@google.com"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Test with natural language:**
   ```
   "Check if ComputeURLMap needs migration to direct controller"
   "Find the EdgeCacheService resource files"
   "What's the migration status for ComputeURLMap?"
   ```

### Option B: Use Gemini API Directly

This requires a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

#### Step 4a: Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### Step 4b: Set Up Environment

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

Or add to `~/.bashrc`:
```bash
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

#### Step 4c: Install Gemini Python Client

```bash
pip install google-generativeai
```

#### Step 4d: Create the Bridge Script

Create `gemini-interactive.py`:

```python
#!/usr/bin/env python3

import os
import json
import subprocess
import sys
from google import generativeai as genai

# Configure Gemini
api_key = os.environ.get('GOOGLE_API_KEY')
if not api_key:
    print("❌ Error: GOOGLE_API_KEY not set")
    print("Run: export GOOGLE_API_KEY='your-api-key'")
    sys.exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

print("╔════════════════════════════════════════════════════════════════╗")
print("║         Gemini + KCC MCP Server Interactive Shell             ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()
print("Available commands:")
print("  - Natural language requests (e.g., 'Check if ComputeURLMap needs migration')")
print("  - Direct tool calls (e.g., 'kcc_find_resource EdgeCacheService')")
print("  - Type 'quit' or 'exit' to exit")
print()

# Start MCP server
mcp_process = subprocess.Popen(
    ['node', 'dist/index.js'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    cwd='/home/fcurrie/Projects/kcc-mcp-server',
    env={
        **os.environ,
        'KCC_REPO_PATH': '/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector',
        'KCC_AUTHOR_NAME': 'Frank Currie',
        'KCC_AUTHOR_EMAIL': 'fcurrie@google.com'
    }
)

# Initialize MCP connection
init_request = {
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'initialize',
    'params': {
        'protocolVersion': '2024-11-05',
        'capabilities': {},
        'clientInfo': {'name': 'gemini-bridge', 'version': '1.0.0'}
    }
}
mcp_process.stdin.write(json.dumps(init_request) + '\n')
mcp_process.stdin.flush()
init_response = mcp_process.stdout.readline()

print("✅ MCP Server connected")
print()

# Tool descriptions for Gemini
TOOLS = """
Available KCC MCP Tools:

1. kcc_find_resource - Find resource files (types, controller, mapper)
2. kcc_detect_controller_type - Check if resource is Terraform or direct
3. kcc_migration_status - Get migration progress (7 phases)
4. kcc_plan_migration - Create detailed migration plan
5. kcc_scaffold_types - Generate API types file
6. kcc_scaffold_identity - Generate identity handler
7. kcc_scaffold_controller - Generate controller
8. kcc_scaffold_mockgcp - Generate MockGCP server
9. kcc_add_field - Add field to existing direct controller
10. kcc_generate_mapper - Regenerate proto mappers
11. kcc_git_commit - Create commit (blocks AI attribution)
12. kcc_git_status - Show git status

Example prompts:
- "Check if ComputeURLMap needs migration"
- "Find the EdgeCacheService files"
- "What's the migration status for ComputeURLMap?"
- "Create a migration plan for ComputeURLMap"
"""

def call_mcp_tool(tool_name, arguments):
    """Call an MCP tool and return the result."""
    request = {
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'tools/call',
        'params': {
            'name': tool_name,
            'arguments': arguments
        }
    }

    mcp_process.stdin.write(json.dumps(request) + '\n')
    mcp_process.stdin.flush()

    response_line = mcp_process.stdout.readline()
    response = json.loads(response_line)

    if 'result' in response and 'content' in response['result']:
        return response['result']['content'][0]['text']
    elif 'error' in response:
        return f"Error: {response['error']['message']}"
    return str(response)

# Interactive loop
while True:
    try:
        user_input = input("You: ")
        if user_input.lower() in ['quit', 'exit']:
            print("\nShutting down...")
            break

        if not user_input.strip():
            continue

        # Send to Gemini with tool context
        prompt = f"""{TOOLS}

User request: {user_input}

If this is a tool-related request, tell me which tool to call and what parameters to use.
Format: TOOL: tool_name | PARAMS: {{params}}

Otherwise, provide helpful guidance."""

        response = model.generate_content(prompt)
        print(f"\nGemini: {response.text}\n")

        # Check if Gemini suggested a tool call
        if "TOOL:" in response.text and "PARAMS:" in response.text:
            # Extract tool name and params (simple parsing)
            parts = response.text.split("TOOL:")[1].split("PARAMS:")
            tool_name = parts[0].strip().split()[0]
            params_str = parts[1].strip()

            # Try to parse params
            try:
                params = json.loads(params_str)
                print(f"Calling {tool_name}...")
                result = call_mcp_tool(tool_name, params)
                print(f"\nResult:\n{result}\n")
            except Exception as e:
                print(f"Could not parse tool call: {e}")

    except KeyboardInterrupt:
        print("\n\nInterrupted. Shutting down...")
        break
    except Exception as e:
        print(f"Error: {e}")

# Cleanup
mcp_process.terminate()
print("Goodbye!")
```

#### Step 4e: Run the Interactive Shell

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
chmod +x gemini-interactive.py
python3 gemini-interactive.py
```

#### Step 4f: Try These Prompts

```
You: Check if ComputeURLMap needs migration

You: Find the EdgeCacheService resource files

You: What's the migration status for ComputeURLMap?

You: Create a migration plan for ComputeURLMap
```

---

## 📊 Summary of Options

| Method | Difficulty | Use Case |
|--------|-----------|----------|
| **MCP Inspector** | ⭐ Easy | Visual testing, debugging |
| **Command-Line Test** | ⭐ Easy | Quick validation |
| **Claude Desktop** | ⭐⭐ Medium | Natural language, works now |
| **Gemini API** | ⭐⭐⭐ Advanced | Full Gemini integration |

---

## 🎯 Recommended Path

1. **Start with MCP Inspector** (visual, easiest)
   ```bash
   ./start-inspector.sh
   ```

2. **Then try Claude Desktop** (if you have it installed)
   - Native MCP support
   - Works immediately

3. **Finally, Gemini API** (for full Gemini integration)
   - Requires API key
   - More setup, but full natural language

---

## ✅ What's Working Now

- ✅ All 12 MCP tools functional
- ✅ Command-line test working
- ✅ MCP Inspector installed
- ✅ Ready for Gemini integration

---

## 🆘 Need Help?

- MCP Inspector not opening? Check http://localhost:5173 manually
- Git errors? Check KCC_REPO_PATH is correct
- Tool errors? Run `node test-gemini-client.js` to verify

---

**Next:** Run `./start-inspector.sh` to see the visual UI!
