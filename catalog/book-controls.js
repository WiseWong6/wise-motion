/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 翻页书在既有画板里切换真实交互与固定演示，不改变其他效果的播放接口。 */
(function (global) {
  'use strict';
  function create(root, definition, options = {}) {
    const one = id => document.getElementById(id);
    const media = options.reducedMotion || global.matchMedia('(prefers-reduced-motion: reduce)');
    const handlers = [];
    let mode = 'timeline', destroyed = false, book = null, timer = null;
    let savedTime = 0, savedPlaying = false, speed = 1, ease = definition.default_ease;
    let paper = {...{padding:10,radius:20,crease:11},...options.paperSettings};
    let interactiveState = {index:0,busy:false,paused:false};
    function on(target, type, callback) {
      target.addEventListener(type,callback); handlers.push(()=>target.removeEventListener(type,callback));
    }
    function paintPaper() {
      for (const key of ['padding','radius','crease']) {
        const input = one('book-'+key), unit = key==='crease' ? '%' : ' 像素';
        input.value = paper[key]; one('book-'+key+'-value').textContent = paper[key]+unit;
        input.style.setProperty('--fill',(paper[key]/Number(input.max)*100)+'%');
      }
      if (book) book.setSettings(paper);
      else {
        const shell = root.querySelector('.wm-book');
        if (!shell) return;
        shell.style.setProperty('--book-pad',paper.padding+'px');
        shell.style.setProperty('--book-radius',paper.radius+'px');
        shell.style.setProperty('--book-crease',String(paper.crease/100));
      }
    }
    function paintMode() {
      const interactive = mode==='interactive';
      one('book-panel').hidden = false;
      one('book-interactive').setAttribute('aria-pressed',String(interactive));
      one('book-timeline').setAttribute('aria-pressed',String(!interactive));
      one('book-navigation').hidden = !interactive;
      one('book-replay').hidden = !interactive || media.matches;
      document.querySelector('.playbar').hidden = interactive;
      one('ins-tempo').closest('.ins-section').hidden = interactive;
      root.setAttribute('aria-hidden',String(!interactive));
      if (interactive) root.tabIndex=0; else root.removeAttribute('tabindex');
      one('book-hint').textContent = interactive
        ? '点击左右书页或下方按钮翻页。在书本上按左右方向键也可翻页。'
        : '下方播放条可暂停、重播和拖动时间；纸页设置即时生效。';
    }
    function makeTimer() {
      return MotionRuntime.create(root,{...definition,paper_settings:paper},{onUpdate:options.onUpdate});
    }
    function makeBook(index) {
      book = WiseDitherBook.create(root.querySelector('.motion-stage'),{
        interactive:true,intro:false,reducedMotion:media.matches,settings:paper,
        onUpdate(state){
          interactiveState=state;
          one('book-prev').disabled=one('book-next').disabled=state.busy;
          one('book-page').textContent='图稿 '+String(state.index+1).padStart(2,'0')+' / 06';
        }
      });
      book.renderState({index,flip:null,entrance:1});
    }
    function setMode(next) {
      if (destroyed || next===mode || !['interactive','timeline'].includes(next)) return;
      if (next==='interactive') {
        savedTime=timer.currentTime; savedPlaying=!timer.paused; timer.pause();
        const state=WiseDitherBook.demoAt(savedTime);
        makeBook(state.flip ? state.flip.from+state.flip.direction : state.index);
      } else {
        book.destroy(); book=null; timer.destroy(); timer=makeTimer();
        timer.setSpeed(speed); timer.setEase(ease); timer.seek(savedTime);
        if (savedPlaying && !media.matches) timer.play();
      }
      mode=next; paintMode(); paintPaper();
    }
    timer=makeTimer();
    on(one('book-interactive'),'click',()=>setMode('interactive'));
    on(one('book-timeline'),'click',()=>setMode('timeline'));
    on(one('book-prev'),'click',()=>book?.prev());
    on(one('book-next'),'click',()=>book?.next());
    on(one('book-replay'),'click',()=>book?.restartIntro());
    on(root,'keydown',event=>{
      if (!book || event.target!==root || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key==='ArrowLeft' || event.key==='ArrowRight') {
        event.preventDefault(); if(event.key==='ArrowLeft')book.prev();else book.next();
      }
    });
    for (const key of ['padding','radius','crease']) on(one('book-'+key),'input',event=>{
      paper[key]=Number(event.target.value); paintPaper(); options.onSettingsChange?.();
    });
    on(one('book-reset'),'click',()=>{
      paper={padding:10,radius:20,crease:11}; paintPaper(); options.onSettingsChange?.();
    });
    on(media,'change',()=>{
      if (book) {const index=interactiveState.index;book.destroy();makeBook(index);}
      paintMode();paintPaper();
    });
    paintMode(); paintPaper();
    if (options.mode==='interactive') {
      setMode('interactive');
      if (Number.isFinite(options.pageIndex))book.renderState({index:options.pageIndex,flip:null,entrance:1});
    }
    return {
      setMode,
      play(){if(destroyed)return;if(book)book.resume();else timer.play();},
      pause(){if(destroyed)return;if(book)book.pause();timer.pause();},
      restart(shouldPlay=true){if(destroyed)return;if(book){if(shouldPlay)book.restartIntro();else book.renderState({index:0,flip:null,entrance:1});}else timer.restart(shouldPlay);},
      seek(ms){if(!destroyed)timer.seek(ms);},
      setSpeed(value){if(destroyed)return;timer.setSpeed(value);speed=timer.speed;},
      setEase(value){if(destroyed)return;timer.setEase(value);ease=definition.default_ease;},
      destroy(preserve=false){
        if(destroyed)return;destroyed=true;
        book?.destroy(preserve);timer.destroy(preserve);handlers.splice(0).forEach(off=>off());
        one('book-panel').hidden=true;document.querySelector('.playbar').hidden=false;
        one('ins-tempo').closest('.ins-section').hidden=false;root.setAttribute('aria-hidden','true');root.removeAttribute('tabindex');
      },
      get mode(){return mode;},get paperSettings(){return {...paper};},
      get pageIndex(){return book ? interactiveState.index : WiseDitherBook.demoAt(timer.currentTime).index;},
      get currentTime(){return timer.currentTime;},get speed(){return speed;},
      get paused(){return book ? !interactiveState.busy || interactiveState.paused : timer.paused;},
      get destroyed(){return destroyed;}
    };
  }
  global.WiseDitherWorkbench={create};
})(globalThis);
