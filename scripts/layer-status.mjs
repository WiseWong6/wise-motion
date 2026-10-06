// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FRAME_STYLES, frameScriptsFor} from '../remotion/frame-document.mjs';
const root=new URL('../',import.meta.url);
export function layerFingerprint(definition){
  const files=[...FRAME_STYLES,...frameScriptsFor(definition),'remotion/frame-document.mjs','remotion/index.jsx'];
  // 字体也影响字宽、边界和透明区域；不能只给样式表取指纹。
  for(const css of FRAME_STYLES)for(const match of readFileSync(new URL(css,root),'utf8').matchAll(/url\(["']?(fonts\/[^)"']+)/g))files.push(css.replace(/[^/]+$/,'')+match[1]);
  const hash=createHash('sha256');
  for(const file of [...new Set(files)].sort())hash.update(file).update(readFileSync(new URL(file,root)));
  const {layer,...definitionWithoutStatus}=definition;
  return hash.update(JSON.stringify(definitionWithoutStatus)).digest('hex');
}
export function layerStatus(definition){
  if(definition.layer!=='overlay-ok')return 'own-background';
  try{
    const report=JSON.parse(readFileSync(new URL('catalog/layer-audit.json',root),'utf8'));
    const item=report.results.find(row=>row.id===definition.id&&(row.variant||null)===(definition.variant_id||null));
    return item?.status==='overlay-ok'&&item.fingerprint===layerFingerprint(definition)?'overlay-ok':'own-background';
  }catch{return 'own-background';}
}
