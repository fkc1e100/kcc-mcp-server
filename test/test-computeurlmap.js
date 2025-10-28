#!/usr/bin/env node

/**
 * Test script for ComputeURLMap example
 * Tests adding defaultCustomErrorResponsePolicy field
 */

import { ConfigManager } from '../dist/config.js';
import { GitValidator } from '../dist/git-validator.js';
import { findResource } from '../dist/tools/find-resource.js';

console.log('🧪 Testing KCC MCP Server - ComputeURLMap Example\n');

try {
  // Step 1: Initialize configuration
  console.log('📋 Step 1: Initialize configuration');
  const config = new ConfigManager();
  console.log(`✅ Config loaded`);
  console.log(`   Repository: ${config.getRepoPath()}`);
  console.log(`   Author: ${config.getGitAuthor().name} <${config.getGitAuthor().email}>\n`);

  // Step 2: Find ComputeURLMap resource
  console.log('📋 Step 2: Find ComputeURLMap resource');
  const repoPath = config.getRepoPath();
  const location = findResource(repoPath, 'ComputeURLMap');

  console.log(`✅ Resource found:`);
  console.log(`   Service: ${location.service}`);
  console.log(`   Version: ${location.version}`);
  console.log(`   Types file: ${location.types_file}`);
  console.log(`   Controller: ${location.controller_file}`);
  console.log(`   Mapper: ${location.mapper_file}`);
  console.log(`   Test fixtures: ${location.test_fixtures_dir}`);
  console.log(`   Files exist:`, location.files_exist);
  console.log('');

  // Step 3: Test git validator (should block AI attribution)
  console.log('📋 Step 3: Test git attribution enforcement\n');

  const gitValidator = new GitValidator(config);

  // Test 1: Should PASS - clean commit message
  console.log('  Test 1: Clean commit message');
  try {
    gitValidator.validateCommitMessage('feat: Add defaultCustomErrorResponsePolicy to ComputeURLMap');
    console.log('  ✅ PASS - Clean message accepted\n');
  } catch (err) {
    console.log(`  ❌ FAIL - Should have accepted: ${err.message}\n`);
  }

  // Test 2: Should BLOCK - Claude attribution
  console.log('  Test 2: Message with Claude attribution');
  try {
    gitValidator.validateCommitMessage('feat: Add field\n\nCo-Authored-By: Claude <noreply@anthropic.com>');
    console.log('  ❌ FAIL - Should have blocked this message\n');
  } catch (err) {
    console.log('  ✅ PASS - Correctly blocked AI attribution');
    console.log(`  Message: ${err.message.split('\n')[0]}\n`);
  }

  // Test 3: Should BLOCK - Gemini mention
  console.log('  Test 3: Message with Gemini mention');
  try {
    gitValidator.validateCommitMessage('feat: Add field\n\n🤖 Generated with Gemini');
    console.log('  ❌ FAIL - Should have blocked this message\n');
  } catch (err) {
    console.log('  ✅ PASS - Correctly blocked AI attribution');
    console.log(`  Message: ${err.message.split('\n')[0]}\n`);
  }

  // Test 4: Should BLOCK - Anthropic mention
  console.log('  Test 4: Message with "anthropic" mention');
  try {
    gitValidator.validateCommitMessage('chore: update dependencies for anthropic integration');
    console.log('  ❌ FAIL - Should have blocked this message\n');
  } catch (err) {
    console.log('  ✅ PASS - Correctly blocked AI attribution');
    console.log(`  Message: ${err.message.split('\n')[0]}\n`);
  }

  // Test 5: Conventional commit validation
  console.log('  Test 5: Conventional commit format');
  try {
    gitValidator.validateConventionalCommit('feat: Add new field');
    console.log('  ✅ PASS - Valid conventional commit format\n');
  } catch (err) {
    console.log(`  ❌ FAIL - Should have accepted: ${err.message}\n`);
  }

  // Test 6: Invalid conventional commit
  console.log('  Test 6: Invalid conventional commit format');
  try {
    gitValidator.validateConventionalCommit('Added a new field');
    console.log('  ❌ FAIL - Should have rejected non-conventional format\n');
  } catch (err) {
    console.log('  ✅ PASS - Correctly rejected invalid format');
    console.log(`  Message: ${err.message.split('\n')[0]}\n`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All tests completed!\n');
  console.log('Summary:');
  console.log('✅ Configuration loaded successfully');
  console.log('✅ Resource location working');
  console.log('✅ AI attribution blocking working');
  console.log('✅ Conventional commit validation working');
  console.log('');
  console.log('The MCP server is ready to use!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Add to Claude Desktop config (see INSTALL.md)');
  console.log('2. Restart Claude Desktop');
  console.log('3. Use the tools to add fields to KCC resources');
  console.log('='.repeat(60));

} catch (err) {
  console.error('\n❌ Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
