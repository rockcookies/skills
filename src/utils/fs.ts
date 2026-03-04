import type { Mode, PathLike } from 'node:fs'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export async function ensureDir(dir: PathLike, mode?: Mode) {
  return await fs.promises.mkdir(dir, {
    mode: mode != null ? mode : 0o777,
    recursive: true,
  })
}

export function ensureDirSync(dir: PathLike, mode?: Mode) {
  return fs.mkdirSync(dir, {
    mode: mode != null ? mode : 0o777,
    recursive: true,
  })
}

export async function emptyDir(dir: string) {
  let items: string[]

  try {
    items = await fs.promises.readdir(dir)
  }
  catch {
    await ensureDir(dir)
    return
  }

  await Promise.all(items.map(item => fs.promises.rm(path.join(dir, item), { recursive: true, force: true })))
}

export function emptyDirSync(dir: string) {
  let items: string[]

  try {
    items = fs.readdirSync(dir)
  }
  catch {
    ensureDirSync(dir)
    return
  }

  for (const item of items) {
    const filepath = path.join(dir, item)
    fs.rmSync(filepath, { recursive: true, force: true })
  }
}

export async function pathExists(path: PathLike): Promise<boolean> {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false)
}

export const pathExistsSync = (path: PathLike) => fs.existsSync(path)

interface FindUpOptions {
  /**
   * The directory to start from.
   * @default process.cwd()
   */
  readonly cwd?: URL | string

  /**
   * The type of path to match.
   * @default 'file'
   */
  readonly type?: 'file' | 'directory'

  /**
   * A directory path where the search halts if no matches are found before reaching this point.
   * default is Root directory
   */
  readonly stopAt?: URL | string
}

const toFindPath = (urlOrPath: URL | string) => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath

// https://github.com/sindresorhus/find-up-simple/blob/main/index.js
export async function findUp(name: string, {
  cwd = process.cwd(),
  type = 'file',
  stopAt,
}: FindUpOptions = {}): Promise<string | undefined> {
  let directory = path.resolve(toFindPath(cwd) ?? '')
  const { root } = path.parse(directory)
  stopAt = path.resolve(directory, toFindPath(stopAt ?? root))
  const isAbsoluteName = path.isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : path.join(directory, name)
    try {
      const stats = await fsPromises.stat(filePath)
      if ((type === 'file' && stats.isFile()) || (type === 'directory' && stats.isDirectory())) {
        return filePath
      }
    }
    catch { }

    if (directory === stopAt || directory === root) {
      break
    }

    directory = path.dirname(directory)
  }
}

export function findUpSync(name: string, {
  cwd = process.cwd(),
  type = 'file',
  stopAt,
}: FindUpOptions = {}) {
  let directory = path.resolve(toFindPath(cwd) ?? '')
  const { root } = path.parse(directory)
  stopAt = path.resolve(directory, toFindPath(stopAt ?? root))
  const isAbsoluteName = path.isAbsolute(name)

  while (directory) {
    const filePath = isAbsoluteName ? name : path.join(directory, name)

    try {
      const stats = fs.statSync(filePath, { throwIfNoEntry: false })
      if ((type === 'file' && stats?.isFile()) || (type === 'directory' && stats?.isDirectory())) {
        return filePath
      }
    }
    catch { }

    if (directory === stopAt || directory === root) {
      break
    }

    directory = path.dirname(directory)
  }
}
