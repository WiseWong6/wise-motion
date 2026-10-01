// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, readdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {history} from './history.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFile(path.join(root, relative), 'utf8');
const data = JSON.parse(await read('catalog/registry.json'));
assert.equal(data.effects.length, 80);
assert.equal(data.effects.filter(x => x.kind === 'action').length, 74);
assert.equal(data.effects.filter(x => x.kind === 'composition').length, 6);
assert.equal(new Set(data.effects.map(x => x.id)).size, data.effects.length);
assert.equal(data.license, 'AGPL-3.0-only');
const files = new Set();
for (const e of data.effects) {
  for (const key of ['id','name','kind','category','summary','purpose','objects','phases','aliases','behaviors','retain','avoid','duration_ms','default_ease','parameters','source','actions','trigger','analogy','assumptions','tempo_note']) assert.ok(e[key], e.id + ' 缺少 ' + key);
  assert.ok(data.categories.some(c => c.id === e.category));
  assert.ok(['action','composition'].includes(e.kind));
  assert.equal(e.kind === 'composition', e.category === 'compositions');
  assert.equal(e.phases.length, 3);
  assert.ok(e.duration_ms > 0 && e.preview_ms >= 0 && e.preview_ms <= e.duration_ms);
  assert.equal(typeof e.loop, 'boolean');
  assert.equal(e.source.factory, e.id);
  assert.equal(e.source.origin, 'original');
  assert.equal(e.source.license, 'AGPL-3.0-only');
  assert.equal(e.source.library, 'animejs@4.5.0');
  assert.ok(e.source.path.startsWith('catalog/effects/'));
  assert.ok(!e.source.path.includes('..'));
  assert.ok((await stat(path.join(root, e.source.path))).isFile());
  assert.ok(e.parameters.speed.min <= e.parameters.speed.default && e.parameters.speed.default <= e.parameters.speed.max);
  if (e.parameters.ease) assert.ok(e.parameters.ease.options.includes(e.default_ease));
  if (e.kind === 'action') assert.equal(e.actions.length, 0);
  else { assert.ok(e.actions.length); for (const id of e.actions) assert.ok(data.effects.some(x => x.id === id && x.kind === 'action'), e.id + ' 的关联动作无效：' + id); }
  files.add(e.source.path);
}
const factories = {}; const context = vm.createContext({MotionFactories: factories});
for (const file of files) vm.runInContext(await read(file), context, {filename:file});
assert.deepEqual(Object.keys(factories).sort(), data.effects.map(x => x.id).sort());
assert.ok(Object.values(factories).every(x => typeof x === 'function'));
const source = JSON.parse(await read('vendor/animejs/SOURCE.json'));
assert.equal(source.version, '4.5.0'); assert.equal(source.license, 'MIT'); assert.equal(source.modified, false);
for (const [name, expected] of Object.entries(source.files)) {
  const bytes = await readFile(path.join(root, 'vendor/animejs', name));
  assert.equal(bytes.length, expected.bytes, name + ' 长度改变');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, name + ' 内容改变');
}
const iconSource = JSON.parse(await read('vendor/heroicons/SOURCE.json'));
assert.equal(iconSource.version,'2.2.0'); assert.equal(iconSource.license,'MIT');
for (const [name,expected] of Object.entries(iconSource.files)) {
  const bytes = await readFile(path.join(root,'vendor/heroicons',name));
  assert.equal(bytes.length,expected.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256);
}
assert.match(await read('vendor/heroicons/LICENSE'), /MIT License/);
const lucideSource = JSON.parse(await read('vendor/lucide/SOURCE.json'));
assert.equal(lucideSource.version, '1.8.0');
assert.equal(lucideSource.license, 'ISC AND MIT');
const lucideLicense = await readFile(path.join(root, 'vendor/lucide/LICENSE'));
assert.equal(createHash('sha256').update(lucideLicense).digest('hex'), lucideSource.files.LICENSE.sha256);
assert.match(lucideLicense.toString(), /ISC License/);
assert.match(lucideLicense.toString(), /The MIT License \(MIT\)/);
assert.match(await read('vendor/animejs/LICENSE.md'), /MIT License/);
assert.match(await read('LICENSE'), /GNU AFFERO GENERAL PUBLIC LICENSE/);
assert.match(await read('agents/openai.yaml'), /allow_implicit_invocation:\s*false/);
const html = await read('catalog/index.html');
for (const [, resource] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (resource.startsWith('#')) { assert.ok(html.includes(`id="${resource.slice(1)}"`), '页面内链接的目标不存在：' + resource); continue; }
  assert.ok(!/^(https?:|\/\/)/.test(resource), '目录引用远程资源：' + resource);
  assert.ok((await stat(path.resolve(root, 'catalog', resource))).isFile(), '缺少目录资源：' + resource);
}
const historical=await history(data);
assert.equal(historical.counts.reviewed,292);assert.equal(historical.counts.recipes,285);
assert.equal(historical.counts.entries,307);assert.equal(historical.counts.document,61);
assert.equal(historical.excluded.length,7);
assert.equal(new Set(historical.recipes.map(x=>x.id)).size,285);
assert.ok(historical.recipes.every(r=>r.entries.length&&r.source_clock&&r.source_parameters&&r.review.preserve.length));
const ownFiles = ['catalog/runtime.js','catalog/history-runtime.js','catalog/history.css','catalog/export.js','catalog/dropdown.js','catalog/matching.js','catalog/app.js','catalog/app.css','catalog/scenes.css','catalog/book-controls.js','catalog/book-controls.css', ...files];
for (const file of ownFiles) {
  const content = await read(file);
  assert.ok(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bimport\s*\(|@import\s|url\(\s*["']?(?:https?:|\/\/)/.test(content), '运行时有联网或模块依赖：' + file);
  assert.ok(!/Math\.random\s*\(|setInterval\s*\(/.test(content), '有不可复现的时序：' + file);
}
for (const dir of ['catalog','catalog/effects','scripts','tests']) {
  for (const name of await readdir(path.join(root, dir))) if (/\.(js|mjs)$/.test(name)) {
    const result = spawnSync(process.execPath, ['--check', path.join(root, dir, name)], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
}
const build = spawnSync(process.execPath, [path.join(root, 'scripts/build.mjs'), '--check'], {encoding:'utf8'});
assert.equal(build.status, 0, build.stderr);
const markdown = ['README.md','SKILL.md','NOTICE.md','references/index.md','references/history.md','references/method.md','references/sources.md','references/runtime-interface.md','references/apple-hig.md','tests/manual.md', ...data.effects.map(e => 'references/effects/' + e.id + '.md')];
for (const file of markdown) for (const [, link] of (await read(file)).matchAll(/\]\(([^)]+)\)/g)) if (!/^(https?:|#)/.test(link)) assert.ok((await stat(path.resolve(root, path.dirname(file), link))).isFile(), file + ' 的链接缺失：' + link);
console.log('检查通过：74 个动作、6 个组合、285 条历史配方与 307 个案例；定义、来源路径、生成文件、许可和脚本语法完整。');
