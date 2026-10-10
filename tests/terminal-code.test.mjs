// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data,themed,sourceDefinition} from './helpers.mjs';

test('三行终端按统一字号计算字距，保留逐字时钟、光标和光带，缩略图完整且末尾停止',async()=>{
  const source='/Users/wisewong/Documents/Developer/wise-video/motion-tutorial/ai-motion-tutorial-portrait-remake/';
  const original=await readFile(source+'scenes/opening.js','utf8');
  const sandbox=vm.createContext({window:{FilmScenes:[],FilmAssets:{}}});
  vm.runInContext(await readFile(source+'runtime/theme.js','utf8'),sandbox);
  // 只在测试沙箱暴露原函数，原工程文件保持只读。
  vm.runInContext(original.replace(' F.push(', ' window.terminalSource=terminal; F.push('),sandbox);
  const measured=spawnSync('/usr/local/bin/python3',['-c',`
import json, sys
from fontTools.ttLib import TTFont
f=TTFont(sys.argv[1]); cmap=f.getBestCmap()
print(json.dumps({chr(n):f['hmtx'].metrics[name][0]*31/f['head'].unitsPerEm for n,name in cmap.items()},ensure_ascii=False))
`,source+'assets/fonts/SourceHanSansCN-Regular.otf'],{encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(measured.status,0,measured.stderr);
  const widths=JSON.parse(measured.stdout),width=str=>Array.from(str).reduce((n,ch)=>n+widths[ch],0);
  const fontMetrics=spawnSync('/usr/local/bin/python3',['-c',`
import json, sys
from fontTools.ttLib import TTFont
fonts=[TTFont(path) for path in sys.argv[1:]]
print(json.dumps([{chr(n):f['hmtx'].metrics[name][0]/f['head'].unitsPerEm for n,name in f.getBestCmap().items()} for f in fonts],ensure_ascii=False))
`,new URL('../catalog/fonts/Oswald-Bold.woff2',import.meta.url).pathname,new URL('../catalog/fonts/SourceHanSansSC-Light.woff2',import.meta.url).pathname],{encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(fontMetrics.status,0,fontMetrics.stderr);
  const [latin,body]=JSON.parse(fontMetrics.stdout),displayWidth=str=>Array.from(str).reduce((n,ch)=>n+(16/.6)*(/[0-9A-Za-z.\-]/.test(ch)?latin[ch]:body[ch]),0);
  const ease=p=>{p=Math.min(1,Math.max(0,p));return p<.5?4*p**3:1-(-2*p+2)**3/2;};
  const originalAt=t=>{
    const texts=[],rects=[],translations=[],stack=[];let shape;
    const c={globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:0,
      save(){stack.push({alpha:this.globalAlpha,fill:this.fillStyle});},
      restore(){const state=stack.pop();this.globalAlpha=state.alpha;this.fillStyle=state.fill;},
      translate(x,y){translations.push([x,y]);},beginPath(){shape=null;},
      roundRect(x,y,w,h,r){shape={x,y,w,h,r};},
      fill(){if(shape)rects.push({...shape,alpha:this.globalAlpha,paint:this.fillStyle});},
      arc(){},clip(){},stroke(){},
      measureText(str){return {width:width(str)};},
      createLinearGradient(...coordinates){return {coordinates,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};},
      fillRect(x,y,w,h){rects.push({x,y,w,h,paint:this.fillStyle});}
    };
    sandbox.window.terminalSource(c,t,{enter:(t,at,d)=>ease((t-at)/d),text(value,x,y,options){texts.push({value,x,y,...options});}});
    return {texts,rects,translations};
  };
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='terminal-code'));await env.reveal('[data-effect="terminal-code"] .thumb');
    assert.equal(effect.category,'writing');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,'终端逐字敲代码')[0].effect.id,effect.id);
    const card=d.querySelector('[data-effect="terminal-code"]'),thumb=card.querySelector('.thumb');
    assert.equal(thumb.querySelectorAll('[data-terminal-code-row]').length,3);
    assert.deepEqual([...thumb.querySelectorAll('[data-terminal-code-row]')].map(row=>[...row.querySelectorAll('tspan')].map(n=>n.textContent).join('')),['const idea = "一个画面";','const motion = "让它动起来";','create(idea, motion);']);
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect),part=id=>root.querySelector(`[data-part="${id}"]`);
    const close=(actual,expected)=>assert.ok(Math.abs(Number(actual)-expected)<1e-6,`${actual} 与原源码 ${expected} 不同`);
    for(const ms of [0,100,200,320,400,500,625,750,820,875,1000,1125,1320,1500,1625,1800,2200,2500,3000]){
      draw(ms);const src=originalAt(Math.min(ms,2500)/1000),frame=src.rects.find(r=>r.r===18);
      close(part('terminal-window').getAttribute('opacity'),frame.alpha);
      assert.equal(part('terminal-window').getAttribute('transform'),`translate(0 ${src.translations[0][1]})`);
      for(let i=0;i<3;i++){
        const row=part('terminal-row'+i),tokens=[...row.querySelectorAll('text')].slice(1),written=src.texts.filter(n=>n.y===607+i*72&&n.value!=='›');
        assert.equal(row.getAttribute('opacity'),written.length?'1':'0');
        assert.deepEqual(tokens.filter(n=>n.textContent).map(n=>n.textContent),written.map(n=>n.value));
        let prefix='';
        tokens.filter(n=>n.textContent).forEach((node,j)=>{close(node.getAttribute('x'),62+displayWidth(prefix));close(node.getAttribute('y'),written[j].y-520);assert.equal(node.getAttribute('fill'),themed(written[j].color));prefix+=written[j].value;});
        const cursor=src.rects.find(r=>r.w===10&&r.h===29&&r.y===610+i*72);
        assert.equal(part('terminal-cursor'+i).getAttribute('opacity'),cursor?'1':'0');
        if(cursor)close(part('terminal-cursor'+i).getAttribute('x'),62+displayWidth(written.map(n=>n.value).join('')));
      }
      const beam=src.rects.find(r=>r.w===110&&r.h===28),bar=src.rects.find(r=>r.w===36&&r.h===4);
      close(part('terminal-status').getAttribute('transform').match(/translate\(([^ ]+)/)[1],beam.x+55-140);
      assert.equal(beam.paint.stops[1][1],'rgba(10,228,72,0.18)');assert.equal(bar.paint,'rgba(10,228,72,0.58)');
    }
    for(const span of root.querySelectorAll('tspan'))assert.equal(span.getAttribute('font-weight'),/[0-9A-Za-z.\-]/.test(span.textContent)?'700':'300');
    draw(1000);const typing=root.innerHTML;draw(3000);draw(0);draw(1000);assert.equal(root.innerHTML,typing);
    draw(2500);const final=root.innerHTML;draw(3000);draw(6000);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,characterData:true,childList:true});draw(3000);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    const other=d.createElement('div');w.MotionFactories[effect.id](other,w.MotionKit,effect)(2600);
    assert.notEqual(other.querySelector('linearGradient').id,root.querySelector('linearGradient').id);
    assert.equal(root.querySelector('image,video,canvas'),null);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='tutorial-terminal'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='tutorial-terminal'));
    assert.ok(data.effects.some(e=>e.id==='terminal-window-illustration'),'已有命令与日志终端独立保留');
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['tutorial-terminal'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
