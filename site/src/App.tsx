import { fileCopyCommands, resolveRequirements, skillsAddCommand, type Shell } from '@services/install-commands.service'
import { useEffect, useMemo, useState } from 'react'

import { dependencyMap, fetchCatalog, type Catalog } from './catalog'

const SHELLS: Shell[] = ['bash', 'powershell', 'cmd']

/** agent / rule 文件的下载根：Pages 域名 + base 路径，不依赖 raw.githubusercontent.com */
function pagesBase(): string {
  return location.origin + import.meta.env.BASE_URL.replace(/\/$/, '')
}

function toggle(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button type="button" className="copy" onClick={copy}>
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

function CommandBlock({ title, note, command }: { title: string; note?: string; command: string | null }) {
  if (!command) return null
  return (
    <section className="command-block">
      <div className="command-head">
        <h3>{title}</h3>
        <CopyButton text={command} />
      </div>
      {note && <p className="note">{note}</p>}
      <pre>
        <code>{command}</code>
      </pre>
    </section>
  )
}

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [selectedAgents, setSelectedAgents] = useState<ReadonlySet<string>>(new Set())
  const [selectedRules, setSelectedRules] = useState<ReadonlySet<string>>(new Set())
  const [shell, setShell] = useState<Shell>('bash')
  const [scope, setScope] = useState<'global' | 'project'>('global')
  const [assumeYes, setAssumeYes] = useState(false)
  const [agentTargetsText, setAgentTargetsText] = useState('')
  const [query, setQuery] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((error) => setLoadError(errorMessage(error)))
  }, [])

  const deps = useMemo(() => (catalog ? dependencyMap(catalog) : {}), [catalog])
  const agentPathByName = useMemo(() => new Map((catalog?.agents ?? []).map((a) => [a.name, a.path])), [catalog])
  const rulePathByName = useMemo(() => new Map((catalog?.rules ?? []).map((r) => [r.name, r.path])), [catalog])
  const vendors = useMemo(() => [...new Set((catalog?.skills ?? []).map((s) => s.vendor))].sort(), [catalog])

  const requirements = useMemo(() => resolveRequirements([...selected], deps), [selected, deps])
  const missing = requirements.missingSkills

  const agentFiles = [
    ...new Set([
      ...selectedAgents,
      ...requirements.agents.map((name) => agentPathByName.get(name)).filter((p) => p !== undefined),
    ]),
  ]
  const ruleFiles = [
    ...new Set([
      ...selectedRules,
      ...requirements.rules.map((name) => rulePathByName.get(name)).filter((p) => p !== undefined),
    ]),
  ]

  const agentTargets = agentTargetsText.split(/[,\s]+/).filter(Boolean)
  let skillsCommand: string | null = null
  let skillsError: string | null = null
  if (catalog !== null && selected.size > 0) {
    try {
      skillsCommand = skillsAddCommand({ skills: [...selected], scope, agents: agentTargets, yes: assumeYes, shell })
    } catch (error) {
      skillsError = errorMessage(error)
    }
  }
  const base = pagesBase()
  const agentCommand =
    agentFiles.length > 0 ? fileCopyCommands(agentFiles, { shell, baseUrl: base, targetDir: '.cursor/agents' }) : null
  const ruleCommand =
    ruleFiles.length > 0 ? fileCopyCommands(ruleFiles, { shell, baseUrl: base, targetDir: '.cursor/rules' }) : null

  if (loadError) {
    return <main className="error-page">Failed to load catalog: {loadError}</main>
  }
  if (!catalog) {
    return <main className="loading">Loading catalog…</main>
  }

  const visibleSkills = catalog.skills.filter(
    (s) =>
      !s.internal &&
      (vendorFilter === '' || s.vendor === vendorFilter) &&
      (query === '' ||
        s.name.includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())),
  )

  const addMissing = () => setSelected(new Set([...selected, ...missing]))

  return (
    <main>
      <header>
        <h1>rockcookies/skills</h1>
        <p>
          {catalog.skills.length} skills · {catalog.agents.length} agents · {catalog.rules.length} rules ·{' '}
          <a href="https://github.com/rockcookies/skills">repo</a>
        </p>
        <p className="note">
          <code>npx skills add</code> installs skills only. Agents and rules are delivered as copy commands from this
          site. Single branch <code>main</code>; this site deploys from the Pages artifact.
        </p>
      </header>

      <section>
        <h2>Packs</h2>
        <div className="packs">
          {catalog.packs.map((pack) => {
            const allSelected = pack.skills.every((name) => selected.has(name))
            return (
              <label key={pack.id} className="pack">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    setSelected(() => {
                      const next = new Set(selected)
                      for (const name of pack.skills) {
                        if (allSelected) next.delete(name)
                        else next.add(name)
                      }
                      return next
                    })
                  }}
                />
                <span className="pack-name">{pack.id}</span>
                <span className="pack-desc">{pack.description}</span>
                <span className="pack-count">{pack.skills.length} skills</span>
              </label>
            )
          })}
        </div>
      </section>

      <section>
        <h2>Skills</h2>
        <div className="filters">
          <input
            type="search"
            placeholder="Search name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="note">{selected.size} selected</span>
        </div>
        <ul className="skill-list">
          {visibleSkills.map((skill) => (
            <li key={skill.name}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(skill.name)}
                  onChange={() => setSelected(toggle(selected, skill.name))}
                />
                <code>{skill.name}</code>
                <span className="vendor">{skill.vendor}</span>
                <span className="desc">{skill.description}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Agents</h2>
        <p className="note">
          Required by selected skills (via dependencies) or checked manually. Not installed by{' '}
          <code>npx skills add</code> — copied from this site instead.
        </p>
        <ul className="file-list">
          {catalog.agents.map((agent) => (
            <li key={agent.path}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedAgents.has(agent.path)}
                  onChange={() => setSelectedAgents(toggle(selectedAgents, agent.path))}
                />
                <code>{agent.name}</code>
                <span className="vendor">{agent.path}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Rules</h2>
        <ul className="file-list">
          {catalog.rules.map((rule) => (
            <li key={rule.path}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedRules.has(rule.path)}
                  onChange={() => setSelectedRules(toggle(selectedRules, rule.path))}
                />
                <code>{rule.name}</code>
                <span className="vendor">{rule.path}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="install">
        <h2>Install</h2>
        <div className="install-options">
          <label>
            Shell
            <select value={shell} onChange={(e) => setShell(e.target.value as Shell)}>
              {SHELLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scope
            <select value={scope} onChange={(e) => setScope(e.target.value as 'global' | 'project')}>
              <option value="global">global (-g)</option>
              <option value="project">project</option>
            </select>
          </label>
          <label>
            Target agents (-a)
            <input
              type="text"
              placeholder="claude-code, cursor"
              value={agentTargetsText}
              onChange={(e) => setAgentTargetsText(e.target.value)}
            />
          </label>
          <label className="inline">
            <input type="checkbox" checked={assumeYes} onChange={() => setAssumeYes(!assumeYes)} />
            assume yes (-y)
          </label>
        </div>

        {missing.length > 0 && (
          <div className="missing">
            <p>
              Missing dependencies of selected skills:{' '}
              {missing.map((name) => (
                <code key={name}>{name}</code>
              ))}
            </p>
            <button type="button" onClick={addMissing}>
              Add missing ({missing.length})
            </button>
          </div>
        )}

        {skillsError && <p className="error">Invalid option: {skillsError}</p>}
        <CommandBlock title="Skills" command={skillsCommand} />
        <CommandBlock
          title="Agents (copy to ~/.cursor/agents)"
          note="npx skills add does not install agents; run these to fetch them from this site."
          command={agentCommand}
        />
        <CommandBlock
          title="Rules (copy to ~/.cursor/rules)"
          note="npx skills add does not install rules; run these to fetch them from this site."
          command={ruleCommand}
        />
        {selected.size === 0 && <p className="note">Select skills above to generate install commands.</p>}
      </section>
    </main>
  )
}
