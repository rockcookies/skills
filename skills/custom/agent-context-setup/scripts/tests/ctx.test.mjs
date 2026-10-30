// 运行：node --test scripts/tests/ctx.test.mjs（在技能目录内）
// 证伪原则：每条检查都有"故意弄坏→必须报错；修好→必须消失"的用例；
// 最后一个用例断言 CODES 里每个检查码都被真实触发过，防止门禁退化成空操作。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { discover } from '../discover.mjs';
import { audit, CODES } from '../audit.mjs';
import { loadConfig } from '../lib.mjs';
import { applySync, planSync, suggestScopes, writeScopes } from '../sync.mjs';

const triggered = new Set();

function mk(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-'));
  for (const [p, c] of Object.entries(files)) {
    const f = path.join(root, p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, c);
  }
  return root;
}
const write = (root, p, c) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), c);
};
const read = (root, p) => fs.readFileSync(path.join(root, p), 'utf8');
const codes = (root, opts) => {
  const r = audit(root, opts);
  r.findings.forEach((f) => triggered.add(f.code));
  return r.findings.map((f) => f.code);
};
const sync = (root, opts = {}) => {
  const d = discover(root);
  const actions = planSync(d, opts);
  applySync(actions, { write: true });
  return actions;
};
const paths = (root) => discover(root).scopes.map((s) => s.path);
const scope = (root, p) => discover(root).scopes.find((s) => s.path === p);

// ---------- 发现：布局无关 ----------
test('pnpm monorepo：packages/ 是分组，包是单元', () => {
  const root = mk({
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'package.json': '{"name":"mono"}',
    'packages/a/package.json': '{"name":"@x/a"}',
    'packages/b/package.json': '{"name":"@x/b"}',
    'docs/README.md': '# docs',
  });
  assert.deepEqual(paths(root), ['.', 'packages', 'packages/a', 'packages/b']);
  assert.equal(scope(root, 'packages').kind, 'group');
  assert.equal(scope(root, 'packages/a').parent, 'packages');
  assert.ok(scope(root, '.').workspace.includes('pnpm'));
});

test('backend/frontend 分目录：Maven 多模块 + Go + Node，无需 packages/', () => {
  const root = mk({
    'backend/pom.xml': '<project><artifactId>backend</artifactId><modules><module>svc</module></modules></project>',
    'backend/svc/pom.xml': '<project><parent><artifactId>backend</artifactId></parent><artifactId>svc</artifactId></project>',
    'backend/gosvc/go.mod': 'module example.com/gosvc\n',
    'frontend/package.json': '{"name":"web"}',
  });
  assert.deepEqual(paths(root), ['.', 'backend', 'backend/gosvc', 'backend/svc', 'frontend']);
  assert.equal(scope(root, 'backend/svc').parent, 'backend');
  assert.equal(scope(root, 'backend/svc').name, 'svc');
  assert.deepEqual(scope(root, 'backend/gosvc').stacks, ['go']);
  assert.ok(scope(root, 'backend').workspace.includes('maven-modules'));
});

test('根目录与前端同级：go.mod 在根，frontend/ 是独立单元；根同时有 go.mod+package.json 也成立', () => {
  const a = mk({ 'go.mod': 'module example.com/app\n', 'frontend/package.json': '{"name":"web"}', 'cmd/app/main.go': 'package main' });
  assert.deepEqual(paths(a), ['.', 'frontend']);
  assert.deepEqual(scope(a, '.').stacks, ['go']);
  const b = mk({ 'go.mod': 'module example.com/app\n', 'package.json': '{"name":"web"}' });
  assert.deepEqual(scope(b, '.').stacks, ['go', 'node']);
});

test('配置：ignore 目录名、exclude 路径、include 强制单元', () => {
  const root = mk({
    '.agent-context.json': JSON.stringify({ ignore: ['unused'], exclude: ['examples/**'], include: ['tools/x'] }),
    'unused/package.json': '{"name":"old"}',
    'examples/demo/package.json': '{"name":"demo"}',
    'tools/x/run.sh': 'echo',
    'app/package.json': '{"name":"app"}',
  });
  assert.deepEqual(paths(root), ['.', 'app', 'tools', 'tools/x']);
  assert.equal(scope(root, 'tools/x').kind, 'unit');
});

// ---------- 审计：证伪 ----------
test('DEAD_LINK：弄坏必报，修好消失', () => {
  const root = mk({ 'AGENTS.md': '# x\n[a](docs/a.md)\n', 'CLAUDE.md': '@AGENTS.md\n' });
  assert.ok(codes(root).includes('DEAD_LINK'));
  write(root, 'docs/a.md', '# a');
  assert.ok(!codes(root).includes('DEAD_LINK'));
});

