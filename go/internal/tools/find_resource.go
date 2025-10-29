package tools

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// ResourceLocation represents the location of KCC resource files
type ResourceLocation struct {
	Resource        string                 `json:"resource"`
	Service         string                 `json:"service"`
	Version         string                 `json:"version"`
	TypesFile       string                 `json:"types_file"`
	ControllerFile  string                 `json:"controller_file"`
	MapperFile      string                 `json:"mapper_file"`
	TestFixturesDir string                 `json:"test_fixtures_dir"`
	FilesExist      map[string]bool        `json:"files_exist"`
}

// FindResource locates files for a KCC resource
func FindResource(repoPath, resource string) (*ResourceLocation, error) {
	// Normalize resource name
	resourceLower := strings.ToLower(resource)

	// Find types file
	findCmd := fmt.Sprintf("find apis/ -name \"*%s*types.go\" 2>/dev/null || true", resourceLower)
	cmd := exec.Command("sh", "-c", findCmd)
	cmd.Dir = repoPath
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to search for types file: %w", err)
	}

	typesFiles := strings.Split(strings.TrimSpace(string(output)), "\n")
	typesFiles = removeEmpty(typesFiles)

	if len(typesFiles) == 0 {
		return nil, fmt.Errorf(`Resource not found: %s

Searched for: apis/**/*%s*types.go

Make sure the resource exists and has a direct controller.`, resource, resourceLower)
	}

	// Parse path: apis/{service}/{version}/{resource}_types.go
	typesFile := typesFiles[0]
	pathParts := strings.Split(typesFile, "/")

	if len(pathParts) < 4 {
		return nil, fmt.Errorf("unexpected types file path format: %s", typesFile)
	}

	service := pathParts[1]
	version := pathParts[2]
	resourceName := strings.TrimSuffix(pathParts[3], "_types.go")

	// Expected file locations
	controllerFile := filepath.Join("pkg", "controller", "direct", service, fmt.Sprintf("%s_controller.go", resourceName))
	mapperFile := filepath.Join("pkg", "controller", "direct", service, "mapper.generated.go")
	testFixturesDir := filepath.Join("pkg", "test", "resourcefixture", "testdata", "basic", service, version, resourceName)

	// Check existence
	filesExist := map[string]bool{
		"types":         fileExists(filepath.Join(repoPath, typesFile)),
		"controller":    fileExists(filepath.Join(repoPath, controllerFile)),
		"mapper":        fileExists(filepath.Join(repoPath, mapperFile)),
		"test_fixtures": fileExists(filepath.Join(repoPath, testFixturesDir)),
	}

	return &ResourceLocation{
		Resource:        resourceName,
		Service:         service,
		Version:         version,
		TypesFile:       typesFile,
		ControllerFile:  controllerFile,
		MapperFile:      mapperFile,
		TestFixturesDir: testFixturesDir,
		FilesExist:      filesExist,
	}, nil
}

// fileExists checks if a file or directory exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// removeEmpty removes empty strings from a slice
func removeEmpty(strs []string) []string {
	result := make([]string, 0, len(strs))
	for _, s := range strs {
		if s != "" {
			result = append(result, s)
		}
	}
	return result
}
