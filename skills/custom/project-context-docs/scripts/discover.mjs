// 发现仓库里的"作用域"（scope）。不依赖目录命名：以清单文件（package.json / go.mod / pom.xml …）定位单元，
// 以"含有单元的无清单目录"定位分组，仓库根永远是一个作用域。
// 用法：node ctx.mjs discover [--root <dir>]   → 输出 JSON
import fs from 'node:fs';
import path from 'node:path';
import {
  cmp, firstHeading, globToRegex, loadConfig, manifestsOf,
  parseFrontmatter, readText, scanTree,
} from './lib.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

function nameFor(abs, stack, file, fallback) {
  try {
    const full = path.join(abs, file);
    if (stack === 'node' || stack === 'php') return readJson(full).name ?? fallback;
    const t = fs.readFileSync(full, 'utf8');
    if (stack === 'go') return t.match(/^module\s+(\S+)/m)?.[1] ?? fallback;
    if (stack === 'maven') {
      const s = t.replace(/<parent>[\s\S]*?<\/parent>/, '');
      return s.match(/<artifactId>\s*([^<\s]+)\s*<\/artifactId>/)?.[1] ?? fallback;
    }
    if (stack === 'python' || stack === 'rust') return t.match(/^name\s*=\s*["']([^"']+)["']/m)?.[1] ?? fallback;
  } catch {
    /* 取不到就用目录名 */
  }
  return fallback;
}

function workspaceKinds(abs, files) {
  const k = [];
  const has = (f) => files.includes(f);
  if (has('pnpm-workspace.yaml')) k.push('pnpm');
  if (has('turbo.json')) k.push('turbo');
  if (has('nx.json')) k.push('nx');
  if (has('lerna.json')) k.push('lerna');
  if (has('go.work')) k.push('go-work');
  if (has('settings.gradle') || has('settings.gradle.kts')) k.push('gradle');
  try {
    if (has('package.json') && readJson(path.join(abs, 'package.json')).workspaces) k.push('npm-workspaces');
    if (has('pom.xml') && fs.readFileSync(path.join(abs, 'pom.xml'), 'utf8').includes('<modules>')) k.push('maven-modules');
    if (has('Cargo.toml') && fs.readFileSync(path.join(abs, 'Cargo.toml'), 'utf8').includes('[workspace]')) k.push('cargo-workspace');
  } catch {
    /* 忽略 */
  }
  return k;
}

function makeScope(root, rel, kind, node, manifests) {
  const abs = rel === '.' ? root : path.join(root, rel);
  const stacks = [...manifests.keys()].sort();
  const fallback = rel === '.' ? path.basename(root) : path.posix.basename(rel);
  const names = {};
  for (const st of stacks) names[st] = nameFor(abs, st, manifests.get(st), fallback);

  const agents = { exists: false, lines: 0, blocks: [], todo: 0 };
  if (node.files.includes('AGENTS.md')) {
    const { text } = readText(path.join(abs, 'AGENTS.md'));
    agents.exists = true;
    agents.lines = text.replace(/\n$/, '').split('\n').length;
    agents.blocks = [...text.matchAll(/<!-- ctx:begin ([\w-]+) -->/g)].map((m) => m[1]);
    agents.todo = (text.match(/TODO\(ctx\)/g) || []).length;
  }

  const claude = { exists: false, state: 'missing' };
  if (node.files.includes('CLAUDE.md')) {
    claude.exists = true;
    const cf = path.join(abs, 'CLAUDE.md');
    try {
      if (fs.lstatSync(cf).isSymbolicLink()) {
        claude.state = path.basename(fs.readlinkSync(cf)) === 'AGENTS.md' ? 'symlink' : 'divergent';
      } else {
        claude.state = /^@AGENTS\.md\s*$/m.test(readText(cf).text) ? 'import' : 'divergent';
      }
    } catch {
      claude.state = 'divergent';
    }
  }

  return {
    path: rel,
    kind,
    stacks,
    manifests: Object.fromEntries(manifests),
    name: stacks.length ? names[stacks[0]] : fallback,
    names,
    workspace: workspaceKinds(abs, node.files),
    depth: rel === '.' ? 0 : rel.split('/').length,
    parent: null,
    inheritsFrom: null,
    agents,
    claude,
    docs: null,
    commands: null,
    listed: false, // 显式模式下由 scopes 列入
    desc: '', // scopes 里写的一句话职责，会渲染进 units 区块
    docsOverride: null,
    maxLines: null,
  };
}

