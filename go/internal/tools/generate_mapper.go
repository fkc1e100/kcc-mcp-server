package tools

import (
	"fmt"
	"os/exec"
)

// GenerateMapper generates the KRM ↔ Proto mapper for a resource
func GenerateMapper(repoPath, resource string) (string, error) {
	// Run the mapper generation script
	cmd := exec.Command("./dev/tasks/generate-mapper", resource)
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf(`Failed to generate mapper for %s:

%s

Make sure:
1. Proto annotations (+kcc:proto=) are correct
2. Proto definitions exist in mockgcp/third_party/googleapis/
3. Field names match proto (use snake_case in annotation)`, resource, string(output))
	}

	return fmt.Sprintf("✅ Mapper generated successfully for %s\n\n%s", resource, string(output)), nil
}
