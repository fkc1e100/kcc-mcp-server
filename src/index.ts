#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { ConfigManager } from './config.js';
import { GitValidator } from './git-validator.js';
import { findResource } from './tools/find-resource.js';
import { addField, AddFieldParams } from './tools/add-field.js';
import { generateMapper } from './tools/generate-mapper.js';
import { detectControllerType } from './tools/detect-controller-type.js';
import { planMigration } from './tools/plan-migration.js';
import { scaffoldTypes, ScaffoldTypesParams } from './tools/scaffold-types.js';
import { scaffoldIdentity, ScaffoldIdentityParams } from './tools/scaffold-identity.js';
import { scaffoldController, ScaffoldControllerParams } from './tools/scaffold-controller.js';
import { scaffoldMockGCP, ScaffoldMockGCPParams } from './tools/scaffold-mockgcp.js';
import { getMigrationStatus } from './tools/migration-status.js';

// Initialize config
let config: ConfigManager;
let gitValidator: GitValidator;

try {
  config = new ConfigManager();
  gitValidator = new GitValidator(config);
  console.error('✅ KCC MCP Server initialized');
  console.error(`📁 Repository: ${config.getRepoPath()}`);
  console.error(`👤 Author: ${config.getGitAuthor().name} <${config.getGitAuthor().email}>`);
} catch (err) {
  console.error('❌ Failed to initialize KCC MCP Server:');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: 'kcc-contributor-server',
  version: '1.0.0',
});

// Register tools
server.registerTool(
  'kcc_find_resource',
  {
    description: 'Locate files for a KCC resource (types, controller, mapper, test fixtures)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name (e.g., "ComputeURLMap", "EdgeCacheService")'),
    }).shape,
  },
  async ({ resource }) => {
    const repoPath = config.getRepoPath();
    const location = findResource(repoPath, resource);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(location, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_add_field',
  {
    description: 'Add a field to an existing direct controller with proper proto annotations',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
      field_name: z.string().describe('Field name in PascalCase (e.g., "DefaultCustomErrorResponsePolicy")'),
      field_type: z.enum(['string', 'int64', 'bool', 'object', 'array']).describe('Field type'),
      proto_path: z.string().describe('Full proto path (e.g., "google.cloud.compute.v1.UrlMap.default_custom_error_response_policy")'),
      parent_type: z.string().optional().describe('Parent type name (defaults to {Resource}Spec)'),
      description: z.string().optional().describe('Field description comment'),
    }).shape,
  },
  async (args) => {
    const params = args as unknown as AddFieldParams;
    const repoPath = config.getRepoPath();
    const location = findResource(repoPath, params.resource);
    const result = addField(repoPath, location.types_file, params);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_generate_mapper',
  {
    description: 'Regenerate KRM ↔ Proto mapper after adding fields',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
    }).shape,
  },
  async ({ resource }) => {
    const repoPath = config.getRepoPath();
    const result = generateMapper(repoPath, resource);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_git_commit',
  {
    description: 'Create git commit with enforced rules: blocks AI attribution, uses your git identity, validates message format',
    inputSchema: z.object({
      message: z.string().describe('Commit message (will be validated for AI attribution and conventional commit format)'),
      files: z.array(z.string()).optional().describe('Specific files to stage (optional, defaults to all changed files)'),
    }).shape,
  },
  async ({ message, files }) => {
    const repoPath = config.getRepoPath();
    gitValidator.createCommit(repoPath, message, files);
    return {
      content: [
        {
          type: 'text',
          text: `✅ Commit created successfully\n\nMessage: ${message}\n\nAuthor: ${config.getGitAuthor().name} <${config.getGitAuthor().email}>`,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_git_status',
  {
    description: 'Get current git status',
    inputSchema: z.object({}).shape,
  },
  async () => {
    const repoPath = config.getRepoPath();
    const status = gitValidator.getStatus(repoPath);
    return {
      content: [
        {
          type: 'text',
          text: status || 'Working tree clean',
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_detect_controller_type',
  {
    description: 'Detect if a resource uses direct controller or Terraform-based controller',
    inputSchema: z.object({
      resource: z.string().describe('Resource name (e.g., "ComputeURLMap", "EdgeCacheService")'),
    }).shape,
  },
  async ({ resource }) => {
    const repoPath = config.getRepoPath();
    const info = detectControllerType(repoPath, resource);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_migration_status',
  {
    description: 'Get migration status for a resource (shows which phases are complete)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
    }).shape,
  },
  async ({ resource }) => {
    const repoPath = config.getRepoPath();
    const status = getMigrationStatus(repoPath, resource);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_plan_migration',
  {
    description: 'Create a detailed 7-phase migration plan for migrating a Terraform-based resource to direct controller',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
    }).shape,
  },
  async ({ resource }) => {
    const repoPath = config.getRepoPath();
    const plan = planMigration(repoPath, resource);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(plan, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_scaffold_types',
  {
    description: 'Generate API types file (Phase 2 of migration)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
      service: z.string().describe('Service name (e.g., "networkservices")'),
      version: z.string().describe('API version (e.g., "v1alpha1")'),
      proto_package: z.string().describe('Proto package (e.g., "google.cloud.networkservices.v1")'),
      proto_message: z.string().describe('Proto message name (e.g., "EdgeCacheService")'),
      description: z.string().optional().describe('Optional resource description'),
    }).shape,
  },
  async (args) => {
    const params = args as unknown as ScaffoldTypesParams;
    const repoPath = config.getRepoPath();
    const result = scaffoldTypes(repoPath, params);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_scaffold_identity',
  {
    description: 'Generate identity handler file (Phase 3 of migration)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
      service: z.string().describe('Service name'),
      version: z.string().describe('API version'),
      resource_name_format: z.string().describe('GCP resource name format (e.g., "projects/{project}/locations/{location}/edgeCacheServices/{edgeCacheService}")'),
    }).shape,
  },
  async (args) => {
    const params = args as unknown as ScaffoldIdentityParams;
    const repoPath = config.getRepoPath();
    const result = scaffoldIdentity(repoPath, params);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_scaffold_controller',
  {
    description: 'Generate controller file (Phase 5 of migration)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
      service: z.string().describe('Service name'),
      version: z.string().describe('API version'),
      proto_package: z.string().describe('Proto package'),
      proto_message: z.string().describe('Proto message name'),
    }).shape,
  },
  async (args) => {
    const params = args as unknown as ScaffoldControllerParams;
    const repoPath = config.getRepoPath();
    const result = scaffoldController(repoPath, params);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

server.registerTool(
  'kcc_scaffold_mockgcp',
  {
    description: 'Generate MockGCP server file (Phase 6 of migration)',
    inputSchema: z.object({
      resource: z.string().describe('Resource name'),
      service: z.string().describe('Service name'),
      proto_package: z.string().describe('Proto package'),
      proto_message: z.string().describe('Proto message name'),
      resource_name_format: z.string().describe('GCP resource name format'),
    }).shape,
  },
  async (args) => {
    const params = args as unknown as ScaffoldMockGCPParams;
    const repoPath = config.getRepoPath();
    const result = scaffoldMockGCP(repoPath, params);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 KCC MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
