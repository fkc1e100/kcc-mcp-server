package config

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// KCCConfig represents the configuration for the KCC MCP Server
type KCCConfig struct {
	Git struct {
		AuthorName  string `json:"author_name"`
		AuthorEmail string `json:"author_email"`
	} `json:"git"`
	KCCRepoPath string `json:"kcc_repo_path"`
	Rules       struct {
		BlockAIAttribution         bool `json:"block_ai_attribution"`
		RequireConventionalCommits bool `json:"require_conventional_commits"`
	} `json:"rules"`
}

// ConfigManager handles loading and accessing configuration
type ConfigManager struct {
	config *KCCConfig
}

// NewConfigManager creates and initializes a new ConfigManager
func NewConfigManager() (*ConfigManager, error) {
	cm := &ConfigManager{}
	if err := cm.loadConfig(); err != nil {
		return nil, err
	}
	return cm, nil
}

// loadConfig loads configuration from environment variables, config file, or git config
// Priority: 1. Environment variables, 2. Config file, 3. Git config
func (cm *ConfigManager) loadConfig() error {
	// Load config file if it exists
	configPath := filepath.Join(os.Getenv("HOME"), ".config", "kcc-mcp-server", "config.json")
	var fileConfig KCCConfig

	if data, err := os.ReadFile(configPath); err == nil {
		if err := json.Unmarshal(data, &fileConfig); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: Could not parse config file: %v\n", err)
		}
	}

	// Get author email with priority: env > file > git config
	authorEmail := os.Getenv("KCC_AUTHOR_EMAIL")
	if authorEmail == "" {
		authorEmail = fileConfig.Git.AuthorEmail
	}
	if authorEmail == "" {
		authorEmail = getGitConfig("user.email")
	}

	// Get author name with priority: env > file > git config
	authorName := os.Getenv("KCC_AUTHOR_NAME")
	if authorName == "" {
		authorName = fileConfig.Git.AuthorName
	}
	if authorName == "" {
		authorName = getGitConfig("user.name")
	}

	// Get repo path with priority: env > file
	kccRepoPath := os.Getenv("KCC_REPO_PATH")
	if kccRepoPath == "" {
		kccRepoPath = fileConfig.KCCRepoPath
	}

	// Validate required fields
	if authorEmail == "" || authorName == "" {
		return fmt.Errorf(`Git author not configured. Set either:
1. KCC_AUTHOR_EMAIL and KCC_AUTHOR_NAME environment variables, or
2. ~/.config/kcc-mcp-server/config.json, or
3. git config user.email and user.name

Example config file:
{
  "git": {
    "author_name": "Your Name",
    "author_email": "you@example.com"
  },
  "kcc_repo_path": "/path/to/k8s-config-connector"
}`)
	}

	if kccRepoPath == "" {
		return fmt.Errorf(`KCC repository path not configured. Set either:
1. KCC_REPO_PATH environment variable, or
2. kcc_repo_path in ~/.config/kcc-mcp-server/config.json`)
	}

	// Build final config
	cm.config = &KCCConfig{}
	cm.config.Git.AuthorName = authorName
	cm.config.Git.AuthorEmail = authorEmail
	cm.config.KCCRepoPath = kccRepoPath
	cm.config.Rules.BlockAIAttribution = true // Always enforced
	cm.config.Rules.RequireConventionalCommits = fileConfig.Rules.RequireConventionalCommits || true

	return nil
}

// getGitConfig retrieves a git config value
func getGitConfig(key string) string {
	cmd := exec.Command("git", "config", key)
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

// GetConfig returns the loaded configuration
func (cm *ConfigManager) GetConfig() *KCCConfig {
	return cm.config
}

// GetGitAuthor returns the git author information
func (cm *ConfigManager) GetGitAuthor() (name, email string) {
	return cm.config.Git.AuthorName, cm.config.Git.AuthorEmail
}

// GetRepoPath returns the KCC repository path
func (cm *ConfigManager) GetRepoPath() string {
	return cm.config.KCCRepoPath
}

// IsBlockAIAttribution returns whether AI attribution blocking is enabled
func (cm *ConfigManager) IsBlockAIAttribution() bool {
	return cm.config.Rules.BlockAIAttribution
}

// IsRequireConventionalCommits returns whether conventional commits are required
func (cm *ConfigManager) IsRequireConventionalCommits() bool {
	return cm.config.Rules.RequireConventionalCommits
}
