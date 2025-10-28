import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface ResourceLocation {
  resource: string;
  service: string;
  version: string;
  types_file: string;
  controller_file: string;
  mapper_file: string;
  test_fixtures_dir: string;
  files_exist: {
    types: boolean;
    controller: boolean;
    mapper: boolean;
    test_fixtures: boolean;
  };
}

export function findResource(repoPath: string, resource: string): ResourceLocation {
  // Normalize resource name (e.g., "ComputeURLMap" or "computeurlmap")
  const resourceLower = resource.toLowerCase();

  // Find types file
  const findCmd = `find apis/ -name "*${resourceLower}*types.go" 2>/dev/null || true`;
  const typesFiles = execSync(findCmd, { cwd: repoPath, encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  if (typesFiles.length === 0) {
    throw new Error(
      `Resource not found: ${resource}\n\n` +
        `Searched for: apis/**/*${resourceLower}*types.go\n\n` +
        `Make sure the resource exists and has a direct controller.`
    );
  }

  // Parse path: apis/{service}/{version}/{resource}_types.go
  const typesFile = typesFiles[0];
  const pathParts = typesFile.split('/');

  if (pathParts.length < 4) {
    throw new Error(`Unexpected types file path format: ${typesFile}`);
  }

  const service = pathParts[1];
  const version = pathParts[2];
  const resourceName = pathParts[3].replace('_types.go', '');

  // Expected file locations
  const controllerFile = join('pkg', 'controller', 'direct', service, `${resourceName}_controller.go`);
  const mapperFile = join('pkg', 'controller', 'direct', service, 'mapper.generated.go');
  const testFixturesDir = join(
    'pkg',
    'test',
    'resourcefixture',
    'testdata',
    'basic',
    service,
    version,
    resourceName
  );

  // Check existence
  const filesExist = {
    types: existsSync(join(repoPath, typesFile)),
    controller: existsSync(join(repoPath, controllerFile)),
    mapper: existsSync(join(repoPath, mapperFile)),
    test_fixtures: existsSync(join(repoPath, testFixturesDir)),
  };

  return {
    resource: resourceName,
    service,
    version,
    types_file: typesFile,
    controller_file: controllerFile,
    mapper_file: mapperFile,
    test_fixtures_dir: testFixturesDir,
    files_exist: filesExist,
  };
}
