// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile, symlink, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {createPlan, checkPlan, buildJsx, sourceTag, splitSubtitles} from '../scripts/plan.mjs';
import registry from '../catalog/registry.json' with {type: 'json'};

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const example = async () => JSON.parse(await readFile(path.join(root, 'references/plan-example.json'), 'utf8'));
const byId = id => registry.effects.find(effect => effect.id === id);

test('字幕切成镜头：空行被忽略，过长的行按句末标点再切', () => {
  assert.deepEqual(splitSubtitles('「第一句」\n\n第二句\r\n'), ['第一句', '第二句']);
  const long = '这是一个很长的句子需要被切开所以我写了很多字。' + '这是第二个同样很长的句子也要被切开所以也写了很多字！';
  assert.equal(splitSubtitles(long).length, 2);
});

test('init 生成的骨架留空设计字段，检查时用中文逐项指出', () => {
  const plan = createPlan('opus 5.5做视频很强\n但几乎没有稳定的使用方式');
  assert.equal(plan.shots.length, 2);
  assert.deepEqual(plan.shots.map(shot => shot.id), ['s01', 's02']);
  assert.ok(plan.shots.every(shot => shot.seconds >= 1.5));
  const {errors} = checkPlan(plan);
  assert.ok(errors.some(message => message.includes('没有填写「看谁（主体）」')));
  assert.ok(errors.some(message => message.includes('effect.mode')));
  assert.throws(() => buildJsx(plan), /未通过检查/);
});

test('随附的示例计划通过检查，且来源标记与目录一致', async () => {
  const plan = await example();
  const {errors} = checkPlan(plan);
  assert.deepEqual(errors, []);
  for (const shot of plan.shots) assert.equal(shot.effect.source, sourceTag(byId(shot.effect.id)));
});

test('检查拦截：未读源码、插画、微调无提示词、镜头过短', async () => {
  const plan = await example();
  const wrongSource = structuredClone(plan);
  wrongSource.shots[0].effect.source = '';
  assert.ok(checkPlan(wrongSource).errors.some(message => message.includes('effect.source')));

  const illustration = registry.effects.find(effect => effect.kind === 'illustration');
  const asIllustration = structuredClone(plan);
  Object.assign(asIllustration.shots[0].effect, {id: illustration.id, source: sourceTag(illustration)});
  assert.ok(checkPlan(asIllustration).errors.some(message => message.includes('插画素材')));

  const blankTweak = structuredClone(plan);
  blankTweak.shots[3].effect.prompt = '';
  assert.ok(checkPlan(blankTweak).errors.some(message => message.includes('effect.prompt')));

  const tooShort = structuredClone(plan);
  tooShort.shots[2].seconds = 0.5;
  assert.ok(checkPlan(tooShort).errors.some(message => message.includes('截断')));
});

test('装配：帧数连续，总长等于各镜之和，速度落在允许范围', async () => {
  const plan = await example();
  const {source, totalFrames, pending} = buildJsx(plan);
  assert.deepEqual(pending, []);
  assert.equal(totalFrames, plan.shots.reduce((sum, shot) => sum + Math.round(shot.seconds * plan.fps), 0));
  const sequences = [...source.matchAll(/<Sequence from=\{(\d+)\} durationInFrames=\{(\d+)\}/g)].map(m => [Number(m[1]), Number(m[2])]);
  assert.equal(sequences.length, plan.shots.length);
  let expected = 0;
  for (const [from, frames] of sequences) { assert.equal(from, expected); expected += frames; }
  assert.equal(expected, totalFrames);
  for (const [, speed] of source.matchAll(/speed=\{([\d.]+)\}/g)) assert.ok(Number(speed) >= 0.5 && Number(speed) <= 2);
  assert.match(source, /durationInFrames=\{480\} \/>/);
  const {tweak, reuse} = buildJsx(plan);
  assert.deepEqual(tweak.map(item => item.id), ['s01', 's02', 's04', 's05'], '微调镜头要列为待改');
  assert.deepEqual(reuse.map(item => item.id), ['s03']);
});