test('DEAD_LINK：代码块里的示例链接不算', () => {
  const root = mk({ 'AGENTS.md': '# x\n```md\n[a](nope.md)\n```\n', 'CLAUDE.md': '@AGENTS.md\n' });
  assert.ok(!codes(root).includes('DEAD_LINK'));
});

test('ROOT_AGENTS_MISSING / SCOPE_AGENTS_MISSING', () => {
  const root = mk({ 'packages/a/package.json': '{"name":"a"}' });
  const c = codes(root);
  assert.ok(c.includes('ROOT_AGENTS_MISSING'));
  assert.ok(c.includes('SCOPE_AGENTS_MISSING'));
  write(root, 'AGENTS.md', '# r\n');
  write(root, 'packages/a/AGENTS.md', '# a\n');
  const c2 = codes(root);
  assert.ok(!c2.includes('ROOT_AGENTS_MISSING') && !c2.includes('SCOPE_AGENTS_MISSING'));
});

test('AGENTS_TOO_LONG', () => {
  const root = mk({ 'AGENTS.md': 'line\n'.repeat(200), 'CLAUDE.md': '@AGENTS.md\n' });
  assert.ok(codes(root).includes('AGENTS_TOO_LONG'));
  write(root, 'AGENTS.md', 'line\n'.repeat(20));
  assert.ok(!codes(root).includes('AGENTS_TOO_LONG'));
});

test('CLAUDE_ENTRY：缺失/分叉报，@AGENTS.md 通过', () => {
  const root = mk({ 'AGENTS.md': '# r\n' });
  assert.ok(codes(root).includes('CLAUDE_ENTRY'));
  write(root, 'CLAUDE.md', '# 另一份完全不同的规则\n');
  assert.ok(codes(root).includes('CLAUDE_ENTRY'));
  write(root, 'CLAUDE.md', '@AGENTS.md\n');
  assert.ok(!codes(root).includes('CLAUDE_ENTRY'));
});

test('BLOCK_STALE：区块过期报，sync 后消失且幂等', () => {
  const root = mk({
    'package.json': '{"name":"r"}',
    'a/package.json': '{"name":"a"}',
    'AGENTS.md': '# r\n<!-- ctx:begin units -->\n旧内容\n<!-- ctx:end units -->\n',
    'CLAUDE.md': '@AGENTS.md\n',
  });
  assert.ok(codes(root).includes('BLOCK_STALE'));
  const acts = sync(root);
  assert.equal(acts.filter((a) => a.type === 'update').length, 1);
  assert.ok(read(root, 'AGENTS.md').includes('`a/`'));
  assert.ok(!codes(root).includes('BLOCK_STALE'));
  assert.equal(planSync(discover(root), {}).length, 0, '第二次应无事可做');
});

test('BLOCK_UNBALANCED：只有起始标记 → 报错，且 sync 不碰该文件', () => {
  const body = '# r\n<!-- ctx:begin units -->\n没有结束\n';
  const root = mk({ 'AGENTS.md': body, 'CLAUDE.md': '@AGENTS.md\n', 'a/package.json': '{"name":"a"}' });
  assert.ok(codes(root).includes('BLOCK_UNBALANCED'));
  const acts = sync(root);
  assert.ok(acts.some((a) => a.type === 'skip'));
  assert.equal(read(root, 'AGENTS.md'), body);
});

test('CRLF（Windows）：更新区块后换行风格不变', () => {
  const root = mk({
    'a/package.json': '{"name":"a"}',
    'AGENTS.md': '# r\r\n<!-- ctx:begin units -->\r\n旧\r\n<!-- ctx:end units -->\r\n',
    'CLAUDE.md': '@AGENTS.md\r\n',
  });
  sync(root);
  const out = read(root, 'AGENTS.md');
  assert.ok(out.includes('`a/`'));
  assert.ok(!/(?<!\r)\n/.test(out), '不应出现裸 LF');
});

