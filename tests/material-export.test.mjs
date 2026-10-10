// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {environment, data} from './helpers.mjs';

test('材质演化的提示词保留纸色和图形轮廓，复制页带真实本地源码', async () => {
  const e = await environment(true);
  try {
    const entries = data.effects.filter(item => item.source.path === 'catalog/effects/material-evolution.js');
    assert.equal(entries.length, 8);
    for (const entry of entries) {
      const prompt = e.w.MotionExport.prompt(entry, {}, data);
      assert.match(prompt, /#e2e3dd|#e3e4de/);
      assert.doesNotMatch(prompt, /近黑底 #0a0a0b|本机|Users\/|原片范围|来源与许可/);
      assert.ok(entry.reproduction.presentation);
      const code = e.w.MotionExport.code(entry);
      assert.match(code, /src="catalog\/effects\/material-evolution\.js"/);
      assert.match(code, /MotionRuntime\.create/);
      assert.doesNotMatch(code, /\.mp4|\.jpg|fetch\s*\(/i);
      assert.equal(entry.source.assets.length, 4);
      for (const asset of entry.source.assets) assert.ok((await stat(new URL('../' + asset, import.meta.url))).isFile());
    }
    const record = JSON.parse(await readFile(new URL('../catalog/assets/material-evolution/SOURCE.json', import.meta.url)));
    assert.equal(record.files.length, 4);
    assert.ok(record.graphic_rights.includes('保留'));
    for (const asset of record.files) {
      const bytes = await readFile(new URL('../catalog/assets/material-evolution/' + asset.file, import.meta.url));
      assert.equal(bytes.length, asset.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    }
  } finally { e.close(); }
});
