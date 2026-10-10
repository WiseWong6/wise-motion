// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data,motionTime} from './helpers.mjs';

const points=path=>[...path.getAttribute('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
const meanY=path=>{const p=points(path);return p.reduce((sum,point)=>sum+point[1],0)/p.length;};
const width=path=>{const x=points(path).map(p=>p[0]);return Math.max(...x)-Math.min(...x);};
const area=path=>{const p=points(path);return Math.abs(p.reduce((sum,[x,y],i)=>{const next=p[(i+1)%p.length];return sum+x*next[1]-y*next[0];},0))/2;};

test('平面图案长出真实高度与侧壁，同时放平进入透视，定位重播保持连续',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const effect=data.effects.find(e=>e.id==='flat-to-volume');
    const player=w.MotionRuntime.create(root,effect);
    const paths=[...root.querySelectorAll('path')],flat=root.innerHTML;
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    const surface=root.querySelector('[data-part="surface"]');
    const corners=()=>points(surface);
    const first=corners();
    assert.equal(first[1][0]-first[0][0],296);
    assert.equal(first[2][0]-first[3][0],296);
    for(const id of ['ring','dot-0','dot-1','dot-2','dot-3']){
      assert.equal(part(id).getAttribute('d'),part(id+'-base').getAttribute('d'),'初态图案与底部重合，不能预先有厚度');
    }
    assert.equal(area(part('ring-outer-12')),0);
    player.seek(motionTime(effect,600));assert.equal(root.innerHTML,flat);
    player.seek(motionTime(effect,1800));const middle=root.innerHTML;assert.notEqual(middle,flat);
    player.seek(motionTime(effect,3200));const end=root.innerHTML;assert.notEqual(end,middle);
    player.seek(effect.duration_ms);assert.equal(root.innerHTML,end);
    // 透视后的近边比远边宽；仅压扁或采用平行投影不能满足这一关系。
    const last=corners(),far=last[1][0]-last[0][0],near=last[2][0]-last[3][0];
    assert.ok(near/far>1.4);assert.ok(far<296);assert.ok(near>296);
    assert.ok(last[2][1]-last[1][1]<224);
    assert.ok(width(part('dot-2'))>width(part('dot-0')),'近处的柱体也应比远处大');
    // 顶面必须脱离底板；单纯把平面转成梯形不能满足高度与侧壁面积检查。
    assert.ok(meanY(part('ring-base'))-meanY(part('ring'))>50);
    for(const id of ['dot-0','dot-1','dot-2','dot-3'])assert.ok(meanY(part(id+'-base'))-meanY(part(id))>30,id+' 顶面必须明显升高');
    assert.ok(area(part('ring-outer-12'))>100,'外侧壁必须有实际面积');
    assert.ok(area(part('ring-inner-36'))>100,'内侧壁必须有实际面积');
    assert.ok(paths.every(p=>p===part(p.dataset.part)),'绘制前后顺序变化时仍保留相同节点');
    player.seek(motionTime(effect,1800));assert.equal(root.innerHTML,middle);
    player.restart(false);assert.equal(root.innerHTML,flat);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('圆环显示前侧外壁、后侧内壁与环形顶面，隐藏背面并正确遮挡',async()=>{
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root');
    const effect=data.effects.find(e=>e.id==='flat-to-volume');
    const player=env.w.MotionRuntime.create(root,effect);
    player.seek(motionTime(effect,3200));
    const part=id=>root.querySelector(`[data-part="${id}"]`);
    assert.equal(part('ring-outer-12').getAttribute('visibility'),'visible');
    assert.equal(part('ring-outer-36').getAttribute('visibility'),'hidden');
    assert.equal(part('ring-inner-36').getAttribute('visibility'),'visible');
    assert.equal(part('ring-inner-12').getAttribute('visibility'),'hidden');
    const contains=(polygon,x,y)=>{
      let inside=false;
      for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
        const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
        if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
      }
      return inside;
    };
    const visible=[...root.querySelector('[data-layer="volume"]').children].filter(p=>p.getAttribute('visibility')==='visible');
    const frontAt=(x,y)=>visible.findLast(p=>contains(points(p),x,y))?.dataset.part;
    assert.match(frontAt(320,177),/^ring-outer-/,'前侧外壁应挡住环体内部');
    assert.match(frontAt(320,120),/^ring-inner-/,'空心部分应显示后侧内壁');
    assert.match(frontAt(320,143),/^ring-top-/,'环形顶面应挡住其下方的侧壁');
  }finally{env.close();}
});

test('标准动作不再显示提炼出处，正文及目录名称统一细体',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    const {w}=env,d=w.document;
    for(const link of d.querySelectorAll('link[rel="stylesheet"]')){
      const style=d.createElement('style');style.textContent=await readFile(new URL('../catalog/'+link.getAttribute('href'),import.meta.url),'utf8');d.head.append(style);
    }
    for(const id of ['flat-to-volume','rigid-rebound']){
      d.querySelector(`[data-effect="${id}"]`).click();
      assert.doesNotMatch(d.getElementById('related').textContent,/提炼出处/);
    }
    for(const selector of ['body','.effect-name','#preview-summary','#prompt','.field-label']){
      assert.equal(w.getComputedStyle(d.querySelector(selector)).fontWeight,'300',selector);
    }
    assert.equal(w.getComputedStyle(d.getElementById('preview-title')).fontWeight,'700');
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