test('COVERS_EMPTY / ROUTE_MISSING / 路由生成', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'packages/a/package.json': '{"name":"a"}',
    'packages/a/AGENTS.md': '# a\n',
    'packages/a/CLAUDE.md': '@AGENTS.md\n',
    'packages/a/docs/redis.md': '---\ndescription: Redis 适配器\ncovers:\n  - src/redis/**\n---\n# Redis\n',
    'packages/a/src/redis/index.ts': 'export {}',
  });
  let c = codes(root);
  assert.ok(!c.includes('COVERS_EMPTY'));
  assert.ok(c.includes('ROUTE_MISSING'));

  write(root, 'packages/a/docs/redis.md', '---\ncovers: [src/nope/**]\n---\n# Redis\n');
  assert.ok(codes(root).includes('COVERS_EMPTY'));

  write(root, 'packages/a/docs/redis.md', '---\ndescription: Redis 适配器\ncovers: [src/redis/**]\n---\n# Redis\n');
  sync(root, { addBlocks: true });
  c = codes(root);
  assert.ok(!c.includes('ROUTE_MISSING') && !c.includes('BLOCK_STALE'));
  const a = read(root, 'packages/a/AGENTS.md');
  assert.ok(a.includes('[docs/redis.md](docs/redis.md)') && a.includes('`src/redis/**`'));
});

test('决策记录目录在路由里折叠成一行', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'docs/README.md': '# 文档\n',
    'docs/architecture/decisions/0001-a.md': '# a',
    'docs/architecture/decisions/0002-b.md': '# b',
  });
  sync(root, { addBlocks: true });
  const out = read(root, 'AGENTS.md');
  assert.ok(out.includes('Decision records (2 files)'));
  assert.ok(!out.includes('0001-a.md'));
});

function git(root, args, date) {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) },
  });
}
let gitOk = true;
try {
  execFileSync('git', ['--version'], { stdio: 'pipe' });
} catch {
  gitOk = false;
}

test('DOC_STALE：代码比文档新 → 报；文档再更新 → 消失', { skip: !gitOk && '无 git' }, () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'a/package.json': '{"name":"a"}',
    'a/docs/x.md': '---\ncovers: [src/**]\n---\n# x\n',
    'a/src/x.ts': 'v1',
  });
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 't@t']);
  git(root, ['config', 'user.name', 't']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'c1'], '2026-01-01T00:00:00+00:00');
  write(root, 'a/src/x.ts', 'v2');
  git(root, ['commit', '-qam', 'c2'], '2026-02-01T00:00:00+00:00');
  assert.ok(codes(root).includes('DOC_STALE'));
  // verified 早于代码改动 → 仍过期（证伪）；晚于 → 视为已复核（不改正文、不提交）
  write(root, 'a/docs/x.md', '---\ncovers: [src/**]\nverified: { by: human:a, at: 2026-01-15T00:00:00Z }\n---\n# x\n');
  assert.ok(codes(root).includes('DOC_STALE'));
  write(root, 'a/docs/x.md', '---\ncovers: [src/**]\nverified: { by: human:a, at: 2026-02-15T00:00:00Z }\n---\n# x\n');
  assert.ok(!codes(root).includes('DOC_STALE'));
  // 文档在代码之后被修改并提交 → 不过期
  write(root, 'a/docs/x.md', '---\ncovers: [src/**]\n---\n# x\n更新\n');
  git(root, ['commit', '-qam', 'c3'], '2026-03-01T00:00:00+00:00');
  assert.ok(!codes(root).includes('DOC_STALE'));
});

// ---------- 脚手架 ----------
test('scaffold：任意布局都能铺出 AGENTS.md + CLAUDE.md，继承链正确，幂等', () => {
  const root = mk({
    'package.json': '{"name":"web-root","scripts":{"build":"vite build"}}',
    'backend/go.mod': 'module example.com/backend\n',
    'backend/Makefile': 'build:\n\tgo build ./...\ntest:\n\tgo test ./...\n',
    'frontend/package.json': '{"name":"web","scripts":{"dev":"vite"}}',
  });
  const acts = sync(root, { scaffold: true });
  assert.ok(acts.every((a) => a.type === 'create'));
  for (const p of ['AGENTS.md', 'CLAUDE.md', 'backend/AGENTS.md', 'backend/CLAUDE.md', 'frontend/AGENTS.md', 'frontend/CLAUDE.md']) {
    assert.ok(fs.existsSync(path.join(root, p)), p);
  }
  assert.equal(read(root, 'backend/CLAUDE.md'), '@AGENTS.md\n');
  assert.ok(read(root, 'backend/AGENTS.md').includes('[../AGENTS.md](../AGENTS.md)'));
  assert.ok(read(root, 'backend/AGENTS.md').includes('`make build`'));
  assert.ok(read(root, 'AGENTS.md').includes('`backend/`'));
  const c = codes(root);
  assert.ok(c.includes('TODO_LEFT'));
  assert.ok(!c.some((x) => ['ROOT_AGENTS_MISSING', 'SCOPE_AGENTS_MISSING', 'BLOCK_STALE', 'DEAD_LINK', 'CLAUDE_ENTRY'].includes(x)));
  assert.equal(planSync(discover(root), { scaffold: true }).length, 0, '第二次应无事可做');
});

