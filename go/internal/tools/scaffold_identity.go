package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ScaffoldIdentityParams contains parameters for scaffolding identity handler
type ScaffoldIdentityParams struct {
	Resource           string `json:"resource"`
	Service            string `json:"service"`
	Version            string `json:"version"`
	ResourceNameFormat string `json:"resource_name_format"` // e.g., "projects/{project}/locations/{location}/urlMaps/{urlMap}"
}

// ScaffoldIdentity generates identity handler file
func ScaffoldIdentity(repoPath string, params ScaffoldIdentityParams) (string, error) {
	resourceLower := strings.ToLower(params.Resource)
	targetPath := filepath.Join(repoPath, "apis", params.Service, params.Version, fmt.Sprintf("%s_identity.go", resourceLower))

	if fileExists(targetPath) {
		return "", fmt.Errorf("identity file already exists: %s", targetPath)
	}

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	content := generateIdentityTemplate(params)
	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("✅ Created identity file: apis/%s/%s/%s_identity.go\n\n"+
		"Next steps:\n"+
		"1. Verify resource name format matches GCP API\n"+
		"2. Adjust parsing logic if needed\n"+
		"3. Use: kcc_scaffold_controller to create controller",
		params.Service, params.Version, resourceLower), nil
}

func generateIdentityTemplate(params ScaffoldIdentityParams) string {
	year := time.Now().Year()
	resourceTitle := params.Resource
	resourceLower := strings.ToLower(params.Resource)
	identityType := fmt.Sprintf("%sIdentity", resourceTitle)
	gvk := fmt.Sprintf("%s%s", strings.Title(params.Service), resourceTitle)

	// Parse the resource name format to extract components
	parts := strings.Split(params.ResourceNameFormat, "/")
	hasLocation := false
	for _, part := range parts {
		if part == "locations" {
			hasLocation = true
			break
		}
	}

	// Build format string for String() method
	formatStr := params.ResourceNameFormat
	formatStr = strings.ReplaceAll(formatStr, "{project}", "%s")
	formatStr = strings.ReplaceAll(formatStr, "{location}", "%s")
	formatStr = strings.ReplaceAll(formatStr, fmt.Sprintf("{%s}", resourceLower), "%s")

	// Build parent identity fields
	parentFields := "ProjectID string"
	if hasLocation {
		parentFields = "ProjectID string\n\tLocation  string"
	}

	// Build parent String() method
	parentStringMethod := `return fmt.Sprintf("projects/%s", i.ProjectID)`
	if hasLocation {
		parentStringMethod = `return fmt.Sprintf("projects/%s/locations/%s", i.ProjectID, i.Location)`
	}

	// Build format args for String() method
	formatArgs := "i.parent.ProjectID, i.id"
	if hasLocation {
		formatArgs = "i.parent.ProjectID, i.parent.Location, i.id"
	}

	// Build location check
	locationCheck := ""
	locationField := ""
	if hasLocation {
		locationCheck = `
	location := obj.Spec.Location
	if location == "" {
		return nil, fmt.Errorf("spec.location is required")
	}`
		locationField = "\n\t\t\tLocation:  location,"
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
	"context"
	"fmt"

	"github.com/GoogleCloudPlatform/k8s-config-connector/apis/common/parent"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// %s defines the resource reference to %s
type %s struct {
	parent *%sIdentity
	id     string
}

func (i *%s) String() string {
	// TODO: Adjust format to match actual GCP API
	// Current format: %s
	return fmt.Sprintf("%s", %s)
}

func (i *%s) Parent() *%sIdentity {
	return i.parent
}

func (i *%s) ID() string {
	return i.id
}

type %sIdentity struct {
	%s
}

func (i *%sIdentity) String() string {
	%s
}

// New%sIdentity creates an %s from KRM object
func New%sIdentity(ctx context.Context, reader client.Reader, obj *%s) (*%s, error) {
	projectRef := obj.Spec.ProjectRef
	if projectRef == nil {
		return nil, fmt.Errorf("spec.projectRef is required")
	}

	projectID, err := parent.ResolveProjectID(ctx, reader, projectRef)
	if err != nil {
		return nil, err
	}
%s

	resourceID := valueOf(obj.Spec.ResourceID)
	if resourceID == "" {
		resourceID = obj.GetName()
	}
	if resourceID == "" {
		return nil, fmt.Errorf("cannot resolve resource ID")
	}

	return &%s{
		parent: &%sIdentity{
			ProjectID: projectID,%s
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
`, year, params.Version, identityType, resourceTitle, identityType,
		params.Service, identityType, params.ResourceNameFormat,
		formatStr, formatArgs, identityType, params.Service, identityType,
		params.Service, parentFields, params.Service, parentStringMethod,
		resourceTitle, identityType, resourceTitle, gvk, identityType,
		locationCheck, identityType, params.Service, locationField)
}
