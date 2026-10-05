// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 实际执行每个条目和变体；在相同浏览器中比较完整加载与按需加载。
// 不截图、不起服务，检查结果写到调用者指定的维护目录。
import {openBrowser} from '@remotion/renderer';
import {readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createFrameDocument, FRAME_SCRIPTS, frameScriptsFor} from '../remotion/frame-document.mjs';
import {effectDefinitions, resolveEffect} from '../remotion/clock.mjs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
if (!option('--output')) throw Error('请用 --output 指定源码外的检查结果文件');
const output = path.resolve(option('--output'));
if (output === root || output.startsWith(root + path.sep)) throw Error('检查结果应保存在源码外的维护目录');
const ids = option('--ids')?.split(',');
const effects = effectDefinitions.filter(effect => !ids || ids.includes(effect.id));
if (ids?.some(id => !effects.some(effect => effect.id === id))) throw Error('检查列表包含未知条目');
const definitions = effects.flatMap(effect => effect.variants?.length
  ? effect.variants.map(variant => resolveEffect(effect.id, variant.id)) : [resolveEffect(effect.id)]);
const files = new Map();
const file = async name => {
  if (!files.has(name)) files.set(name, await readFile(path.join(root, name)));
  return files.get(name);
};
const sha = value => createHash('sha256').update(value).digest('hex');
const byteCount = async names => (await Promise.all(names.map(file))).reduce((sum, bytes) => sum + bytes.length, 0);
const packageInfo = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {cwd: root, encoding: 'utf8'}))[0];
const packaged = new Set(packageInfo.files.map(entry => entry.path));
const manifest = JSON.parse(await readFile(path.join(root, 'ASSET-MANIFEST.json'), 'utf8'));
const manifestFailures = [];
for (const item of manifest.files) {
  if (!packaged.has(item.path)) manifestFailures.push('未入包：' + item.path);
  const bytes = await file(item.path);
  if (bytes.length !== item.bytes || sha(bytes) !== item.sha256) manifestFailures.push('素材清单过期：' + item.path);
}
await mkdir(path.dirname(output), {recursive: true});
const host = output + '.host.html';
const base = pathToFileURL(root + path.sep).href;
const hostScripts = ['vendor/animejs/anime.umd.min.js', 'catalog/registry-data.js', 'catalog/runtime.js', 'catalog/effects/civilization-images.js', 'catalog/remotion-sources.js', 'catalog/export.js'];
await writeFile(host, '<!doctype html><meta charset="utf-8"><body>' + hostScripts.map(name => `<script src="${base + name}"></script>`).join(''));
const report = {createdAt: new Date().toISOString(), source: root,
  scope: '实际加载、绘制、乱序重复定位、画面数据对比、复制源码和打包素材完整性；不等同于逐条人工观看',
  entryCount: effects.length, configurationCount: definitions.length, manifestFiles: manifest.files.length, manifestFailures,
  fullScripts: FRAME_SCRIPTS.length, fullScriptBytes: await byteCount(FRAME_SCRIPTS),
  browserBundleBytes: (await file('catalog/remotion-player.js')).length, results: []};
