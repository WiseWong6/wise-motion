// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const base = 'catalog/remotion/lego-kingdom/';
const compiled = await build({
  absWorkingDir: root,
  stdin: {resolveDir: root, loader: 'js', contents: [
    'Scene.jsx', 'BuildActions.jsx', 'FinaleActions.jsx', 'AmbientActions.jsx', 'fonts.js',
  ].map(file => `export * from './${base}${file}';`).join('\n')},
  bundle: true, write: false, format: 'cjs', platform: 'node',
  external: ['react', 'remotion'], logLevel: 'silent',
});
const module = {exports: {}};
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, module, module.exports);
const {
  LEGO_SPECS, REUSED_MODES, BUILD_SPECS, FINALE_SPECS, AMBIENT_SPECS, FONT_FACES,
  LegoScene, sourceFrame, resolveMotion, BUILD_MOTION,
  efficiencyPose, compareVisualFrame, comparisonPose,
  fileEditorPose,
} = module.exports;
const near = (actual, expected, tolerance = 1e-8) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
  `${actual} != ${expected}`,
);
const scene = (spec, frame) => React.createElement(LegoScene, {
  effectId: spec.exportId, variantId: spec.variantId, frame,
});
const markup = (spec, frame) => renderToStaticMarkup(scene(spec, frame));
const byMode = mode => {
  const spec = LEGO_SPECS.find(item => item.mode === mode);
  assert.ok(spec, `缺少动作模式：${mode}`);
  return spec;
};

test('全部动作明确使用30帧时钟，边界停在真实首末帧', () => {
  assert.deepEqual(Object.keys(BUILD_SPECS).sort(), [
    'brick-illustration', 'brick-wipe', 'cursor-trail', 'engine-flow', 'matrix-scan', 'path-packets', 'tracked-labels',
  ].sort());
  assert.deepEqual(Object.keys(FINALE_SPECS).sort(), [
    'comparison-timer', 'efficiency-grid', 'file-editor-send',
  ].sort());
  assert.deepEqual(Object.keys(AMBIENT_SPECS).sort(), ['verdict-checklist']);
  for (const mode of [
    'star-bounce-float', 'evidence-readouts', 'daynight', 'canvas-focus', 'throughput-lanes', 'code-stream', 'dual-evidence',
    'evidence-focus', 'growth-expand', 'send-expand', 'distance-drop', 'layered-parts',
    'efficiency-particles', 'efficiency-reveal', 'signature-enter', 'signature-close', 'signature-outro',
  ]) assert.ok(!LEGO_SPECS.some(spec => spec.mode === mode), mode + ' 已撤下');
  assert.deepEqual(LEGO_SPECS.filter(spec => spec.kind === 'composition').map(spec => spec.mode), ['engine-flow']);
  for (const spec of LEGO_SPECS.filter(spec => spec.kind!=='illustration'&&!['engine-flow','comparison-timer'].includes(spec.mode))) {
    assert.equal(spec.exportId, REUSED_MODES[spec.mode]?.id, spec.mode + ' 应归入现有动作');
    assert.equal(spec.variantId, REUSED_MODES[spec.mode]?.variantId, spec.mode + ' 应有独立示例变体');
    assert.notEqual(spec.id, spec.exportId, spec.mode + ' 示例工厂不能占用原动作名字');
  }
  const identities = LEGO_SPECS.map(spec => spec.exportId + '/' + (spec.variantId || ''));
  assert.equal(new Set(identities).size, identities.length, '独立入口与变体必须唯一');
  for (const spec of LEGO_SPECS) {
    assert.ok(Number.isInteger(spec.frames) && spec.frames > 0, spec.mode);
    assert.ok(spec.previewFrame >= 0 && spec.previewFrame < spec.frames, spec.mode);
    assert.equal(resolveMotion(spec.exportId, spec.variantId), spec);
    assert.equal(sourceFrame(spec, -1), 0, spec.mode);
    assert.equal(sourceFrame(spec, 0), 0, spec.mode);
    for (let frame = 0; frame < spec.frames; frame++) {
      assert.equal(sourceFrame(spec, frame / 30), frame, spec.mode + '/' + frame);
    }
    assert.equal(sourceFrame(spec, (spec.frames + 100) / 30), spec.frames - 1, spec.mode);
    assert.match(markup(spec, -20), /data-source-frame="0"/);
    assert.match(markup(spec, spec.frames + 20), new RegExp(`data-source-frame="${spec.frames - 1}"`));
    if (spec.frames > 1) assert.match(markup(spec, .9), /data-source-frame="0"/);
  }
  for (const time of [NaN, Infinity, -Infinity]) assert.throws(() => sourceFrame(LEGO_SPECS[0], time), /有限/);
  for (const frame of [NaN, Infinity, -Infinity]) assert.throws(() => renderToStaticMarkup(scene(LEGO_SPECS[0], frame)), /有限/);
  assert.throws(() => resolveMotion('missing-motion'), /未知/);
  assert.throws(() => resolveMotion('follow', 'missing-variant'), /未知/);
});

