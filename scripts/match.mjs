// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {rank, describe} = createRequire(import.meta.url)('../catalog/matching.js');
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
if (error || !query) { console.error(error || '先理解并转译用户需求，再输入动作描述与禁项。\n用法：node scripts/match.mjs "两排卡片反向持续滚动，不要轮播" [--limit 3] [--details]'); process.exitCode = 1; }
else {
  console.log('此命令只检索转译后的动作描述，不负责理解用户意图；采用候选前须回到原话与上下文核对。');
  const matches = rank(data, query);
  if (!matches.length) { console.log('词语检索没有找到满足当前结构或禁项的直接参考。这不限制设计：可从表达目的与对象关系发散，或借用其他参考改良、组合；需要外部实现依据时再定向查证。'); }
  else {
    const candidates = matches.slice(0, limit);
    console.log(`找到 ${matches.length} 个候选，展示前 ${candidates.length} 个。候选可能只覆盖需求的一部分；包含多段动作时应分别检索，再核对组合关系。`);
    console.log('检索结果只供参考，可以改良、跨类组合或另起设计；参考默认值不是用户要求。');
    for (const [i, candidate] of candidates.entries()) {
      const effect = candidate.effect;
      console.log(`\n参考候选 ${i + 1}：${effect.name}\n匹配要求：${candidate.matched.join('、')}\n依据：${candidate.reason}\n已排除：${candidate.excluded.join('、') || '没有识别到明确禁项'}\n画面：${effect.summary}\n源码：${effect.source.path} 中的 ${effect.source.factory}\n说明：references/effects/${effect.id}.md`);
      if (details) console.log('\n' + describe(effect, {}, data));
    }
  }
}
