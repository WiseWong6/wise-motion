/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(global){
  'use strict';
  global.MotionRelated={create({icon,getMain}){
    const $=id=>document.getElementById(id),dialog=$('related-dialog'),host=$('related-preview');
    let player=null,main=null,wasPlaying=false,returnFocus=null,selected=null,resumeVisible=false,disposed=false;
    function sync(state){
      const scrub=$('related-scrub'),ratio=state.duration?state.time/state.duration:0;
      scrub.value=ratio*1000;scrub.style.setProperty('--fill',ratio*100+'%');
      const time=(state.time/1000).toFixed(1),total=(state.duration/1000).toFixed(1);
      $('related-time').textContent=time+' / '+total+' 秒';scrub.setAttribute('aria-valuetext',time+' 秒，共 '+total+' 秒');
      const button=$('related-play'),label=state.paused?'播放相关动作':'暂停相关动作';
      if(button.getAttribute('aria-label')!==label){button.innerHTML=icon(state.paused?'play':'pause');button.setAttribute('aria-label',label);}
    }
    function resolve(effect){
      if(effect.kind!=='recipe')return global.MotionKit.resolveVariant(effect);
      const entry=effect.selected_entry||effect.entries[0],duration=Math.round(entry.preview.duration*1000);
      return {...effect,...entry.definition,selected_entry:entry,duration_ms:duration,preview_ms:Math.round(duration*(typeof entry.preview.poster==='number'?entry.preview.poster:.65))};
    }
    function render(effect){
      player?.destroy();player=null;resumeVisible=false;selected=resolve(effect);
      $('related-title').textContent=selected.name;
      $('related-origin').textContent=selected.kind==='composition'?'组合参考':selected.kind==='recipe'?'历史参考':'独立动作';
      $('related-summary').textContent=selected.summary;
      $('related-variant-field').hidden=!selected.variants?.length;
      $('related-variant').innerHTML=(selected.variants||[]).map(item=>`<option value="${global.MotionKit.escape(item.id)}">${global.MotionKit.escape(item.label)}</option>`).join('');
      $('related-variant').value=selected.variant_id||'';
      host.setAttribute('aria-label',selected.name);
      player=selected.kind==='recipe'
        ?global.MotionHistoryRuntime.create(host,selected,{caseId:selected.selected_entry.id,onUpdate:sync})
        :(global.MotionLocalPreview||global.MotionRuntime).create(host,selected,{onUpdate:sync});
      player.setSpeed(main?.speed||1);
      // 点击明确请求观看该动作：独立从头播放，不继承主组合的时刻或隐藏层。
      player.restart();
      sync({time:player.currentTime,duration:selected.duration_ms,paused:player.paused});
    }
    function cleanup({resume=true,focus=true}={}){
      player?.destroy();player=null;host.replaceChildren();resumeVisible=false;selected=null;
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
    function open(effect,trigger){
      if(disposed)return;
      if(!dialog.open){
        main=getMain();wasPlaying=!!main&&!main.paused;returnFocus=trigger||document.activeElement;
        main?.pause();dialog.showModal();
      }
      try{render(effect);$('related-close').focus();}
      catch(error){close();throw error;}
    }
    const onClose=()=>{if(!dialog.open&&(player||main))cleanup();};
    const onCancel=event=>{event.preventDefault();close();};
    const onClick=event=>{
      if(event.target.closest('#related-close')){close();return;}
      if(!player)return;
      if(event.target.closest('#related-play')){if(player.paused)player.play();else player.pause();}
      if(event.target.closest('#related-restart'))player.restart();
    };
    const onScrub=()=>{if(player&&selected){const time=Number($('related-scrub').value)/1000*selected.duration_ms;player.pause();player.seek(time);}};
    const onVariant=event=>{if(selected?.variants)render(global.MotionKit.resolveVariant(selected,event.target.value));};
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
    dialog.addEventListener('click',onClick);dialog.addEventListener('cancel',onCancel);dialog.addEventListener('close',onClose);
    dialog.addEventListener('keydown',onKey);dialog.addEventListener('pointerdown',onDown);dialog.addEventListener('pointerup',onUp);
    $('related-scrub').addEventListener('input',onScrub);document.addEventListener('visibilitychange',onVisibility);
    $('related-variant').addEventListener('change',onVariant);
    return {open,close,get active(){return dialog.open;},get controller(){return player;},
      destroy(){if(disposed)return;close({resume:false,focus:false});disposed=true;
        dialog.removeEventListener('click',onClick);dialog.removeEventListener('cancel',onCancel);dialog.removeEventListener('close',onClose);
        dialog.removeEventListener('keydown',onKey);dialog.removeEventListener('pointerdown',onDown);dialog.removeEventListener('pointerup',onUp);
        $('related-scrub').removeEventListener('input',onScrub);document.removeEventListener('visibilitychange',onVisibility);
        $('related-variant').removeEventListener('change',onVariant);
      }
    };
  }};
})(globalThis);
