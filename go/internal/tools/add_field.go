package tools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// AddFieldParams contains parameters for adding a field
type AddFieldParams struct {
	Resource    string `json:"resource"`
	FieldName   string `json:"field_name"`
	FieldType   string `json:"field_type"` // "string", "int64", "bool", "object", "array"
	ProtoPath   string `json:"proto_path"`
	ParentType  string `json:"parent_type,omitempty"`
	Description string `json:"description,omitempty"`
	JSONName    string `json:"json_name,omitempty"`
}

// AddField adds a field to a KCC resource types file
func AddField(repoPath, typesFile string, params AddFieldParams) (string, error) {
	filePath := filepath.Join(repoPath, typesFile)

	// Read file
	contentBytes, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	content := string(contentBytes)

	// Determine Go type
	goType, err := getGoType(params.FieldType, params.Resource, params.FieldName)
	if err != nil {
		return "", err
	}

	// JSON name (default to camelCase field name)
	jsonName := params.JSONName
	if jsonName == "" {
		jsonName = toCamelCase(params.FieldName)
	}

	// Build field definition
	fieldDef := buildFieldDefinition(params.FieldName, goType, jsonName, params.ProtoPath, params.Description)

	// Find insertion point
	parentType := params.ParentType
	if parentType == "" {
		parentType = fmt.Sprintf("%sSpec", params.Resource)
	}

	insertionPoint := findInsertionPoint(content, parentType)
	if insertionPoint == -1 {
		return "", fmt.Errorf("could not find parent type: %s\n\nMake sure the type exists in %s", parentType, typesFile)
	}

	// Insert field
	lines := strings.Split(content, "\n")
	newLines := make([]string, 0, len(lines)+3)
	newLines = append(newLines, lines[:insertionPoint]...)
	newLines = append(newLines, fieldDef)
	newLines = append(newLines, lines[insertionPoint:]...)
	content = strings.Join(newLines, "\n")

	// Write back
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("✅ Added field to %s\n\n%s", typesFile, fieldDef), nil
}

// getGoType determines the Go type for a field
func getGoType(fieldType, resource, fieldName string) (string, error) {
	switch fieldType {
	case "string":
		return "*string", nil
	case "int64":
		return "*int64", nil
	case "bool":
		return "*bool", nil
	case "array":
		return "[]string", nil // Default, can be customized
	case "object":
		return fmt.Sprintf("*%s_%s", resource, fieldName), nil
	default:
		return "", fmt.Errorf("unsupported field type: %s", fieldType)
	}
}

// buildFieldDefinition builds the field definition with annotations
func buildFieldDefinition(fieldName, goType, jsonName, protoPath, description string) string {
	var lines []string

	// Add description comment if provided
	if description != "" {
		lines = append(lines, fmt.Sprintf("\t// %s", description))
	}

	// Add proto annotation
	lines = append(lines, fmt.Sprintf("\t// +kcc:proto=%s", protoPath))

	// Add field
	lines = append(lines, fmt.Sprintf("\t%s %s `json:\"%s,omitempty\"`", fieldName, goType, jsonName))

	return strings.Join(lines, "\n")
}

// findInsertionPoint finds where to insert the new field
func findInsertionPoint(content, parentType string) int {
	lines := strings.Split(content, "\n")

	// Find the parent type struct
	inStruct := false
	lastFieldLine := -1

	for i, line := range lines {
		// Found the struct definition
		if strings.Contains(line, fmt.Sprintf("type %s struct {", parentType)) {
			inStruct = true
			continue
		}

		// Inside the struct, track last field line
		if inStruct {
			// Check if this is a field line (contains backticks for json tag)
			if strings.Contains(line, "`json:") {
				lastFieldLine = i
			}

			// End of struct
			if strings.TrimSpace(line) == "}" {
				// Insert before the closing brace
				return lastFieldLine + 1
			}
		}
	}

	return -1
}

// toCamelCase converts PascalCase to camelCase
func toCamelCase(str string) string {
	if len(str) == 0 {
		return str
	}
	return strings.ToLower(str[:1]) + str[1:]
}
