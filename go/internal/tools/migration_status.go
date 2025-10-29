package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// PhaseStatus represents the status of a migration phase
type PhaseStatus struct {
	Number     int             `json:"number"`
	Name       string          `json:"name"`
	Status     string          `json:"status"` // "not_started", "in_progress", "completed"
	FilesExist map[string]bool `json:"files_exist"`
}

// MigrationStatus represents the overall migration status
type MigrationStatus struct {
	Resource         string        `json:"resource"`
	OverallProgress  string        `json:"overall_progress"`
	CurrentPhase     PhaseStatus   `json:"current_phase"`
	Phases           []PhaseStatus `json:"phases"`
	NextAction       string        `json:"next_action"`
	CanAddFields     bool          `json:"can_add_fields"`
}

// GetMigrationStatus checks the migration status for a resource
func GetMigrationStatus(repoPath, resource string) (*MigrationStatus, error) {
	info, err := DetectControllerType(repoPath, resource)
	if err != nil {
		return nil, err
	}

	// If already migrated to direct controller
	if info.Type == "direct" {
		return &MigrationStatus{
			Resource:        resource,
			OverallProgress: "Migration complete",
			CurrentPhase: PhaseStatus{
				Number: 7,
				Name:   "Complete",
				Status: "completed",
			},
			Phases:       []PhaseStatus{},
			NextAction:   "Migration complete. Use kcc_add_field to add new fields.",
			CanAddFields: true,
		}, nil
	}

	if info.Service == nil || info.Version == nil {
		return nil, fmt.Errorf("could not determine service/version for %s", resource)
	}

	resourceLower := strings.ToLower(resource)
	service := *info.Service
	version := *info.Version

	// Define expected files for each phase
	type phaseDefinition struct {
		number int
		name   string
		files  map[string]string
	}

	protoLocation := fmt.Sprintf("mockgcp/third_party/googleapis/google/cloud/%s/v1/*.proto", service)
	if info.ProtoLocation != nil {
		protoLocation = *info.ProtoLocation
	}

	phases := []phaseDefinition{
		{
			number: 1,
			name:   "Proto Definitions",
			files: map[string]string{
				"proto": protoLocation,
			},
		},
		{
			number: 2,
			name:   "API Types",
			files: map[string]string{
				"types": fmt.Sprintf("apis/%s/%s/%s_types.go", service, version, resourceLower),
			},
		},
		{
			number: 3,
			name:   "Identity Handler",
			files: map[string]string{
				"identity": fmt.Sprintf("apis/%s/%s/%s_identity.go", service, version, resourceLower),
			},
		},
		{
			number: 4,
			name:   "Mapper",
			files: map[string]string{
				"mapper": fmt.Sprintf("pkg/controller/direct/%s/mapper.generated.go", service),
			},
		},
		{
			number: 5,
			name:   "Controller",
			files: map[string]string{
				"controller": fmt.Sprintf("pkg/controller/direct/%s/%s_controller.go", service, resourceLower),
			},
		},
		{
			number: 6,
			name:   "MockGCP",
			files: map[string]string{
				"mockgcp": fmt.Sprintf("mockgcp/mock%s/%s.go", service, resourceLower),
			},
		},
		{
			number: 7,
			name:   "Test Fixtures",
			files: map[string]string{
				"create_yaml": fmt.Sprintf("pkg/test/resourcefixture/testdata/basic/%s/%s/%s/create.yaml", service, version, resourceLower),
				"update_yaml": fmt.Sprintf("pkg/test/resourcefixture/testdata/basic/%s/%s/%s/update.yaml", service, version, resourceLower),
			},
		},
	}

	// Check which files exist
	phasesStatus := make([]PhaseStatus, 0, len(phases))
	for _, phase := range phases {
		filesExist := make(map[string]bool)
		allExist := true
		someExist := false

		for key, filePath := range phase.files {
			exists := fileExists(filepath.Join(repoPath, filePath))
			filesExist[key] = exists
			if exists {
				someExist = true
			}
			if !exists {
				allExist = false
			}
		}

		status := "not_started"
		if allExist {
			status = "completed"
		} else if someExist {
			status = "in_progress"
		}

		phasesStatus = append(phasesStatus, PhaseStatus{
			Number:     phase.number,
			Name:       phase.name,
			Status:     status,
			FilesExist: filesExist,
		})
	}

	// Find current phase (first incomplete)
	var currentPhase PhaseStatus
	found := false
	for _, p := range phasesStatus {
		if p.Status != "completed" {
			currentPhase = p
			found = true
			break
		}
	}
	if !found {
		currentPhase = phasesStatus[len(phasesStatus)-1]
	}

	// Count completed
	completed := 0
	for _, p := range phasesStatus {
		if p.Status == "completed" {
			completed++
		}
	}
	total := len(phasesStatus)

	// Determine next action
	nextAction := ""
	if currentPhase.Status == "not_started" {
		switch currentPhase.Number {
		case 1:
			nextAction = "Check proto definitions exist in mockgcp/third_party/googleapis"
		case 2:
			nextAction = "Use kcc_scaffold_types to create API types file"
		case 3:
			nextAction = "Use kcc_scaffold_identity to create identity handler"
		case 4:
			nextAction = "Run kcc_generate_mapper to generate mapper functions"
		case 5:
			nextAction = "Use kcc_scaffold_controller to create controller"
		case 6:
			nextAction = "Use kcc_scaffold_mockgcp to create MockGCP implementation"
		case 7:
			nextAction = "Create test fixtures (create.yaml and update.yaml)"
		}
	} else if currentPhase.Status == "in_progress" {
		nextAction = fmt.Sprintf("Complete phase %d: %s", currentPhase.Number, currentPhase.Name)
	}

	return &MigrationStatus{
		Resource:        resource,
		OverallProgress: fmt.Sprintf("%d/%d phases", completed, total),
		CurrentPhase:    currentPhase,
		Phases:          phasesStatus,
		NextAction:      nextAction,
		CanAddFields:    completed >= 4, // Need types, identity, mapper, controller
	}, nil
}

// fileExists is already defined in find_resource.go
// but duplicating here to avoid circular import issues if needed
func fileExistsLocal(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
