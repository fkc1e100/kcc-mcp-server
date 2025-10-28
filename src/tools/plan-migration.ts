import { detectControllerType } from './detect-controller-type.js';

export interface MigrationPlan {
  resource: string;
  current_type: string;
  needs_migration: boolean;
  phases: Array<{
    phase: number;
    name: string;
    description: string;
    tasks: string[];
    estimated_time: string;
  }>;
  target_files: {
    types_file: string;
    identity_file: string;
    controller_file: string;
    mapper_file: string;
    mockgcp_file: string;
    test_fixtures_dir: string;
  };
  proto_info: {
    service: string;
    version: string;
    proto_package: string;
    proto_message: string;
  } | null;
  next_action: string;
}

export function planMigration(repoPath: string, resource: string): MigrationPlan {
  const info = detectControllerType(repoPath, resource);

  if (!info.migration_needed) {
    throw new Error(
      `${resource} is already a direct controller at ${info.location}.\n` +
      `No migration needed. Use kcc_add_field to add fields.`
    );
  }

  if (!info.service || !info.version) {
    throw new Error(
      `Could not determine service/version for ${resource}.\n` +
      `Found at: ${info.location}`
    );
  }

  const resourceLower = resource.toLowerCase();

  const targetFiles = {
    types_file: `apis/${info.service}/${info.version}/${resourceLower}_types.go`,
    identity_file: `apis/${info.service}/${info.version}/${resourceLower}_identity.go`,
    controller_file: `pkg/controller/direct/${info.service}/${resourceLower}_controller.go`,
    mapper_file: `pkg/controller/direct/${info.service}/mapper.generated.go`,
    mockgcp_file: `mockgcp/mock${info.service}/${resourceLower}.go`,
    test_fixtures_dir: `pkg/test/resourcefixture/testdata/basic/${info.service}/${info.version}/${resourceLower}`,
  };

  const phases = [
    {
      phase: 1,
      name: 'Proto Definitions',
      description: 'Ensure proto definitions exist for the resource',
      tasks: [
        info.has_proto
          ? `✅ Proto exists at ${info.proto_location}`
          : '⚠️  Check if proto exists in mockgcp/third_party/googleapis',
        'Identify proto package and message name',
        'Note any custom fields needed',
      ],
      estimated_time: '1-2 hours',
    },
    {
      phase: 2,
      name: 'API Types (KRM)',
      description: 'Create Kubernetes resource model types',
      tasks: [
        `Create ${targetFiles.types_file}`,
        'Define Spec struct with all fields',
        'Add +kcc:proto= annotations for each field',
        'Define nested types if needed',
        'Follow naming conventions (PascalCase)',
      ],
      estimated_time: '4-6 hours',
    },
    {
      phase: 3,
      name: 'Identity Handler',
      description: 'Create resource name parsing and construction',
      tasks: [
        `Create ${targetFiles.identity_file}`,
        'Implement resource name format (e.g., projects/{project}/...)',
        'Add parent identity handling',
        'Implement String() method',
      ],
      estimated_time: '2-3 hours',
    },
    {
      phase: 4,
      name: 'Mapper Generation',
      description: 'Generate KRM ↔ Proto conversion functions',
      tasks: [
        'Run ./dev/tasks/generate-mapper ' + resource,
        `Verify ${targetFiles.mapper_file} updated`,
        'Check for any mapper errors',
      ],
      estimated_time: '30 minutes',
    },
    {
      phase: 5,
      name: 'Controller Implementation',
      description: 'Implement CRUD operations',
      tasks: [
        `Create ${targetFiles.controller_file}`,
        'Implement Find() method',
        'Implement Create() method',
        'Implement Update() method with field mask',
        'Implement Delete() method',
        'Implement Export() method',
        'Add reference resolution (if needed)',
      ],
      estimated_time: '6-8 hours',
    },
    {
      phase: 6,
      name: 'MockGCP Implementation',
      description: 'Create mock GCP server for testing',
      tasks: [
        `Create ${targetFiles.mockgcp_file}`,
        'Implement Get method',
        'Implement List method',
        'Implement Create method with LRO',
        'Implement Update method with LRO',
        'Implement Delete method with LRO',
        'Add resource name parsing',
      ],
      estimated_time: '4-6 hours',
    },
    {
      phase: 7,
      name: 'Test Fixtures',
      description: 'Create test cases',
      tasks: [
        `Create ${targetFiles.test_fixtures_dir}/`,
        'Create create.yaml with initial resource',
        'Create update.yaml with changed fields',
        'Add _http.log for HTTP golden files',
        'Run tests and update golden files',
      ],
      estimated_time: '2-3 hours',
    },
  ];

  const protoInfo = info.service && info.version
    ? {
        service: info.service,
        version: info.version === 'v1alpha1' || info.version === 'v1beta1' ? 'v1' : info.version,
        proto_package: `google.cloud.${info.service}.v1`,
        proto_message: resource,
      }
    : null;

  return {
    resource,
    current_type: info.type,
    needs_migration: true,
    phases,
    target_files: targetFiles,
    proto_info: protoInfo,
    next_action: info.has_proto
      ? 'Start with Phase 2: Create API types using kcc_scaffold_types'
      : 'Check Phase 1: Verify proto definitions exist',
  };
}