test('已有且分叉的 CLAUDE.md 不被覆盖', () => {
  const root = mk({ 'AGENTS.md': '# r\n', 'CLAUDE.md': '# 我自己的规则\n' });
  const acts = sync(root, { scaffold: true });
  assert.ok(acts.some((a) => a.type === 'skip' && a.file === 'CLAUDE.md'));
  assert.equal(read(root, 'CLAUDE.md'), '# 我自己的规则\n');
});

test('STANDARDS：自动识别仓库自己的文档规范', () => {
  const root = mk({ 'AGENTS.md': '# r\n', 'CLAUDE.md': '@AGENTS.md\n', 'docs/governance/documentation.md': '# 文档规范\n' });
  assert.deepEqual(discover(root).standards, ['docs/governance/documentation.md']);
  assert.ok(codes(root).includes('STANDARDS'));
});

// ---------- 显式 scopes（在配置里列出 AGENTS.md 所在目录）----------
test('显式 scopes：只维护列出的目录，没列的不被要求、也不用 exclude', () => {
  const root = mk({
    '.agent-context.json': JSON.stringify({ scopes: ['.', 'apps/web', 'backend'] }),
    'package.json': '{"name":"r"}',
    'apps/web/package.json': '{"name":"web"}',
    'apps/admin/package.json': '{"name":"admin"}',
    'backend/go.mod': 'module example.com/b\n',
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
  });
  const d = discover(root);
  assert.equal(d.mode, 'explicit');
  assert.deepEqual(d.scopes.map((s) => s.path), ['.', 'apps/web', 'backend']);
  assert.deepEqual(d.unlisted, ['apps/admin']);
  const r = audit(root);
  r.findings.forEach((f) => triggered.add(f.code));
  const missing = r.findings.filter((f) => f.code === 'SCOPE_AGENTS_MISSING').map((f) => f.file);
  assert.deepEqual(missing.sort(), ['apps/web/AGENTS.md', 'backend/AGENTS.md']);
  assert.ok(r.findings.some((f) => f.code === 'SCOPE_UNLISTED' && f.message.includes('apps/admin')));
  // 把 admin 加进清单 → 提示消失，变成要求它有 AGENTS.md
  write(root, '.agent-context.json', JSON.stringify({ scopes: ['.', 'apps/web', 'apps/admin', 'backend'] }));
  assert.ok(!codes(root).includes('SCOPE_UNLISTED'));
});

test('SCOPE_PATH_MISSING：清单里的目录不存在 → error；建出来就消失', () => {
  const root = mk({ '.agent-context.json': JSON.stringify({ scopes: ['.', 'nope'] }), 'AGENTS.md': '# r\n', 'CLAUDE.md': '@AGENTS.md\n' });
  assert.ok(codes(root).includes('SCOPE_PATH_MISSING'));
  write(root, 'nope/x.txt', 'x');
  assert.ok(!codes(root).includes('SCOPE_PATH_MISSING'));
});

test('显式 scopes：无清单目录也能当作用域；有下级时是分组；忽略目录里的也能列', () => {
  const root = mk({
    '.agent-context.json': JSON.stringify({ ignore: ['unused'], scopes: ['.', 'tools', 'svc', 'svc/a', 'unused/legacy'] }),
    'tools/run.sh': 'echo',
    'svc/a/go.mod': 'module example.com/a\n',
    'unused/legacy/package.json': '{"name":"legacy"}',
  });
  const by = (p) => discover(root).scopes.find((s) => s.path === p);
  assert.equal(by('tools').kind, 'unit');
  assert.equal(by('svc').kind, 'group');
  assert.deepEqual(by('svc/a').stacks, ['go']);
  assert.equal(by('unused/legacy').name, 'legacy');
  const acts = sync(root, { scaffold: true });
  assert.ok(acts.some((a) => a.file === 'tools/AGENTS.md' && a.type === 'create'));
  assert.ok(acts.some((a) => a.file === 'svc/AGENTS.md' && a.type === 'create'));
});

