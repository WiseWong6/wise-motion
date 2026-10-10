// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {rank, describe, parse} = createRequire(import.meta.url)('../catalog/matching.js');
const data = JSON.parse(await readFile(new URL('../catalog/registry.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2), words = [];
let limit = 5, details = false, error = '';
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--details') details = true;
  else if (arg === '--limit' || arg.startsWith('--limit=')) {
    const value = arg === '--limit' ? args[++i] : arg.slice('--limit='.length);
    if (!/^[1-5]$/.test(value || '')) error = '候选数量须为 1 至 5 的整数。';
    else limit = Number(value);
  } else if (arg.startsWith('--')) error = '未知选项：' + arg;
  else words.push(arg);
}
const query = words.join(' ').trim();
if (error || !query) { console.error(error || '用法：node scripts/match.mjs "两排卡片反向持续滚动，不要轮播" [--limit 3] [--details]'); process.exitCode = 1; }
else {
  const matches = rank(data, query);
  if (!matches.length) { console.log(`没有找到直接参考。未覆盖：${query}。可拆成更具体的动作再查；仍无匹配的部分由调用方继续创作。`); }
  else {
    const candidates = matches.slice(0, limit);
    console.log(`找到 ${matches.length} 个候选，展示 ${candidates.length} 个；可能只覆盖需求的一部分。多段动作分别检索，连接关系由调用方核对。`);
    const segments = parse(query).positive.split(/[，,。；;\n]+/).map(s => s.trim()).filter(Boolean);
    const segmentMatches = segments.map(text => ({text, ids: new Set(rank(data, text).map(item => item.effect.id))}));
    for (const [i, candidate] of candidates.entries()) {
      const effect = candidate.effect;
      const covered = segmentMatches.filter(s => s.ids.has(effect.id)).map(s => s.text);
      const missing = segmentMatches.filter(s => !s.ids.has(effect.id)).map(s => s.text);
      console.log(`\n参考候选 ${i + 1}：${effect.name}（${effect.id}）\n对应片段（词语命中）：${covered.join('；') || query}\n匹配线索：${candidate.matched.join('、')}\n实现：${effect.summary}\n未确认覆盖：${missing.join('；') || '词语检索不能保证全部细节，按上述实现核对'}\n已识别并排除：${candidate.excluded.join('、') || '无明确禁项命中'}\n源码：${effect.source.remotion?.component || effect.source.path}`);
      if (details) console.log('\n' + describe(effect, {}, data));
    }
  }
}
