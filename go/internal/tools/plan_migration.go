package tools

import (
	"fmt"
	"strings"
)

// MigrationPhase represents a single phase in the migration
type MigrationPhase struct {
	Phase         int      `json:"phase"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Tasks         []string `json:"tasks"`
	EstimatedTime string   `json:"estimated_time"`
}

// ProtoInfo contains proto package information
type ProtoInfo struct {
	Service      string `json:"service"`
	Version      string `json:"version"`
	ProtoPackage string `json:"proto_package"`
	ProtoMessage string `json:"proto_message"`
}

// MigrationPlan represents the complete migration plan
type MigrationPlan struct {
	Resource        string                 `json:"resource"`
	CurrentType     string                 `json:"current_type"`
	NeedsMigration  bool                   `json:"needs_migration"`
	Phases          []MigrationPhase       `json:"phases"`
	TargetFiles     map[string]string      `json:"target_files"`
	ProtoInfo       *ProtoInfo             `json:"proto_info"`
	NextAction      string                 `json:"next_action"`
}

// PlanMigration creates a detailed migration plan for a resource
func PlanMigration(repoPath, resource string) (*MigrationPlan, error) {
	info, err := DetectControllerType(repoPath, resource)
	if err != nil {
		return nil, err
	}

	if !info.MigrationNeeded {
		return nil, fmt.Errorf("%s is already a direct controller at %s.\nNo migration needed. Use kcc_add_field to add fields.",
			resource, *info.Location)
	}

	if info.Service == nil || info.Version == nil {
		return nil, fmt.Errorf("could not determine service/version for %s.\nFound at: %s",
			resource, *info.Location)
	}

	resourceLower := strings.ToLower(resource)
	service := *info.Service
	version := *info.Version

	targetFiles := map[string]string{
		"types_file":        fmt.Sprintf("apis/%s/%s/%s_types.go", service, version, resourceLower),
		"identity_file":     fmt.Sprintf("apis/%s/%s/%s_identity.go", service, version, resourceLower),
		"controller_file":   fmt.Sprintf("pkg/controller/direct/%s/%s_controller.go", service, resourceLower),
		"mapper_file":       fmt.Sprintf("pkg/controller/direct/%s/mapper.generated.go", service),
		"mockgcp_file":      fmt.Sprintf("mockgcp/mock%s/%s.go", service, resourceLower),
		"test_fixtures_dir": fmt.Sprintf("pkg/test/resourcefixture/testdata/basic/%s/%s/%s", service, version, resourceLower),
	}

	protoTask := "⚠️  Check if proto exists in mockgcp/third_party/googleapis"
	if info.HasProto && info.ProtoLocation != nil {
		protoTask = fmt.Sprintf("✅ Proto exists at %s", *info.ProtoLocation)
	}

	phases := []MigrationPhase{
		{
			Phase:       1,
			Name:        "Proto Definitions",
			Description: "Ensure proto definitions exist for the resource",
			Tasks: []string{
				protoTask,
				"Identify proto package and message name",
				"Note any custom fields needed",
			},
			EstimatedTime: "1-2 hours",
		},
		{
			Phase:       2,
			Name:        "API Types (KRM)",
			Description: "Create Kubernetes resource model types",
			Tasks: []string{
				fmt.Sprintf("Create %s", targetFiles["types_file"]),
				"Define Spec struct with all fields",
				"Add +kcc:proto= annotations for each field",
				"Define nested types if needed",
				"Follow naming conventions (PascalCase)",
			},
			EstimatedTime: "4-6 hours",
		},
		{
			Phase:       3,
			Name:        "Identity Handler",
			Description: "Create resource name parsing and construction",
			Tasks: []string{
				fmt.Sprintf("Create %s", targetFiles["identity_file"]),
				"Implement resource name format (e.g., projects/{project}/...)",
				"Add parent identity handling",
				"Implement String() method",
			},
			EstimatedTime: "2-3 hours",
		},
		{
			Phase:       4,
			Name:        "Mapper Generation",
			Description: "Generate KRM ↔ Proto conversion functions",
			Tasks: []string{
				fmt.Sprintf("Run ./dev/tasks/generate-mapper %s", resource),
				fmt.Sprintf("Verify %s updated", targetFiles["mapper_file"]),
				"Check for any mapper errors",
			},
			EstimatedTime: "30 minutes",
		},
		{
			Phase:       5,
			Name:        "Controller Implementation",
			Description: "Implement CRUD operations",
			Tasks: []string{
				fmt.Sprintf("Create %s", targetFiles["controller_file"]),
				"Implement Find() method",
				"Implement Create() method",
				"Implement Update() method with field mask",
				"Implement Delete() method",
				"Implement Export() method",
				"Add reference resolution (if needed)",
			},
			EstimatedTime: "6-8 hours",
		},
		{
			Phase:       6,
			Name:        "MockGCP Implementation",
			Description: "Create mock GCP server for testing",
			Tasks: []string{
				fmt.Sprintf("Create %s", targetFiles["mockgcp_file"]),
				"Implement Get method",
				"Implement List method",
				"Implement Create method with LRO",
				"Implement Update method with LRO",
				"Implement Delete method with LRO",
				"Add resource name parsing",
			},
			EstimatedTime: "4-6 hours",
		},
		{
			Phase:       7,
			Name:        "Test Fixtures",
			Description: "Create test cases",
			Tasks: []string{
				fmt.Sprintf("Create %s/", targetFiles["test_fixtures_dir"]),
				"Create create.yaml with initial resource",
				"Create update.yaml with changed fields",
				"Add _http.log for HTTP golden files",
				"Run tests and update golden files",
			},
			EstimatedTime: "2-3 hours",
		},
	}

	// Construct proto info
	var protoInfo *ProtoInfo
	if info.Service != nil && info.Version != nil {
		protoVersion := *info.Version
		if protoVersion == "v1alpha1" || protoVersion == "v1beta1" {
			protoVersion = "v1"
		}
		protoInfo = &ProtoInfo{
			Service:      *info.Service,
			Version:      protoVersion,
			ProtoPackage: fmt.Sprintf("google.cloud.%s.v1", *info.Service),
			ProtoMessage: resource,
		}
	}

	nextAction := "Check Phase 1: Verify proto definitions exist"
	if info.HasProto {
		nextAction = "Start with Phase 2: Create API types using kcc_scaffold_types"
	}

	return &MigrationPlan{
		Resource:       resource,
		CurrentType:    info.Type,
		NeedsMigration: true,
		Phases:         phases,
		TargetFiles:    targetFiles,
		ProtoInfo:      protoInfo,
		NextAction:     nextAction,
	}, nil
}
