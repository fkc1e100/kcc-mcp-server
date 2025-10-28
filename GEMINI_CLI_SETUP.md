# Testing KCC MCP Server with Gemini CLI

This guide shows how to test the KCC MCP server with Google's Gemini using the gemini-cli client.

## Prerequisites

1. **Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Node.js** - The MCP server is built with Node.js
3. **Built MCP Server** - Run `npm run build` in the kcc-mcp-server directory

## Option 1: Using Google AI CLI (Recommended)

Google's AI CLI supports MCP servers. Here's how to set it up:

### 1. Install Google AI CLI

```bash
# Using npm
npm install -g @google/generative-ai-cli

# Or using pip (if you prefer Python)
pip install google-generativeai
```

### 2. Configure API Key

```bash
# Set your Gemini API key
export GOOGLE_API_KEY="your-api-key-here"

# Or add to ~/.bashrc or ~/.zshrc
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.bashrc
```

### 3. Create MCP Configuration

Create `~/.config/google-ai/mcp-config.json`:

```json
{
  "mcpServers": {
    "kcc-contributor": {
      "command": "node",
      "args": [
        "/home/fcurrie/Projects/kcc-mcp-server/dist/index.js"
      ],
      "env": {
        "KCC_REPO_PATH": "/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector",
        "KCC_AUTHOR_NAME": "Frank Currie",
        "KCC_AUTHOR_EMAIL": "fcurrie@google.com"
      }
    }
  }
}
```

### 4. Test the MCP Server

Start an interactive session:

```bash
google-ai chat --mcp
```

Then try these commands:

```
# Test 1: Find a resource
> Use kcc_find_resource to find the EdgeCacheService resource

# Test 2: Detect controller type
> Use kcc_detect_controller_type to check if ComputeURLMap is a direct controller

# Test 3: Get migration status
> Use kcc_migration_status to check ComputeURLMap migration progress

# Test 4: Plan migration
> Use kcc_plan_migration to create a migration plan for ComputeURLMap

# Test 5: Check git status
> Use kcc_git_status to see the current git status
```

## Option 2: Direct MCP Protocol Testing (Advanced)

If Google AI CLI doesn't support MCP yet, you can test the MCP server directly using the stdio protocol:

### 1. Create a Test Script

Create `test-mcp-stdio.js`:

```javascript
#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    KCC_REPO_PATH: '/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector',
    KCC_AUTHOR_NAME: 'Frank Currie',
    KCC_AUTHOR_EMAIL: 'fcurrie@google.com'
  }
});

let messageId = 1;

// Handle server responses
server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server log:', data.toString());
});

// Helper to send MCP requests
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Initialize
setTimeout(() => {
  console.log('Initializing MCP connection...');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
}, 1000);

// List tools
setTimeout(() => {
  console.log('\nListing available tools...');
  sendRequest('tools/list');
}, 2000);

// Test: Find resource
setTimeout(() => {
  console.log('\nTesting kcc_find_resource...');
  sendRequest('tools/call', {
    name: 'kcc_find_resource',
    arguments: {
      resource: 'EdgeCacheService'
    }
  });
}, 3000);

// Test: Detect controller type
setTimeout(() => {
  console.log('\nTesting kcc_detect_controller_type...');
  sendRequest('tools/call', {
    name: 'kcc_detect_controller_type',
    arguments: {
      resource: 'ComputeURLMap'
    }
  });
}, 4000);

// Test: Migration status
setTimeout(() => {
  console.log('\nTesting kcc_migration_status...');
  sendRequest('tools/call', {
    name: 'kcc_migration_status',
    arguments: {
      resource: 'ComputeURLMap'
    }
  });
}, 5000);

// Cleanup
setTimeout(() => {
  console.log('\nShutting down...');
  server.stdin.end();
  process.exit(0);
}, 6000);
```

### 2. Run the Test

```bash
cd /home/fcurrie/Projects/kcc-mcp-server
node test-mcp-stdio.js
```

## Option 3: Using MCP Inspector (Visual Testing)

The MCP Inspector provides a visual UI for testing MCP servers:

### 1. Install MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
```

### 2. Start the Inspector

```bash
mcp-inspector node dist/index.js
```

This will:
- Start the MCP server
- Open a web UI (usually http://localhost:5173)
- Let you interactively test all 12 tools

### 3. Test in the Web UI

The inspector shows:
- Available tools (all 12)
- Tool parameters
- Request/response JSON
- Error messages

## Option 4: Simple Command-Line Test

Create a simple test without needing Gemini:

### 1. Create Test File

Create `test-tools.sh`:

```bash
#!/bin/bash

cd /home/fcurrie/Projects/kcc-mcp-server

echo "=== Testing KCC MCP Server Tools ==="
echo ""

