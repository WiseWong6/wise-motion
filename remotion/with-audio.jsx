// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {staticFile} from 'remotion';
import {WiseMotionEffect as Picture, resolveEffect} from './index.jsx';
import {CompositionAudio} from './audio.jsx';
export * from './index.jsx';

/** 为完整组合接入声音，单个动作直接使用原画面组件。 */
export function WiseMotionEffect(props) {
  const effect = resolveEffect(props.definition ?? props.effectId, props.variantId);
  if (props.includeAudio === false || effect.kind !== 'composition' || !effect.audio?.tracks?.length) return <Picture {...props} />;
  const defaultBase = props.assetBaseUrl ?? staticFile('wise-motion');
  const base = typeof document === 'undefined' ? defaultBase : new URL(defaultBase.replace(/\/?$/, '/'), document.baseURI).href;
  return <>
    <CompositionAudio effect={effect} speed={props.speed ?? 1} base={base} />
    <Picture {...props} />
  </>;
}
