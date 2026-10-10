// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {createContext, useContext, useLayoutEffect, useRef} from 'react';
import {themes} from './nested-data.json';

// 子画面使用目录的原绘制函数，时间由父画面传入，共同准备和释放资源。
export const ExtractScope = createContext(null);
export function ActualEffect({definition, time, width, height, theme='dark'}) {
 const host=useRef(null), draw=useRef(null), current=useRef(time), scope=useContext(ExtractScope);
 current.current=time;
 useLayoutEffect(()=>{
  globalThis.MotionKit.prepareStage(host.current,definition);
  const renderer=globalThis.MotionKit.createRenderer(host.current,definition);
  draw.current=renderer;scope?.add(renderer);
  renderer(current.current,{elapsed:current.current});
  return ()=>{scope?.delete(renderer);draw.current=null;renderer.destroy?.();host.current?.replaceChildren();};
 },[definition,scope]);
 useLayoutEffect(()=>{draw.current?.(time,{elapsed:time});},[time]);
 return <div data-actual-effect={definition.id} data-theme={theme} style={{position:'relative',width,height,overflow:'hidden'}}>
  <div ref={host} className="motion-stage" data-theme={theme} style={{...themes[theme],position:'absolute',left:0,top:0,width:640,height:360,transform:`scale(${width/640})`,transformOrigin:'0 0'}} />
 </div>;
}
