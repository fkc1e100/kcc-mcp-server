package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/fkc1e100/kcc-mcp-server/go/internal/config"
	"github.com/fkc1e100/kcc-mcp-server/go/internal/gitvalidator"
	"github.com/fkc1e100/kcc-mcp-server/go/internal/tools"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	// Initialize config
	cfg, err := config.NewConfigManager()
	if err != nil {
		log.Fatalf("❌ Failed to initialize KCC MCP Server:\n%v\n", err)
	}

	gitValidator := gitvalidator.NewGitValidator(cfg)

	authorName, authorEmail := cfg.GetGitAuthor()
	fmt.Fprintf(os.Stderr, "✅ KCC MCP Server initialized\n")
	fmt.Fprintf(os.Stderr, "📁 Repository: %s\n", cfg.GetRepoPath())
	fmt.Fprintf(os.Stderr, "👤 Author: %s <%s>\n", authorName, authorEmail)

	// Create MCP server
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "kcc-contributor-server",
		Version: "1.0.0",
	}, nil)

	// Register kcc_find_resource tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_find_resource",
		Description: "Locate files for a KCC resource (types, controller, mapper, test fixtures)",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Resource string `json:"resource"`
	}) (*mcp.CallToolResult, any, error) {
		location, err := tools.FindResource(cfg.GetRepoPath(), input.Resource)
		if err != nil {
			return nil, nil, err
		}

		jsonData, _ := json.MarshalIndent(location, "", "  ")
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: string(jsonData)},
			},
		}, location, nil
	})

	// Register kcc_detect_controller_type tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_detect_controller_type",
		Description: "Detect if a resource uses direct controller or Terraform-based controller",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Resource string `json:"resource"`
	}) (*mcp.CallToolResult, any, error) {
		info, err := tools.DetectControllerType(cfg.GetRepoPath(), input.Resource)
		if err != nil {
			return nil, nil, err
		}

		jsonData, _ := json.MarshalIndent(info, "", "  ")
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: string(jsonData)},
			},
		}, info, nil
	})

	// Register kcc_generate_mapper tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_generate_mapper",
		Description: "Regenerate KRM ↔ Proto mapper after adding fields",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Resource string `json:"resource"`
	}) (*mcp.CallToolResult, any, error) {
		result, err := tools.GenerateMapper(cfg.GetRepoPath(), input.Resource)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_git_status tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_git_status",
		Description: "Get current git status",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct{}) (*mcp.CallToolResult, any, error) {
		status, err := gitValidator.GetStatus(cfg.GetRepoPath())
		if err != nil {
			return nil, nil, err
		}

		if status == "" {
			status = "Working tree clean"
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: status},
			},
		}, map[string]string{"status": status}, nil
	})

	// Register kcc_git_commit tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_git_commit",
		Description: "Create git commit with enforced rules: blocks AI attribution, uses your git identity, validates message format",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Message string   `json:"message"`
		Files   []string `json:"files,omitempty"`
	}) (*mcp.CallToolResult, any, error) {
		err := gitValidator.CreateCommit(cfg.GetRepoPath(), input.Message, input.Files)
		if err != nil {
			return nil, nil, err
		}

		authorName, authorEmail := cfg.GetGitAuthor()
		result := fmt.Sprintf("✅ Commit created successfully\n\nMessage: %s\n\nAuthor: %s <%s>",
			input.Message, authorName, authorEmail)

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_migration_status tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_migration_status",
		Description: "Check migration progress for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Resource string `json:"resource"`
	}) (*mcp.CallToolResult, any, error) {
		status, err := tools.GetMigrationStatus(cfg.GetRepoPath(), input.Resource)
		if err != nil {
			return nil, nil, err
		}

		jsonData, _ := json.MarshalIndent(status, "", "  ")
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: string(jsonData)},
			},
		}, status, nil
	})

	// Register kcc_plan_migration tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_plan_migration",
		Description: "Create detailed migration plan for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		Resource string `json:"resource"`
	}) (*mcp.CallToolResult, any, error) {
		plan, err := tools.PlanMigration(cfg.GetRepoPath(), input.Resource)
		if err != nil {
			return nil, nil, err
		}

		jsonData, _ := json.MarshalIndent(plan, "", "  ")
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: string(jsonData)},
			},
		}, plan, nil
	})

	// Register kcc_add_field tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_add_field",
		Description: "Add a field to a KCC resource types file with proto annotations",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input struct {
		TypesFile string                 `json:"types_file"`
		Params    tools.AddFieldParams   `json:"params"`
	}) (*mcp.CallToolResult, any, error) {
		result, err := tools.AddField(cfg.GetRepoPath(), input.TypesFile, input.Params)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_scaffold_types tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_scaffold_types",
		Description: "Generate API types file for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input tools.ScaffoldTypesParams) (*mcp.CallToolResult, any, error) {
		result, err := tools.ScaffoldTypes(cfg.GetRepoPath(), input)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_scaffold_identity tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_scaffold_identity",
		Description: "Generate identity handler for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input tools.ScaffoldIdentityParams) (*mcp.CallToolResult, any, error) {
		result, err := tools.ScaffoldIdentity(cfg.GetRepoPath(), input)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_scaffold_controller tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_scaffold_controller",
		Description: "Generate controller implementation for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input tools.ScaffoldControllerParams) (*mcp.CallToolResult, any, error) {
		result, err := tools.ScaffoldController(cfg.GetRepoPath(), input)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Register kcc_scaffold_mockgcp tool
	mcp.AddTool(server, &mcp.Tool{
		Name:        "kcc_scaffold_mockgcp",
		Description: "Generate MockGCP implementation for a resource",
	}, func(ctx context.Context, req *mcp.CallToolRequest, input tools.ScaffoldMockGCPParams) (*mcp.CallToolResult, any, error) {
		result, err := tools.ScaffoldMockGCP(cfg.GetRepoPath(), input)
		if err != nil {
			return nil, nil, err
		}

		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{Text: result},
			},
		}, map[string]string{"result": result}, nil
	})

	// Start server
	fmt.Fprintf(os.Stderr, "🚀 KCC MCP Server running\n")

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Fatalf("Fatal error: %v\n", err)
	}
}
