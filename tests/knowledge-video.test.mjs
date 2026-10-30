// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{fileURLToPath}from'node:url';import{SPECS,sourceTime}from'../catalog/remotion/knowledge-video/specs.js';import{q}from'../catalog/remotion/knowledge-video/frame.js';import{projectFor}from'../scripts/export.mjs';
import {JSDOM} from 'jsdom';import {LAYOUT} from '../catalog/remotion/knowledge-video/source-layout.js';import {makeK} from '../catalog/remotion/knowledge-video/drawing.js';import {table,paper} from '../catalog/remotion/knowledge-video/scenes.js';
const root=new URL('../',import.meta.url);
test('已确认范围：9项10例，光丝两例均跳过前置界面并覆盖流动',()=>{
 assert.equal(new Set(SPECS.map(s=>s.id)).size,9);assert.equal(SPECS.length,10);
 const cross=SPECS.find(s=>s.variant==='cross');assert.ok(Math.abs(cross.start-(10.31+1.55))<1e-9);assert.ok(cross.end>10.31+2.1+1.85);
 assert.ok(SPECS.find(s=>s.variant==='context').start>=31.32);
 assert.equal(SPECS.filter(s=>s.draw==='sentences').length,1);
});
test('每段从成片秒定位到源秒；超出范围保持端点且反复定位不依赖前序',()=>{
 for(const s of SPECS){assert.equal(sourceTime(s,-1),s.start);assert.equal(sourceTime(s,999),s.end);const times=[0,s.duration/2,s.duration,0,s.duration/2];assert.deepEqual(times.map(t=>sourceTime(s,t)),times.map(t=>Math.min(s.end,s.start+s.rate*t)));assert.throws(()=>sourceTime(s,NaN));}
 const table=SPECS.find(s=>s.draw==='table');assert.equal(table.rate,2.6);assert.ok(Math.abs(table.duration-14.1/2.6)<1e-9);assert.deepEqual(table.view,[0,180,1600,900]);
 assert.equal(q(0,0,1,'p3io'),0);assert.equal(q(.5,0,1,'p3io'),.5);assert.equal(q(1,0,1,'p3io'),1);
});
test('每个已选示例均能独立导出真实绘制、素材及许可，复制包无原机路径或 GSAP 依赖',async()=>{
 for(const s of SPECS){const p=await projectFor(s.id,{variantId:s.variant});assert.equal(p.kind,'standalone');assert.ok(p.effect.reproduction.details.some(d=>d.includes(String(s.start))),s.factory+' 的说明必须与实际片段时钟一致');
 const joined=Object.values(p.files).filter(v=>typeof v==='string').join('\n');assert.doesNotMatch(joined,/\/Users\/|gsap\.(timeline|set|to)\(/);assert.ok(p.files['catalog/remotion/knowledge-video/scenes.js']);assert.ok(Buffer.isBuffer(p.files['public/catalog/assets/knowledge-video/SmileySans-Oblique.otf']));assert.ok(p.files['catalog/assets/knowledge-video/3D-Chladni-Apache-2.0.txt']);
 const pkg=JSON.parse(p.files['package.json']);assert.ok(pkg.scripts['check:source']);assert.match(p.files['index.jsx'],new RegExp('width=\\{'+s.view[2]+'\\}'));
 }
});
test('原数据为三行八列，表格不再隐藏后五列',async()=>{
 const source=await readFile(new URL('catalog/remotion/knowledge-video/scenes.js',root),'utf8');assert.match(source,/export const BITS=\[\[1,1,0,1,1,0,1,1\],\[1,1,0,1,1,0,1,0\],\[0,0,1,0,0,1,0,1\]\]/);
 const table=source.slice(source.indexOf('export function table'),source.indexOf('export function dimensions'));assert.doesNotMatch(table,/slice\(0,\s*3\)/);assert.match(table,/BITS\[0\]\.join/);
});
test('宽屏表格保留八列间距；竖屏论文三组依次入场且可以倒回起点',()=>{
 function setup(draw){
  const spec=SPECS.find(s=>s.draw===draw),layout=LAYOUT[spec.scene],dom=new JSDOM(spec.nodes.map(id=>layout.html[id]).join('')),document=dom.window.document,$=id=>document.getElementById(id);
  const set=(target,values)=>{for(const el of typeof target==='string'?document.querySelectorAll(target):[target])for(const[k,v]of Object.entries(values))el.style[k]=typeof v==='number'?v+'px':v;};
  return{spec,document,$,env:{$,set,K:makeK(document),T:layout.T}};
 }
 const a=setup('table'),drawTable=table(a.env);drawTable(a.spec.end);
 const cells=[...a.document.querySelectorAll('.s03-c')],users=[...a.document.querySelectorAll('.s03-u')];assert.equal(cells.length,24);assert.equal(users.length,8);
 assert.deepEqual(cells.slice(0,8).map(c=>parseFloat(c.style.left)),[328,488,648,808,968,1128,1288,1448]);
 assert.ok(parseFloat(cells[7].style.left)+76<a.spec.view[2]);assert.equal(a.$('s03-rowbox').style.width,'1504px');
 const b=setup('paper'),drawPaper=paper(b.env),visible=id=>Number(b.$(id).style.opacity)>.05;
 assert.equal(b.spec.view[2]/b.spec.view[3],3/4);
 drawPaper(b.env.T.paper+.2);assert.ok(visible('s04-sheet'));assert.ok(!visible('s04-year'));assert.ok(!visible('s04-fig'));
 drawPaper(b.env.T.paper+1);assert.ok(visible('s04-year'));assert.ok(visible('s04-yl'));assert.ok(!visible('s04-fig'));
 drawPaper(b.spec.poster);for(const id of b.spec.nodes)assert.ok(visible(id),id);
 assert.equal(b.$('s04-fig').querySelector('img').getAttribute('src'),'__TRANSFORMER__');
 drawPaper(b.spec.start);for(const id of b.spec.nodes)assert.equal(Number(b.$(id).style.opacity),0,id);
});
