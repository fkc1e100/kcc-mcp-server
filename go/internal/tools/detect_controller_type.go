package tools

import (
	"fmt"
	"os/exec"
	"strings"
)

// ControllerTypeInfo contains information about a resource's controller type
type ControllerTypeInfo struct {
	Resource           string  `json:"resource"`
	Type               string  `json:"type"` // "direct", "terraform", or "unknown"
	Location           *string `json:"location"`
	MigrationNeeded    bool    `json:"migration_needed"`
	HasDirectTypes     bool    `json:"has_direct_types"`
	HasTerraformTypes  bool    `json:"has_terraform_types"`
	HasProto           bool    `json:"has_proto"`
	ProtoLocation      *string `json:"proto_location"`
	Service            *string `json:"service"`
	Version            *string `json:"version"`
}

// DetectControllerType detects if a resource uses direct controller or Terraform
func DetectControllerType(repoPath, resource string) (*ControllerTypeInfo, error) {
	resourceLower := strings.ToLower(resource)

	// Check for direct controller types (apis/{service}/{version}/*_types.go)
	directTypesCmd := fmt.Sprintf("find apis/ -name \"*%s*_types.go\" 2>/dev/null || true", resourceLower)
	cmd := exec.Command("sh", "-c", directTypesCmd)
	cmd.Dir = repoPath
	directOutput, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to search for direct types: %w", err)
	}

	directTypesFiles := strings.Split(strings.TrimSpace(string(directOutput)), "\n")
	directTypesFiles = removeEmpty(directTypesFiles)

	// Check for Terraform-based types (pkg/clients/generated/)
	tfTypesCmd := fmt.Sprintf("find pkg/clients/generated/ -name \"*%s*types.go\" 2>/dev/null || true", resourceLower)
	cmd = exec.Command("sh", "-c", tfTypesCmd)
	cmd.Dir = repoPath
	tfOutput, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to search for terraform types: %w", err)
	}

	tfTypesFiles := strings.Split(strings.TrimSpace(string(tfOutput)), "\n")
	tfTypesFiles = removeEmpty(tfTypesFiles)

	hasDirectTypes := len(directTypesFiles) > 0
	hasTerraformTypes := len(tfTypesFiles) > 0

	controllerType := "unknown"
	var location *string
	var service *string
	var version *string

	if hasDirectTypes {
		controllerType = "direct"
		location = &directTypesFiles[0]

		// Parse: apis/{service}/{version}/{resource}_types.go
		parts := strings.Split(*location, "/")
		if len(parts) >= 4 {
			service = &parts[1]
			version = &parts[2]
		}
	} else if hasTerraformTypes {
		controllerType = "terraform"
		location = &tfTypesFiles[0]

		// Parse: pkg/clients/generated/apis/{service}/{version}/{resource}_types.go
		parts := strings.Split(*location, "/")
		if len(parts) >= 6 {
			service = &parts[4]
			version = &parts[5]
		}
	}

	// Check for proto definitions
	hasProto := false
	var protoLocation *string

	if service != nil {
		protoCmd := fmt.Sprintf("find mockgcp/third_party/googleapis -path \"*/%s/*\" -name \"*.proto\" 2>/dev/null | head -5 || true", *service)
		cmd = exec.Command("sh", "-c", protoCmd)
		cmd.Dir = repoPath
		protoOutput, err := cmd.Output()
		if err == nil {
			protoFiles := strings.Split(strings.TrimSpace(string(protoOutput)), "\n")
			protoFiles = removeEmpty(protoFiles)
			if len(protoFiles) > 0 {
				hasProto = true
				protoLocation = &protoFiles[0]
			}
		}
	}

	return &ControllerTypeInfo{
		Resource:          resource,
		Type:              controllerType,
		Location:          location,
		MigrationNeeded:   controllerType == "terraform",
		HasDirectTypes:    hasDirectTypes,
		HasTerraformTypes: hasTerraformTypes,
		HasProto:          hasProto,
		ProtoLocation:     protoLocation,
		Service:           service,
		Version:           version,
	}, nil
}
