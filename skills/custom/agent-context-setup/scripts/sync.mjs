// 同步生成区块、按需脚手架；并生成/维护 .agent-context.json 里的 scopes（init 子命令的后端）。
// 默认 dry-run，加 --write 才落盘。
// 用法：node ctx.mjs sync [--root <dir>] [--write] [--scaffold] [--add-blocks] [--json]
//   --scaffold    为缺失的 AGENTS.md / CLAUDE.md 按模板新建（永不覆盖已有文件）
//   --add-blocks  给已有 AGENTS.md 末尾追加缺失的生成区块（只追加，不改其他内容）
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover.mjs';
import { CONFIG_FILE, SKILL_DIR, loadConfig, normalizeScopes, readText, readUserConfig, writeText } from './lib.mjs';
import {
  BLOCK_IDS, BLOCK_TITLES, EMPTY_BODY, expectedBlocks, findBlocks, requiresAgents, wrapBlock,
} from './render.mjs';

const join = (scopePath, name) => (scopePath === '.' ? name : `${scopePath}/${name}`);

function scaffoldAgents(d, s, blocks, planned) {
  const tplName = s.path === '.' ? 'root-agents.md' : 'scope-agents.md';
  let out = fs.readFileSync(path.join(SKILL_DIR, 'references', 'templates', tplName), 'utf8').replace(/\r\n/g, '\n');

  // 继承目标：最近的、已有或将被创建 AGENTS.md 的祖先
  let inherit = 'AGENTS.md';
  if (s.path !== '.') {
    const parts = s.path.split('/');
    let target = '.';
    for (let i = parts.length - 1; i >= 1; i--) {
      const anc = parts.slice(0, i).join('/');
      if (planned.has(anc)) {
        target = anc;
        break;
      }
    }
    inherit = path.posix.relative(s.path, join(target, 'AGENTS.md'));
  }
  const vars = { name: s.name, path: s.path, stacks: s.stacks.join('+') || 'directory', inherit };

  out = out.replace(/\{\{#([\w-]+)\}\}\n?([\s\S]*?)\{\{\/\1\}\}\n?/g, (_, id, inner) => (blocks[id] ? inner : ''));
  out = out.replace(/\{\{block:([\w-]+)\}\}/g, (_, id) => wrapBlock(id, blocks[id] ?? EMPTY_BODY));
  out = out.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  return out.replace(/\n{3,}/g, '\n\n');
}

export function planSync(d, opts = {}) {
  const actions = [];
  const planned = new Set(d.scopes.filter((s) => s.agents.exists).map((s) => s.path));
  // 渲染用视图：把"将被创建"的 AGENTS.md 也算作已存在，让生成区块一次到位（脚手架后无需再同步一轮）
  const will = new Set(planned);
  if (opts.scaffold) for (const s of d.scopes) if (requiresAgents(s, d.config)) will.add(s.path);
  const view = { ...d, scopes: d.scopes.map((s) => ({ ...s, agents: { ...s.agents, exists: will.has(s.path) } })) };

  for (const s of d.scopes) {
    const abs = path.join(d.root, s.path === '.' ? '' : s.path);
    const agentsFile = join(s.path, 'AGENTS.md');
    const blocks = expectedBlocks(view, view.scopes.find((x) => x.path === s.path));

    if (!s.agents.exists) {
      if (opts.scaffold && requiresAgents(s, d.config)) {
        planned.add(s.path);
        actions.push({
          type: 'create',
          file: agentsFile,
          abs: path.join(abs, 'AGENTS.md'),
          content: scaffoldAgents(d, s, blocks, planned),
        });
      }
    } else {
      const abs1 = path.join(abs, 'AGENTS.md');
      const { text, eol } = readText(abs1);
      const { blocks: found, problems } = findBlocks(text);
      if (problems.length) {
        actions.push({ type: 'skip', file: agentsFile, reason: `unbalanced ctx markers, left untouched: ${problems.join('; ')}` });
      } else {
        let out = text;
        const changed = [];
        for (const b of [...found].sort((x, y) => y.start - x.start)) {
          if (!BLOCK_IDS.includes(b.id)) continue;
          const body = (blocks[b.id] ?? EMPTY_BODY).trim();
          if (out.slice(b.innerStart, b.innerEnd).trim() !== body) {
            out = `${out.slice(0, b.innerStart)}\n${body}\n${out.slice(b.innerEnd)}`;
            changed.push(b.id);
          }
        }
        if (opts.addBlocks) {
          const have = new Set(found.map((b) => b.id));
          for (const id of BLOCK_IDS) {
            if (!have.has(id) && blocks[id]) {
              out = `${out.replace(/\n*$/, '\n')}\n## ${BLOCK_TITLES[id]}\n\n${wrapBlock(id, blocks[id])}\n`;
              changed.push(`+${id}`);
            }
          }
        }
        if (out !== text) actions.push({ type: 'update', file: agentsFile, abs: abs1, content: out, eol, blocks: changed });
      }
    }

    if (d.config.claudeEntry && planned.has(s.path)) {
      const claudeFile = join(s.path, 'CLAUDE.md');
      if (s.claude.state === 'missing' && opts.scaffold) {
        actions.push({ type: 'create', file: claudeFile, abs: path.join(abs, 'CLAUDE.md'), content: '@AGENTS.md\n' });
      } else if (s.claude.state === 'divergent') {
        actions.push({ type: 'skip', file: claudeFile, reason: 'CLAUDE.md has no link to AGENTS.md, left untouched; after confirming, edit it manually to the single line @AGENTS.md' });
      }
    }
  }
  return actions;
}

export function applySync(actions, { write = false } = {}) {
  if (!write) return;
  for (const a of actions) if (a.type === 'create' || a.type === 'update') writeText(a.abs, a.content, a.eol ?? '\n');
}

// ---------- init：探测/写入 scopes ----------
export function suggestScopes(root, { groups = false } = {}) {
  const config = { ...loadConfig(root), scopes: null }; // 用自动模式探测
  const d = discover(root, { config });
  return d.scopes
    .filter((s) => s.path === '.' || s.kind === 'unit' || (s.kind === 'group' && (groups || s.agents.exists)))
    .map((s) => s.path);
}

export function writeScopes(root, paths, { force = false } = {}) {
  const user = readUserConfig(root);
  if (user.scopes && !force) {
    return { written: false, reason: 'scopes already exist; pass --force to regenerate from the current code (desc/docs overrides on same-path entries are kept)' };
  }
  const old = new Map((user.scopes ? normalizeScopes(user.scopes) : []).map((o) => [o.path, o]));
  const scopes = paths.map((p) => {
    const o = old.get(p);
    return o && Object.keys(o).length > 1 ? o : p;
  });
  const { scopes: _drop, ...rest } = user;
  const file = path.join(root, CONFIG_FILE);
  fs.writeFileSync(file, JSON.stringify({ scopes, ...rest }, null, 2) + '\n');
  return { written: true, file };
}
