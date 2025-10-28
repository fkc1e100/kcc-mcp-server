#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

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

// Define tools
const tools: Tool[] = [
  {
    name: 'kcc_find_resource',
    description: 'Locate files for a KCC resource (types, controller, mapper, test fixtures)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name (e.g., "ComputeURLMap", "EdgeCacheService")',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'kcc_add_field',
    description: 'Add a field to an existing direct controller with proper proto annotations',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
        field_name: {
          type: 'string',
          description: 'Field name in PascalCase (e.g., "DefaultCustomErrorResponsePolicy")',
        },
        field_type: {
          type: 'string',
          enum: ['string', 'int64', 'bool', 'object', 'array'],
          description: 'Field type',
        },
        proto_path: {
          type: 'string',
          description: 'Full proto path (e.g., "google.cloud.compute.v1.UrlMap.default_custom_error_response_policy")',
        },
        parent_type: {
          type: 'string',
          description: 'Parent type name (defaults to {Resource}Spec)',
        },
        description: {
          type: 'string',
          description: 'Field description comment',
        },
      },
      required: ['resource', 'field_name', 'field_type', 'proto_path'],
    },
  },
  {
    name: 'kcc_generate_mapper',
    description: 'Regenerate KRM ↔ Proto mapper after adding fields',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'kcc_git_commit',
    description:
      'Create git commit with enforced rules: blocks AI attribution, uses your git identity, validates message format',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message (will be validated for AI attribution and conventional commit format)',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to stage (optional, defaults to all changed files)',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'kcc_git_status',
    description: 'Get current git status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'kcc_detect_controller_type',
    description: 'Detect if a resource uses direct controller or Terraform-based controller',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name (e.g., "ComputeURLMap", "EdgeCacheService")',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'kcc_migration_status',
    description: 'Get migration status for a resource (shows which phases are complete)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'kcc_plan_migration',
    description: 'Create a detailed 7-phase migration plan for migrating a Terraform-based resource to direct controller',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'kcc_scaffold_types',
    description: 'Generate API types file (Phase 2 of migration)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
        service: {
          type: 'string',
          description: 'Service name (e.g., "networkservices")',
        },
        version: {
          type: 'string',
          description: 'API version (e.g., "v1alpha1")',
        },
        proto_package: {
          type: 'string',
          description: 'Proto package (e.g., "google.cloud.networkservices.v1")',
        },
        proto_message: {
          type: 'string',
          description: 'Proto message name (e.g., "EdgeCacheService")',
        },
        description: {
          type: 'string',
          description: 'Optional resource description',
        },
      },
      required: ['resource', 'service', 'version', 'proto_package', 'proto_message'],
    },
  },
  {
    name: 'kcc_scaffold_identity',
    description: 'Generate identity handler file (Phase 3 of migration)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
        service: {
          type: 'string',
          description: 'Service name',
        },
        version: {
          type: 'string',
          description: 'API version',
        },
        resource_name_format: {
          type: 'string',
          description: 'GCP resource name format (e.g., "projects/{project}/locations/{location}/edgeCacheServices/{edgeCacheService}")',
        },
      },
      required: ['resource', 'service', 'version', 'resource_name_format'],
    },
  },
  {
    name: 'kcc_scaffold_controller',
    description: 'Generate controller file (Phase 5 of migration)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
        service: {
          type: 'string',
          description: 'Service name',
        },
        version: {
          type: 'string',
          description: 'API version',
        },
        proto_package: {
          type: 'string',
          description: 'Proto package',
        },
        proto_message: {
          type: 'string',
          description: 'Proto message name',
        },
      },
      required: ['resource', 'service', 'version', 'proto_package', 'proto_message'],
    },
  },
  {
    name: 'kcc_scaffold_mockgcp',
    description: 'Generate MockGCP server file (Phase 6 of migration)',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource name',
        },
        service: {
          type: 'string',
          description: 'Service name',
        },
        proto_package: {
          type: 'string',
          description: 'Proto package',
        },
        proto_message: {
          type: 'string',
          description: 'Proto message name',
        },
        resource_name_format: {
          type: 'string',
          description: 'GCP resource name format',
        },
      },
      required: ['resource', 'service', 'proto_package', 'proto_message', 'resource_name_format'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'kcc-contributor-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'kcc_find_resource': {
        const { resource } = args as { resource: string };
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

      case 'kcc_add_field': {
        const params = args as unknown as AddFieldParams;
        const repoPath = config.getRepoPath();

        // Find the resource first
        const location = findResource(repoPath, params.resource);

        // Add the field
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

      case 'kcc_generate_mapper': {
        const { resource } = args as { resource: string };
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

      case 'kcc_git_commit': {
        const { message, files } = args as { message: string; files?: string[] };
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

      case 'kcc_git_status': {
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

      case 'kcc_detect_controller_type': {
        const { resource } = args as { resource: string };
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

      case 'kcc_migration_status': {
        const { resource } = args as { resource: string };
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

      case 'kcc_plan_migration': {
        const { resource } = args as { resource: string };
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

      case 'kcc_scaffold_types': {
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

      case 'kcc_scaffold_identity': {
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

      case 'kcc_scaffold_controller': {
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

      case 'kcc_scaffold_mockgcp': {
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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

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
