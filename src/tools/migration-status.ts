import { existsSync } from 'fs';
import { join } from 'path';
import { detectControllerType } from './detect-controller-type.js';

export interface MigrationStatus {
  resource: string;
  overall_progress: string; // e.g., "3/7 phases"
  current_phase: {
    number: number;
    name: string;
    status: 'not_started' | 'in_progress' | 'completed';
  };
  phases: Array<{
    number: number;
    name: string;
    status: 'not_started' | 'in_progress' | 'completed';
    files_exist: { [key: string]: boolean };
  }>;
  next_action: string;
  can_add_fields: boolean;
}

export function getMigrationStatus(repoPath: string, resource: string): MigrationStatus {
  const info = detectControllerType(repoPath, resource);

  if (info.type === 'direct') {
    return {
      resource,
      overall_progress: 'Migration complete',
      current_phase: {
        number: 7,
        name: 'Complete',
        status: 'completed',
      },
      phases: [],
      next_action: 'Migration complete. Use kcc_add_field to add new fields.',
      can_add_fields: true,
    };
  }

  if (!info.service || !info.version) {
    throw new Error(`Could not determine service/version for ${resource}`);
  }

  const resourceLower = resource.toLowerCase();

  // Define expected files for each phase
  const phases = [
    {
      number: 1,
      name: 'Proto Definitions',
      files: {
        proto: info.proto_location || `mockgcp/third_party/googleapis/google/cloud/${info.service}/v1/*.proto`,
      },
    },
    {
      number: 2,
      name: 'API Types',
      files: {
        types: `apis/${info.service}/${info.version}/${resourceLower}_types.go`,
      },
    },
    {
      number: 3,
      name: 'Identity Handler',
      files: {
        identity: `apis/${info.service}/${info.version}/${resourceLower}_identity.go`,
      },
    },
    {
      number: 4,
      name: 'Mapper',
      files: {
        mapper: `pkg/controller/direct/${info.service}/mapper.generated.go`,
      },
    },
    {
      number: 5,
      name: 'Controller',
      files: {
        controller: `pkg/controller/direct/${info.service}/${resourceLower}_controller.go`,
      },
    },
    {
      number: 6,
      name: 'MockGCP',
      files: {
        mockgcp: `mockgcp/mock${info.service}/${resourceLower}.go`,
      },
    },
    {
      number: 7,
      name: 'Test Fixtures',
      files: {
        create_yaml: `pkg/test/resourcefixture/testdata/basic/${info.service}/${info.version}/${resourceLower}/create.yaml`,
        update_yaml: `pkg/test/resourcefixture/testdata/basic/${info.service}/${info.version}/${resourceLower}/update.yaml`,
      },
    },
  ];

  // Check which files exist
  const phasesStatus = phases.map((phase) => {
    const filesExist: { [key: string]: boolean } = {};
    let allExist = true;
    let someExist = false;

    for (const [key, filePath] of Object.entries(phase.files)) {
      const exists = existsSync(join(repoPath, filePath));
      filesExist[key] = exists;
      if (exists) someExist = true;
      if (!exists) allExist = false;
    }

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (allExist) {
      status = 'completed';
    } else if (someExist) {
      status = 'in_progress';
    }

    return {
      number: phase.number,
      name: phase.name,
      status,
      files_exist: filesExist,
    };
  });

  // Find current phase (first incomplete)
  let currentPhase = phasesStatus.find((p) => p.status !== 'completed') || phasesStatus[phasesStatus.length - 1];

  // Count completed
  const completed = phasesStatus.filter((p) => p.status === 'completed').length;
  const total = phasesStatus.length;

  // Determine next action
  let nextAction = '';
  if (currentPhase.status === 'not_started') {
    switch (currentPhase.number) {
      case 1:
        nextAction = 'Check proto definitions exist in mockgcp/third_party/googleapis';
        break;
      case 2:
        nextAction = 'Use kcc_scaffold_types to create API types file';
        break;
      case 3:
        nextAction = 'Use kcc_scaffold_identity to create identity handler';
        break;
      case 4:
        nextAction = 'Run kcc_generate_mapper to generate mapper functions';
        break;
      case 5:
        nextAction = 'Use kcc_scaffold_controller to create controller';
        break;
      case 6:
        nextAction = 'Use kcc_scaffold_mockgcp to create MockGCP implementation';
        break;
      case 7:
        nextAction = 'Create test fixtures (create.yaml and update.yaml)';
        break;
    }
  } else if (currentPhase.status === 'in_progress') {
    nextAction = `Complete phase ${currentPhase.number}: ${currentPhase.name}`;
  }

  return {
    resource,
    overall_progress: `${completed}/${total} phases`,
    current_phase: {
      number: currentPhase.number,
      name: currentPhase.name,
      status: currentPhase.status,
    },
    phases: phasesStatus,
    next_action: nextAction,
    can_add_fields: completed >= 4, // Need types, identity, mapper, controller
  };
}
