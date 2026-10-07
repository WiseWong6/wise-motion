(() => {
  class JourneySound {
    constructor(audio,button,notice) {
      this.audio=audio;this.button=button;this.notice=notice;
      this.enabled=true;this.running=false;this.time=0;
      this.pending=false;this.blocked=false;this.needsAlign=false;
      this.request=0;this.lastCorrection=-Infinity;this.status='ready';
      audio.preload='auto';audio.muted=false;audio.volume=1;
      audio.addEventListener('canplay',()=>{this.align();this.start();});
      audio.addEventListener('seeked',()=>this.align());
      audio.addEventListener('waiting',()=>{if(this.enabled&&this.running){this.status='loading';this.label();}});
      audio.addEventListener('playing',()=>{if(this.enabled&&this.running){this.status='playing';this.label();}});
      audio.addEventListener('error',()=>{if(this.enabled)this.fail('配乐未能加载，请确认音乐文件保留完整。');});
      this.label();
    }
    label() {
      const description=!this.enabled?'开启配乐':this.blocked?'点击播放配乐':!this.running?'配乐随画面暂停':'关闭配乐';
      this.button.setAttribute('aria-checked',String(this.enabled));
      this.button.setAttribute('aria-label',description);
      this.button.title=description;
      this.button.dataset.status=this.status;
    }
    align(force=false) {
      if(force)this.needsAlign=true;
      if(this.pending||this.audio.seeking||this.audio.readyState<3)return;
      const duration=this.audio.duration;
      if(!Number.isFinite(duration)||duration<=0)return;
      const target=Math.max(0,Math.min(this.time,duration-0.001));
      const drift=Math.abs(this.audio.currentTime-target),now=performance.now();
      if(drift<0.04){this.needsAlign=false;return;}
      if(this.needsAlign||(drift>0.45&&now-this.lastCorrection>800)){
        try{this.audio.currentTime=target;this.needsAlign=false;this.lastCorrection=now;}catch(error){               }
      }
    }
    stop() {
      if(this.pending||!this.audio.paused){this.request++;this.pending=false;this.audio.pause();}
    }
    fail(message) {
      this.enabled=false;this.status='off';this.stop();this.notice.textContent=message;this.label();
    }
    start() {
      if(!this.enabled||!this.running||this.blocked||this.pending||!this.audio.paused)return;
      this.pending=true;const request=++this.request;
      try{
        Promise.resolve(this.audio.play()).then(()=>{
          if(request!==this.request)return;
          this.pending=false;
          if(!this.enabled||!this.running){this.stop();return;}
          this.status='playing';this.align();this.label();
          if(this.notice.textContent==='点击「配乐」播放声音')this.notice.textContent='';
        }).catch(error=>{
          if(request!==this.request)return;
          this.pending=false;
          if(error.name==='AbortError'||!this.enabled||!this.running)return;
          if(error.name==='NotAllowedError'){
            this.blocked=true;this.status='blocked';this.notice.textContent='点击「配乐」播放声音';this.label();
          }else this.fail('配乐暂时无法播放，请重新开启配乐。');
        });
      }catch(error){this.pending=false;this.fail('配乐暂时无法播放，请重新开启配乐。');}
    }
    unlock() {
      if(!this.enabled)return;
      this.audio.allowGesture();this.blocked=false;this.start();
    }
    toggle() {
      if(this.enabled&&this.blocked){this.unlock();return;}
      this.enabled=!this.enabled;this.blocked=false;this.notice.textContent='';
      this.status=this.enabled?'ready':'off';this.needsAlign=true;this.label();
      if(this.enabled){this.audio.allowGesture();this.start();}else this.stop();
    }
    sync(time,running,force=false) {
      this.audio.update();
      this.time=time;const changed=this.running!==running;this.running=running;
      if(changed)this.label();if(force)this.needsAlign=true;
      if(!this.enabled||!running){this.stop();if(this.enabled)this.align();return;}
      if(!this.audio.paused)this.align();
      this.start();
    }
  }
  window.JourneySound=JourneySound;
})();
