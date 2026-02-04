export class GitError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly cwd?: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'GitError'
  }
}

export class SubmoduleNotFoundError extends GitError {
  constructor(path: string, cwd?: string) {
    super(`Submodule not found: ${path}`, 'submodule-status', cwd)
    this.name = 'SubmoduleNotFoundError'
  }
}

export class GitOperationFailedError extends GitError {
  constructor(
    command: string,
    public readonly exitCode?: number,
    cwd?: string,
    originalError?: unknown,
  ) {
    super(`Git command failed: ${command}`, command, cwd, originalError)
    this.name = 'GitOperationFailedError'
  }
}
