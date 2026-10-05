// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile, readdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFile(path.join(root, relative), 'utf8');
const data = JSON.parse(await read('catalog/registry.json'));
assert.equal(data.effects.length, 360);
assert.equal(data.effects.filter(x => x.kind === 'action').length, 274);
assert.equal(data.effects.filter(x => x.kind === 'illustration').length, 61);
assert.equal(data.effects.filter(x => x.kind === 'composition').length, 25);
assert.equal(new Set(data.effects.map(x => x.id)).size, data.effects.length);
for(const [from,to] of Object.entries(data.redirects||{})){
  assert.ok(!data.effects.some(e=>e.id===from),'旧书签不应覆盖现有条目');
  assert.ok(data.effects.some(e=>e.id===to),'旧书签对应动作缺失：'+from);
}
for(const [from,variant] of Object.entries(data.variant_redirects||{})){
  assert.ok(data.effects.find(e=>e.id===data.redirects[from])?.variants?.some(v=>v.id===variant),'旧书签对应示例缺失：'+from);
}
assert.equal(data.license, 'AGPL-3.0-only');
const files = new Set();
for (const e of data.effects) {
  for (const key of ['id','name','kind','category','summary','purpose','objects','phases','aliases','behaviors','retain','avoid','duration_ms','default_ease','parameters','source','actions','trigger','analogy','assumptions','tempo_note','recommendation']) assert.ok(e[key], e.id + ' 缺少 ' + key);
  assert.ok(typeof e.recommendation === 'string' && e.recommendation.trim(), e.id + ' 的推荐说明不能为空');
  assert.ok(data.categories.some(c => c.id === e.category));
  assert.ok(['action','illustration','composition'].includes(e.kind));
  assert.equal(e.kind === 'composition', (e.category === 'compositions' || e.category.startsWith('composition-')));
  assert.equal(e.kind === 'illustration', e.category.startsWith('illustration-'));
  assert.equal(e.phases.length, 3);
  assert.ok(e.duration_ms > 0 && e.preview_ms >= 0 && e.preview_ms <= e.duration_ms);
  if (e.timing) {
    const t=e.timing;
    assert.ok(Object.values(t).every(Number.isFinite),e.id+' 的节奏有无效时间');
    assert.ok(t.source_duration_ms>0&&t.source_preview_ms>=0&&t.source_preview_ms<=t.source_duration_ms);
    assert.ok(t.source_start_ms>=0&&t.source_start_ms<t.source_end_ms&&t.source_end_ms<=t.source_duration_ms);
    assert.ok(t.start_ms>=0&&t.start_ms<t.end_ms&&t.end_ms<=e.duration_ms);
    if (e.loop) {
      assert.equal(t.start_ms,0);assert.equal(t.end_ms,e.duration_ms);
      assert.equal(t.source_start_ms,0);assert.equal(t.source_end_ms,t.source_duration_ms);
    } else {
      assert.equal(t.start_ms,150);assert.equal(e.duration_ms-t.end_ms,450);
      // 分组递增按用户要求去掉组间停留，保留每组递增过程。
      if(e.id==='narrated-count') assert.equal(t.end_ms-t.start_ms,1320);
      else assert.ok([600,1200,1800,2400,3600].includes(t.end_ms-t.start_ms));
    }
  }
  assert.equal(typeof e.loop, 'boolean');
  assert.ok(typeof e.source.factory === 'string' && e.source.factory.length, e.id+' 缺少绘制入口');
  assert.equal(e.source.origin, 'original');
  assert.equal(e.source.license, 'AGPL-3.0-only');
  assert.equal(e.source.library, 'animejs@4.5.0');
  for(const reference of [e.source.reference,...(e.source.additional_references||[])].filter(Boolean)){
    assert.ok(typeof reference.name==='string'&&reference.name.trim(),e.id+' 缺少参考来源名称');
    if(reference.url)assert.equal(new URL(reference.url).protocol,'https:',e.id+' 的参考来源必须使用 HTTPS');
    for(const key of ['credit_prefix','credit_suffix'])if(reference[key]!==undefined)assert.ok(typeof reference[key]==='string'&&reference[key].trim(),e.id+' 的署名文字无效');
  }
  assert.ok(e.source.path.startsWith('catalog/effects/'));
  assert.ok(!e.source.path.includes('..'));
  assert.ok((await stat(path.join(root, e.source.path))).isFile());
  assert.ok(e.parameters.speed.min <= e.parameters.speed.default && e.parameters.speed.default <= e.parameters.speed.max);
  if (e.parameters.ease) assert.ok(e.parameters.ease.options.includes(e.default_ease));
  if (e.kind === 'action') assert.equal(e.actions.length, 0);
  else {
    if(e.kind === 'composition')assert.ok(e.actions.length,e.id+' 未关联独立动作');
    assert.equal(new Set(e.actions).size,e.actions.length,e.id+' 的关联重复');
    for (const id of e.actions) assert.ok(data.effects.some(x => x.id === id && (e.kind==='illustration' ? x.kind==='action' : ['action','illustration'].includes(x.kind))), e.id + ' 的关联参考无效：' + id);
  }
  if (e.variants) {
    assert.ok(e.variants.length>1);
    assert.equal(new Set(e.variants.map(v=>v.id)).size,e.variants.length);
    for(const v of e.variants)assert.ok(v.id&&v.label&&v.summary&&v.duration_ms>0&&v.preview_ms>=0&&v.preview_ms<=v.duration_ms,e.id+' 的示例定义不完整');
    assert.equal(e.duration_ms,e.variants[0].duration_ms);assert.equal(e.preview_ms,e.variants[0].preview_ms);
  }
  for(const [id,variant] of Object.entries(e.action_variants||{})){
    assert.ok(e.actions.includes(id),e.id+' 的示例不属于相关动作');
    assert.ok(data.effects.find(x=>x.id===id)?.variants?.some(v=>v.id===variant),e.id+' 关联的示例不存在');
  }
  for(const dependency of e.source.dependencies||[]){
    assert.ok(dependency.startsWith('catalog/effects/')&&!dependency.includes('..'));
    assert.ok((await stat(path.join(root,dependency))).isFile());files.add(dependency);
  }
  for(const asset of e.source.assets||[]){
    assert.ok(asset.startsWith('catalog/assets/')&&!asset.includes('..'),e.id+' 的素材路径无效');
    assert.ok((await stat(path.join(root,asset))).isFile(),e.id+' 缺少本地素材：'+asset);
  }
  files.add(e.source.path);
}
const factories = {}; const context = vm.createContext({MotionFactories: factories});
for (const file of files) vm.runInContext(await read(file), context, {filename:file});
const drawings=data.effects.flatMap(e=>[e,...(e.variants||[]).map(({id,label,...fields})=>({...e,...fields}))]);
assert.deepEqual(Object.keys(factories).sort(), [...new Set(drawings.map(x => x.source.factory))].sort());
assert.ok(Object.values(factories).every(x => typeof x === 'function'));
for(const e of drawings){
  const source=e.source,owner=data.effects.find(x=>x.id===source.factory);
  assert.ok(owner,e.id+' 的绘制入口未登记');
  if(source.factory!==e.id){
    assert.equal(owner.source.path,source.path,e.id+' 的共享绘制来源不一致');
    assert.ok(owner.kind==='illustration'&&owner.actions.includes(e.id),e.id+' 未与源插画关联');
  }
  for(const file of [source.path,...(source.dependencies||[]),...(source.assets||[])]){
    assert.ok(file.startsWith('catalog/')&&!file.includes('..'),e.id+' 的示例资源路径无效');
    assert.ok((await stat(path.join(root,file))).isFile(),e.id+' 的示例资源缺失：'+file);
  }
}
for (const effect of data.effects.filter(e=>e.kind==='composition')) {
  const layers=factories[effect.id].breakdown;
  assert.ok(layers?.length,effect.id+' 缺少真实拆解');
  assert.equal(new Set(layers.map(x=>x.id)).size,layers.length);
  for(const layer of layers){
    assert.ok(layer.id&&layer.name&&layer.detail&&layer.time,effect.id+' 拆解信息不完整');
    assert.ok(layer.start>=0&&layer.end>layer.start&&layer.end<=effect.duration_ms,effect.id+'/'+layer.id+' 时段无效');
    for(const action of layer.actions||[])assert.ok(effect.actions.includes(action),effect.id+' 存在未登记关联');
  }
  assert.deepEqual([...new Set(layers.flatMap(layer=>Array.from(layer.actions||[])))].sort(),[...effect.actions].sort(),effect.id+' 的图层与独立动作不对应');
}

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
// 普通检查只读随源码提供的退役记录；原始档案一致性由 check:history 检查。
const historyContext={};
vm.runInNewContext(await read('catalog/history-data.js'),historyContext);
const historical=historyContext.MotionHistory;
assert.equal(historical.counts.reviewed,311);assert.equal(historical.counts.recipes,0);
assert.equal(historical.counts.entries,0);assert.equal(historical.counts.document,0);
assert.equal(historical.excluded.length,311);
assert.equal(historical.merged.length,0);
assert.equal(historical.recipes.length+historical.excluded.length+historical.merged.length,historical.counts.reviewed);
assert.equal(new Set(historical.recipes.map(x=>x.id)).size,0);
assert.ok(historical.recipes.every(r=>r.entries.length&&r.source_clock&&r.source_parameters&&r.review.preserve.length));
const ownFiles = ['catalog/runtime.js','catalog/history-runtime.js','catalog/history.css','catalog/export.js','catalog/dropdown.js','catalog/matching.js','catalog/app.js','catalog/app.css','catalog/scenes.css','catalog/book-controls.js','catalog/book-controls.css','catalog/composition-controls.js','catalog/related-preview.js', ...files];
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
const markdown = ['README.md','SKILL.md','NOTICE.md','CATALOG-STATS.md','references/index.md','references/history.md','references/method.md','references/sources.md','references/runtime-interface.md','references/material-refinement.md','references/apple-hig.md','tests/manual.md', ...data.effects.map(e => 'references/effects/' + e.id + '.md')];
for (const file of markdown) for (const [, link] of (await read(file)).matchAll(/\]\(([^)]+)\)/g)) if (!/^(https?:|#)/.test(link)) assert.ok((await stat(path.resolve(root, path.dirname(file), link))).isFile(), file + ' 的链接缺失：' + link);
console.log(`检查通过：${data.effects.filter(x => x.kind === 'action').length} 个动作、${data.effects.filter(x => x.kind === 'illustration').length} 个插画单图、${data.effects.filter(x => x.kind === 'composition').length} 个组合；定义、关联动作、共享绘制、来源路径、生成文件、许可文件和脚本语法完整。`);
