// 审计仓库上下文文档的健康度。退出码：有 error → 1；加 --strict 时有 warn 也 → 1。
// 用法：node ctx.mjs audit [--root <dir>] [--json] [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { discover } from './discover.mjs';
import {
  extractImports, extractLinks, filesUnder, gitAvailable, gitDirtyPaths, gitLastCommit, globToRegex,
  readText, stripCode,
} from './lib.mjs';
import { BLOCK_IDS, EMPTY_BODY, expectedBlocks, findBlocks, requiresAgents, routeEntries } from './render.mjs';

export const CODES = [
  'ROOT_AGENTS_MISSING', 'SCOPE_AGENTS_MISSING', 'AGENTS_TOO_LONG', 'CLAUDE_ENTRY',
  'BLOCK_UNBALANCED', 'BLOCK_STALE', 'TODO_LEFT', 'DEAD_LINK', 'COVERS_EMPTY',
  'DOC_STALE', 'ROUTE_MISSING', 'STANDARDS',
  'SCOPE_PATH_MISSING', 'SCOPE_UNLISTED', 'DOC_FRONTMATTER', 'DOC_EXPIRED',
  'STALE_CHECK_SKIPPED', 'SCAN_INCOMPLETE',
];

const isoDay = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const join = (p, n) => (p === '.' ? n : `${p}/${n}`);
const shownList = (arr, n = 5) => arr.slice(0, n).join(', ') + (arr.length > n ? `, and ${arr.length - n} more` : '');
const mtimeSec = (abs) => {
  try {
    return Math.floor(fs.statSync(abs).mtimeMs / 1000);
  } catch {
    return 0;
  }
};

