/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){
  'use strict';
  global.MotionRelated={create({data,icon,reducedMotion,getMain,getSettings=()=>({})}){
    const $=id=>document.getElementById(id),dialog=$('related-dialog'),host=$('related-preview');
    let player=null,main=null,wasPlaying=false,returnFocus=null,context=null,selected=null,resumeVisible=false,disposed=false;
    const esc=global.MotionKit.escape;
    function sync(state){
      const scrub=$('related-scrub'),ratio=state.duration?state.time/state.duration:0;
      scrub.value=ratio*1000;scrub.style.setProperty('--fill',ratio*100+'%');
      const time=(state.time/1000).toFixed(1),total=(state.duration/1000).toFixed(1);
      $('related-time').textContent=time+' / '+total+' 秒';scrub.setAttribute('aria-valuetext',time+' 秒，共 '+total+' 秒');
      const button=$('related-play'),label=state.paused?'播放相关动作':'暂停相关动作';
      if(button.getAttribute('aria-label')!==label){button.innerHTML=icon(state.paused?'play':'pause');button.setAttribute('aria-label',label);}
    }
    function resolve(effect){
      if(effect.kind!=='recipe')return effect;
      const entry=effect.selected_entry||effect.entries[0],duration=Math.round(entry.preview.duration*1000);
      return {...effect,selected_entry:entry,duration_ms:duration,preview_ms:Math.round(duration*(typeof entry.preview.poster==='number'?entry.preview.poster:.65))};
    }
    function render(effect,layer=null){
      player?.destroy();player=null;resumeVisible=false;selected=resolve(effect);
      const title=layer?.name||selected.name;
      $('related-title').textContent=title;
      $('related-origin').textContent=layer?'来自组合：'+selected.name:context?.layer?'独立动作示例':'相关参考';
      $('related-summary').textContent=layer?.detail||selected.summary;
      host.setAttribute('aria-label',title);
      const examples=(context?.layer?.actions||[]).map(id=>data.effects.find(e=>e.id===id)).filter(Boolean);
      $('related-examples').hidden=!examples.length;
      $('related-example-buttons').innerHTML=examples.length?
        `<button type="button" class="btn" data-related-example="" aria-pressed="${!!layer}">在组合中查看</button>`+
        examples.map(e=>`<button type="button" class="btn" data-related-example="${esc(e.id)}" aria-pressed="${!layer&&e.id===selected.id}">${esc(e.name)}</button>`).join(''):'';
      player=selected.kind==='recipe'
        ?global.MotionHistoryRuntime.create(host,selected,{caseId:selected.selected_entry.id,onUpdate:sync})
        :global.MotionRuntime.create(host,selected,{onUpdate:sync,...(layer?{ease:getSettings().ease}: {})});
      player.setSpeed(main?.speed||1);
      if(layer)global.MotionComposition.isolate(host,[layer.id]);
      // 优先在组合当前时刻对照；该层尚未开始或已经结束时，定位到其动作区间。
      const time=main?.currentTime||0;
      const layerTime=layer&&(time<layer.start||time>layer.end)?(layer.start+layer.end)/2:time;
      if(layer&&selected.loop&&Number.isFinite(main?.elapsedTime))player.seekElapsed(main.elapsedTime-time+layerTime);
      else player.seek(layer?Math.min(layerTime,selected.duration_ms):selected.preview_ms);
      sync({time:player.currentTime,duration:selected.duration_ms,paused:player.paused});
    }
    function cleanup({resume=true,focus=true}={}){
      player?.destroy();player=null;host.replaceChildren();resumeVisible=false;context=null;selected=null;
      if(resume&&wasPlaying&&main&&!main.destroyed&&!document.hidden)main.play();
      wasPlaying=false;main=null;
      if(focus&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;
    }
    function close(options){
      const target=returnFocus;
      cleanup({...options,focus:false});if(dialog.open)dialog.close();
      // 关闭后主页面才解除不可交互状态，此时再把焦点交回原按钮。
      if(options?.focus!==false&&target?.isConnected)target.focus({preventScroll:true});
    }
    function open(effect,layer,trigger){
      if(disposed)return;
      if(!dialog.open){
        main=getMain();wasPlaying=!!main&&!main.paused;returnFocus=trigger||document.activeElement;
        main?.pause();dialog.showModal();
      }
      context=layer?{effect,layer}:null;
      try{render(effect,layer);$('related-close').focus();}
      catch(error){close();throw error;}
    }
    const onClose=()=>{if(!dialog.open&&(player||main))cleanup();};
    const onCancel=event=>{event.preventDefault();close();};
    const onClick=event=>{
      if(event.target.closest('#related-close')){close();return;}
      const example=event.target.closest('[data-related-example]');
      if(example&&context){const effect=example.dataset.relatedExample?data.effects.find(e=>e.id===example.dataset.relatedExample):context.effect;if(effect){render(effect,example.dataset.relatedExample?null:context.layer);$('related-example-buttons').querySelector('[aria-pressed="true"]')?.focus();}return;}
      if(!player)return;
      if(event.target.closest('#related-play')){if(player.paused)player.play();else player.pause();}
      if(event.target.closest('#related-restart'))player.restart();
    };
    const onScrub=()=>{if(player&&selected){const time=Number($('related-scrub').value)/1000*selected.duration_ms;player.pause();player.seek(time);}};
    const onKey=event=>{
      if(!dialog.open)return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
      if((event.key===' '||event.code==='Space')&&!event.target.closest('button,input,select,textarea')){
        event.preventDefault();$('related-play').click();
      }
      // 原生对话框负责焦点圈定，主页面的快捷键不参与弹窗操作。
      event.stopPropagation();
    };
    let outsideDown=false;
    const outside=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);};
    const onDown=event=>{outsideDown=outside(event);};
    const onUp=event=>{if(outsideDown&&outside(event))close();outsideDown=false;};
    const onVisibility=()=>{if(document.hidden){resumeVisible=!!player&&!player.paused;player?.pause();}else if(resumeVisible){player?.play();resumeVisible=false;}};
    const onPreference=()=>{if(reducedMotion.matches){player?.pause();resumeVisible=false;wasPlaying=false;}};
    dialog.addEventListener('click',onClick);dialog.addEventListener('cancel',onCancel);dialog.addEventListener('close',onClose);
    dialog.addEventListener('keydown',onKey);dialog.addEventListener('pointerdown',onDown);dialog.addEventListener('pointerup',onUp);
    $('related-scrub').addEventListener('input',onScrub);document.addEventListener('visibilitychange',onVisibility);
    reducedMotion.addEventListener?.('change',onPreference);
    return {open,close,get active(){return dialog.open;},get controller(){return player;},
      destroy(){if(disposed)return;close({resume:false,focus:false});disposed=true;
        dialog.removeEventListener('click',onClick);dialog.removeEventListener('cancel',onCancel);dialog.removeEventListener('close',onClose);
        dialog.removeEventListener('keydown',onKey);dialog.removeEventListener('pointerdown',onDown);dialog.removeEventListener('pointerup',onUp);
        $('related-scrub').removeEventListener('input',onScrub);document.removeEventListener('visibilitychange',onVisibility);reducedMotion.removeEventListener?.('change',onPreference);
      }
    };
  }};
})(globalThis);
