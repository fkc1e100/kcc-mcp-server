import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface ControllerTypeInfo {
  resource: string;
  type: 'direct' | 'terraform' | 'unknown';
  location: string | null;
  migration_needed: boolean;
  has_direct_types: boolean;
  has_terraform_types: boolean;
  has_proto: boolean;
  proto_location: string | null;
  service: string | null;
  version: string | null;
}

export function detectControllerType(repoPath: string, resource: string): ControllerTypeInfo {
  const resourceLower = resource.toLowerCase();

  // Check for direct controller types (apis/{service}/{version}/*_types.go)
  const directTypesCmd = `find apis/ -name "*${resourceLower}*_types.go" 2>/dev/null || true`;
  const directTypesFiles = execSync(directTypesCmd, { cwd: repoPath, encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  // Check for Terraform-based types (pkg/clients/generated/)
  const tfTypesCmd = `find pkg/clients/generated/ -name "*${resourceLower}*types.go" 2>/dev/null || true`;
  const tfTypesFiles = execSync(tfTypesCmd, { cwd: repoPath, encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  const hasDirectTypes = directTypesFiles.length > 0;
  const hasTerraformTypes = tfTypesFiles.length > 0;

  let type: 'direct' | 'terraform' | 'unknown' = 'unknown';
  let location: string | null = null;
  let service: string | null = null;
  let version: string | null = null;

  if (hasDirectTypes) {
    type = 'direct';
    location = directTypesFiles[0];

    // Parse: apis/{service}/{version}/{resource}_types.go
    const parts = location.split('/');
    if (parts.length >= 4) {
      service = parts[1];
      version = parts[2];
    }
  } else if (hasTerraformTypes) {
    type = 'terraform';
    location = tfTypesFiles[0];

    // Parse: pkg/clients/generated/apis/{service}/{version}/{resource}_types.go
    const parts = location.split('/');
    if (parts.length >= 6) {
      service = parts[4];
      version = parts[5];
    }
  }

  // Check for proto definitions
  let hasProto = false;
  let protoLocation: string | null = null;

  if (service) {
    // Check in mockgcp/third_party/googleapis
    const protoCmd = `find mockgcp/third_party/googleapis -path "*/${service}/*" -name "*.proto" 2>/dev/null | head -5 || true`;
    const protoFiles = execSync(protoCmd, { cwd: repoPath, encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (protoFiles.length > 0) {
      hasProto = true;
      protoLocation = protoFiles[0];
    }
  }

  return {
    resource,
    type,
    location,
    migration_needed: type === 'terraform',
    has_direct_types: hasDirectTypes,
    has_terraform_types: hasTerraformTypes,
    has_proto: hasProto,
    proto_location: protoLocation,
    service,
    version,
  };
}