test('乱序定位和重复取样产生相同画面，不依赖已播放的历史', () => {
  for (const spec of LEGO_SPECS) {
    const frames = [...new Set([0, Math.floor(spec.frames / 2), spec.previewFrame, spec.frames - 1])];
    const expected = new Map(frames.map(frame => [frame, markup(spec, frame)]));
    for (const frame of [...frames].reverse().concat(frames[0], frames.at(-1))) {
      const actual = markup(spec, frame);
      assert.equal(actual, expected.get(frame), spec.mode + '/' + frame);
      assert.doesNotMatch(actual, /(?:NaN|Infinity|undefinedpx)/, spec.mode + ' 不得出现无效坐标');
    }
  }
});

test('所有绘制平面的SVG尺寸以行内样式声明，避免被目录图标样式缩小', () => {
  const dom = new JSDOM('<!doctype html><style>svg { width:15px; height:15px }</style><main></main>');
  const host = dom.window.document.querySelector('main');
  let checked = 0;
  try {
    for (const spec of LEGO_SPECS) {
      host.innerHTML = markup(spec, spec.previewFrame);
      for (const svg of host.querySelectorAll('svg')) {
        assert.ok(svg.style.width && svg.style.height, spec.mode + ' 缺少行内尺寸');
        near(Number.parseFloat(svg.style.width), Number(svg.getAttribute('width')));
        near(Number.parseFloat(svg.style.height), Number(svg.getAttribute('height')));
        assert.ok(Number.parseFloat(svg.style.width) > 0 && Number.parseFloat(svg.style.height) > 0);
        checked++;
      }
    }
    assert.ok(checked > 0, '确实检查当前保留动作中的SVG');
  } finally { dom.window.close(); }
});

test('积木在交接帧完全盖住画板，随后全部退出；矩阵落地与扫描保持源关键边界', () => {
  const {brickTile, matrixCell, engineFrame} = BUILD_MOTION;
  near(engineFrame(0), 0); near(engineFrame(64), 113);
  for (let row = 0; row < 25; row++) for (let col = 0; col < 11; col++) {
    near(brickTile(0, row, col).s, 0);
    assert.ok(brickTile(22, row, col).s >= 1 - 1e-9, '换底图时积木必须覆盖原尺寸');
    near(brickTile(43, row, col).s, 0);
  }
  assert.ok(brickTile(9, 0, 0).s > 1, '入场保留超过目标尺寸的回弹');
  near(matrixCell(4, 50).y, -520);
  near(matrixCell(13, 50).y, 0);
  near(matrixCell(15.5, 50).settle, -6);
  near(matrixCell(34, 0).p, 0);
  near(matrixCell(43, 0).y, 0);
  assert.equal(matrixCell(54, 0).done, false);
  assert.equal(matrixCell(57, 0).done, true);
  for (let i = 0; i < 55; i++) assert.equal(matrixCell(76, i).done, true);
  assert.equal(byMode('matrix-scan').frames, 65);
  assert.equal(byMode('path-packets').frames, 13, '独立分流只截原输出52至64帧');
  assert.equal(byMode('engine-flow').frames, 65, '完整组合保留全部原节奏');
  const subactions = ['matrix-scan', 'path-packets'].map(mode => byMode(mode));
  assert.deepEqual(byMode('engine-flow').actions, subactions.map(spec => spec.exportId));
  for (const spec of subactions) assert.equal(byMode('engine-flow').actionVariants[spec.exportId], spec.variantId);
});

