import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export interface ScaffoldIdentityParams {
  resource: string;
  service: string;
  version: string;
  resource_name_format: string; // e.g., "projects/{project}/locations/{location}/urlMaps/{urlMap}"
}

export function scaffoldIdentity(repoPath: string, params: ScaffoldIdentityParams): string {
  const resourceLower = params.resource.toLowerCase();
  const targetPath = join(repoPath, 'apis', params.service, params.version, `${resourceLower}_identity.go`);

  if (existsSync(targetPath)) {
    throw new Error(`Identity file already exists: ${targetPath}`);
  }

  // Ensure directory exists
  mkdirSync(dirname(targetPath), { recursive: true });

  const content = generateIdentityTemplate(params);
  writeFileSync(targetPath, content, 'utf-8');

  return `✅ Created identity file: apis/${params.service}/${params.version}/${resourceLower}_identity.go\n\n` +
    `Next steps:\n` +
    `1. Verify resource name format matches GCP API\n` +
    `2. Adjust parsing logic if needed\n` +
    `3. Use: kcc_scaffold_controller to create controller`;
}

function generateIdentityTemplate(params: ScaffoldIdentityParams): string {
  const year = new Date().getFullYear();
  const resourceTitle = params.resource;
  const resourceLower = params.resource.toLowerCase();
  const identityType = `${resourceTitle}Identity`;

  // Parse the resource name format to extract components
  // e.g., "projects/{project}/locations/{location}/urlMaps/{urlMap}"
  const parts = params.resource_name_format.split('/');
  const hasLocation = parts.includes('locations');

  return `// Copyright ${year} Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package ${params.version}

import (
	"context"
	"fmt"
	"strings"

	"github.com/GoogleCloudPlatform/k8s-config-connector/apis/common/parent"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ${identityType} defines the resource reference to ${resourceTitle}
type ${identityType} struct {
	parent *${params.service}Identity
	id     string
}

func (i *${identityType}) String() string {
	// TODO: Adjust format to match actual GCP API
	// Current format: ${params.resource_name_format}
	return fmt.Sprintf("${params.resource_name_format.replace('{project}', '%s').replace('{location}', '%s').replace(new RegExp(`\\{${resourceLower}\\}`), '%s')}",
		i.parent.ProjectID, ${hasLocation ? 'i.parent.Location, ' : ''}i.id)
}

func (i *${identityType}) Parent() *${params.service}Identity {
	return i.parent
}

func (i *${identityType}) ID() string {
	return i.id
}

type ${params.service}Identity struct {
	ProjectID string
	${hasLocation ? 'Location  string' : ''}
}

func (i *${params.service}Identity) String() string {
	${hasLocation
		? `return fmt.Sprintf("projects/%s/locations/%s", i.ProjectID, i.Location)`
		: `return fmt.Sprintf("projects/%s", i.ProjectID)`
	}
}

// New${resourceTitle}Identity creates an ${identityType} from KRM object
func New${resourceTitle}Identity(ctx context.Context, reader client.Reader, obj *${params.service.charAt(0).toUpperCase() + params.service.slice(1)}${resourceTitle}) (*${identityType}, error) {
	projectRef := obj.Spec.ProjectRef
	if projectRef == nil {
		return nil, fmt.Errorf("spec.projectRef is required")
	}

	projectID, err := parent.ResolveProjectID(ctx, reader, projectRef)
	if err != nil {
		return nil, err
	}

	${hasLocation ? `location := obj.Spec.Location
	if location == "" {
		return nil, fmt.Errorf("spec.location is required")
	}` : ''}

	resourceID := valueOf(obj.Spec.ResourceID)
	if resourceID == "" {
		resourceID = obj.GetName()
	}
	if resourceID == "" {
		return nil, fmt.Errorf("cannot resolve resource ID")
	}

	return &${identityType}{
		parent: &${params.service}Identity{
			ProjectID: projectID,
			${hasLocation ? 'Location:  location,' : ''}
		},
		id: resourceID,
	}, nil
}

func valueOf[T any](t *T) T {
	var zeroVal T
	if t == nil {
		return zeroVal
	}
	return *t
}
`;
}
