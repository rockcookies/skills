/** skill：整棵文件树在内存里；策略只改这个 Map。 */
export interface SkillContext {
  name: string
  files: Map<string, Buffer>
  entryPath: string
}

/** agent：单文件 markdown。 */
export interface AgentContext {
  name: string
  content: string
}

export type SkillTransform = (ctx: SkillContext) => void
export type AgentTransform = (ctx: AgentContext) => void
