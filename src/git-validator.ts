import { execSync } from 'child_process';
import { ConfigManager } from './config.js';

export class GitValidator {
  constructor(private config: ConfigManager) {}

  /**
   * UNIVERSAL RULE - Blocks AI attribution for everyone
   */
  validateCommitMessage(message: string): void {
    if (!this.config.isBlockAIAttribution()) {
      return; // Rule disabled (should never happen, but safety check)
    }

    const bannedTerms = [
      'claude',
      'anthropic',
      'gemini',
      'openai',
      'gpt',
      'chatgpt',
      'co-authored-by: claude',
      'co-authored-by: gemini',
      'co-authored-by: chatgpt',
      'noreply@anthropic.com',
      'noreply@openai.com',
      '🤖 generated',
      'ai-generated',
      'generated with claude',
      'generated with gemini',
    ];

    const lowerMessage = message.toLowerCase();

    for (const term of bannedTerms) {
      if (lowerMessage.includes(term)) {
        throw new Error(
          `❌ BLOCKED: Commit message contains '${term}'\n\n` +
            `AI attribution is not allowed in k8s-config-connector contributions.\n` +
            `Remove all references to AI tools from commit messages.\n\n` +
            `This rule is enforced for ALL contributors.`
        );
      }
    }
  }

  /**
   * Validates conventional commit format (optional)
   */
  validateConventionalCommit(message: string): void {
    if (!this.config.isRequireConventionalCommits()) {
      return;
    }

    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+/;

    if (!conventionalPattern.test(message)) {
      throw new Error(
        `⚠️  Commit message does not follow conventional commit format.\n\n` +
          `Expected format: <type>(<scope>): <description>\n\n` +
          `Types: feat, fix, docs, style, refactor, perf, test, chore\n` +
          `Example: "feat: Add defaultCustomErrorResponsePolicy to ComputeURLMap"\n\n` +
          `Your message: "${message.split('\\n')[0]}"`
      );
    }
  }

  /**
   * Validates git config matches expected author
   */
  validateGitConfig(repoPath: string): void {
    const author = this.config.getGitAuthor();

    try {
      const currentEmail = execSync('git config user.email', {
        cwd: repoPath,
        encoding: 'utf-8',
      }).trim();

      const currentName = execSync('git config user.name', {
        cwd: repoPath,
        encoding: 'utf-8',
      }).trim();

      if (currentEmail !== author.email || currentName !== author.name) {
        throw new Error(
          `⚠️  Git config mismatch!\n\n` +
            `Current in repository: ${currentName} <${currentEmail}>\n` +
            `Expected from config: ${author.name} <${author.email}>\n\n` +
            `Run in ${repoPath}:\n` +
            `  git config user.email "${author.email}"\n` +
            `  git config user.name "${author.name}"`
        );
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Git config mismatch')) {
        throw new Error(`Failed to check git config: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Create a commit with validated identity
   */
  createCommit(repoPath: string, message: string, files?: string[]): void {
    // 1. Validate message (blocks AI attribution)
    this.validateCommitMessage(message);

    // 2. Validate conventional commit format
    this.validateConventionalCommit(message);

    // 3. Ensure git config matches
    this.validateGitConfig(repoPath);

    // 4. Stage files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        execSync(`git add "${file}"`, { cwd: repoPath });
      }
    } else {
      // Stage all changes
      execSync('git add -A', { cwd: repoPath });
    }

    // 5. Create commit with validated identity
    const author = this.config.getGitAuthor();

    execSync(
      `git commit -m "${message.replace(/"/g, '\\"')}"`,
      {
        cwd: repoPath,
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: author.name,
          GIT_AUTHOR_EMAIL: author.email,
          GIT_COMMITTER_NAME: author.name,
          GIT_COMMITTER_EMAIL: author.email,
        },
      }
    );
  }

  /**
   * Get current git status
   */
  getStatus(repoPath: string): string {
    try {
      return execSync('git status --short', {
        cwd: repoPath,
        encoding: 'utf-8',
      });
    } catch (err) {
      throw new Error(`Failed to get git status: ${err}`);
    }
  }
}
