// 公共工具：配置、目录扫描、glob、frontmatter、markdown 解析、git 查询。零依赖，Node >= 18。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_FILE = '.agent-context.json';

export const BUILTIN_IGNORE = [
  '.git', 'node_modules', 'dist', 'build', 'out', 'target', '.turbo', '.next', '.nuxt',
  '.output', '.cache', '.venv', 'venv', '__pycache__', 'vendor', 'coverage', '.idea',
  '.gradle', '.scratch',
];

export const DEFAULT_CONFIG = {
  ignore: [], // 追加到内置忽略名之后（按目录名匹配，如 "unused"）
  exclude: [], // 作用域排除：按仓库相对路径的 glob（如 "examples/**"）
  include: [], // 强制视为单元的目录 glob（目录里没有清单文件时用）
  extraManifests: {}, // 额外清单文件 → 技术栈，如 {"BUILD.bazel": "bazel"}
  maxDepth: 6,
  rootDocs: 'docs', // 根级文档目录
  docsDirs: ['docs'], // 每个单元下被视为模块文档目录的子目录名（取第一个存在的）
  requireAgents: 'units', // root | units | all
  agentsMaxLines: 120,
  rootAgentsMaxLines: 160,
  routeCollapse: ['decisions', 'adr', 'adrs'], // 这些目录在路由表里折叠成一行
  claudeEntry: true, // 要求有 AGENTS.md 的作用域同时有 CLAUDE.md 入口
  staleCheck: true, // 用 git 时间判断文档是否落后于其 covers
  standards: [], // 仓库自己的文档规范文件（相对路径）；留空则自动探测
  // 显式作用域清单：给出后，AGENTS.md 只维护这些目录（字符串，或 {path, desc, docs, maxLines}）；
  // 不给则自动按清单文件识别。显式模式下没列入的目录永远不会被要求，也不需要 exclude。
  scopes: null,
  reportUnlisted: true, // 显式模式下，提示"有清单文件但没列入 scopes"的目录（info）
  docFrontmatter: 'type', // type：docs 下的概念文档必须有 frontmatter type（OKF）；off：不检查
};

export const MANIFESTS = {
  'package.json': 'node',
  'go.mod': 'go',
  'pom.xml': 'maven',
  'build.gradle': 'gradle',
  'build.gradle.kts': 'gradle',
  'settings.gradle': 'gradle',
  'settings.gradle.kts': 'gradle',
  'pyproject.toml': 'python',
  'Cargo.toml': 'rust',
  'composer.json': 'php',
};

export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// 读取用户配置：允许整行 // 注释（JSON 本身没有注释）。文件不存在返回 {}。
export function readUserConfig(root) {
  const p = path.join(root, CONFIG_FILE);
  if (!fs.existsSync(p)) return {};
  try {
    const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/^\s*\/\/.*$/gm, '');
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`failed to parse ${CONFIG_FILE}: ${e.message}`);
  }
}

// scopes 归一化：字符串或对象 → {path, ...覆盖项}；路径统一为仓库相对的 posix 路径，根为 '.'。
export function normalizeScopes(list) {
  if (!Array.isArray(list)) throw new Error('scopes must be an array');
  const seen = new Map();
  for (const e of list) {
    const o = typeof e === 'string' ? { path: e } : e;
    if (!o || typeof o.path !== 'string') throw new Error('each scopes entry must be a path string or an object with a "path" key');
    let p = o.path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
    if (p === '') p = '.';
    if (p.startsWith('/') || p.split('/').includes('..')) throw new Error(`scopes paths must be relative to the repo root: ${o.path}`);
    if (seen.has(p)) throw new Error(`duplicate scopes entry: "${p}" (each directory may be listed once; merge the overrides)`);
    if (o.desc !== undefined && typeof o.desc !== 'string') throw new Error(`scopes["${p}"].desc must be a string`);
    if (o.docs !== undefined && typeof o.docs !== 'string') throw new Error(`scopes["${p}"].docs must be a string`);
    if (o.maxLines !== undefined && !(Number.isInteger(o.maxLines) && o.maxLines > 0)) throw new Error(`scopes["${p}"].maxLines must be a positive integer`);
    seen.set(p, { ...o, path: p });
  }
  return [...seen.values()];
}

export function loadConfig(root) {
  const user = readUserConfig(root);
  return {
    ...DEFAULT_CONFIG,
    ...user,
    ignore: [...BUILTIN_IGNORE, ...(user.ignore || [])],
    scopes: user.scopes ? normalizeScopes(user.scopes) : null,
  };
}

// ---------- 文本读写（保留原换行风格，Windows/CRLF 友好）----------
export function readText(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return { text: raw.replace(/\r\n/g, '\n'), eol: raw.includes('\r\n') ? '\r\n' : '\n' };
}

export function writeText(file, text, eol = '\n') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, eol === '\n' ? text : text.replace(/\n/g, eol));
}

