/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import React from 'react';
import {Composition} from 'remotion';
import {WiseMotionEffect,getEffectMetadata} from './with-audio.jsx';
export const Root=()=> <Composition id="WiseMotion" component={WiseMotionEffect} width={640} height={360} fps={60} durationInFrames={181}
 defaultProps={{effectId:'stagger-in'}} calculateMetadata={({props})=>{const m=getEffectMetadata(props.effectId,props);return {durationInFrames:m.durationInFrames,fps:m.fps,width:props.width||m.width,height:props.height||m.height};}}/>;