test('原创镜头在装配里留占位并被报告', async () => {
  const plan = await example();
  plan.shots[1].effect = {mode: 'original', id: '', variant: '', speed: null, source: '', prompt: '一行字沿水平线从左向右依次出现，落位后整行保持 1 秒，不抖动。'};
  const {source, pending} = buildJsx(plan);
  assert.deepEqual(pending, ['s02']);
  assert.match(source, /原创镜头，待实现/);
});

test('命令行：check 通过，build 拒绝写进技能目录，show 找不到时给出相近建议', async () => {
  const example = path.join(root, 'references/plan-example.json');
  const checked = await run('node', ['scripts/plan.mjs', 'check', example], {cwd: root});
  assert.match(checked.stdout, /通过/);

  await assert.rejects(run('node', ['scripts/plan.mjs', 'build', example, path.join(root, 'out.jsx')], {cwd: root}), error => /不能写进技能源码目录/.test(error.stderr));

  const dir = await mkdtemp(path.join(tmpdir(), 'wise-plan-'));
  try {
    const target = path.join(dir, 'src/index.jsx');
    await run('node', ['scripts/plan.mjs', 'build', example, target], {cwd: root});
    assert.match(await readFile(target, 'utf8'), /WiseMotionEffect/);
    const subtitles = path.join(dir, 'a.txt');
    await writeFile(subtitles, '第一句\n第二句\n');
    const planFile = path.join(dir, 'plan.json');
    await run('node', ['scripts/plan.mjs', 'init', subtitles, planFile], {cwd: root});
    assert.equal(JSON.parse(await readFile(planFile, 'utf8')).shots.length, 2);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }

  const shown = await run('node', ['scripts/show.mjs', 'word-slam'], {cwd: root});
  assert.match(shown.stdout, /effects\/word-slam\.js/);
  assert.match(shown.stdout, /WiseMotionEffect/);
  await assert.rejects(run('node', ['scripts/show.mjs', 'word-slamm'], {cwd: root}), error => error.code === 1);
});

test('速选表里的每个动效都在目录里，且不是插画', async () => {
  const text = (await readFile(path.join(root, 'references/quickstart.md'), 'utf8')).split('## 按镜头用途速选')[1].split('\n## ')[0];
  const ids = [...text.matchAll(/`([a-z][a-z0-9-]+)` /g)].map(match => match[1]);
  assert.ok(ids.length >= 30, '速选表应列出足够多的条目');
  for (const id of new Set(ids)) {
    const effect = byId(id);
    assert.ok(effect, `速选表里的 ${id} 不在目录里`);
    assert.notEqual(effect.kind, 'illustration', `${id} 是插画`);
  }
});

test('全局目录链接可调用分镜与查看命令，且不能经链接写回技能目录', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'wise-global-'));
  try {
    const entry = path.join(dir, 'wise-motion');
    await symlink(root, entry, 'dir');
    const exampleFile = path.join(entry, 'references/plan-example.json');
    const checked = await run('node', [path.join(entry, 'scripts/plan.mjs'), 'check', exampleFile], {cwd: dir});
    assert.match(checked.stdout, /通过/);
    const shown = await run('node', [path.join(entry, 'scripts/show.mjs'), 'word-slam'], {cwd: dir});
    assert.match(shown.stdout, /effects\/word-slam\.js/);
    const output = path.join(entry, path.basename(dir), 'src/index.jsx');
    await assert.rejects(run('node', [path.join(entry, 'scripts/plan.mjs'), 'build', exampleFile, output], {cwd: dir}), error => /不能写进技能源码目录/.test(error.stderr));
    await assert.rejects(access(path.dirname(output)), error => error.code === 'ENOENT');
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