test('路径粒子经过共同起点、水平分流和终点前竖段，未改为直线插值', () => {
  const start = BUILD_MOTION.packet(91, 0, 0);
  near(start.x, 540); near(start.y, 947); near(start.opacity, 0);
  const horizontal = BUILD_MOTION.packet(98.6923076923077, 0, 0);
  near(horizontal.x, 420); near(horizontal.y, 987);
  const vertical = BUILD_MOTION.packet(104.46153846153845, 0, 0);
  near(vertical.x, 310); near(vertical.y, 997);
  assert.ok(horizontal.opacity > 0 && vertical.opacity > 0);
  const right = BUILD_MOTION.packet(91, 1, 0);
  assert.ok(right.y > 947 && right.y < 987, '另一分支保留错开相位');
});

test('分流包含原两块输出积木，完整引擎保留原指纹、输出和说明', () => {
  const raw = (mode, frame, props = {}) => renderToStaticMarkup(React.createElement(
    module.exports.BuildAction, {mode, frame, ...props},
  ));
  const dom = new JSDOM('<!doctype html><main></main>');
  const host = dom.window.document.querySelector('main');
  try {
    for (const frame of [0, 43]) {
      host.innerHTML = raw('brick-wipe', frame);
      assert.equal(host.firstElementChild.children.length, 0, '转场首末只有空的遮挡层容器');
    }
    host.innerHTML = raw('path-packets', 9);
    assert.equal(host.firstElementChild.children.length, 2);
    assert.equal(host.firstElementChild.lastElementChild.children.length, 2, '原两块积木完整保留');
    const paths = host.firstElementChild.firstElementChild;
    assert.equal(paths.tagName.toLowerCase(), 'svg');
    assert.equal(paths.querySelectorAll('path').length, 2);
    assert.equal(paths.querySelectorAll('rect').length, 6);
    for (const text of ['const KINGDOM','const CASTLES','岛形 · 分区 · 河流','100 座城堡配方']) assert.ok(host.textContent.includes(text), text);
    host.innerHTML = raw('cursor-trail', 30);
    assert.equal(host.querySelectorAll('svg').length, 2);
    assert.equal(host.firstElementChild.children.length, 2, '只保留原轨迹及鼠标两层');
    assert.equal(host.querySelectorAll('[style*="background"]').length, 0,
      '鼠标单动作没有替代水面或底色');
    host.innerHTML = raw('matrix-scan', 64);
    assert.equal(host.firstElementChild.children.length, 55);
    assert.match(host.textContent, /§001✓ u0gu2j1/);
    assert.match(host.textContent, /§055✓ lztqyfd/);
    assert.doesNotMatch(host.textContent, /NODE/);
    host.innerHTML = raw('engine-flow', 64);
    for (const text of ['渲染 · 材质 · 灯光', '地形 · 河流 · 生长动画', 'const KINGDOM',
      'const CASTLES', '岛形 · 分区 · 河流', '100 座城堡配方']) {
      assert.ok(host.textContent.includes(text), text);
    }
    assert.ok(host.querySelector('[style*="radial-gradient"]'), '完整组合保留源点阵底');
    assert.doesNotMatch(host.textContent, /OUTPUT_A|OUTPUT_B|INPUT · PROCESS|结构数据|样式数据/);
    host.innerHTML = raw('engine-flow', 64, {engineTitle: '自定标题'});
    assert.ok(host.textContent.includes('自定标题'), '原品牌标题由独立参数提供');
  } finally { dom.window.close(); }
});

