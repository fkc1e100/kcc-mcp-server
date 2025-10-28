#!/usr/bin/env node

/**
 * Test migration tools with ComputeURLMap
 */

import { detectControllerType } from '../dist/tools/detect-controller-type.js';
import { planMigration } from '../dist/tools/plan-migration.js';
import { getMigrationStatus } from '../dist/tools/migration-status.js';

const repoPath = process.env.KCC_REPO_PATH || '/home/fcurrie/Projects/kcc-resource-add/k8s-config-connector';

console.log('='.repeat(80));
console.log('Testing Migration Tools with ComputeURLMap');
console.log('='.repeat(80));
console.log();

// Test 1: Detect controller type
console.log('Test 1: Detect Controller Type');
console.log('-'.repeat(80));
try {
  const info = detectControllerType(repoPath, 'ComputeURLMap');
  console.log('  ✅ PASS - Detected controller info:');
  console.log(`     Type: ${info.type}`);
  console.log(`     Migration needed: ${info.migration_needed}`);
  console.log(`     Service: ${info.service || 'N/A'}`);
  console.log(`     Version: ${info.version || 'N/A'}`);
  console.log(`     Terraform file: ${info.terraform_types_file || 'N/A'}`);
  console.log();
} catch (err) {
  console.log('  ❌ FAIL - Error:', err.message);
  console.log();
}

// Test 2: Get migration status
console.log('Test 2: Get Migration Status');
console.log('-'.repeat(80));
try {
  const status = getMigrationStatus(repoPath, 'ComputeURLMap');
  console.log('  ✅ PASS - Migration status:');
  console.log(`     Resource: ${status.resource}`);
  console.log(`     Overall progress: ${status.overall_progress}`);
  console.log(`     Current phase: ${status.current_phase.number} - ${status.current_phase.name}`);
  console.log(`     Phase status: ${status.current_phase.status}`);
  console.log(`     Next action: ${status.next_action}`);
  console.log(`     Can add fields: ${status.can_add_fields}`);
  console.log();
  console.log('  Phase breakdown:');
  status.phases.forEach(phase => {
    const icon = phase.status === 'completed' ? '✓' :
                 phase.status === 'in_progress' ? '◐' : '○';
    console.log(`     ${icon} Phase ${phase.number}: ${phase.name} (${phase.status})`);
    Object.entries(phase.files_exist).forEach(([key, exists]) => {
      console.log(`        ${exists ? '✓' : '✗'} ${key}`);
    });
  });
  console.log();
} catch (err) {
  console.log('  ❌ FAIL - Error:', err.message);
  console.log();
}

// Test 3: Plan migration
console.log('Test 3: Plan Migration');
console.log('-'.repeat(80));
try {
  const plan = planMigration(repoPath, 'ComputeURLMap');
  console.log('  ✅ PASS - Migration plan created:');
  console.log(`     Resource: ${plan.resource}`);
  console.log(`     Service: ${plan.service}`);
  console.log(`     Version: ${plan.version}`);
  console.log(`     Total phases: ${plan.phases.length}`);
  console.log();
  console.log('  Phase summary:');
  plan.phases.forEach(phase => {
    console.log(`     Phase ${phase.phase}: ${phase.name}`);
    console.log(`        Tasks: ${phase.tasks.length}`);
    phase.tasks.slice(0, 2).forEach(task => {
      console.log(`        - ${task}`);
    });
    if (phase.tasks.length > 2) {
      console.log(`        ... ${phase.tasks.length - 2} more tasks`);
    }
  });
  console.log();
} catch (err) {
  console.log('  ❌ FAIL - Error:', err.message);
  console.log();
}

// Test 4: Verify EdgeCacheService (should be direct controller)
console.log('Test 4: Verify EdgeCacheService (Direct Controller)');
console.log('-'.repeat(80));
try {
  const info = detectControllerType(repoPath, 'EdgeCacheService');
  if (info.type === 'direct' && !info.migration_needed) {
    console.log('  ✅ PASS - EdgeCacheService is a direct controller');
    console.log(`     Service: ${info.service}`);
    console.log(`     Version: ${info.version}`);
  } else {
    console.log('  ❌ FAIL - EdgeCacheService should be direct controller');
  }
  console.log();
} catch (err) {
  console.log('  ❌ FAIL - Error:', err.message);
  console.log();
}

console.log('='.repeat(80));
console.log('Testing Complete');
console.log('='.repeat(80));
