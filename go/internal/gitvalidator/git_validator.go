package gitvalidator

import (
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"

	"github.com/fkc1e100/kcc-mcp-server/go/internal/config"
)

// GitValidator handles git validation and operations
type GitValidator struct {
	config *config.ConfigManager
}

// NewGitValidator creates a new GitValidator
func NewGitValidator(cfg *config.ConfigManager) *GitValidator {
	return &GitValidator{config: cfg}
}

// ValidateCommitMessage validates that commit messages don't contain AI attribution
// This is a UNIVERSAL RULE - blocks AI attribution for everyone
func (gv *GitValidator) ValidateCommitMessage(message string) error {
	if !gv.config.IsBlockAIAttribution() {
		return nil // Rule disabled (should never happen, but safety check)
	}

	bannedTerms := []string{
		"claude",
		"anthropic",
		"gemini",
		"openai",
		"gpt",
		"chatgpt",
		"co-authored-by: claude",
		"co-authored-by: gemini",
		"co-authored-by: chatgpt",
		"noreply@anthropic.com",
		"noreply@openai.com",
		"🤖 generated",
		"ai-generated",
		"generated with claude",
		"generated with gemini",
	}

	lowerMessage := strings.ToLower(message)

	for _, term := range bannedTerms {
		if strings.Contains(lowerMessage, term) {
			return fmt.Errorf(`❌ BLOCKED: Commit message contains '%s'

AI attribution is not allowed in k8s-config-connector contributions.
Remove all references to AI tools from commit messages.

This rule is enforced for ALL contributors.`, term)
		}
	}

	return nil
}

// ValidateConventionalCommit validates conventional commit format (optional)
func (gv *GitValidator) ValidateConventionalCommit(message string) error {
	if !gv.config.IsRequireConventionalCommits() {
		return nil
	}

	conventionalPattern := regexp.MustCompile(`^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+`)

	if !conventionalPattern.MatchString(message) {
		firstLine := strings.Split(message, "\n")[0]
		return fmt.Errorf(`⚠️  Commit message does not follow conventional commit format.

Expected format: <type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, chore
Example: "feat: Add defaultCustomErrorResponsePolicy to ComputeURLMap"

Your message: "%s"`, firstLine)
	}

	return nil
}

// ValidateGitConfig validates git config matches expected author
func (gv *GitValidator) ValidateGitConfig(repoPath string) error {
	authorName, authorEmail := gv.config.GetGitAuthor()

	// Get current email
	cmd := exec.Command("git", "config", "user.email")
	cmd.Dir = repoPath
	currentEmailBytes, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("failed to check git config: %w", err)
	}
	currentEmail := strings.TrimSpace(string(currentEmailBytes))

	// Get current name
	cmd = exec.Command("git", "config", "user.name")
	cmd.Dir = repoPath
	currentNameBytes, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("failed to check git config: %w", err)
	}
	currentName := strings.TrimSpace(string(currentNameBytes))

	if currentEmail != authorEmail || currentName != authorName {
		return fmt.Errorf(`⚠️  Git config mismatch!

Current in repository: %s <%s>
Expected from config: %s <%s>

Run in %s:
  git config user.email "%s"
  git config user.name "%s"`,
			currentName, currentEmail,
			authorName, authorEmail,
			repoPath,
			authorEmail,
			authorName)
	}

	return nil
}

// CreateCommit creates a commit with validated identity
func (gv *GitValidator) CreateCommit(repoPath, message string, files []string) error {
	// 1. Validate message (blocks AI attribution)
	if err := gv.ValidateCommitMessage(message); err != nil {
		return err
	}

	// 2. Validate conventional commit format
	if err := gv.ValidateConventionalCommit(message); err != nil {
		return err
	}

	// 3. Ensure git config matches
	if err := gv.ValidateGitConfig(repoPath); err != nil {
		return err
	}

	// 4. Stage files if provided
	if len(files) > 0 {
		for _, file := range files {
			cmd := exec.Command("git", "add", file)
			cmd.Dir = repoPath
			if err := cmd.Run(); err != nil {
				return fmt.Errorf("failed to stage file %s: %w", file, err)
			}
		}
	} else {
		// Stage all changes
		cmd := exec.Command("git", "add", "-A")
		cmd.Dir = repoPath
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to stage changes: %w", err)
		}
	}

	// 5. Create commit with validated identity
	authorName, authorEmail := gv.config.GetGitAuthor()

	cmd := exec.Command("git", "commit", "-m", message)
	cmd.Dir = repoPath
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("GIT_AUTHOR_NAME=%s", authorName),
		fmt.Sprintf("GIT_AUTHOR_EMAIL=%s", authorEmail),
		fmt.Sprintf("GIT_COMMITTER_NAME=%s", authorName),
		fmt.Sprintf("GIT_COMMITTER_EMAIL=%s", authorEmail),
	)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	return nil
}

// GetStatus gets current git status
func (gv *GitValidator) GetStatus(repoPath string) (string, error) {
	cmd := exec.Command("git", "status", "--short")
	cmd.Dir = repoPath
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get git status: %w", err)
	}
	return string(output), nil
}
