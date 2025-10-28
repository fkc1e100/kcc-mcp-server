import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export interface ScaffoldTypesParams {
  resource: string;
  service: string;
  version: string;
  proto_package: string;
  proto_message: string;
  description?: string;
}

export function scaffoldTypes(repoPath: string, params: ScaffoldTypesParams): string {
  const resourceLower = params.resource.toLowerCase();
  const targetPath = join(repoPath, 'apis', params.service, params.version, `${resourceLower}_types.go`);

  if (existsSync(targetPath)) {
    throw new Error(
      `Types file already exists: ${targetPath}\n` +
      `Use kcc_add_field to add fields to existing types.`
    );
  }

  // Ensure directory exists
  mkdirSync(dirname(targetPath), { recursive: true });

  const content = generateTypesTemplate(params);
  writeFileSync(targetPath, content, 'utf-8');

  return `✅ Created types file: apis/${params.service}/${params.version}/${resourceLower}_types.go\n\n` +
    `Next steps:\n` +
    `1. Fill in the Spec fields with proper +kcc:proto= annotations\n` +
    `2. Add nested types if needed\n` +
    `3. Run: ./dev/tasks/generate-mapper ${params.resource}\n` +
    `4. Use: kcc_scaffold_identity to create identity handler`;
}

function generateTypesTemplate(params: ScaffoldTypesParams): string {
  const year = new Date().getFullYear();
  const resourceTitle = params.resource;
  const resourceSpec = `${resourceTitle}Spec`;
  const resourceStatus = `${resourceTitle}Status`;
  const resourceObservedState = `${resourceTitle}ObservedState`;
  const gvk = `${params.service.charAt(0).toUpperCase() + params.service.slice(1)}${resourceTitle}`;
  const description = params.description || `${resourceTitle} resource`;

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
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/apis/k8s/v1alpha1"
)

var ${gvk}GVK = GroupVersion.WithKind("${gvk}")

// ${resourceSpec} defines the desired state of ${resourceTitle}
// +kcc:proto=${params.proto_package}.${params.proto_message}
type ${resourceSpec} struct {
	// TODO: Add fields here with proper +kcc:proto= annotations
	// Example:
	// // Description of the resource
	// // +kcc:proto=${params.proto_package}.${params.proto_message}.description
	// Description *string \`json:"description,omitempty"\`

	// REQUIRED: Immutable. The Project that this resource belongs to.
	ProjectRef *v1alpha1.ProjectRef \`json:"projectRef"\`

	// REQUIRED: Immutable. The location for the resource
	Location string \`json:"location"\`

	// REQUIRED: The ${resourceTitle} name. If not given, the metadata.name will be used.
	// + optional
	ResourceID *string \`json:"resourceID,omitempty"\`
}

// ${resourceStatus} defines the config connector machine state of ${resourceTitle}
type ${resourceStatus} struct {
	/* Conditions represent the latest available observations of the
	   object's current state. */
	Conditions []v1alpha1.Condition \`json:"conditions,omitempty"\`

	// ObservedGeneration is the generation of the resource that was most recently observed by the Config Connector controller. If this is equal to metadata.generation, then that means that the current reported status reflects the most recent desired state of the resource.
	ObservedGeneration *int64 \`json:"observedGeneration,omitempty"\`

	// A unique specifier for the ${resourceTitle} resource in GCP.
	ExternalRef *string \`json:"externalRef,omitempty"\`

	// ObservedState is the state of the resource as most recently observed in GCP.
	ObservedState *${resourceObservedState} \`json:"observedState,omitempty"\`
}

// ${resourceObservedState} is the state of the ${resourceTitle} resource as most recently observed in GCP.
// +kcc:proto=${params.proto_package}.${params.proto_message}
type ${resourceObservedState} struct {
	// TODO: Add observed state fields here
	// These are typically output-only fields from the GCP API
}

// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
// +kubebuilder:resource:categories=gcp
// +kubebuilder:subresource:status
// +kubebuilder:metadata:labels="cnrm.cloud.google.com/managed-by-kcc=true";"cnrm.cloud.google.com/system=true"
// +kubebuilder:printcolumn:name="Age",JSONPath=".metadata.creationTimestamp",type="date"
// +kubebuilder:printcolumn:name="Ready",JSONPath=".status.conditions[?(@.type=='Ready')].status",type="string",description="When 'True', the most recent reconcile of the resource succeeded"
// +kubebuilder:printcolumn:name="Status",JSONPath=".status.conditions[?(@.type=='Ready')].reason",type="string",description="The reason for the value in 'Ready'"
// +kubebuilder:printcolumn:name="Status Age",JSONPath=".status.conditions[?(@.type=='Ready')].lastTransitionTime",type="date",description="The last transition time for the value in 'Status'"

// ${gvk} is the Schema for the ${params.service} ${resourceTitle} API
// +k8s:openapi-gen=true
type ${gvk} struct {
	metav1.TypeMeta   \`json:",inline"\`
	metav1.ObjectMeta \`json:"metadata,omitempty"\`

	// +required
	Spec   ${resourceSpec}   \`json:"spec,omitempty"\`
	Status ${resourceStatus} \`json:"status,omitempty"\`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
// ${gvk}List contains a list of ${gvk}
type ${gvk}List struct {
	metav1.TypeMeta \`json:",inline"\`
	metav1.ListMeta \`json:"metadata,omitempty"\`
	Items           []${gvk} \`json:"items"\`
}

func init() {
	SchemeBuilder.Register(&${gvk}{}, &${gvk}List{})
}
`;
}
