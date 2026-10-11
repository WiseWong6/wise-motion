// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FRAME_STYLES, frameScriptsFor} from '../remotion/frame-document.mjs';
import {resolveEffect, effectDefinitions} from '../remotion/clock.mjs';
import {auditedLayerStatus, LAYER_AUDIT_VERSION, layerKey, stableJson} from '../remotion/layer-policy.mjs';
const root=new URL('../',import.meta.url);
const readSource=file=>readFileSync(new URL(file,root));
// 旧文字审计曾把提示词也算入指纹。此映射只承认完全相同的绘制、字体、
// 适配器及其他定义；逐项恢复旧提示词后已验证仍对应原审计的24个样本。
// 绘制依据有任何变化都会产生其他指纹，不会命中兼容项。
const promptOnlyFingerprintAliases=new Map([
  ['b9d411a795caaa6278cfbb2c026da17f40a26706d0412b4625fbe14a36536630','01c4fb9ff752c3931151280dce06ae49107f4fda074397b01a84349dfd8bb6dd']
]);
export function layerFingerprint(definition, read=readSource){
  const scripts=frameScriptsFor(definition);
  const files=[...FRAME_STYLES,...scripts,'remotion/frame-document.mjs','remotion/index.jsx','remotion/clock.mjs','remotion/layer-policy.mjs'];
  // 字体也影响字宽、边界和透明区域；不能只给样式表取指纹。
  for(const css of FRAME_STYLES)for(const match of read(css).toString().matchAll(/url\(["']?(fonts\/[^)"']+)/g))files.push(css.replace(/[^/]+$/,'')+match[1]);
  const hash=createHash('sha256');
  hash.update(stableJson({version:LAYER_AUDIT_VERSION,styles:FRAME_STYLES,scripts}));
  for(const file of [...new Set(files)].sort())hash.update(file).update(read(file));
  const {content,reproduction,...implementation}=definition;
  const fingerprint=hash.update(stableJson(implementation)).digest('hex');
  return promptOnlyFingerprintAliases.get(fingerprint)||fingerprint;
}
export function layerStatus(definition){
  try{
    const report=JSON.parse(readFileSync(new URL('catalog/layer-audit.json',root),'utf8'));
    const canonical=resolveEffect(definition.id,definition.variant_id);
    if(canonical.layer!=='overlay-ok')return 'own-background';
    return auditedLayerStatus(definition,layerFingerprint(canonical),report);
  }catch{return 'own-background';}
}

// 只生成当前源码指纹，不修改审计记录。审计过期时构建在写产物前停止。
export function verifiedLayerFingerprints({report=JSON.parse(readFileSync(new URL('catalog/layer-audit.json',root),'utf8')),read=readSource}={}){
  const fingerprints={},invalid=[];
  for(const entry of effectDefinitions){
    for(const variant of entry.variants||[null]){
      const definition=resolveEffect(entry.id,variant?.id);
      if(definition.layer!=='overlay-ok')continue;
      const fingerprint=layerFingerprint(definition,read);
      if(auditedLayerStatus(definition,fingerprint,report)!=='overlay-ok')invalid.push(layerKey(definition));
      fingerprints[layerKey(definition)]=fingerprint;
    }
  }
  if(invalid.length)throw new Error('透明审计过期或未通过：'+invalid.join('、')+'；请重新取证并复核 catalog/layer-audit.json，不能只更新指纹。');
  return {version:LAYER_AUDIT_VERSION,fingerprints};
}

export function assertLayerBuildCurrent(){
  const expected=verifiedLayerFingerprints();
  const actual=JSON.parse(readFileSync(new URL('catalog/layer-fingerprints.json',root),'utf8'));
  if(stableJson(actual)!==stableJson(expected))throw new Error('透明审计构建指纹未同步；请运行 npm run build:remotion。');
}
