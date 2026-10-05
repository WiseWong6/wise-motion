// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {rank, describe} = createRequire(import.meta.url)('../catalog/matching.js');
const data = JSON.parse(await readFile(new URL('../catalog/registry.json', import.meta.url), 'utf8'));
const query = process.argv.slice(2).join(' ').trim();
if (!query) { console.error('先理解并转译用户需求，再输入动作描述与禁项。\n用法：node scripts/match.mjs "两排卡片反向持续滚动，不要轮播"'); process.exitCode = 1; }
else {
  console.log('此命令只检索转译后的动作描述，不负责理解用户意图；采用候选前须回到原话与上下文核对。');
  const matches = rank(data, query);
  if (!matches.length) { console.log('词语检索没有找到满足当前结构或禁项的直接参考。这不限制设计：可从表达目的与对象关系发散，或借用其他参考改良、组合；需要外部实现依据时再定向查证。'); }
  else {
    const best = matches[0];
    console.log('检索结果只供参考，可以改良、跨类组合或另起设计；参考默认值不是用户要求。');
    console.log(`参考候选：${best.effect.name}\n匹配要求：${best.matched.join('、')}\n依据：${best.reason}\n已排除：${best.excluded.join('、') || '没有识别到明确禁项'}\n\n${describe(best.effect, {}, data)}`);
  }
}
