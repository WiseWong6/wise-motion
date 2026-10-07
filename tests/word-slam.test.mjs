// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import {history,state} from '../scripts/history.mjs';
import {environment,data,sourceDefinition,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='word-slam');
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migration=crosswalk.rules['reel-word-slam'].migration;
const source=await readFile(migration.files[0].file,'utf8');
const numbers=node=>node.getAttribute('transform').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const measured=spawnSync('/usr/local/bin/python3',['-c',`
import json,sys
from fontTools.ttLib import TTFont
f=TTFont(sys.argv[1]);c=f.getBestCmap();u=f['head'].unitsPerEm
print(json.dumps({chr(n):f['hmtx'].metrics[g][0]/u for n,g in c.items()}))
`,new URL('../catalog/fonts/Oswald-Bold.woff2',import.meta.url).pathname],{encoding:'utf8'});
assert.equal(measured.status,0,measured.stderr);
const metrics=JSON.parse(measured.stdout),width=(text,size)=>[...text].reduce((n,ch)=>n+metrics[ch]*size,0);

test('八词顺序、位置、二十四格抖动、错版与三词残影遵循原作，反白块按本地实际字体适配',async()=>{
  const scene=source.slice(source.indexOf('function sGrit('));
  const clock=scene.slice(scene.indexOf('const fr ='),scene.indexOf("ctx.fillStyle = '#0c0b09'"));
  const words=scene.slice(scene.indexOf('const words ='),scene.indexOf('  if (lt >= 4.1)'));
  const shake=scene.match(/ctx\.translate\([^\n]+/)[0];
  let frame;
  const ctx={save(){},restore(){},translate(...xy){frame.transforms.push(xy);},scale(...xy){frame.scale=xy;},fillRect(...rect){frame.rect=rect;}};
  const original=runInNewContext(source.match(/const hash =[^\n]+/)[0]+'; (lt)=>{'+clock+shake+words+'}',{
    ctx,VERT:false,W:1920,H:1080,F:{type:'',sans:''},
    measure:(text,{size})=>width(text,size),
    txt:(text,x,y,options)=>frame.text.push({text,x,y,...options})
  });
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,sourceDefinition(effect));
    const part=id=>root.querySelector(`[data-part="${id}"]`),seen=[];
    // 边界前后与全部原片格点，既核对硬切，也核对停止前的抖动。
    const times=[0,499.99,500,999.99,1000,...Array.from({length:96},(_,i)=>i*1000/24),3950];
    for(const ms of times){
      frame={transforms:[],text:[],rect:null};original(.25+Math.min(ms,3950)/1000);player.seek(ms);
      numbers(part('shake')).forEach((v,i)=>near(v,frame.transforms[0][i]));
      numbers(part('current')).forEach((v,i)=>near(v,[...frame.transforms[1],...frame.scale][i]));
      const actualGhosts=[...root.querySelectorAll('[data-ghost][visibility="visible"]')];
      const ghosts=frame.text.filter(t=>t.x>100),current=frame.text.filter(t=>t.x<100);
      assert.deepEqual(actualGhosts.map(n=>n.textContent),ghosts.map(n=>n.text));
      assert.ok(actualGhosts.length<=3);
      actualGhosts.forEach((n,i)=>{for(const [key,field]of [['x','x'],['y','y'],['font-size','size']])near(Number(n.getAttribute(key)),ghosts[i][field]);});
      const visible=current.length===1?[part('word')]:[part('red'),part('offset'),part('word')];
      for(const [i,node]of visible.entries()){
        assert.equal(node.textContent,current[i].text);near(Number(node.getAttribute('x')),current[i].x);near(Number(node.getAttribute('y')),current[i].y);
        near(Number(part('current').getAttribute('font-size')),current[i].size);
      }
      assert.equal(part('block').getAttribute('visibility'),frame.rect?'visible':'hidden');
      assert.equal(part('red').getAttribute('visibility'),frame.rect?'hidden':'visible');
      assert.equal(part('offset').getAttribute('visibility'),frame.rect?'hidden':'visible');
      assert.equal(part('word').getAttribute('fill'),frame.rect?'var(--stage)':'var(--ink)');
      if(frame.rect)for(const [i,key]of ['x','y','width','height'].entries())near(Number(part('block').getAttribute(key)),frame.rect[i]);
      const [dx,dy]=frame.transforms[0],[x,y]=frame.transforms[1],[scale]=frame.scale;
      const size=current[0].size,word=current[0].text;
      assert.ok(dx+x-20*scale>72&&dx+x+(width(word,size)+20)*scale<1848,'主词及反白块保留左右边距');
      assert.ok(dy+y-size>72&&dy+y+size*.2<1008,'主词及反白块保留上下边距');
      if(!seen.includes(word))seen.push(word);
    }
    assert.deepEqual(seen,['CUT','SCRATCH','BLEED','LAYER','DISTORT','EXPOSE','REPEAT','OBSESS']);
    player.seek(2130);const middle=root.innerHTML,nodes=[...root.querySelectorAll('*')];
    player.seek(3950);const end=root.innerHTML;player.seek(0);player.seek(2130);
    assert.equal(root.innerHTML,middle);assert.deepEqual([...root.querySelectorAll('*')],nodes);
    player.seek(3950);assert.equal(root.innerHTML,end);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,characterData:true,childList:true});
    player.seek(10000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  }finally{env.close();}
});

test('词语撞入换位进入文字分类，旧名可查且历史去重，主预览与缩略图一致',async()=>{
  const historical=await history(data);
  assert.equal(effect.category,'writing');assert.equal(effect.kind,'action');
  assert.ok(historical.excluded.some(r=>r.id==='reel-word-slam'));
  assert.ok(!historical.recipes.some(r=>r.history_id==='reel-word-slam'));
  assert.equal(createHash('sha256').update(source).digest('hex'),migration.files[0].sha256);
  const env=await environment(true,{staticPreview:true,hash:'#word-slam'});
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="word-slam"] .thumb');
    assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,'词语抨击换位'])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="word-slam"] .thumb .motion-stage');
    const root=d.createElement('div'),player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/word-slam\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