test('九点标注在源切换帧结束，鼠标保留延迟轨迹的原坐标', () => {
  const {layout, cursor} = BUILD_MOTION;
  assert.equal(layout(45).alternate, false);
  assert.equal(layout(46).alternate, true); near(layout(46).sourceFrame, 0);
  assert.equal(layout(0).anchors.length, 9);
  assert.deepEqual(cursor(0).point, [544.22, 668.86]);
  assert.deepEqual(cursor(50).point, [556.28, 892.88]);
  assert.equal(cursor(20).trail.length, 10);
  assert.deepEqual(cursor(20).trail[0], [661.9, 750.02]);
  assert.deepEqual(cursor(20).trail[9], cursor(2).point);
  assert.deepEqual(layout(0).anchors[0], [635.04, 594.84]);
  assert.deepEqual(layout(45).anchors[0], [645.98, 587.55]);
  const dom = new JSDOM(markup(byMode('tracked-labels'), 45));
  try {
    const body = dom.window.document.body;
    assert.match(body.textContent, /王都/); assert.match(body.textContent, /朔方/);
    assert.equal(body.querySelectorAll('svg line').length, 9);
    assert.equal(body.querySelectorAll('svg circle').length, 9);
    assert.equal(body.querySelectorAll('svg path, svg polygon, svg rect').length, 0,
      '单动作只剥离原标签，不能添加替代地形');
    dom.window.document.body.innerHTML = markup(byMode('tracked-labels'), 46);
    assert.doesNotMatch(body.textContent, /王都|朔方|曙光|东屿|南港|南泽|镜湖|河湾|西林/,
      '原片切换时结束旧标签');
    assert.equal(body.querySelectorAll('svg').length, 0, '第二地形不添加标签');
    assert.match(body.querySelector('img').getAttribute('src'), /layout\/frame-046.webp$/);
    for(const frame of [0,45,46,92]){
      const bg=BUILD_MOTION.layoutBackground(frame);
      assert.equal(bg.frame,frame);
      assert.equal(bg.sourceFrame,frame<46?frame:frame-46);
      const output=markup(byMode('tracked-labels'),frame);
      assert.ok(output.includes(bg.path));
    }
  } finally { dom.window.close(); }
});

test('效率、独立条形计时与文件使用最新时间锚点，不补旧尾段', () => {
  near(efficiencyPose(80).authoredFrame, 88); near(efficiencyPose(95).authoredFrame, 88);
  assert.equal(efficiencyPose(80).count, 100); near(efficiencyPose(95).finish, 1);
  for (const [current, original] of [[0, 0], [1, 2], [104, 148], [157, 231], [245, 332], [346, 427], [534, 546]]) {
    near(compareVisualFrame(current), original);
  }
  near(comparisonPose(104).minute, 185.8 / 60);
  near(comparisonPose(157).minute, 23); near(comparisonPose(245).minute, 26 + 4 / 60);
  near(fileEditorPose(0).local, 0); near(fileEditorPose(188).local, 119);
  assert.ok(fileEditorPose(188).exit > 0 && fileEditorPose(188).exit < 1,
    '原片在淡出完成前截断，不能人为补到旧123帧');
  assert.equal(byMode('comparison-timer').exportId,'lego-comparison-timer');
  assert.equal(byMode('comparison-timer').category,'data');
  assert.equal(byMode('comparison-timer').variantId,undefined);
});

const browserBundle = (await build({
  absWorkingDir: root, entryPoints: [base + 'catalog.jsx'], bundle: true, write: false,
  format: 'iife', platform: 'browser', define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'silent',
})).outputFiles[0].text;
const catalogUrl = pathToFileURL(root + 'catalog/index.html').href;
const legacyIds = [...new Set([
  'follow', 'particle-word', 'crt-collapse', 'count-up',
  ...Object.values(REUSED_MODES).map(item => item.id),
])];
function browserEnvironment() {
  const dom = new JSDOM('<!doctype html><body></body>', {url: catalogUrl, runScripts: 'outside-only'});
  const w = dom.window, fontRequests = [];
  Object.defineProperty(w.document, 'fonts', {value: {
    load(query) { fontRequests.push(query); return Promise.resolve([]); },
  }});
  w.eval(browserBundle);
  return {dom, w, fontRequests,
    host() {const node = w.document.createElement('div'); w.document.body.append(node); return node;}};
}

