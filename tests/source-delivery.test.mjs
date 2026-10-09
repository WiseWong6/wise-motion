// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, mkdir, readdir, realpath, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {exportEffect} from '../scripts/export.mjs';
import {selectEffect, show} from '../scripts/show.mjs';
import registry from '../catalog/registry.json' with {type:'json'};

const root = path.resolve(import.meta.dirname, '..');
const run = (script, args, cwd = root) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {cwd, encoding:'utf8'});
async function temporary(fn) {
  const dir = await realpath(await mkdtemp(path.join(tmpdir(), 'wise-source-')));
  try { return await fn(dir); } finally { await rm(dir, {recursive:true, force:true}); }
}
async function browserExporter() {
  const context = {document:{documentElement:{dataset:{theme:'dark'}}}};
  for (const file of ['catalog/runtime.js','catalog/content.js','catalog/effects/civilization-images.js','catalog/remotion-sources.js','catalog/export.js']) {
    runInNewContext(await readFile(path.join(root, file), 'utf8'), context, {filename:file});
  }
  return context.MotionExport;
}

const browser = await browserExporter();
const packageVersion = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;

test('明确动作、多段动作、禁项和无匹配均可从任意目录检索', async () => temporary(async dir => {
  const cases = [
    ['四张卡片依次出现，按顺序', /stagger-in/],
    ['字幕逐句出现，画面有金属质感转场', /未确认覆盖：字幕逐句出现/],
    ['上下两排卡片反向持续滚动，不要轮播，不要停顿', /dual-scroll/],
    ['让三维液体表面生成真实湍流', /没有找到直接参考。未覆盖/]
  ];
  for (const [query, expected] of cases) {
    const output = run('match.mjs', [query], dir);
    assert.equal(output.status, 0, output.stderr); assert.match(output.stdout, expected);
    assert.doesNotMatch(output.stdout, /plan\.json|nearest|原创理由|先.*分镜/);
  }
  assert.match(run('match.mjs', ['上下两排卡片反向持续滚动，不要轮播，不要停顿'], dir).stdout, /已识别并排除：逐张切换、停顿或停住/);
  // 多段关系分别检索，不能用材质命中冒充已经覆盖文字呈现。
  assert.match(run('match.mjs', ['字幕逐句出现'], dir).stdout, /subtitle-focus/);
  assert.match(run('match.mjs', ['画面有金属质感转场'], dir).stdout, /metal-impact/);
}));

