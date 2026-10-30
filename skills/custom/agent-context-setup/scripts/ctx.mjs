#!/usr/bin/env node
// 唯一 CLI 入口：init / discover / audit / sync。零依赖，Node >= 18。
// 用法：node ctx.mjs <init|discover|audit|sync> [--root <dir>] [选项]
//   init     探测并预览建议的 scopes；--write 写入 .agent-context.json（已有 scopes 需 --force，同路径覆盖项保留）；--groups 把分组也列上
//   discover 输出作用域清单 JSON（技术栈、继承链、docs、命令、AGENTS/CLAUDE 状态、未列入的目录）
//   audit    健康检查；有 error 退出码 1；--strict 时有 warn 也 → 1；--json 输出 JSON
//            （没执行的检查会以 STALE_CHECK_SKIPPED / SCAN_INCOMPLETE 明说，"没有告警"不等于"已检查通过"）
//   sync     dry-run 列出将要做的事；--write 落盘；--scaffold 新建缺失的 AGENTS.md/CLAUDE.md；--add-blocks 给已有 AGENTS.md 追加缺失区块；--json 输出 JSON
// 之后维护清单就直接编辑 .agent-context.json：加一行 = 纳入，删一行 = 不再维护，无需 exclude。
import path from 'node:path';
import { audit } from './audit.mjs';
import { discover } from './discover.mjs';
import { parseArgs } from './lib.mjs';
import { applySync, planSync, suggestScopes, writeScopes } from './sync.mjs';

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
const root = path.resolve(args.root ?? '.');

if (cmd === 'init') {
  const paths = suggestScopes(root, { groups: !!args.groups });
  console.log(JSON.stringify({ scopes: paths }, null, 2));
  if (args.write) {
    const r = writeScopes(root, paths, { force: !!args.force });
    console.log(r.written ? `\nwritten: ${r.file}` : `\nnot written: ${r.reason}`);
    process.exit(r.written ? 0 : 1);
  }
  console.log('\ndry-run: nothing written. add --write to confirm; afterwards edit scopes in .agent-context.json directly.');
} else if (cmd === 'discover') {
  process.stdout.write(JSON.stringify(discover(args.root ?? '.'), null, 2) + '\n');
} else if (cmd === 'audit') {
  const r = audit(args.root ?? '.');
  if (args.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  } else {
    const mark = { error: '✗', warn: '!', info: '·' };
    console.log(`scopes: ${r.summary.scopes} (${r.summary.units} units)`);
    for (const f of r.findings) console.log(`${mark[f.severity]} [${f.code}] ${f.file ? f.file + ': ' : ''}${f.message}`);
    console.log(`\nresult: ${r.summary.error} error, ${r.summary.warn} warn, ${r.summary.info} info`);
  }
  process.exit(r.summary.error > 0 || (args.strict && r.summary.warn > 0) ? 1 : 0);
} else if (cmd === 'sync') {
  const d = discover(args.root ?? '.');
  if (d.scanIssues.length) {
    console.error(`warning: scan incomplete, could not read: ${d.scanIssues.map((i) => `${i.path} (${i.error})`).join(', ')}; generated blocks may be missing entries`);
  }
  const actions = planSync(d, { scaffold: !!args.scaffold, addBlocks: !!args['add-blocks'] });
  applySync(actions, { write: !!args.write });

  if (args.json) {
    process.stdout.write(JSON.stringify(actions.map(({ abs, content, ...rest }) => rest), null, 2) + '\n');
  } else {
    if (!actions.length) console.log('up to date, nothing to do.');
    for (const a of actions) {
      if (a.type === 'create') console.log(`+ create ${a.file}`);
      else if (a.type === 'update') console.log(`~ update ${a.file}  [${a.blocks.join(', ')}]`);
      else console.log(`· skip   ${a.file}  ${a.reason}`);
    }
    if (!args.write && actions.some((a) => a.type !== 'skip')) console.log('\ndry-run: no files written; add --write to apply.');
  }
} else {
  console.error([
    'usage: node ctx.mjs <init|discover|audit|sync> [--root <dir>]',
    '  init [--write] [--force] [--groups] | audit [--strict] [--json]',
    '  sync [--write] [--scaffold] [--add-blocks] [--json] | discover',
  ].join('\n'));
  process.exit(2);
}