test('scopes 的 desc / docs / maxLines 覆盖项生效，配置支持整行 // 注释', () => {
  const root = mk({
    '.agent-context.json': '// 作用域清单\n' + JSON.stringify({ scopes: ['.', { path: 'a', desc: '接入层', docs: 'documentation', maxLines: 3 }] }),
    'a/package.json': '{"name":"a"}',
    'a/documentation/x.md': '---\ntype: 模块文档\n---\n# x\n',
    'a/AGENTS.md': '1\n2\n3\n4\n5\n',
  });
  assert.equal(discover(root).scopes.find((s) => s.path === 'a').docs.dir, 'a/documentation');
  sync(root, { scaffold: true });
  assert.ok(read(root, 'AGENTS.md').includes('接入层'));
  assert.ok(codes(root).includes('AGENTS_TOO_LONG'));
});

test('init：只建议根+单元；写入后进入显式模式；重复写入需 --force 且保留覆盖项', () => {
  const root = mk({
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'package.json': '{"name":"m"}',
    'packages/a/package.json': '{"name":"a"}',
    'packages/b/package.json': '{"name":"b"}',
  });
  assert.deepEqual(suggestScopes(root), ['.', 'packages/a', 'packages/b']);
  assert.ok(writeScopes(root, suggestScopes(root)).written);
  assert.equal(discover(root).mode, 'explicit');
  assert.equal(writeScopes(root, suggestScopes(root)).written, false);
  write(root, '.agent-context.json', JSON.stringify({ scopes: ['.', { path: 'packages/a', desc: '保留我' }] }));
  assert.ok(writeScopes(root, ['.', 'packages/a', 'packages/b'], { force: true }).written);
  const cfg = JSON.parse(read(root, '.agent-context.json'));
  assert.deepEqual(cfg.scopes, ['.', { path: 'packages/a', desc: '保留我' }, 'packages/b']);
});

// ---------- OKF 格式 ----------
test('DOC_FRONTMATTER：缺 type 报；README 与 index.md 豁免；补上即消失；可关闭', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'docs/README.md': '# 文档\n',
    'docs/index.md': '* [a](a.md)\n',
    'docs/a.md': '# a\n',
  });
  assert.ok(codes(root).includes('DOC_FRONTMATTER'));
  const r = audit(root).findings.find((f) => f.code === 'DOC_FRONTMATTER');
  assert.ok(r.message.includes('a.md') && !r.message.includes('README') && !r.message.includes('index.md'));
  write(root, 'docs/a.md', '---\ntype: 参考\n---\n# a\n');
  assert.ok(!codes(root).includes('DOC_FRONTMATTER'));
  write(root, 'docs/a.md', '# a\n');
  write(root, '.agent-context.json', JSON.stringify({ docFrontmatter: 'off' }));
  assert.ok(!codes(root).includes('DOC_FRONTMATTER'));
});

test('DOC_EXPIRED：stale_after 已过 → 报；未到或 deprecated → 不报', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'docs/a.md': '---\ntype: 参考\nstale_after: 2026-01-01T00:00:00Z\n---\n# a\n',
  });
  const now = new Date('2026-06-01T00:00:00Z');
  assert.ok(codes(root, { now }).includes('DOC_EXPIRED'));
  assert.ok(!codes(root, { now: new Date('2025-12-01T00:00:00Z') }).includes('DOC_EXPIRED'));
  write(root, 'docs/a.md', '---\ntype: 参考\nstatus: deprecated\nstale_after: 2026-01-01T00:00:00Z\n---\n# a\n');
  assert.ok(!codes(root, { now }).includes('DOC_EXPIRED'));
});

test('status: deprecated 的文档不进路由、也不要求被路由；type 出现时路由表多一列', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'docs/new.md': '---\ntype: 指南\ndescription: 新文档\n---\n# new\n',
    'docs/old.md': '---\ntype: 指南\nstatus: deprecated\n---\n# old\n',
  });
  sync(root, { addBlocks: true });
  const out = read(root, 'AGENTS.md');
  assert.ok(out.includes('| Type | Covers |') && out.includes('| 指南 |'));
  assert.ok(out.includes('docs/new.md') && !out.includes('docs/old.md'));
  assert.ok(!codes(root).includes('ROUTE_MISSING'));
});

test('OKF 的 bundle 相对链接 /x.md：先按 docs 根解析，再按仓库根', () => {
  const root = mk({
    'AGENTS.md': '# r\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'docs/a.md': '---\ntype: 参考\n---\n[b](/sub/b.md) [c](/docs/sub/b.md)\n',
    'docs/sub/b.md': '---\ntype: 参考\n---\n# b\n',
  });
  assert.ok(!codes(root).includes('DEAD_LINK'));
  write(root, 'docs/a.md', '---\ntype: 参考\n---\n[x](/sub/nope.md)\n');
  assert.ok(codes(root).includes('DEAD_LINK'));
});