function docsFor(tree, scopes, config, s) {
  const names = s.docsOverride ? [s.docsOverride] : s.path === '.' ? [config.rootDocs] : config.docsDirs;
  const collapse = new Set(config.routeCollapse.map((x) => x.toLowerCase()));
  for (const name of names) {
    const dir = s.path === '.' ? name : `${s.path}/${name}`;
    if (!tree.has(dir)) continue;
    const paths = [];
    const walk = (d) => {
      const n = tree.get(d);
      if (!n) return;
      for (const f of n.files.filter((x) => /\.md$/i.test(x)).sort(cmp)) paths.push(`${d}/${f}`);
      for (const sub of [...n.subdirs].sort(cmp)) {
        const c = `${d}/${sub}`;
        if (scopes.has(c)) continue; // 嵌套单元的文档归它自己
        walk(c);
      }
    };
    walk(dir);
    const relTo = (p) => (s.path === '.' ? p : path.posix.relative(s.path, p));
    const files = paths.map((p) => {
      const { text } = readText(path.join(tree.__root, p));
      const { data, body } = parseFrontmatter(text);
      const segs = path.posix.relative(dir, path.posix.dirname(p)).split('/').filter(Boolean);
      const ci = segs.findIndex((x) => collapse.has(x.toLowerCase()));
      const collapsePath = ci >= 0 ? [dir, ...segs.slice(0, ci + 1)].join('/') : null;
      const covers = Array.isArray(data.covers) ? data.covers : data.covers ? [data.covers] : [];
      const base = path.posix.basename(p);
      // verified 可以是列表，也可以是单个 { by, at } 映射（OKF §5.2）；取最近一次 at
      const vlist = data.verified === undefined ? [] : Array.isArray(data.verified) ? data.verified : [data.verified];
      const vts = vlist
        .map((v) => Date.parse(String(v).match(/\bat:\s*["']?([^,}\s"']+)/)?.[1] ?? ''))
        .filter(Number.isFinite);
      const sa = Date.parse(String(data.stale_after ?? ''));
      return {
        path: p,
        rel: relTo(p),
        title: firstHeading(body) || path.posix.basename(p, '.md'),
        description: typeof data.description === 'string' ? data.description : '',
        covers,
        readme: /^readme\.md$/i.test(base),
        reserved: /^(index|log)\.md$/i.test(base), // OKF 保留名，不要求 frontmatter
        hasFrontmatter: text.startsWith('---\n'),
        type: typeof data.type === 'string' ? data.type : '',
        status: typeof data.status === 'string' ? data.status.toLowerCase() : '',
        staleAfter: Number.isFinite(sa) ? sa : null,
        verifiedAt: vts.length ? Math.floor(Math.max(...vts) / 1000) : null,
        collapse: collapsePath,
        collapseRel: collapsePath ? relTo(collapsePath) : null,
      };
    });
    return { dir, files };
  }
  return null;
}

function detectPm(pkg, nodeFiles, rootFiles) {
  const pmField = typeof pkg.packageManager === 'string' ? pkg.packageManager.split('@')[0] : null;
  if (pmField) return pmField;
  for (const files of [nodeFiles, rootFiles]) {
    if (files.includes('pnpm-lock.yaml')) return 'pnpm';
    if (files.includes('yarn.lock')) return 'yarn';
    if (files.includes('bun.lockb') || files.includes('bun.lock')) return 'bun';
    if (files.includes('package-lock.json')) return 'npm';
  }
  return 'npm';
}

function commandsFor(root, tree, s) {
  const abs = s.path === '.' ? root : path.join(root, s.path);
  const files = tree.get(s.path)?.files ?? [];
  const out = {};
  if (s.manifests.node) {
    try {
      const pkg = readJson(path.join(abs, 'package.json'));
      const scripts = Object.fromEntries(Object.entries(pkg.scripts ?? {}).sort(([a], [b]) => cmp(a, b)));
      if (Object.keys(scripts).length) out.node = { pm: detectPm(pkg, files, tree.get('.')?.files ?? []), scripts };
    } catch {
      /* 忽略 */
    }
  }
  if (files.includes('Makefile')) {
    const t = fs.readFileSync(path.join(abs, 'Makefile'), 'utf8');
    const targets = [...t.matchAll(/^([A-Za-z0-9][A-Za-z0-9_.-]*)\s*:(?!=)/gm)].map((m) => m[1]);
    const uniq = [...new Set(targets)];
    if (uniq.length) out.make = uniq.slice(0, 30);
  }
  return Object.keys(out).length ? out : null;
}

function detectStandards(root, tree, config) {
  const given = config.standards.filter((p) => fs.existsSync(path.join(root, p)));
  if (given.length) return given;
  const out = [];
  const re = /^(documentation|doc-?style|docs?-?guide|writing)[^/]*\.md$/i;
  for (const [rel, node] of tree) {
    if (rel !== config.rootDocs && !rel.startsWith(config.rootDocs + '/')) continue;
    for (const f of node.files) if (re.test(f)) out.push(`${rel}/${f}`);
  }
  return out.sort(cmp);
}

export function discover(rootArg = '.', opts = {}) {
  const root = path.resolve(rootArg);
  const config = opts.config ?? loadConfig(root);
  const explicit = !!config.scopes;
  const tree = scanTree(root, config, explicit ? config.scopes.map((x) => x.path) : []);
  tree.__root = root; // 供 docsFor 读文件用，不参与遍历
  const include = config.include.map(globToRegex);
  const scopes = new Map();
  const missingScopes = [];
  const unlisted = [];

  if (!explicit) {
    // 自动模式：有清单文件的目录是单元，含单元的无清单目录是分组
    for (const [rel, node] of tree) {
      const manifests = manifestsOf(node.files, config.extraManifests);
      const forced = rel !== '.' && include.some((r) => r.test(rel));
      if (rel === '.' || manifests.size > 0 || forced) {
        scopes.set(rel, makeScope(root, rel, rel === '.' ? 'root' : 'unit', node, manifests));
      }
    }
    for (const rel of [...scopes.keys()]) {
      if (rel === '.') continue;
      const parts = rel.split('/');
      for (let i = 1; i < parts.length; i++) {
        const anc = parts.slice(0, i).join('/');
        if (!scopes.has(anc) && tree.has(anc)) scopes.set(anc, makeScope(root, anc, 'group', tree.get(anc), new Map()));
      }
    }
  } else {
    // 显式模式：作用域就是 scopes 里列的目录（根永远在），别的目录与本工具无关
    const rootNode = tree.get('.') ?? { files: [], subdirs: [] };
    scopes.set('.', makeScope(root, '.', 'root', rootNode, manifestsOf(rootNode.files, config.extraManifests)));
    for (const o of config.scopes) {
      if (o.path === '.') continue;
      const node = tree.get(o.path);
      if (!node) {
        missingScopes.push(o.path);
        continue;
      }
      scopes.set(o.path, makeScope(root, o.path, 'unit', node, manifestsOf(node.files, config.extraManifests)));
    }
    for (const s of scopes.values()) {
      if (s.kind === 'unit' && s.stacks.length === 0 && [...scopes.keys()].some((k) => k.startsWith(s.path + '/'))) s.kind = 'group';
    }
    for (const o of config.scopes) {
      const s = scopes.get(o.path);
      if (!s) continue;
      s.listed = true;
      s.desc = typeof o.desc === 'string' ? o.desc : '';
      s.docsOverride = typeof o.docs === 'string' ? o.docs : null;
      s.maxLines = Number.isInteger(o.maxLines) ? o.maxLines : null;
    }
    for (const [rel, node] of tree) {
      if (rel === '.' || scopes.has(rel)) continue;
      if (manifestsOf(node.files, config.extraManifests).size > 0) unlisted.push(rel);
    }
    unlisted.sort(cmp);
  }

  const ancestorsOf = (rel) => {
    if (rel === '.') return [];
    const parts = rel.split('/');
    const out = [];
    for (let i = parts.length - 1; i >= 1; i--) out.push(parts.slice(0, i).join('/'));
    out.push('.');
    return out;
  };
  const ordered = [...scopes.values()].sort((a, b) => (a.path === '.' ? -1 : b.path === '.' ? 1 : cmp(a.path, b.path)));
  for (const s of ordered) {
    const anc = ancestorsOf(s.path);
    s.parent = anc.find((a) => scopes.has(a)) ?? null;
    s.inheritsFrom = anc.find((a) => scopes.get(a)?.agents.exists) ?? null;
    s.docs = docsFor(tree, scopes, config, s);
    s.commands = commandsFor(root, tree, s);
  }

  const result = {
    root,
    config,
    mode: explicit ? 'explicit' : 'auto',
    standards: detectStandards(root, tree, config),
    scopes: ordered,
    missingScopes,
    unlisted,
  };
  Object.defineProperty(result, 'tree', { value: tree, enumerable: false });
  return result;
}
