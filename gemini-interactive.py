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
    print("Get your key from: https://makersuite.google.com/app/apikey")
    print("Then run: export GOOGLE_API_KEY='your-api-key'")
    sys.exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

print("╔════════════════════════════════════════════════════════════════╗")
print("║         Gemini + KCC MCP Server Interactive Shell             ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()
print("Available commands:")
print("  - Natural language: 'Check if ComputeURLMap needs migration'")
print("  - Direct tool calls: 'kcc_find_resource EdgeCacheService'")
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
   Example: {"resource": "EdgeCacheService"}

2. kcc_detect_controller_type - Check if resource is Terraform or direct
   Example: {"resource": "ComputeURLMap"}

3. kcc_migration_status - Get migration progress (7 phases)
   Example: {"resource": "ComputeURLMap"}

4. kcc_plan_migration - Create detailed migration plan
   Example: {"resource": "ComputeURLMap"}

5. kcc_git_status - Show git status
   Example: {}

Example prompts:
- "Check if ComputeURLMap needs migration"
- "Find the EdgeCacheService files"
- "What's the migration status for ComputeURLMap?"
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

If this request needs a tool, respond ONLY with:
TOOL: <tool_name>
PARAMS: <json_params>

Otherwise, provide helpful guidance about what tool to use."""

        response = model.generate_content(prompt)
        print(f"\nGemini: {response.text}\n")

        # Check if Gemini suggested a tool call
        if "TOOL:" in response.text and "PARAMS:" in response.text:
            # Extract tool name and params
            lines = response.text.split('\n')
            tool_name = None
            params_str = None

            for line in lines:
                if line.startswith("TOOL:"):
                    tool_name = line.replace("TOOL:", "").strip()
                elif line.startswith("PARAMS:"):
                    params_str = line.replace("PARAMS:", "").strip()

            if tool_name and params_str:
                try:
                    params = json.loads(params_str)
                    print(f"📞 Calling {tool_name}...")
                    result = call_mcp_tool(tool_name, params)

                    # Try to format JSON results
                    try:
                        result_json = json.loads(result)
                        print(f"\n📊 Result:")
                        print(json.dumps(result_json, indent=2))
                    except:
                        print(f"\n📊 Result:\n{result}")
                    print()
                except Exception as e:
                    print(f"❌ Error calling tool: {e}\n")

    except KeyboardInterrupt:
        print("\n\nInterrupted. Shutting down...")
        break
    except Exception as e:
        print(f"❌ Error: {e}")

# Cleanup
mcp_process.terminate()
print("Goodbye!")