test('默认查看精简，详细查看保留内容限制、素材、许可和变体实际入口', async () => {
  const effect = selectEffect('word-slam');
  const concise = await show(effect), detailed = await show(effect, {details:true});
  assert.ok(concise.length < detailed.length);
  for (const pattern of [/用途：/, /预览：file:/, /源码：\//, /依赖：/, /可调：/, /透明背景：/, /4\.2 秒/]) assert.match(concise, pattern);
  assert.doesNotMatch(concise, /三选一|nearest|原创理由|动作阶段：/);
  assert.match(detailed, /动作阶段：/); assert.match(detailed, /max_chars/);
  const variant = selectEffect('terminal-code', 'command-log');
  const changed = await show(variant, {details:true});
  assert.match(changed, /command-log/); assert.ok(changed.includes(path.join(root, variant.source.path)));
  const native = selectEffect('seed-bloom-brand-sequence');
  assert.ok((await show(native)).includes(path.join(root, native.source.remotion.component)));
  assert.throws(() => selectEffect('word-slam', 'missing'), /未知动效变体/);
  assert.throws(() => selectEffect('terminal-code', 'missing'), /未知动效变体/);
  assert.throws(() => selectEffect('word-sla'), /相近.*word-slam/);
});

test('普通动作与带素材和声音的组合使用浏览器同一组件示例，可编译接入', async () => temporary(async dir => {
  for (const id of ['word-slam', 'balloon-drive-journey', 'terminal-code', 'local-scan']) {
    const variantId = id === 'terminal-code' ? 'command-log' : undefined;
    const effect = selectEffect(id, variantId);
    const out = await exportEffect(effect.name, {variantId, outDir:path.join(dir, id)});
    assert.equal(out.kind, 'shared-package'); assert.equal(out.files.length, 3);
    assert.ok(out.files.every(file => path.isAbsolute(file)));
    const source = await readFile(path.join(out.directory, 'src/Root.jsx'), 'utf8');
    assert.equal(source, browser.remotionCode(effect, {variantId}));
    assert.ok(source.includes(effect.source.path)); assert.doesNotMatch(source, /\/Users\//);
    const guide = await readFile(path.join(out.directory, 'README.md'), 'utf8');
    assert.match(guide, /共享组件包/); assert.match(guide, /install-assets\.mjs/);
    assert.match(guide, /未安装依赖/);
    for (const text of [source, guide]) {
      assert.deepEqual([...text.matchAll(/wise-motion@([^\s]+)/g)].map(match => match[1]), [packageVersion], '安装指引必须使用当前交付版本');
    }
    if (variantId) assert.match(source, /"variantId": "command-log"/);
    for (const asset of effect.source.assets || []) assert.ok(source.includes(asset), asset);
    if (effect.audio) assert.match(source, /includeAudio=\{false\}/);
    const compiled = await build({entryPoints:[path.join(out.directory,'src/index.jsx')], bundle:true, write:false, platform:'node', format:'esm', alias:{'wise-motion':path.join(root,'dist/index.mjs')}, external:['react','remotion'], logLevel:'silent'});
    assert.ok(compiled.outputFiles[0].text.includes('WiseMotionEffect'));
  }
}));

test('独立工程与浏览器复制逐文件一致，真实绘制文件不变，入口可编译', async () => temporary(async dir => {
  const effect = selectEffect('seed-bloom-brand-sequence'), out = await exportEffect(effect.id, {outDir:path.join(dir,'native')});
  assert.equal(out.kind, 'standalone');
  const expected = browser.projectFiles(effect).files;
  assert.deepEqual(out.files.map(file => path.relative(out.directory,file)).sort(), Object.keys(expected).sort());
  const copied = browser.remotionCode(effect);
  for (const [relative, content] of Object.entries(expected)) {
    assert.equal(await readFile(path.join(out.directory,relative),'utf8'), content);
    assert.ok(copied.includes(content), relative + ' 未使用复制生成器');
  }
  for (const file of effect.source.remotion.files) assert.equal(expected[file], await readFile(path.join(root,file),'utf8'));
  const pkg = JSON.parse(expected['package.json']);
  assert.deepEqual(pkg.dependencies, effect.source.remotion.packages);
  const compiled = await build({entryPoints:[path.join(out.directory,'index.jsx')], bundle:true, write:false, platform:'node', format:'esm', external:['react','remotion'], logLevel:'silent'});
  assert.ok(compiled.outputFiles[0].text.includes('SeedBloomBrand'));
}));

test('已有目录可用；同名文件整批停止，错误样式和链接不会留下半成品', async () => temporary(async dir => {
  const target = path.join(dir, 'target'); await mkdir(target);
  const first = await exportEffect('word-slam', {outDir:target});
  const source = path.join(target,'src/Root.jsx'); await writeFile(source, '// 用户改动\n');
  await assert.rejects(exportEffect('word-slam', {outDir:target}), /目标文件已存在/);
  assert.equal(await readFile(source,'utf8'), '// 用户改动\n'); assert.equal(first.files.length,3);
  const other = path.join(dir,'other'); await mkdir(other); await writeFile(path.join(other,'unrelated.txt'),'keep');
  await exportEffect('word-slam', {outDir:other});
  assert.equal(await readFile(path.join(other,'unrelated.txt'),'utf8'), 'keep');
  const conflict = path.join(dir,'conflict'); await mkdir(conflict); await writeFile(path.join(conflict,'README.md'),'用户说明');
  await assert.rejects(exportEffect('word-slam', {outDir:conflict}), /目标文件已存在/);
  assert.deepEqual(await readdir(conflict), ['README.md']);
  assert.equal(await readFile(path.join(conflict,'README.md'),'utf8'), '用户说明');
  const redirect = path.join(dir,'redirect'); await mkdir(redirect); await symlink(other,path.join(redirect,'src'));
  await assert.rejects(exportEffect('word-slam', {outDir:redirect}), /符号链接/);
  assert.deepEqual(await readdir(redirect), ['src']);
  const bad = path.join(dir, 'bad');
  await assert.rejects(exportEffect('word-slam', {outDir:bad, variantId:'none'}), /变体/);
  await assert.rejects(exportEffect('missing', {outDir:bad}), /没有名为/);
  await assert.rejects(readdir(bad), {code:'ENOENT'});
  await symlink(target, path.join(dir,'link'));
  await assert.rejects(exportEffect('word-slam', {outDir:path.join(dir,'link')}), /符号链接/);
  await symlink(root, path.join(dir,'skill'));
  await assert.rejects(exportEffect('word-slam', {outDir:path.join(dir,'skill/output')}), /技能源码/);
  await assert.rejects(exportEffect('word-slam', {outDir:root}), /技能源码/);
  await assert.rejects(exportEffect('word-slam', {outDir:path.dirname(root)}), /技能源码/);
}));

test('全局安装链接支持查看、名称导出、相对目标路径及明确参数错误', async () => temporary(async dir => {
  const entry = path.join(dir,'entry'); await symlink(root,entry);
  const invoke = (script,args) => spawnSync(process.execPath,[path.join(entry,'scripts',script),...args],{cwd:dir,encoding:'utf8'});
  const inspect = invoke('show.mjs',['terminal-code','--variant','command-log']);
  assert.equal(inspect.status,0,inspect.stderr); assert.match(inspect.stdout,/command-log/);
  const out = invoke('export.mjs',[selectEffect('word-slam').name,'--out-dir','output']);
  assert.equal(out.status,0,out.stderr); assert.ok(out.stdout.includes(path.join(dir,'output/src/Root.jsx')));
  assert.doesNotMatch(out.stdout,/import React/);
  for (const args of [[],['word-slam'],['word-slam','--out-dir'],['word-slam','--unknown'],['word-slam','--variant','--out-dir','x']]) assert.equal(invoke('export.mjs',args).status,1);
  for (const args of [[],['word-slam','--variant'],['word-slam','--unknown']]) assert.equal(invoke('show.mjs',args).status,1);
}));

test('速选表中的候选真实存在，通用入口和生成模板没有旧流程引用', async () => {
  const text = await readFile(path.join(root,'references/quickstart.md'),'utf8');
  const rows = text.split('## 按动作用途速选')[1].split('\n').filter(line=>line.startsWith('|')).join('\n');
  for (const [,id] of rows.matchAll(/`([a-z][a-z0-9-]+)`/g)) assert.ok(registry.effects.some(e=>e.id===id && e.kind!=='illustration'),id);
  for (const file of ['SKILL.md','README.md','agents/openai.yaml','references/quickstart.md','references/index.md','scripts/build.mjs','scripts/verify_project_skills.py']) {
    const body = await readFile(path.join(root,file),'utf8');
    assert.doesNotMatch(body,/director-design\.md|pipeline-methodology\.md|wise-motion-dna\.md|narrated-tutorial-review\.md|production-contract\.md|scripts\/plan\.mjs|eval-plan|effect\.content\b|nearest|\/Users\//,file);
  }
});
