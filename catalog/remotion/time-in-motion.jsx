// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {WiseNativeVideo} from './native-video.jsx';
import '../effects/time-in-motion-data.js';

export function WiseTimeInMotion({effectId = 'time-in-motion-sequence', definition, ...props}) {
  const selected = definition ?? globalThis.WiseTimeInMotion.definitions[effectId];
  if (!selected) throw new Error('未知动作：' + effectId);
  return <WiseNativeVideo {...props} definition={selected}/>;
}
