// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import audit from '../catalog/layer-audit.json' with {type: 'json'};
import buildFingerprints from '../catalog/layer-fingerprints.json' with {type: 'json'};
import {resolveEffect} from './clock.mjs';
import contentApi from '../catalog/content.js';

export const LAYER_AUDIT_VERSION = 2;
export const layerKey = definition => definition.id + '/' + (definition.variant_id || '');
export function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

// 浏览器使用构建时的源码指纹；命令行传入现场计算值。两者共用此判断。
export function auditedLayerStatus(definition, fingerprint, report = audit) {
  try {
    const canonical = resolveEffect(definition.id, definition.variant_id);
    if (canonical.layer !== 'overlay-ok' || report.version !== LAYER_AUDIT_VERSION || !fingerprint) return 'own-background';
    contentApi.validateContent(canonical, definition.content);
    const {content, ...implementation} = definition;
    if (stableJson(implementation) !== stableJson(canonical)) return 'own-background';
    const row = report.results.find(item => item.id === canonical.id && (item.variant || null) === (canonical.variant_id || null));
    return row?.status === 'overlay-ok' && row.fingerprint === fingerprint ? 'overlay-ok' : 'own-background';
  } catch { return 'own-background'; }
}

export function builtLayerStatus(definition) {
  return auditedLayerStatus(definition, buildFingerprints.version === LAYER_AUDIT_VERSION ? buildFingerprints.fingerprints[layerKey(definition)] : undefined);
}
