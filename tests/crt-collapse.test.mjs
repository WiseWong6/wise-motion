// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,frameMarkup} from './helpers.mjs';

const near=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('关机恢复为先压高度、再收宽度、最后熄灭的既有版本',async()=>{
  const env=await environment();
  try{
    const factory=env.w.MotionFactories['crt-collapse'];
    assert.equal(factory.timing.duration_ms,1200);
    near(factory.stateAt(150).scaleX,1);near(factory.stateAt(150).scaleY,1);
    let previousHeight=1;
    for(const time of [250,350,450,550]){
      const state=factory.stateAt(time);
      near(state.scaleX,1);assert.ok(state.scaleY<previousHeight,'压线阶段只持续收高度');previousHeight=state.scaleY;
    }
    assert.ok(factory.stateAt(550).scaleY*360<3,'压线后高度应小于三像素');
    let previousWidth=1;
    for(const time of [600,650,700,750]){
      const state=factory.stateAt(time);
      near(state.scaleY,factory.stateAt(550).scaleY);assert.ok(state.scaleX<previousWidth,'收点阶段只持续收宽度');previousWidth=state.scaleX;
      assert.ok(state.glowRadius<=8,'亮点不能扩张成大光球');
    }
    assert.ok(factory.stateAt(750).scaleX*640<6,'横线最终收成小点');
    assert.equal(factory.stateAt(-20).time,0);assert.equal(factory.stateAt(1500).time,1200);
    assert.ok(factory.stateAt(350).scaleY>factory.stateAt(550).scaleY);
    assert.ok(factory.stateAt(650).scaleX>factory.stateAt(750).scaleX);
    assert.ok(factory.stateAt(825).glowOpacity<factory.stateAt(750).glowOpacity);
    assert.equal(factory.stateAt(900).screenOpacity,0);
    assert.equal(factory.stateAt(900).glowOpacity,0);
  }finally{env.close();}
});

test('关机整幅画面一起收缩，亮线与中心亮点始终为白色',async()=>{
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root'),factory=env.w.MotionFactories['crt-collapse'];
    const draw=factory(root),screen=root.querySelector('[data-crt-screen]');
    assert.ok(screen,'完整画面应使用一个收缩层');
    for(const name of ['background','grid','content','flash'])assert.ok(screen.querySelector(`[data-crt-${name}]`),name+' 不能留在收缩层外面');
    assert.ok(screen.querySelector('[data-crt-content]').textContent.includes('$ WISE MOTION'));
    const backdrop=[...root.querySelectorAll('rect')].find(node=>node.getAttribute('fill')==='#000'&&!screen.contains(node));
    assert.ok(backdrop,'收缩层外应有固定黑底');
    const flash=screen.querySelector('[data-crt-flash]'),core=root.querySelector('[data-crt-core]');
    assert.equal(flash.getAttribute('fill'),'#fff');
    assert.ok(core&&!screen.contains(core),'亮点保持在画面中心，不能随屏幕缩放');
    near(Number(core.getAttribute('cx')),320);near(Number(core.getAttribute('cy')),180);
    const gradientId=core.getAttribute('fill').match(/^url\(#(.+)\)$/)?.[1];
    const gradient=root.querySelector('[id="'+gradientId+'"]');
    assert.equal(gradient?.tagName.toLowerCase(),'radialgradient');
    assert.ok([...gradient.querySelectorAll('stop')].every(stop=>stop.getAttribute('stop-color')==='#fff'));
    for(const time of [0,350,550,650,750]){
      draw(time);
      const transform=screen.getAttribute('transform').replaceAll(',',' ');
      assert.match(transform,/translate\(320\s+180\)/);
      assert.match(transform,/translate\(-320\s+-180\)/);
      const values=transform.match(/scale\(([-\d.e]+)\s+([-\d.e]+)\)/);
      assert.ok(values,'屏幕的宽高应分别控制');
      const state=factory.stateAt(time);
      near(Number(values[1]),state.scaleX,1e-5);near(Number(values[2]),state.scaleY,1e-5);
    }
    root.style.setProperty('--ink','#222222');root.style.setProperty('--surface','#f7f5f0');
    draw(650);
    assert.equal(flash.getAttribute('fill'),'#fff','浅色模式不能把关机横线换成黑色');
    assert.ok([...gradient.querySelectorAll('stop')].every(stop=>stop.getAttribute('stop-color')==='#fff'),'浅色模式亮点仍为白色');
    draw(900);assert.equal(Number(screen.getAttribute('opacity')),0);assert.equal(Number(core.getAttribute('opacity')),0);
    const black=frameMarkup(root);
    draw(1200);assert.equal(frameMarkup(root),black,'熄灭后保持黑场');
    draw(650);draw(900);assert.equal(frameMarkup(root),black,'反向定位后能准确恢复黑场');
  }finally{env.close();}
});