const coveredDoc = {
  'AGENTS.md': '# r\n',
  'CLAUDE.md': '@AGENTS.md\n',
  'docs/x.md': '---\ntype: 参考\ncovers: [src/**]\n---\n# x\n',
  'src/x.ts': 'v1',
};

test('STALE_CHECK_SKIPPED：不是 git 仓库必报，且不报 DOC_STALE', () => {
  const root = mk(coveredDoc);
  assert.ok(codes(root).includes('STALE_CHECK_SKIPPED'));
  assert.ok(!codes(root).includes('DOC_STALE'));
});

test('STALE_CHECK_SKIPPED：还没有提交必报，第一次提交后消失；关掉 staleCheck 再报，打开后消失', { skip: !gitOk && '无 git' }, () => {
  const root = mk(coveredDoc);
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 't@t']);
  git(root, ['config', 'user.name', 't']);
  assert.ok(codes(root).includes('STALE_CHECK_SKIPPED'));
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'c1'], '2026-01-01T00:00:00+00:00');
  assert.ok(!codes(root).includes('STALE_CHECK_SKIPPED'));
  write(root, '.agent-context.json', JSON.stringify({ staleCheck: false }));
  assert.ok(codes(root).includes('STALE_CHECK_SKIPPED'));
  write(root, '.agent-context.json', JSON.stringify({ staleCheck: true }));
  assert.ok(!codes(root).includes('STALE_CHECK_SKIPPED'));
});

test('SCAN_INCOMPLETE：损坏的 package.json 必报，修好消失', () => {
  const root = mk({ 'AGENTS.md': '# r\n', 'CLAUDE.md': '@AGENTS.md\n', 'package.json': '{' });
  assert.ok(codes(root).includes('SCAN_INCOMPLETE'));
  write(root, 'package.json', '{"name":"ok"}');
  assert.ok(!codes(root).includes('SCAN_INCOMPLETE'));
});

test('DOC_STALE：未提交的代码改动必报；文档也改或 verified 晚于代码 mtime 则消失', { skip: !gitOk && '无 git' }, () => {
  const root = mk(coveredDoc);
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 't@t']);
  git(root, ['config', 'user.name', 't']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'c1'], '2026-01-01T00:00:00+00:00');
  assert.ok(!codes(root).includes('DOC_STALE'));
  write(root, 'src/x.ts', 'v2');
  assert.ok(codes(root).includes('DOC_STALE'));
  const later = new Date(Date.now() + 60_000).toISOString();
  write(root, 'docs/x.md', `---\ntype: 参考\ncovers: [src/**]\nverified: { by: human:a, at: ${later} }\n---\n# x\n`);
  assert.ok(!codes(root).includes('DOC_STALE'));
  write(root, 'docs/x.md', '---\ntype: 参考\ncovers: [src/**]\n---\n# x\n改了\n');
  assert.ok(!codes(root).includes('DOC_STALE'));
});

test('normalizeScopes：重复路径或非法覆盖项直接抛错', () => {
  const dup = mk({ '.agent-context.json': JSON.stringify({ scopes: ['.', '.'] }) });
  assert.throws(() => loadConfig(dup), /duplicate scopes entry/);
  const badDesc = mk({ '.agent-context.json': JSON.stringify({ scopes: [{ path: '.', desc: 1 }] }) });
  assert.throws(() => loadConfig(badDesc), /desc must be a string/);
  const badDocs = mk({ '.agent-context.json': JSON.stringify({ scopes: [{ path: '.', docs: 1 }] }) });
  assert.throws(() => loadConfig(badDocs), /docs must be a string/);
  const badLines = mk({ '.agent-context.json': JSON.stringify({ scopes: [{ path: '.', maxLines: 0 }] }) });
  assert.throws(() => loadConfig(badLines), /maxLines must be a positive integer/);
});

// ---------- 门禁自检：最后运行 ----------
test('每个检查码都被真实触发过（防止门禁静默退化）', () => {
  const need = CODES.filter((c) => gitOk || c !== 'DOC_STALE');
  const missing = need.filter((c) => !triggered.has(c));
  assert.deepEqual(missing, [], `这些检查从未被触发：${missing.join(', ')}`);
});
