/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function () {
  'use strict';
  const one = id => document.getElementById(id);
  const host = one('book-host');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const definition = {id:'dither-lab-book',duration_ms:WiseDitherBook.duration,loop:false,default_ease:'outCubic',parameters:{speed:{min:.5,max:2,default:1}}};
  let mode = 'interactive', book = null, player = null, disposed = false, wasPlaying = false;
  let settings = {padding:10,radius:20,crease:11};
  const handlers = [];
  function on(target, type, fn) { target.addEventListener(type, fn); handlers.push(() => target.removeEventListener(type, fn)); }
  function updateSettings() {
    for (const key of ['padding','radius','crease']) {
      one(key).value = settings[key];
      one(key+'-value').textContent = settings[key] + (key === 'crease' ? '%' : ' 像素');
    }
    if (book) book.setSettings(settings);
    else {
      const shell = host.querySelector('.wm-book');
      if (shell) {
        shell.style.setProperty('--book-pad',settings.padding+'px');
        shell.style.setProperty('--book-radius',settings.radius+'px');
        shell.style.setProperty('--book-crease',String(settings.crease/100));
      }
    }
  }
  function stop() {
    book?.destroy(); player?.destroy(); book = null; player = null;
  }
  function switchMode(next) {
    if (disposed) return;
    stop(); mode = next; wasPlaying = false;
    one('interactive-mode').setAttribute('aria-pressed',String(mode === 'interactive'));
    one('demo-mode').setAttribute('aria-pressed',String(mode === 'demo'));
    one('interactive-controls').hidden = mode !== 'interactive';
    one('demo-controls').hidden = mode !== 'demo';
    one('intro-replay').hidden = mode !== 'interactive';
    one('mode-hint').textContent = mode === 'interactive' ? '点击左右书页、使用下方按钮，或在书本上按左右方向键。' : '快速翻页入场后，向前翻两页，再往回翻两页。拖动时间可观察翻转中间的纸面。';
    if (mode === 'interactive') {
      book = WiseDitherBook.create(host,{interactive:true,reducedMotion:reduced.matches,settings,onUpdate(state){
        one('prev').disabled = one('next').disabled = state.busy;
        one('page-label').textContent = '图稿 '+String(state.index+1).padStart(2,'0')+' / 06';
      }});
    } else {
      host.innerHTML = '<div class="demo-runtime"></div>';
      const runtimeRoot = host.firstElementChild;
      runtimeRoot.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden';
      const style = document.createElement('style');
      style.textContent = '.demo-runtime .motion-stage{position:absolute;top:50%;left:50%;width:640px;height:360px;transform-origin:center}';
      host.prepend(style);
      player = MotionRuntime.create(runtimeRoot,definition,{onUpdate(state){
        one('play').textContent = state.paused ? '播放' : '暂停';
        one('time').value = state.time;
        one('time-label').textContent = (state.time/1000).toFixed(1)+' / 7.6 秒';
      }});
      player.setSpeed(Number(one('speed').value));
      if (reduced.matches) player.seek(2900); else player.play();
    }
    updateSettings();
  }
  on(one('interactive-mode'),'click',()=>{if(mode !== 'interactive')switchMode('interactive');});
  on(one('demo-mode'),'click',()=>{if(mode !== 'demo')switchMode('demo');});
  on(one('prev'),'click',()=>book?.prev()); on(one('next'),'click',()=>book?.next());
  on(one('intro-replay'),'click',()=>book?.restartIntro());
  on(one('play'),'click',()=>{if(player)player.paused?player.play():player.pause();});
  on(one('replay'),'click',()=>player?.restart());
  on(one('time'),'input',event=>{const value=Number(event.target.value);if(player){player.pause();player.seek(value);}});
  on(one('speed'),'change',event=>player?.setSpeed(Number(event.target.value)));
  on(one('settings-toggle'),'click',()=>{
    const visible = one('settings').hidden;
    one('settings').hidden = !visible; one('settings-toggle').setAttribute('aria-expanded',String(visible));
  });
  for(const key of ['padding','radius','crease'])on(one(key),'input',event=>{settings[key]=Number(event.target.value);updateSettings();});
  on(one('reset-settings'),'click',()=>{settings={padding:10,radius:20,crease:11};updateSettings();});
  on(one('theme'),'click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';});
  on(document,'visibilitychange',()=>{
    if(document.hidden){
      if(book)book.pause();
      if(player){wasPlaying=!player.paused;player.pause();}
    }else{
      if(book)book.resume();
      if(player&&wasPlaying){wasPlaying=false;player.play();}
    }
  });
  on(reduced,'change',()=>switchMode(mode));
  on(window,'pagehide',()=>{disposed=true;stop();handlers.splice(0).forEach(off=>off());});
  // A restored page needs its controllers and page events again.
  window.addEventListener('pageshow',event=>{if(event.persisted&&disposed)location.reload();});
  if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark';
  switchMode(mode);
  window.DitherBookPreview = {get mode(){return mode;},get book(){return book;},get player(){return player;},switchMode};
})();
