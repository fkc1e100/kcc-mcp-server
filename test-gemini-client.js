#!/usr/bin/env node

/**
 * Simple test client for KCC MCP Server
 * Simulates how Gemini or other AI clients would interact with the server
 */

import { spawn } from 'child_process';

// Start the MCP server
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║       Testing KCC MCP Server (Gemini Client Simulation)       ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

const server = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    KCC_REPO_PATH: '/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector',
    KCC_AUTHOR_NAME: 'Frank Currie',
    KCC_AUTHOR_EMAIL: 'fcurrie@google.com'
  }
});

let messageId = 1;
let buffer = '';

// Track server initialization
let serverReady = false;

// Handle server responses
server.stdout.on('data', (data) => {
  buffer += data.toString();

  // Process complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.result || response.error) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          if (response.result && response.result.content) {
            const content = response.result.content[0];
            if (content.type === 'text') {
              try {
                // Try to parse as JSON for pretty printing
                const parsed = JSON.parse(content.text);
                console.log(JSON.stringify(parsed, null, 2));
              } catch {
                // Not JSON, print as-is
                console.log(content.text);
              }
            }
          } else if (response.error) {
            console.error('❌ Error:', response.error.message);
          } else if (response.result) {
            console.log(JSON.stringify(response.result, null, 2));
          }
          console.log();
        }
      } catch (err) {
        // Not JSON, might be server log
        if (!line.includes('✅') && !line.includes('📁') && !line.includes('👤') && !line.includes('🚀')) {
          console.error('Parse error:', line);
        }
      }
    }
  }
});

server.stderr.on('data', (data) => {
  const message = data.toString();
  // Only show non-initialization messages
  if (message.includes('KCC MCP Server running')) {
    serverReady = true;
  }
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

// Wait for server to initialize, then run tests
setTimeout(() => {
  console.log('Initializing MCP connection...');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: 'gemini-test-client',
      version: '1.0.0'
    }
  });
}, 500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 1: List Available Tools');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/list');
}, 1500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 2: Find EdgeCacheService (Direct Controller)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/call', {
    name: 'kcc_find_resource',
    arguments: {
      resource: 'EdgeCacheService'
    }
  });
}, 2500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 3: Detect ComputeURLMap Controller Type');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/call', {
    name: 'kcc_detect_controller_type',
    arguments: {
      resource: 'ComputeURLMap'
    }
  });
}, 3500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 4: Get Migration Status for ComputeURLMap');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/call', {
    name: 'kcc_migration_status',
    arguments: {
      resource: 'ComputeURLMap'
    }
  });
}, 4500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 5: Get Git Status');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/call', {
    name: 'kcc_git_status',
    arguments: {}
  });
}, 5500);

setTimeout(() => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test 6: Plan Migration for ComputeURLMap');
  console.log('═══════════════════════════════════════════════════════════════\n');
  sendRequest('tools/call', {
    name: 'kcc_plan_migration',
    arguments: {
      resource: 'ComputeURLMap'
    }
  });
}, 6500);

// Cleanup
setTimeout(() => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    All Tests Complete!                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Next Steps:');
  console.log('  1. Use MCP Inspector for visual testing:');
  console.log('     ./start-inspector.sh');
  console.log();
  console.log('  2. Use with Claude Desktop:');
  console.log('     See README.md for configuration');
  console.log();
  console.log('  3. Use with Gemini:');
  console.log('     See GEMINI_CLI_SETUP.md for configuration');
  console.log();

  server.stdin.end();
  setTimeout(() => process.exit(0), 500);
}, 8000);
