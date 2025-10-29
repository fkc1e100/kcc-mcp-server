package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ScaffoldTypesParams contains parameters for scaffolding types
type ScaffoldTypesParams struct {
	Resource     string `json:"resource"`
	Service      string `json:"service"`
	Version      string `json:"version"`
	ProtoPackage string `json:"proto_package"`
	ProtoMessage string `json:"proto_message"`
	Description  string `json:"description,omitempty"`
}

// ScaffoldTypes generates API types file
func ScaffoldTypes(repoPath string, params ScaffoldTypesParams) (string, error) {
	resourceLower := strings.ToLower(params.Resource)
	targetPath := filepath.Join(repoPath, "apis", params.Service, params.Version, fmt.Sprintf("%s_types.go", resourceLower))

	if fileExists(targetPath) {
		return "", fmt.Errorf("types file already exists: %s\nUse kcc_add_field to add fields to existing types", targetPath)
	}

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	content := generateTypesTemplate(params)
	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("✅ Created types file: apis/%s/%s/%s_types.go\n\n"+
		"Next steps:\n"+
		"1. Fill in the Spec fields with proper +kcc:proto= annotations\n"+
		"2. Add nested types if needed\n"+
		"3. Run: ./dev/tasks/generate-mapper %s\n"+
		"4. Use: kcc_scaffold_identity to create identity handler",
		params.Service, params.Version, resourceLower, params.Resource), nil
}

func generateTypesTemplate(params ScaffoldTypesParams) string {
	year := time.Now().Year()
	resourceTitle := params.Resource
	resourceSpec := fmt.Sprintf("%sSpec", resourceTitle)
	resourceStatus := fmt.Sprintf("%sStatus", resourceTitle)
	resourceObservedState := fmt.Sprintf("%sObservedState", resourceTitle)
	gvk := fmt.Sprintf("%s%s", strings.Title(params.Service), resourceTitle)
	description := params.Description
	if description == "" {
		description = fmt.Sprintf("%s resource", resourceTitle)
	}

	return fmt.Sprintf(`// Copyright %d Google LLC
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

package %s

import (
	"github.com/GoogleCloudPlatform/k8s-config-connector/pkg/apis/k8s/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var %sGVK = GroupVersion.WithKind("%s")

// %s defines the desired state of %s
// +kcc:proto=%s.%s
type %s struct {
	// TODO: Add fields here with proper +kcc:proto= annotations
	// Example:
	// // Description of the resource
	// // +kcc:proto=%s.%s.description
	// Description *string `+"`json:\"description,omitempty\"`"+`

	// REQUIRED: Immutable. The Project that this resource belongs to.
	ProjectRef *v1alpha1.ProjectRef `+"`json:\"projectRef\"`"+`

	// REQUIRED: Immutable. The location for the resource
	Location string `+"`json:\"location\"`"+`

	// REQUIRED: The %s name. If not given, the metadata.name will be used.
	// + optional
	ResourceID *string `+"`json:\"resourceID,omitempty\"`"+`
}

// %s defines the config connector machine state of %s
type %s struct {
	/* Conditions represent the latest available observations of the
	   object's current state. */
	Conditions []v1alpha1.Condition `+"`json:\"conditions,omitempty\"`"+`

	// ObservedGeneration is the generation of the resource that was most recently observed by the Config Connector controller. If this is equal to metadata.generation, then that means that the current reported status reflects the most recent desired state of the resource.
	ObservedGeneration *int64 `+"`json:\"observedGeneration,omitempty\"`"+`

	// A unique specifier for the %s resource in GCP.
	ExternalRef *string `+"`json:\"externalRef,omitempty\"`"+`

	// ObservedState is the state of the resource as most recently observed in GCP.
	ObservedState *%s `+"`json:\"observedState,omitempty\"`"+`
}

// %s is the state of the %s resource as most recently observed in GCP.
// +kcc:proto=%s.%s
type %s struct {
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

// %s is the Schema for the %s %s API
// +k8s:openapi-gen=true
type %s struct {
	metav1.TypeMeta   `+"`json:\",inline\"`"+`
	metav1.ObjectMeta `+"`json:\"metadata,omitempty\"`"+`

	// +required
	Spec   %s `+"`json:\"spec,omitempty\"`"+`
	Status %s `+"`json:\"status,omitempty\"`"+`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
// %sList contains a list of %s
type %sList struct {
	metav1.TypeMeta `+"`json:\",inline\"`"+`
	metav1.ListMeta `+"`json:\"metadata,omitempty\"`"+`
	Items           []%s `+"`json:\"items\"`"+`
}

func init() {
	SchemeBuilder.Register(&%s{}, &%sList{})
}
`, year, params.Version, gvk, gvk, resourceSpec, resourceTitle,
		params.ProtoPackage, params.ProtoMessage, resourceSpec,
		params.ProtoPackage, params.ProtoMessage, resourceTitle,
		resourceStatus, resourceTitle, resourceStatus, resourceTitle,
		resourceObservedState, resourceObservedState, resourceTitle,
		params.ProtoPackage, params.ProtoMessage, resourceObservedState,
		gvk, params.Service, resourceTitle, gvk, resourceSpec, resourceStatus,
		gvk, gvk, gvk, gvk, gvk, gvk)
}
