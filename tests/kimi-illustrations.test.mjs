// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data} from './helpers.mjs';

const record=JSON.parse(await readFile(new URL('../../../state/wise-motion/kimi-illustrations-20261002/extraction.json',import.meta.url),'utf8'));
const source=file=>readFile(record.source_root+file,'utf8');
const near=(a,b,label)=>assert.ok(Math.abs(Number(a)-Number(b))<1e-8,`${label}: ${a} / ${b}`);
const nums=n=>n.getAttribute('transform').match(/-?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi).map(Number);
async function original(extra={}){
  const c=vm.createContext({window:{},...extra});
  vm.runInContext(await source('core/anim.js'),c);c.ANIM=c.window.ANIM;
  vm.runInContext(await source('core/theme.js'),c);c.THEME=c.window.THEME;c.T=c.THEME;
  return c;
}

test('Kimi 插画提取保持原工程只读，八项来源可追溯，已有点阵与纸卷不重复',async()=>{
  for(const [file,expected] of Object.entries(record.source_files)){
    const bytes=await readFile(record.source_root+file);
    assert.equal(bytes.length,expected.bytes,file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,file);
  }
  assert.equal(record.entries.length,8);
  for(const entry of record.entries){
    const def=data.effects.find(e=>e.id===entry.id);
    assert.equal(def.category,'illustration-object');assert.equal(def.source.path,'catalog/effects/kimi-illustrations.js');
    for(const anchor of entry.anchors)assert.ok((await source(entry.sources[0])).includes(anchor),anchor);
  }
  for(const v of record.duplicates)assert.equal(data.effects.filter(e=>e.id===v.existing).length,1);
  assert.ok(record.omitted.some(v=>v.source.endsWith('s7_logo.html')));
});

test('月相卡由原绘图程序核对：二十六个月坑、月相弧线与渐变参数保持',async()=>{
  const arcs=[],fills=[],gradients=[];let arc;
  const ctx={save(){},restore(){},translate(){},rotate(){},fillRect(){},beginPath(){},
    arc(...a){arc=a;arcs.push(a);},fill(){fills.push({arc,color:this.fillStyle});},fillText(){},
    createRadialGradient(...args){const g={args,stops:[],addColorStop(...s){this.stops.push(s);}};gradients.push(g);return g;}};
  const c=await original();c.window.PAPER={roundRect(){}};
  vm.runInContext(await source('core/props.js'),c);
  c.window.PROPS.moonCard(ctx,150,120,230,{rot:.06,phase:.72});
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),p=env.w.MotionRuntime.create(root,data.effects.find(e=>e.id==='moon-card-illustration'));
    p.seek(3000);const craters=[...root.querySelectorAll('[data-crater]')];
    assert.equal(craters.length,26);assert.equal(arcs.length,28);
    craters.forEach((n,i)=>{for(const [j,k] of ['cx','cy','r'].entries())near(n.getAttribute(k),arcs[i+1][j],'月坑 '+i+' '+k);near(n.getAttribute('fill-opacity'),Number(fills[i+1].color.match(/,([^,]+)\)$/)[1]),'月坑透明度');});
    const [fx,fy,fr,cx,cy,r]=gradients[0].args,g=root.querySelector('[id$="-moon"]');
    for(const [k,v] of Object.entries({fx,fy,fr,cx,cy,r}))near(g.getAttribute(k),v,'月面渐变 '+k);
    const a=arcs.at(-1),d=root.querySelector('[data-moon-shade]').getAttribute('d');
    assert.ok(d.includes(' 0 1 1 '),'原月相弧线大于半圆');
    assert.ok(d.startsWith(`M${Math.cos(a[3])*a[2]} ${a[1]+Math.sin(a[3])*a[2]}A`),'暗部从圆周起笔，不接圆心');
    assert.ok(root.textContent.includes('图 03 — 月面 · 蓝晒'));p.destroy();
  }finally{env.close();}
});

test('手绘图卡用原固定种子生成九个点，双笔、网格和峰值标记保持',async()=>{
  const html=await source('scenes/s4_multimodal.html'),c=await original({chartPts:[]});
  vm.runInContext('const {clamp}=ANIM;'+html.slice(html.indexOf('const RC = ANIM.rng(77)'),html.indexOf('// 各卡"细节点"')),c);
  const pts=c.chartPts,env=await environment();
  try{
    const root=env.w.document.getElementById('root'),p=env.w.MotionRuntime.create(root,data.effects.find(e=>e.id==='chart-card-illustration'));
    p.seek(3000);const nodes=[...root.querySelectorAll('[data-point]')];assert.equal(nodes.length,9);
    nodes.forEach((n,i)=>{near(n.getAttribute('cx'),pts[i][0],'图表 x');near(n.getAttribute('cy'),pts[i][1],'图表 y');});
    const path=root.querySelector('[data-chart]');assert.equal(path.getAttribute('stroke'),'#1D4E89');assert.equal(path.getAttribute('stroke-width'),'2');
    assert.equal(root.querySelectorAll('[stroke-dasharray="3 4"]').length,3);
    const peak=pts.reduce((a,b)=>b[1]<a[1]?b:a),ring=root.querySelector('circle[r="6.5"]');near(ring.getAttribute('cx'),peak[0],'峰值 x');near(ring.getAttribute('cy'),peak[1],'峰值 y');
    p.destroy();
  }finally{env.close();}
});

