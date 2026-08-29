import type { SyncItemRecord } from '../types'

/** 旧版只有 sha、没有 items 的 SYNC.json 视为未命中，会重跑该条。 */
export function shouldSkipItem(options: {
  force: boolean
  destExists: boolean
  recorded: SyncItemRecord | undefined
  sourceDigest: string
  transformId: string
}): boolean {
  if (options.force || !options.destExists) return false
  if (!options.recorded?.sourceDigest || !options.recorded.transformId) return false
  return options.recorded.sourceDigest === options.sourceDigest && options.recorded.transformId === options.transformId
}