test('原有工厂及其属性保持原样，独立示例只注册自己的工厂', () => {
  for (const [mode, mapping] of Object.entries(REUSED_MODES)) {
    assert.equal(byMode(mode).exportId, mapping.id);
    assert.equal(byMode(mode).variantId, mapping.variantId);
  }
  const dom = new JSDOM('<!doctype html><body></body>', {url: catalogUrl, runScripts: 'outside-only'}), w = dom.window;
  const calls = new Map(legacyIds.map(id => [id, 0]));
  const originals = new Map();
  w.MotionFactories = {};
  for (const id of legacyIds) {
    const factory = Object.assign(() => {calls.set(id, calls.get(id) + 1); return 'legacy-' + id;}, {probe: () => id});
    originals.set(id, factory); w.MotionFactories[id] = factory;
  }
  try {
    for (let load = 0; load < 2; load++) {
      w.eval(browserBundle);
      for (const id of legacyIds) {
        assert.equal(w.MotionFactories[id], originals.get(id), id + ' 原函数未被替换');
        assert.equal(w.MotionFactories[id](w.document.body, {}, {id}), 'legacy-' + id);
        assert.equal(w.MotionFactories[id].probe(), id);
        assert.equal(calls.get(id), load + 1, '普通调用只到达旧工厂一次');
      }
      for (const spec of LEGO_SPECS) assert.equal(typeof w.MotionFactories[spec.id], 'function', spec.id);
    }
  } finally { dom.window.close(); }
});

test('目录工厂可创建、定位和销毁，字体加载可等待且末帧保留遵守参数', async () => {
  const env = browserEnvironment();
  try {
    for (const spec of LEGO_SPECS) {
      const definition = {id: spec.exportId, variant_id: spec.variantId, lego_motion: true};
      const host = env.host(), fontStart = env.fontRequests.length;
      const draw = env.w.MotionFactories[spec.id](host, {}, definition);
      assert.equal(typeof draw, 'function'); assert.equal(typeof draw.destroy, 'function');
      assert.equal(typeof draw.ready?.then, 'function', spec.mode + ' 字体准备可等待');
      await draw.ready;
      assert.deepEqual(env.fontRequests.slice(fontStart), FONT_FACES.map(([family,,weight]) => `${weight} 32px "${family}"`));
      const fontStyle = [...host.querySelectorAll('style')].find(node => node.textContent.includes('@font-face'));
      assert.ok(fontStyle, spec.mode + ' 目录载入来源字体声明');
      for (const [, file] of FONT_FACES) assert.ok(fontStyle.textContent.includes(new URL(file, pathToFileURL(root)).href), file);
      draw(spec.previewFrame / 30 * 1000);
      assert.equal(Number(host.querySelector('[data-source-frame]').dataset.sourceFrame), spec.previewFrame);
      const expected = host.innerHTML;
      draw(0); draw(spec.previewFrame / 30 * 1000);
      assert.equal(host.innerHTML, expected, spec.id + ' 目录逆向定位一致');
      draw.destroy(true);
      assert.equal(host.innerHTML, expected, spec.id + ' 保留绘制节点而卸载React根');
      draw(0); draw.destroy(true);
      assert.equal(host.innerHTML, expected, spec.id + ' 销毁后不再更新，重复销毁不改变保留画面');
      const disposable = env.host(), clear = env.w.MotionFactories[spec.id](disposable, {}, definition);
      assert.ok(disposable.childNodes.length);
      clear.destroy(); clear(1000); clear.destroy();
      assert.equal(disposable.childNodes.length, 0, spec.id + ' 默认销毁必须清空绘制节点');
    }
  } finally { env.dom.window.close(); }
});

test('三个原始动作模块不调用播放钩子、计时器或浏览器字体测量', async () => {
  for (const file of ['BuildActions.jsx', 'FinaleActions.jsx', 'AmbientActions.jsx']) {
    const source = await readFile(new URL('../' + base + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b(?:useCurrentFrame|requestAnimationFrame|setTimeout|setInterval|measureText|getContext)\s*\(/, file);
  }
});