export function audit(rootArg = '.', opts = {}) {
  const d = discover(rootArg, opts);
  const cfg = d.config;
  const findings = [];
  const add = (code, severity, file, message) => findings.push({ code, severity, file, message });
  const label = (s) => (s.kind === 'group' ? 'group' : 'unit');
  const now = (opts.now ?? new Date()).getTime();

  // 0) 扫描是否完整、显式作用域清单的自洽性
  const unreadable = new Set(d.scanIssues.map((i) => i.path));
  if (d.scanIssues.length) {
    add('SCAN_INCOMPLETE', 'warn', '', `could not read: ${shownList(d.scanIssues.map((i) => `${i.path} (${i.error})`))}; discovery may be incomplete, so a clean result here is not an all-clear`);
  }
  for (const p of d.missingScopes) add('SCOPE_PATH_MISSING', 'error', '.agent-context.json', `scopes entry "${p}" does not exist on disk (renamed or deleted?)${unreadable.has(p) ? '; it could not be read, see SCAN_INCOMPLETE' : ''}`);
  if (d.mode === 'explicit' && cfg.reportUnlisted && d.unlisted.length) {
    const shown = d.unlisted.slice(0, 8).join(', ') + (d.unlisted.length > 8 ? `, and ${d.unlisted.length - 8} more` : '');
    add('SCOPE_UNLISTED', 'info', '.agent-context.json', `these directories have a manifest but are not listed in scopes: ${shown}. add them to scopes to maintain them, or ignore (reportUnlisted: false silences this)`);
  }

  // 1) AGENTS.md 存在性 / 长度 / 区块 / TODO / CLAUDE 入口
  for (const s of d.scopes) {
    const agentsFile = join(s.path, 'AGENTS.md');
    if (!s.agents.exists) {
      if (s.path === '.') add('ROOT_AGENTS_MISSING', 'error', agentsFile, 'repo root is missing AGENTS.md (the context entry point)');
      else if (requiresAgents(s, cfg)) add('SCOPE_AGENTS_MISSING', 'warn', agentsFile, `${s.listed ? 'listed in scopes: ' : label(s) + ' '}${s.path}/ is missing AGENTS.md`);
      continue;
    }
    const max = s.maxLines ?? (s.path === '.' ? cfg.rootAgentsMaxLines : cfg.agentsMaxLines);
    if (s.agents.lines > max) {
      add('AGENTS_TOO_LONG', 'warn', agentsFile, `${s.agents.lines} lines, over the limit of ${max}; move specialized content into docs/ and route to it`);
    }
    const { text } = readText(path.join(d.root, agentsFile));
    const { blocks, problems } = findBlocks(text);
    for (const p of problems) add('BLOCK_UNBALANCED', 'error', agentsFile, p);
    if (!problems.length) {
      const fresh = expectedBlocks(d, s);
      for (const b of blocks) {
        if (!BLOCK_IDS.includes(b.id)) continue;
        const want = (fresh[b.id] ?? EMPTY_BODY).trim();
        if (text.slice(b.innerStart, b.innerEnd).trim() !== want) {
          add('BLOCK_STALE', 'warn', agentsFile, `generated block ${b.id} is out of date; run sync --write to refresh`);
        }
      }
    }
    if (s.agents.todo > 0) add('TODO_LEFT', 'info', agentsFile, `${s.agents.todo} TODO(ctx) markers left; read the code and fill them in`);
    if (cfg.claudeEntry) {
      if (s.claude.state === 'missing') add('CLAUDE_ENTRY', 'warn', join(s.path, 'CLAUDE.md'), 'CLAUDE.md is missing; a single line @AGENTS.md is recommended');
      else if (s.claude.state === 'divergent') add('CLAUDE_ENTRY', 'warn', join(s.path, 'CLAUDE.md'), 'CLAUDE.md does not import AGENTS.md; the two may diverge');
    }
  }

  // 2) 链接 / @导入 死链
  const mdFiles = new Set();
  for (const s of d.scopes) {
    if (s.agents.exists) mdFiles.add(join(s.path, 'AGENTS.md'));
    if (s.claude.exists) mdFiles.add(join(s.path, 'CLAUDE.md'));
    for (const f of s.docs?.files ?? []) mdFiles.add(f.path);
  }
  const bundleOf = new Map(); // 文档 → 它所在的 OKF bundle 根（即该作用域的 docs 目录）
  for (const s of d.scopes) for (const f of s.docs?.files ?? []) bundleOf.set(f.path, s.docs.dir);
  for (const f of [...mdFiles].sort()) {
    const abs = path.join(d.root, f);
    let text;
    try {
      text = stripCode(readText(abs).text);
    } catch {
      continue;
    }
    const targets = extractLinks(text);
    if (path.posix.basename(f) === 'CLAUDE.md') targets.push(...extractImports(text));
    for (const raw of targets) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) continue;
      let t = raw.split('#')[0].split('?')[0];
      if (!t) continue;
      try {
        t = decodeURIComponent(t);
      } catch {
        /* 保持原样 */
      }
      const candidates = t.startsWith('/')
        ? [bundleOf.has(f) ? path.join(d.root, bundleOf.get(f), t) : null, path.join(d.root, t)].filter(Boolean)
        : [path.resolve(path.dirname(abs), t)];
      if (!candidates.some((c) => fs.existsSync(c))) add('DEAD_LINK', 'error', f, `link target does not exist: ${raw}`);
    }
  }

  // 3) covers 有效性 + 文档是否落后于代码
  //    DOC_STALE 只是"该看一眼了"的机械线索（提交时间 + 未提交改动），不证明文档对或错；语义核对见 references/audit.md。
  //    任何没能执行的检查都要明说（STALE_CHECK_SKIPPED），避免把"没检查"读成"没问题"。
  const gitOk = cfg.staleCheck && gitAvailable(d.root);
  const dirty = gitOk ? gitDirtyPaths(d.root) : null; // 未提交改动（含未跟踪）；git 出错为 null
  const skipReasons = new Set();
  let staleCandidates = 0; // 有 covers、非 deprecated 且匹配到文件的文档数：只有它们才需要过期检查
  for (const s of d.scopes) {
    if (!s.docs) continue;
    const underScope = filesUnder(d.tree, s.path).filter((f) => !f.startsWith(s.docs.dir + '/'));
    const relToScope = (f) => (s.path === '.' ? f : f.slice(s.path.length + 1));
    for (const doc of s.docs.files) {
      if (!doc.covers.length) continue;
      const covered = new Set();
      for (const pat of doc.covers) {
        const re = globToRegex(pat.replace(/^\.\//, ''));
        const hit = underScope.filter((f) => re.test(relToScope(f)));
        if (!hit.length) add('COVERS_EMPTY', 'error', doc.path, `covers "${pat}" matches no files (path renamed or deleted?)`);
        hit.forEach((h) => covered.add(h));
      }
      if (covered.size && doc.status !== 'deprecated') {
        staleCandidates++;
        if (!cfg.staleCheck) skipReasons.add('staleCheck is false in the config');
        else if (!gitOk) skipReasons.add('git is unavailable or this is not a git work tree');
        else {
          const docC = gitLastCommit(d.root, [doc.path]);
          const codeC = gitLastCommit(d.root, [...covered]);
          const docT = docC.time;
          const codeT = codeC.time;
          let staleMsg = null;
          if (docC.failed || codeC.failed) {
            skipReasons.add(`git log failed (${docC.error || codeC.error})`);
          } else if (docT && codeT && codeT > docT && !(doc.verifiedAt && doc.verifiedAt >= codeT)) {
            // verified（OKF §5.2）：有人在代码最后一次改动之后复核过，就不算过期
            staleMsg = `covered code last changed ${isoDay(codeT)}, doc last changed ${isoDay(docT)}; verify whether the doc is stale`;
          }
          // 未提交的代码改动：提交时间看不到它。文档本身也有未提交改动时，认为作者正在同步改，不报。
          if (!staleMsg && dirty) {
            const dirtyCode = [...covered].filter((f) => dirty.has(f));
            if (dirtyCode.length && !dirty.has(doc.path)) {
              const codeM = Math.max(...dirtyCode.map((f) => mtimeSec(path.join(d.root, f))));
              if (!(doc.verifiedAt && doc.verifiedAt >= codeM)) {
                staleMsg = `${dirtyCode.length} covered file(s) have uncommitted changes (e.g. ${dirtyCode[0]}) and the doc has none; verify whether the doc is stale`;
              }
            }
          } else if (!staleMsg && !dirty) {
            skipReasons.add('could not read the working-tree status, so uncommitted code changes were not checked');
          }
          if (staleMsg) add('DOC_STALE', 'warn', doc.path, staleMsg);
        }
      }
    }
  }

  if (staleCandidates && skipReasons.size) {
    add('STALE_CHECK_SKIPPED', 'info', '', `doc staleness was not (fully) checked: ${[...skipReasons].join('; ')}. no DOC_STALE here does not mean the docs are current`);
  }

  // 3b) OKF：frontmatter type、stale_after
  for (const s of d.scopes) {
    if (!s.docs) continue;
    const bad = [];
    for (const doc of s.docs.files) {
      if (doc.status !== 'deprecated' && doc.staleAfter && now >= doc.staleAfter) {
        add('DOC_EXPIRED', 'warn', doc.path, `past stale_after (${new Date(doc.staleAfter).toISOString().slice(0, 10)}); review and update`);
      }
      if (cfg.docFrontmatter === 'type' && !doc.readme && !doc.reserved && !(doc.hasFrontmatter && doc.type)) bad.push(doc.rel);
    }
    if (bad.length) {
      const shown = bad.slice(0, 5).join(', ') + (bad.length > 5 ? `, and ${bad.length - 5} more` : '');
      add('DOC_FRONTMATTER', 'warn', s.docs.dir, `missing frontmatter type: ${shown} (docFrontmatter: "off" disables the check)`);
    }
  }

  // 4) 文档路由完整性
  for (const s of d.scopes) {
    if (!s.agents.exists || !s.docs) continue;
    const text = readText(path.join(d.root, join(s.path, 'AGENTS.md'))).text;
    const missing = routeEntries(s).filter((e) => !e.readme && !text.includes(e.key)).map((e) => e.key);
    if (missing.length) {
      const shown = missing.slice(0, 5).join(', ') + (missing.length > 5 ? `, and ${missing.length - 5} more` : '');
      add('ROUTE_MISSING', 'warn', join(s.path, 'AGENTS.md'), `AGENTS.md does not point to these docs: ${shown}`);
    }
  }

  // 5) 仓库自带的文档规范
  if (d.standards.length) {
    add('STANDARDS', 'info', '', `repo has its own documentation standard(s): ${d.standards.join(', ')}; read them before editing docs and defer to them`);
  }

  const summary = {
    error: findings.filter((f) => f.severity === 'error').length,
    warn: findings.filter((f) => f.severity === 'warn').length,
    info: findings.filter((f) => f.severity === 'info').length,
    scopes: d.scopes.length,
    units: d.scopes.filter((s) => s.kind === 'unit').length,
  };
  return { findings, summary, standards: d.standards };
}