# Test 1: Find resource
echo "Test 1: Find EdgeCacheService"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kcc_find_resource","arguments":{"resource":"EdgeCacheService"}}}' | node dist/index.js
echo ""

# Test 2: Detect controller type
echo "Test 2: Detect ComputeURLMap controller type"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"kcc_detect_controller_type","arguments":{"resource":"ComputeURLMap"}}}' | node dist/index.js
echo ""

# Test 3: Git status
echo "Test 3: Check git status"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"kcc_git_status","arguments":{}}}' | node dist/index.js
echo ""
```

### 2. Run Tests

```bash
chmod +x test-tools.sh
./test-tools.sh
```

## Recommended Approach for Your Use Case

For using with Gemini 2.5 Pro, I recommend:

### 1. Use Gemini with LangChain + MCP Bridge

Create `gemini-mcp-bridge.py`:

```python
#!/usr/bin/env python3

import os
import json
import subprocess
from google import generativeai as genai

# Configure Gemini
genai.configure(api_key=os.environ['GOOGLE_API_KEY'])
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# MCP Server process
mcp_server = subprocess.Popen(
    ['node', 'dist/index.js'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    env={
        **os.environ,
        'KCC_REPO_PATH': '/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector',
        'KCC_AUTHOR_NAME': 'Frank Currie',
        'KCC_AUTHOR_EMAIL': 'fcurrie@google.com'
    }
)

def call_mcp_tool(tool_name, arguments):
    """Call an MCP tool and return the result."""
    request = {
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'tools/call',
        'params': {
            'name': tool_name,
            'arguments': arguments
        }
    }

    mcp_server.stdin.write(json.dumps(request) + '\n')
    mcp_server.stdin.flush()

    response = mcp_server.stdout.readline()
    return json.loads(response)

# Example: Use Gemini with MCP tools
def main():
    # Get list of available tools
    tools = [
        "kcc_find_resource",
        "kcc_detect_controller_type",
        "kcc_migration_status",
        "kcc_plan_migration",
        "kcc_add_field",
        "kcc_generate_mapper",
        "kcc_git_commit",
        "kcc_git_status"
    ]

    print("Available MCP tools:", ", ".join(tools))
    print("\nYou can now interact with Gemini and it will use the MCP tools.")
    print("\nExample prompts:")
    print("- Check if ComputeURLMap needs migration")
    print("- Find the EdgeCacheService resource files")
    print("- Create a migration plan for ComputeURLMap")
    print()

    # Interactive loop
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit']:
            break

        # Send to Gemini
        response = model.generate_content(
            f"You have access to these KCC MCP tools: {', '.join(tools)}. "
            f"User request: {user_input}"
        )

        print(f"\nGemini: {response.text}\n")

        # TODO: Parse Gemini's response for tool calls and execute them

if __name__ == '__main__':
    main()
```

### 2. Install Python Dependencies

```bash
pip install google-generativeai
```

### 3. Set API Key and Run

```bash
export GOOGLE_API_KEY="your-api-key"
cd /home/fcurrie/Projects/kcc-mcp-server
python3 gemini-mcp-bridge.py
```

## Testing Checklist

- [ ] MCP server builds successfully (`npm run build`)
- [ ] Environment variables configured (KCC_REPO_PATH, etc.)
- [ ] Test basic tool: `kcc_find_resource`
- [ ] Test migration detection: `kcc_detect_controller_type`
- [ ] Test migration status: `kcc_migration_status`
- [ ] Test scaffolding: `kcc_scaffold_types`
- [ ] Test git operations: `kcc_git_status`
- [ ] Test AI attribution blocking: `kcc_git_commit` with banned terms

## Troubleshooting

### Issue: "MCP server not responding"
**Solution:** Check that the server is running:
```bash
node dist/index.js
# Should output: 🚀 KCC MCP Server running
```

### Issue: "Tool not found"
**Solution:** List available tools:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Issue: "Repository not found"
**Solution:** Verify KCC_REPO_PATH is set correctly:
```bash
echo $KCC_REPO_PATH
ls $KCC_REPO_PATH/apis/
```

### Issue: "Git commit blocked"
**Solution:** This is expected! The server blocks AI attribution. Make sure your commit message doesn't contain:
- claude, anthropic, gemini, openai
- Co-Authored-By lines with AI emails

## Next Steps

1. Choose your testing method (MCP Inspector recommended for visual testing)
2. Test each tool individually
3. Try the complete workflows from README.md
4. Use with Gemini for actual k8s-config-connector contributions

## Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Google Gemini API](https://ai.google.dev/)
- [k8s-config-connector Docs](https://github.com/GoogleCloudPlatform/k8s-config-connector/tree/master/docs)
