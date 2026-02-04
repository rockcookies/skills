import { GitError } from '../errors/git.error.ts'

export function formatError(error: unknown): string {
  if (error instanceof GitError) {
    const cwd = error.cwd ? ` (${error.cwd})` : ''
    return `${error.message}${cwd}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
