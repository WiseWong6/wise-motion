// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {losslessWebpDimensions} from './image-assets.mjs';
test('全部独立图片均为完整的无损 WebP，尺寸与来源记录一致',async()=>{
 const records=JSON.parse(await readFile(new URL('../catalog/assets/WEBP-SOURCES.json',import.meta.url),'utf8'));
 assert.equal(records.assets.length,96);
 for(const record of records.assets){
  const bytes=await readFile(new URL('../'+record.target,import.meta.url));
  assert.equal(bytes.length,record.bytes);
  assert.ok(record.bytes<record.original_bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
  assert.deepEqual(losslessWebpDimensions(bytes),record.dimensions);
 }
});
