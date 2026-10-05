// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
export function losslessWebpDimensions(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
 for(let offset=12;offset+8<=bytes.length;){
  const size=bytes.readUInt32LE(offset+4),start=offset+8;
  assert.ok(start+size<=bytes.length);
  if(bytes.toString('ascii',offset,offset+4)==='VP8L'){
   assert.ok(size>=5);assert.equal(bytes[start],0x2f);
   const packed=bytes.readUInt32LE(start+1);assert.equal(packed>>>29,0);
   return [(packed&0x3fff)+1,((packed>>>14)&0x3fff)+1];
  }
  offset=start+size+(size&1);
 }
 assert.fail('缺少 WebP 无损图像数据');
}
