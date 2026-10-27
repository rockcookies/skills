// 生成区块：从 discover 的事实渲染出 markdown，并提供区块标记的查找/替换工具。
// 区块形如：<!-- ctx:begin units --> … <!-- ctx:end units -->，标记之外的内容脚本永不触碰。
import path from 'node:path';

export const BLOCK_IDS = ['units', 'commands', 'doc-routes'];
export const EMPTY_BODY = '_(none)_';
export const BLOCK_TITLES = {
  units: 'Subdirectories & modules',
  commands: 'Common commands',
  'doc-routes': 'Doc routes (read first)',
};

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/`/g, "'");
const rel = (scope, target) => (scope.path === '.' ? target : path.posix.relative(scope.path, target));

export function requiresAgents(scope, cfg) {
  if (scope.path === '.') return true;
  if (cfg.scopes) return true; // 显式模式：列入 scopes 的目录都要有
  if (cfg.requireAgents === 'root') return false;
  if (cfg.requireAgents === 'all') return true;
  return scope.kind === 'unit';
}

// ---------- units ----------
function renderUnits(d, scope) {
  const desc = d.scopes.filter(
    (s) => s.path !== '.' && s.path !== scope.path && (scope.path === '.' || s.path.startsWith(scope.path + '/')),
  );
  if (!desc.length) return null;
  const lines = [];
  if (scope.path === '.' && scope.stacks.length) {
    lines.push(`The root itself is a ${scope.stacks.join('+')} unit (${esc(scope.name)}).`, '');
  }
  const hasDesc = desc.some((s) => s.desc);
  lines.push(
    `| Path | Kind | Stacks | Name |${hasDesc ? ' Desc |' : ''} Entry |`,
    `|---|---|---|---|${hasDesc ? '---|' : ''}---|`,
  );
  for (const s of desc) {
    const links = [];
    if (s.agents.exists) links.push(`[AGENTS.md](${rel(scope, s.path + '/AGENTS.md')})`);
    if (s.docs?.files.length) links.push(`[docs](${rel(scope, s.docs.dir)}/)`);
    lines.push(
      `| \`${rel(scope, s.path)}/\` | ${s.kind === 'group' ? 'group' : 'unit'} | ${s.stacks.join('+') || '—'} | ${
        s.kind === 'group' ? '—' : esc(s.name)
      } |${hasDesc ? ` ${esc(s.desc) || '—'} |` : ''} ${links.join(' · ') || '—'} |`,
    );
  }
  return lines.join('\n');
}

// ---------- commands ----------
const runCmd = (pm, k) => (pm === 'yarn' ? `yarn run ${k}` : `${pm} run ${k}`);
const trunc = (s, n = 90) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function renderCommands(scope) {
  const c = scope.commands;
  if (!c) return null;
  const lines = [];
  if (c.node) {
    lines.push(`**Node** (\`package.json\`, ${c.node.pm})`, '', '| Command | Runs |', '|---|---|');
    for (const [k, v] of Object.entries(c.node.scripts)) lines.push(`| \`${runCmd(c.node.pm, k)}\` | \`${esc(trunc(String(v)))}\` |`);
  }
  if (c.make) {
    if (lines.length) lines.push('');
    lines.push('**Make** (`Makefile`): ' + c.make.map((t) => `\`make ${t}\``).join(', '));
  }
  return lines.join('\n');
}

// ---------- doc-routes ----------
export function routeEntries(scope) {
  if (!scope.docs) return [];
  const out = [];
  const seen = new Map();
  for (const f of scope.docs.files) {
    if (f.status === 'deprecated') continue; // 已废弃的文档不再作为"先读"的路由
    if (f.collapse) {
      let e = seen.get(f.collapse);
      if (!e) {
        e = { key: f.collapseRel, kind: 'dir', count: 0, readme: false, covers: [], description: '' };
        seen.set(f.collapse, e);
        out.push(e);
      }
      e.count++;
      continue;
    }
    out.push({ key: f.rel, kind: 'file', type: f.type, description: f.description || f.title, covers: f.covers, readme: f.readme });
  }
  return out.sort((a, b) => (a.readme === b.readme ? (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) : a.readme ? -1 : 1));
}

function renderDocRoutes(scope) {
  const entries = routeEntries(scope);
  if (!entries.length) return null;
  const hasType = entries.some((e) => e.type);
  const lines = [
    `| ${hasType ? 'Type | ' : ''}Covers | Read first | Notes |`,
    `|${hasType ? '---|' : ''}---|---|---|`,
  ];
  for (const e of entries) {
    const t = hasType ? `${esc(e.type) || '—'} | ` : '';
    if (e.kind === 'dir') {
      lines.push(`| ${t}— | [${e.key}/](${e.key}/) | Decision records (${e.count} files); consult before architecture calls |`);
    } else {
      const covers = e.covers.length ? e.covers.map((c) => `\`${esc(c)}\``).join(', ') : '—';
      lines.push(`| ${t}${covers} | [${e.key}](${e.key}) | ${esc(e.description) || '—'} |`);
    }
  }
  return lines.join('\n');
}

export function expectedBlocks(d, scope) {
  return { units: renderUnits(d, scope), commands: renderCommands(scope), 'doc-routes': renderDocRoutes(scope) };
}

// ---------- 区块标记 ----------
export const wrapBlock = (id, body) => `<!-- ctx:begin ${id} -->\n${body}\n<!-- ctx:end ${id} -->`;

export function findBlocks(text) {
  const begins = [...text.matchAll(/<!-- ctx:begin ([\w-]+) -->/g)].map((m) => ({ id: m[1], i: m.index, len: m[0].length }));
  const ends = [...text.matchAll(/<!-- ctx:end ([\w-]+) -->/g)].map((m) => ({ id: m[1], i: m.index, len: m[0].length }));
  const blocks = [];
  const problems = [];
  const used = new Set();
  const seen = new Set();
  for (const b of begins) {
    if (seen.has(b.id)) problems.push(`duplicate block ${b.id}`);
    seen.add(b.id);
    const e = ends.find((x) => x.id === b.id && x.i > b.i && !used.has(x));
    if (!e) {
      problems.push(`block ${b.id} is missing its end marker`);
      continue;
    }
    used.add(e);
    blocks.push({ id: b.id, start: b.i, innerStart: b.i + b.len, innerEnd: e.i, end: e.i + e.len });
  }
  for (const e of ends) if (!used.has(e)) problems.push(`block ${e.id} is missing its begin marker`);
  return { blocks, problems };
}
