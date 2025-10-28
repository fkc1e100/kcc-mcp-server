import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface KCCConfig {
  git: {
    author_name: string;
    author_email: string;
  };
  kcc_repo_path: string;
  rules?: {
    block_ai_attribution?: boolean;
    require_conventional_commits?: boolean;
  };
}

export class ConfigManager {
  private config: KCCConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    // Priority:
    // 1. Environment variables
    // 2. Config file (~/.config/kcc-mcp-server/config.json)
    // 3. Git config (fallback)

    const configPath = join(homedir(), '.config', 'kcc-mcp-server', 'config.json');
    let fileConfig: Partial<KCCConfig> = {};

    if (existsSync(configPath)) {
      try {
        fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      } catch (err) {
        console.error(`Warning: Could not parse config file: ${err}`);
      }
    }

    const authorEmail =
      process.env.KCC_AUTHOR_EMAIL ||
      fileConfig.git?.author_email ||
      this.getGitConfig('user.email');

    const authorName =
      process.env.KCC_AUTHOR_NAME ||
      fileConfig.git?.author_name ||
      this.getGitConfig('user.name');

    const kccRepoPath =
      process.env.KCC_REPO_PATH ||
      fileConfig.kcc_repo_path ||
      '';

    if (!authorEmail || !authorName) {
      throw new Error(
        'Git author not configured. Set either:\n' +
          '1. KCC_AUTHOR_EMAIL and KCC_AUTHOR_NAME environment variables, or\n' +
          '2. ~/.config/kcc-mcp-server/config.json, or\n' +
          '3. git config user.email and user.name\n\n' +
          'Example config file:\n' +
          JSON.stringify(
            {
              git: {
                author_name: 'Your Name',
                author_email: 'you@example.com',
              },
              kcc_repo_path: '/path/to/k8s-config-connector',
            },
            null,
            2
          )
      );
    }

    if (!kccRepoPath) {
      throw new Error(
        'KCC repository path not configured. Set either:\n' +
          '1. KCC_REPO_PATH environment variable, or\n' +
          '2. kcc_repo_path in ~/.config/kcc-mcp-server/config.json'
      );
    }

    this.config = {
      git: {
        author_name: authorName,
        author_email: authorEmail,
      },
      kcc_repo_path: kccRepoPath,
      rules: {
        block_ai_attribution: true, // Always enforced
        require_conventional_commits: fileConfig.rules?.require_conventional_commits ?? true,
      },
    };
  }

  private getGitConfig(key: string): string {
    try {
      return execSync(`git config ${key}`, { encoding: 'utf-8' }).trim();
    } catch {
      return '';
    }
  }

  getConfig(): KCCConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }

  getGitAuthor(): { name: string; email: string } {
    const config = this.getConfig();
    return {
      name: config.git.author_name,
      email: config.git.author_email,
    };
  }

  getRepoPath(): string {
    return this.getConfig().kcc_repo_path;
  }

  isBlockAIAttribution(): boolean {
    return this.getConfig().rules?.block_ai_attribution ?? true;
  }

  isRequireConventionalCommits(): boolean {
    return this.getConfig().rules?.require_conventional_commits ?? true;
  }
}
