export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Injected so unit tests can simulate spawn failures and nonzero exits without a mount. */
export type CommandRunner = (command: string, args: readonly string[]) => Promise<CommandResult>;

export interface UnmountStatusAttempt {
  command: string;
  args: readonly string[];
  status: number | null;
  stderr: string;
}

export interface UnmountSpawnAttempt {
  command: string;
  args: readonly string[];
  spawnError: string;
}

export type UnmountAttempt = UnmountStatusAttempt | UnmountSpawnAttempt;

/**
 * `run` resolves when the process exits, including nonzero status. A failed
 * fusermount3 must fall through; only status 0 is a successful unmount.
 */
export class FuseUnmountError extends Error {
  readonly attempts: readonly UnmountAttempt[];

  constructor(mountPath: string, attempts: readonly UnmountAttempt[]) {
    super(`failed to unmount ${mountPath}: ${attempts.map(describeAttempt).join('; ')}`);
    this.name = 'FuseUnmountError';
    this.attempts = [...attempts];
  }
}

export async function unmountFuse(mountPath: string, run: CommandRunner): Promise<void> {
  const attempts: UnmountAttempt[] = [];
  for (const [command, args] of unmountCommands(mountPath)) {
    try {
      const result = await run(command, args);
      if (result.status === 0) return;
      attempts.push({ command, args, status: result.status, stderr: result.stderr });
    } catch (error) {
      const spawnError = error instanceof Error ? error.message : String(error);
      attempts.push({ command, args, spawnError });
    }
  }
  throw new FuseUnmountError(mountPath, attempts);
}

/** Keep the original assertion text, then record the cleanup failure after it. */
export function combineAssertionAndCleanup(assertion: unknown, cleanup: unknown): Error {
  const error = assertion instanceof Error ? assertion : new Error(String(assertion));
  const extra = cleanup instanceof Error ? cleanup.message : String(cleanup);
  error.message = `${error.message}\nCleanup also failed: ${extra}`;
  return error;
}

function unmountCommands(mountPath: string): readonly (readonly [string, readonly string[]])[] {
  return [
    ['fusermount3', ['-u', mountPath]],
    ['fusermount', ['-u', mountPath]],
    ['umount', [mountPath]],
  ];
}

function describeAttempt(attempt: UnmountAttempt): string {
  const rendered = [attempt.command, ...attempt.args].join(' ');
  if ('spawnError' in attempt) return `${rendered}: spawn error: ${attempt.spawnError}`;
  const status = attempt.status === null ? 'null' : String(attempt.status);
  return `${rendered}: status ${status}: ${attempt.stderr}`;
}