const browser = await openBrowser('chrome', {chromeMode: 'headless-shell', chromiumOptions: {gl: 'angle', disableWebSecurity: true}, logLevel: 'error'});
const save = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
try {
  const page = await browser.newPage({context: undefined, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog() {}});
  await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
  await page.goto({url: pathToFileURL(host).href, timeout: 120000});
  report.browser = await page.evaluate(() => navigator.userAgent);
  for (const definition of definitions) {
    const record = {id: definition.id, name: definition.name, variant: definition.variant_id ?? null, kind: definition.kind,
      source: definition.source.path, status: 'failed'};
    try {
      record.scripts = frameScriptsFor(definition);
      record.scriptBytes = await byteCount(record.scripts);
      for (const name of record.scripts) if (!packaged.has(name)) throw Error('绘制代码没有进入复用包：' + name);
      const copy = await page.evaluate(def => {
        const code = MotionExport.remotionCode(def);
        const nativeFiles = def.source.remotion?.files.map(name => ({name, source: MotionRemotionSources[name]}));
        return {code, nativeFiles};
      }, definition);
      if (/\/Users\/|file:\/\/\//.test(copy.code)) throw Error('复制代码依赖本机路径');
      record.copy = {bytes: Buffer.byteLength(copy.code), sha256: sha(copy.code), type: copy.nativeFiles ? '完整原生工程' : '含实际绘制文件的组件包'};
      if (copy.nativeFiles) {
        for (const source of copy.nativeFiles) {
          if ((await file(source.name)).toString() !== source.source) throw Error('复制的原生源码不是当前文件：' + source.name);
          if (!packaged.has(source.name)) throw Error('复制源文件没有进入复用包：' + source.name);
        }
      } else {
        await transform(copy.code, {loader: 'jsx', format: 'esm'});
        if (!copy.code.includes("from 'wise-motion-remotion'") || !packaged.has('dist/index.mjs')) throw Error('复制结果缺少实际组件入口');
      }
      // 两种加载使用同一份绘制文件，按相同顺序取样；包含回退定位和循环累计时间。
      const passes = [];
      for (const selective of [false, true]) {
        const html = createFrameDocument({assetBaseUrl: base, definition: selective ? definition : undefined});
        const result = await page.evaluate(async ({html, definition}) => {
          const frame = document.createElement('iframe');
          frame.style.cssText = 'width:640px;height:360px;border:0;display:block';
          const start = performance.now();
          let timeout;
          try {
            await Promise.race([
              new Promise((resolve, reject) => {
                frame.onload = () => { if (frame.contentDocument?.URL !== 'about:blank') resolve(); };
                frame.onerror = () => reject(Error('隔离页加载失败'));
                document.body.append(frame); frame.srcdoc = html;
              }),
              new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('隔离页加载超时')), 180000); })
            ]);
            clearTimeout(timeout);
            const win = frame.contentWindow;
            const session = await win.__wiseMotionCreateSession({definition});
            const readyMs = performance.now() - start;
            const checksum = value => {
              let hash = 2166136261;
              for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ (typeof value === 'string' ? value.charCodeAt(i) : value[i]), 16777619);
              return (hash >>> 0).toString(16);
            };
            const signature = () => {
              const canonical = (node, visibleOnly = false) => {
                if (node.nodeType !== 1) return node.textContent;
                // 未显示的组合层保留缓存；重复定位只比较当前显示的层。
                // 完整加载与按需加载仍会另行比较所有层，包括隐藏缓存。
                if (visibleOnly && node.hasAttribute('data-layer') && win.getComputedStyle(node).display === 'none') return ['hidden-layer', node.dataset.layer];
                const attrs = [...node.attributes].filter(attr => attr.name !== 'style' || attr.value.trim()).map(attr => [attr.name, attr.value]).sort(([a], [b]) => a.localeCompare(b));
                return [node.tagName, attrs, [...node.childNodes].map(child => canonical(child, visibleOnly))];
              };
              const normalize = value => {
                let text = JSON.stringify(value);
                [...session.stage.querySelectorAll('[id]')].forEach((node, i) => { text = text.replaceAll(node.id, 'normalized-' + i); });
                return checksum(text);
              };
              const canvases = [...session.stage.querySelectorAll('canvas')].map(canvas => {
                // 不直接反复读取作品画布：Chromium 会因此切换绘制后端，
                // 让检查本身改变后续帧的抗锯齿。只读取独立的检查画布。
                const capture = document.createElement('canvas');
                capture.width = canvas.width; capture.height = canvas.height;
                const ctx = capture.getContext('2d', {willReadFrequently: true});
                ctx.drawImage(canvas, 0, 0);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const hiddenLayer = canvas.closest('[data-layer]');
                const hidden = Boolean(hiddenLayer && win.getComputedStyle(hiddenLayer).display === 'none');
                return {width: canvas.width, height: canvas.height, pixels: checksum(pixels), nonzero: pixels.some(value => value !== 0), hidden};
              });
              return {dom: normalize([...session.stage.childNodes].map(node => canonical(node))),
                visibleDom: normalize([...session.stage.childNodes].map(node => canonical(node, true))),
                nodes: session.stage.querySelectorAll('*').length, canvases};
            };
            const times = [0, definition.duration_ms * .25, definition.duration_ms * .5, definition.preview_ms, definition.duration_ms, definition.duration_ms * .25];
            if (definition.loop) times.push(definition.duration_ms * 2 + definition.duration_ms * .25);
            const samples = [];
            for (const elapsed of times) {
              const time = definition.loop && elapsed > definition.duration_ms ? elapsed % definition.duration_ms : elapsed;
              const drawStart = performance.now();
              await session.draw(time, elapsed, 'exact');
              const drawMs = performance.now() - drawStart;
              const state = signature();
              if (!state.nodes) throw Error('真实绘制结果为空');
              samples.push({time, elapsed, drawMs, ...state});
            }
            session.destroy();
            if (!session.destroyed || session.stage.childElementCount) throw Error('绘制资源没有销毁');
            return {readyMs, samples, released: true, scripts: [...win.document.scripts].filter(script => script.src).map(script => script.src)};
          } finally {
            clearTimeout(timeout);
            frame.contentWindow?.__wiseMotionSession?.destroy();
            frame.remove();
          }
        }, {html, definition});
        passes.push(result);
      }
      const clean = pass => pass.samples.map(({drawMs, ...value}) => value);
      record.fullLoad = passes[0]; record.selectiveLoad = passes[1];
      record.identicalDrawing = JSON.stringify(clean(passes[0])) === JSON.stringify(clean(passes[1]));
      if (!record.identicalDrawing) throw Error('按需加载后绘制结果有差异');
      const samples = passes[1].samples;
      const signatureOnly = ({visibleDom, canvases}) => JSON.stringify({visibleDom, canvases: canvases.filter(canvas => !canvas.hidden)});
      record.repeatable = signatureOnly(samples[1]) === signatureOnly(samples[5]);
      record.hiddenStateChanged = samples[1].dom !== samples[5].dom || JSON.stringify(samples[1].canvases) !== JSON.stringify(samples[5].canvases);
      if (!record.repeatable) throw Error('重复定位的绘制结果不一致');
      record.distinctStates = new Set(samples.map(signatureOnly)).size;
      record.status = 'passed';
    } catch (error) { record.error = error.stack || String(error); }
    report.results.push(record);
    await save();
    console.log(`${report.results.length}/${definitions.length} ${record.status} ${record.id}${record.variant ? '/' + record.variant : ''}${record.error ? ': ' + record.error.split('\n')[0] : ''}`);
  }
  report.passed = report.results.filter(record => record.status === 'passed').length;
  report.failed = report.results.length - report.passed;
  report.completedAt = new Date().toISOString();
  await save();
  if (report.failed || manifestFailures.length) process.exitCode = 1;
} finally {
  await browser.close({silent: true});
  await rm(host, {force: true});
}
