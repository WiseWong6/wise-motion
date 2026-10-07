import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('花落成蝶退出时释放表面反光资源，并阻止旧恢复回调重建资源',async()=>{
  const created=[],deleted=[],listeners=new Map();let lost=0,draws=0;
  const gl=new Proxy({}, {get(_target,key){
    if(['createShader','createProgram','createBuffer','createTexture'].includes(key))return ()=>{const value={kind:key};created.push(value);return value;};
    if(['deleteShader','deleteProgram','deleteBuffer','deleteTexture'].includes(key))return value=>deleted.push(value);
    if(['getShaderParameter','getProgramParameter'].includes(key))return ()=>true;
    if(key==='getAttribLocation')return ()=>0;
    if(key==='getExtension')return ()=>({loseContext(){lost++;}});
    if(key==='drawArrays')return ()=>draws++;
    return key.toUpperCase()===key?1:()=>{};
  }});
  const ctx=new Proxy({}, {get(_target,key){return key==='getImageData'?undefined:()=>{};}});
  const canvases=[];
  const document={createElement(){const canvas={width:0,height:0,getContext:type=>type==='webgl'?gl:ctx,
    addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){assert.equal(listeners.get(type),fn);listeners.delete(type);}};
    canvases.push(canvas);return canvas;}};
  const context=vm.createContext({document,console});
  vm.runInContext(await readFile(new URL('../catalog/effects/scene-osmanthus-data.js',import.meta.url),'utf8'),context);
  const glitter=context.NightGlitter.create([{bounds:[0,0,32,32],mask(){},seed:1,gold:1,grain:1,curvature:1}]);
  assert.equal(glitter.available,true);
  const staleRestore=listeners.get('webglcontextrestored');
  const persistent=created.filter(value=>value.kind!=='createShader');assert.equal(persistent.length,3);
  glitter.destroy();glitter.destroy();
  assert.equal(glitter.available,false);assert.equal(listeners.size,0);assert.equal(lost,1);
  for(const value of persistent)assert.equal(deleted.filter(item=>item===value).length,1);
  for(const canvas of canvases)assert.deepEqual([canvas.width,canvas.height],[1,1]);
  const count=created.length;staleRestore();glitter.render(1,[{slot:0,gain:1}]);
  assert.equal(created.length,count);assert.equal(draws,0);
});