// ---------- glob ----------
export function globToRegex(glob) {
  const g = glob.replace(/\\/g, '/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

// ---------- 目录扫描 ----------
// 返回 Map<相对路径('.' 为根), {files:[], subdirs:[]}>；不跟随符号链接。
// 读不了的目录（权限等）不会让扫描中断，但会记入 tree.__issues（[{path, error}]），由 discover/audit 上报，
// 避免"没扫到"被误读成"没有"。
export function scanTree(root, config, extraRoots = []) {
  const ignore = new Set(config.ignore);
  const excl = config.exclude.map(globToRegex);
  const isExcluded = (rel) => {
    const parts = rel.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const pre = parts.slice(0, i).join('/');
      if (excl.some((r) => r.test(pre))) return true;
    }
    return false;
  };
  const tree = new Map();
  const issues = [];
  tree.__issues = issues; // 非 Map 条目，遍历不到
  const visit = (rel, depth) => {
    const abs = rel === '.' ? root : path.join(root, rel);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch (e) {
      issues.push({ path: rel, error: e.code ?? e.message });
      return;
    }
    const node = { files: [], subdirs: [] };
    tree.set(rel, node);
    for (const e of entries) {
      if (e.isSymbolicLink()) {
        node.files.push(e.name);
        continue;
      }
      if (e.isDirectory()) {
        if (ignore.has(e.name)) continue;
        const child = rel === '.' ? e.name : `${rel}/${e.name}`;
        if (isExcluded(child)) continue;
        node.subdirs.push(e.name);
        if (depth < config.maxDepth) visit(child, depth + 1);
      } else node.files.push(e.name);
    }
  };
  visit('.', 0);
  // 显式列出的目录（哪怕位于被忽略的目录里、或超出 maxDepth）也要扫到
  for (const rel of extraRoots) {
    if (rel === '.' || tree.has(rel)) continue;
    try {
      if (!fs.statSync(path.join(root, rel)).isDirectory()) continue;
    } catch (e) {
      if (e.code !== 'ENOENT') issues.push({ path: rel, error: e.code ?? e.message }); // 不存在由 SCOPE_PATH_MISSING 报告
      continue;
    }
    visit(rel, 0);
  }
  return tree;
}

export function manifestsOf(files, extra = {}) {
  const found = new Map();
  for (const f of files) {
    const stack = MANIFESTS[f] ?? extra[f] ?? (f.endsWith('.csproj') ? 'dotnet' : null);
    if (stack && !found.has(stack)) found.set(stack, f);
  }
  return found;
}

export function filesUnder(tree, scopePath) {
  const out = [];
  for (const [rel, node] of tree) {
    if (scopePath === '.' || rel === scopePath || rel.startsWith(scopePath + '/')) {
      for (const f of node.files) out.push(rel === '.' ? f : `${rel}/${f}`);
    }
  }
  return out.sort(cmp);
}

// ---------- markdown ----------
const unq = (s) => s.replace(/^["']|["']$/g, '');

// 极简 frontmatter 解析：只支持 `key: value`、`key: [a, b]`、`key:` + `- item` 列表。
export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const v = kv[2].trim();
      if (v === '') data[key] = [];
      else if (v.startsWith('[') && v.endsWith(']'))
        data[key] = v.slice(1, -1).split(',').map((s) => unq(s.trim())).filter(Boolean);
      else data[key] = unq(v);
    } else {
      const li = line.match(/^\s*-\s+(.*)$/);
      if (li && key && Array.isArray(data[key])) data[key].push(unq(li[1].trim()));
    }
  }
  return { data, body: text.slice(m[0].length) };
}

export function firstHeading(body) {
  return body.match(/^#\s+(.+?)\s*$/m)?.[1] ?? '';
}

export function stripCode(text) {
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

export function extractLinks(strippedText) {
  const out = [];
  const re = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
  for (const m of strippedText.matchAll(re)) out.push(m[1]);
  return out;
}

export function extractImports(strippedText) {
  return [...strippedText.matchAll(/^@(\S+)\s*$/gm)].map((m) => m[1]);
}

// ---------- git ----------
export function gitAvailable(root) {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// 这批路径里最近一次提交的 unix 秒。
// 返回 { time, failed, error }：time 为 null 表示这些路径没有提交记录；
// failed > 0 表示 git 本身报错（如仓库还没有任何提交），此时 time 不可信，调用方应报"未检查"而不是"没问题"。
export function gitLastCommit(root, relPaths) {
  let time = null;
  let failed = 0;
  let error = '';
  for (let i = 0; i < relPaths.length; i += 200) {
    const chunk = relPaths.slice(i, i + 200);
    try {
      const out = execFileSync(
        'git',
        ['--literal-pathspecs', 'log', '-1', '--format=%ct', '--', ...chunk],
        { cwd: root, stdio: 'pipe', encoding: 'utf8' },
      ).trim();
      if (out) time = Math.max(time ?? 0, Number(out));
    } catch (e) {
      failed++;
      error = String(e.stderr || e.message).trim().split('\n')[0];
    }
  }
  return { time, failed, error };
}

// 兼容旧调用：只要时间。
export function lastCommitTime(root, relPaths) {
  return gitLastCommit(root, relPaths).time;
}

// 工作区里有未提交改动（含未跟踪文件）的路径集合，路径相对 root、posix 风格。git 出错返回 null。
export function gitDirtyPaths(root) {
  try {
    const prefix = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: root, stdio: 'pipe', encoding: 'utf8' }).trim();
    const out = execFileSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
      cwd: root, stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    const parts = out.split('\0');
    const set = new Set();
    for (let i = 0; i < parts.length; i++) {
      const e = parts[i];
      if (e.length < 4) continue;
      const code = e.slice(0, 2);
      const p = e.slice(3);
      if (/[RC]/.test(code)) i++; // 重命名/复制：下一段是原路径，跳过
      if (prefix && !p.startsWith(prefix)) continue; // root 是仓库子目录时，只看 root 以内
      set.add(prefix ? p.slice(prefix.length) : p);
    }
    return set;
  } catch {
    return null;
  }
}

// ---------- CLI ----------
export function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') o.root = argv[++i];
    else if (a.startsWith('--')) o[a.slice(2)] = true;
    else o._.push(a);
  }
  return o;
}
