/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel=$('composition-panel'),list=$('composition-layers'),status=$('composition-status');
  let layers=[],nodes=[],buttons=[],player=null,selected=-1,mode='stack',duration=0,paintVersion=0,sequential=false;
  const compositionLayers=(effect,controller)=>effect.kind==='composition'
    ? global.MotionFactories?.[effect.id]?.breakdown || controller?.session?.doc?.defaultView?.MotionFactories?.[effect.id]?.breakdown || [] : [];
  function isolate(targets,visible) {
    for(const node of targets) {
      const show=!visible||visible.has(node.dataset.layer)||targets.some(child=>visible.has(child.dataset.layer)&&node.contains(child));
      if(node.namespaceURI==='http://www.w3.org/2000/svg'){
        if(show)node.removeAttribute('display');else node.setAttribute('display','none');
      }else{
        // 保留文档流位置；按钮或字幕隐藏后，其他组成部分不能移动。
        node.toggleAttribute('data-composition-hidden',!show);
      }
    }
  }
  function paint() {
    const visible=selected<0 ? null : new Set((mode==='solo' ? [layers[selected]] : layers.slice(0,selected+1)).map(layer=>layer.id));
    const current=player,version=++paintVersion,prepare=selected<0?current?.ensureVideo:current?.ensureCode;
    if(prepare){
      // 本机视频没有可拆的图层；绘制器就绪后，重新取得当前时刻的真实节点。
      Promise.resolve(prepare.call(current)).then(ok=>{
        if(current!==player||version!==paintVersion||current.destroyed)return;
        if(!ok){status.textContent='当前画面准备失败，请重新选择动效。';return;}
        nodes=[...(current.stage||$('preview')).querySelectorAll('[data-layer]')];
        isolate(nodes,visible);
      }).catch(error=>{if(current===player&&version===paintVersion)status.textContent='当前画面准备失败：'+error.message;});
    }else if(!sequential)isolate(nodes,visible);
    buttons.forEach((button,index)=>{
      button.setAttribute('aria-pressed',String(index===selected));
      button.dataset.included=String(!visible || visible.has(layers[index].id));
    });
    panel.querySelectorAll('[data-composition-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.compositionMode===mode)));
    $('composition-full').setAttribute('aria-pressed',String(selected<0));
    status.textContent=selected<0 ? '完整组合：'+layers.map(layer=>layer.name).join(' ＋ ')+'。' :
      (mode==='solo' ? '单独查看：'+layers[selected].name : '叠加到这里：'+layers.slice(0,selected+1).map(layer=>layer.name).join(' ＋ '));
    $('composition-detail').textContent=selected<0 ? `各层共用同一时间轴。时间条表示原速下的动作区间，完整一段为 ${duration/1000} 秒。` : layers[selected].detail;
    if(sequential){
      status.textContent=selected<0?'完整组合：'+layers.map(layer=>layer.name).join(' → ')+'。':'查看片段：'+layers[selected].name+'。';
      if(selected<0)$('composition-detail').textContent=`各镜头按同一时间轴接续，完整片段为 ${duration/1000} 秒；点击片段定位到对应时间。`;
    }
  }
  panel.addEventListener('click',event=>{
    if(!player || player.destroyed) return;
    const row=event.target.closest('[data-composition-layer]'),modeButton=event.target.closest('[data-composition-mode]');
    if(row) selected=layers.findIndex(layer=>layer.id===row.dataset.compositionLayer);
    else if(modeButton) { mode=modeButton.dataset.compositionMode; if(selected<0) selected=0; }
    else if(event.target.closest('#composition-full')) selected=-1;
    else if(event.target.closest('#composition-replay')) { player.restart(); return; }
    else return;
    // 暂停在同一时刻对照构成；重播按钮与画面下方进度条仍控制这一个播放器。
    player.pause();
    if(sequential&&row&&selected>=0)player.seek(layers[selected].start+(layers[selected].end-layers[selected].start)*.5);
    paint();
  });
  global.MotionComposition = {
    layers:compositionLayers,
    isolate(root,ids) { isolate([...root.querySelectorAll('[data-layer]')],ids?new Set(ids):null); },
    select(effect,controller,view) {
      player=null;sequential=effect.breakdown_mode==='sequence';layers=compositionLayers(effect,controller);
      if(effect.kind==='composition'&&!layers.length){
        // 原绘制器也保存在隔离预览里；首帧就绪后直接取它的拆解清单。
        const wait=effect.source?.frame_cache?global.MotionLazy?.ensure(effect):controller.ready;
        if(wait)wait.then(()=>{if(!controller.destroyed&&compositionLayers(effect,controller).length)this.select(effect,controller,view);},()=>{});
      }
      panel.hidden=!layers.length;
      nodes=[];buttons=[];list.replaceChildren();
      if(panel.hidden) return;
      player=controller;duration=effect.duration_ms;mode=view?.mode==='solo' ? 'solo' : 'stack';
      panel.querySelectorAll('[data-composition-mode]').forEach(button=>{button.hidden=sequential;});
      selected=layers.findIndex(layer=>layer.id===view?.layer);
      nodes=[...(controller.stage||$('preview')).querySelectorAll('[data-layer]')];
      if(controller.ready)controller.ready.then(ok=>{if(ok&&player===controller){nodes=[...(controller.stage||$('preview')).querySelectorAll('[data-layer]')];paint();}});
      const esc=global.MotionKit.escape;
      list.innerHTML=layers.map(layer=>`<button type="button" class="composition-layer" data-composition-layer="${esc(layer.id)}" aria-pressed="false" aria-controls="preview" title="${esc(layer.detail)}"><span class="composition-row"><span>${esc(layer.name)}</span><small>${esc(layer.time)}</small></span><span class="composition-track" aria-hidden="true"><i style="left:${layer.start/effect.duration_ms*100}%;width:${(layer.end-layer.start)/effect.duration_ms*100}%"></i></span></button>`).join('');
      buttons=[...list.querySelectorAll('button')];paint();this.sync(controller.currentTime);
    },
    sync(time) {
      if(panel.hidden) return;
      // 仅越过开始/结束边界时更新状态，不为拆解增加循环或每帧改写整块面板。
      buttons.forEach((button,index)=>{
        const layer=layers[index],phase=time<layer.start?'waiting':time<layer.end?'active':'settled';
        if(button.dataset.phase!==phase) button.dataset.phase=phase;
      });
    },
    get view() { return panel.hidden ? undefined : {mode,layer:layers[selected]?.id}; }
  };
})(globalThis);