test('档案盒对照原文件浮出程序，保留左缘开盖、七条轨迹与四加三终态',async()=>{
  const html=await source('scenes/s6_open.html'),calls=[];
  const ctx={save(){},restore(){},translate(...args){calls.push(['translate',...args]);},rotate(...args){calls.push(['rotate',...args]);},scale(...args){calls.push(['scale',...args]);},beginPath(){},arc(){},fill(){},fillText(){}};
  const c=await original({BOX:{cx:900,cy:700,w:560,h:300},CHIP:{w:264,h:74,gap:24},GRID_CX:1230,ROW_Y:[210,300],N_CHIPS:7,chipTargets:[],chipSeeds:[],ctx,PROPS:{withShadow(c,f){f();}},PAPER:{roundRect(){}}});
  vm.runInContext('const {seg,easeOutCubic,lerp}=ANIM;'+html.slice(html.indexOf('// 文件块目标网格位置'),html.indexOf('// 结尾铁粉'))+html.slice(html.indexOf('function drawChip'),html.indexOf('// ---------- 逐帧渲染')),c);
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),p=env.w.MotionRuntime.create(root,data.effects.find(e=>e.id==='archive-box-illustration'));
    for(const ms of [0,500,800,1500,2050,2800,3000]){
      p.seek(ms);const t=Math.min(ms/1000,2.97),k=1-(1-Math.max(0,Math.min(1,(t-.5)/.9)))**3,lid=nums(root.querySelector('[data-part="lid"]'));
      near(lid[0],620,'盒盖左缘 x');near(lid[1],700,'盒盖左缘 y');near(lid[2],-.9*k*180/Math.PI,'盒盖角度');
      for(let i=0;i<7;i++){
        calls.length=0;c.drawChip(i,t);const n=root.querySelector(`[data-part="chip${i}"]`);
        if(!calls.length){assert.equal(+n.getAttribute('opacity'),0);continue;}
        const transform=nums(n),expected=[...calls[0].slice(1),calls[1][1]*180/Math.PI,calls[2][1]];
        expected.forEach((v,j)=>near(transform[j],v,'文件 '+i+' 位置与姿态 '+j));
      }
    }
    const end=[...root.querySelectorAll('[data-part^="chip"]')].map(nums);
    assert.deepEqual(end.map(v=>v[1]),[210,210,210,210,300,300,300]);p.destroy();
  }finally{env.close();}
});

test('八项 Kimi 插画可反复定位，双实例标识独立，物件原色不跟随目录主题改变',async()=>{
  const env=await environment();
  try{
    const d=env.w.document,root=d.getElementById('root'),other=d.createElement('div');root.after(other);
    for(const entry of record.entries){
      const def=data.effects.find(e=>e.id===entry.id),p=env.w.MotionRuntime.create(root,def),q=env.w.MotionRuntime.create(other,def);
      for(const ms of [3000,0,1500,700,2900]){p.seek(ms);const snapshot=root.innerHTML;p.seek(0);p.seek(ms);assert.equal(root.innerHTML,snapshot,entry.id);}
      if(entry.id==='terminal-window-illustration'){
        assert.equal(def.name,'命令窗口');assert.ok(def.previous_names.includes('终端命令与日志'));
        const html=await source('scenes/s5_agents.html'),c=await original();
        vm.runInContext(html.slice(html.indexOf('const C_PROMPT'),html.indexOf('function monoW')),c);
        const lines=vm.runInContext('LINES',c);
        for(const ms of [0,250,450,800,1200,1850,2300,2600,3000]){
          p.seek(ms);const t=Math.min(ms/1000*2,5.1),window=root.querySelector('[data-part="window"]');
          assert.equal(window.getAttribute('transform'),null,'窗口只保留静态外层画板适配');
          assert.equal(window.getAttribute('opacity'),null,'窗口不变淡');
          assert.equal(window.getAttribute('filter'),null,'窗口不柔焦');
          lines.forEach((line,i)=>{
            const node=root.querySelector(`[data-part="row${i}"]`);
            const expected=line.typed?c.ANIM.typewriter(line.text,t,line.t0,line.cps):line.text+(line.debug?c.debugDots(t):'');
            assert.equal(node.textContent,expected,'原终端第 '+i+' 行内容');
            near(node.getAttribute('opacity'),c.ANIM.seg(t,line.t0,line.t0+.12),'日志显现时刻');
          });
          assert.ok(!root.textContent.includes('为智能体而生'),'不带前景标题');
        }
      }
      p.seek(2900);q.seek(2900);
      const ids=[...root.querySelectorAll('[id]')].map(n=>n.id);assert.ok(![...other.querySelectorAll('[id]')].some(n=>ids.includes(n.id)));
      const picture=root.innerHTML;d.documentElement.dataset.theme='light';p.seek(2900);assert.equal(root.innerHTML,picture);
      d.documentElement.dataset.theme='dark';p.seek(2900);assert.equal(root.innerHTML,picture);
      assert.equal(root.querySelectorAll('canvas,image,foreignObject').length,0);assert.equal(root.querySelector('svg').getAttribute('viewBox'),'0 0 640 360');
      p.destroy();q.destroy();assert.equal(env.w.MotionRuntime.instanceCount,0);
    }
  }finally{env.close();}
});
