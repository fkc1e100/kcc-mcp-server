import { execSync } from 'child_process';

export function generateMapper(repoPath: string, resource: string): string {
  try {
    // Run the mapper generation script
    const cmd = `./dev/tasks/generate-mapper ${resource}`;

    const output = execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return `✅ Mapper generated successfully for ${resource}\n\n${output}`;
  } catch (err: any) {
    throw new Error(
      `Failed to generate mapper for ${resource}:\n\n` +
        `${err.message}\n\n` +
        `${err.stderr || ''}\n\n` +
        `Make sure:\n` +
        `1. Proto annotations (+kcc:proto=) are correct\n` +
        `2. Proto definitions exist in mockgcp/third_party/googleapis/\n` +
        `3. Field names match proto (use snake_case in annotation)`
    );
  }
}
