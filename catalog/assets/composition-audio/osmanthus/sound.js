/* 本地合成生长、叶片、开花、风、轻碰、扑翼和星光；声音随画面时间播放。 */
'use strict';
(()=>{
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const STAR_SOUND_DURATION=1.25;
  // 《风过之处》24.5～29 秒混合音轨的高频能量起伏，仅参考节奏，不复制原配乐。
  const grassReference=[.151,.154,.183,.244,.197,.183,.233,.212,.139,.138,.192,.217,.164,.164,.163,.141,.133,.122,.09,.088,.087,.114,.151,.227,.292,.318,.421,.433,.489,.543,.529,.565,.902,1,1,1,.366,.153,.215,.157,.149,.21,.17,.319,.353];
  function grassEnvelope(age){
    // 把原片末段阵风的增强位置对齐本片树梢偏动，再让叶声自然散开。
    const position=(age+2.7)*10,index=Math.min(grassReference.length-2,Math.floor(position));
    const fraction=smooth(Math.min(1,position-index));
    return (grassReference[index]*(1-fraction)+grassReference[index+1]*fraction)*Math.exp(-Math.max(0,age-1.6)*.7);
  }
  function synthesize(duration,wind,cues,rate=32000,stages={}){
    const length=Math.ceil(duration*rate),left=new Float32Array(length),right=new Float32Array(length);
    let seed=81731,low=0,mid=0,slow=0,high=0,otherMid=0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
    for(let i=Math.floor(wind.start*rate);i<Math.min(length,Math.ceil((wind.end+.7)*rate));i++){
      const t=i/rate,age=t-wind.start,n=random(),other=random();
      low+=(n-low)*.022;mid+=(n-mid)*.16;slow+=(other-slow)*.008;
      high+=(n-high)*.73;otherMid+=(other-otherMid)*.18;
      const envelope=smooth(age/.24)*(1-smooth((t-wind.end+1.1)/1.8));
      const grass=grassEnvelope(age),gust=.17+.83*grass;
      const windSound=(low*.36+slow*.16)*envelope*gust;
      // 带限沙沙声：去掉低频轰鸣与最尖的白噪声，保留叶片擦过的细碎感。
      const texture=(high-mid),leaves=texture*envelope*(.022+.095*grass);
      const pan=.3-.65*smooth(age/3.4);
      left[i]=(windSound+leaves)*Math.sqrt((1-pan)/2);
      right[i]=(windSound+leaves*.72+(other-otherMid)*.019*envelope*grass)*Math.sqrt((1+pan)/2);
    }
    const notes=[1567.98,2093,2349.32,2637.02,3135.96];
    const strike=(time,frequency,amplitude,pan,decay)=>{
      const start=Math.floor(time*rate),count=Math.ceil(decay*7*rate);
      for(let j=0;j<count&&start+j<length;j++){
        const age=j/rate,attack=1-Math.exp(-age/.00045);
        // 薄金属的高频敲击先亮起，短余音随后消散；不使用低沉的长铃音。
        const tone=.65*Math.sin(2*Math.PI*frequency*age)*Math.exp(-age/decay)
          +.18*Math.sin(2*Math.PI*frequency*1.009*age)*Math.exp(-age/(decay*.76))
          +.44*Math.sin(2*Math.PI*frequency*2.756*age)*Math.exp(-age/(decay*.42))
          +.22*Math.sin(2*Math.PI*frequency*4.07*age)*Math.exp(-age/(decay*.18));
        const contact=random()*.22*Math.exp(-age/.003);
        const value=(tone+contact)*attack*amplitude*smooth((count-j)/(rate*.004));
        left[start+j]+=value*Math.sqrt((1-pan)/2);right[start+j]+=value*Math.sqrt((1+pan)/2);
      }
    };
    for(const [i,cue] of cues.entries()){
      const frequency=notes[(i*3)%notes.length],pan=Math.max(-.8,Math.min(.8,cue.pan));
      strike(cue.time,frequency,.108+(i%3)*.009,pan,.14+(i%4)*.025);
      if(i%3!==1)strike(cue.time+.085+(i%4)*.027,frequency*1.12,.032,pan-.05,.115);
    }
    const brush=(start,end,amplitude,kind,phase=0,panFrom=-.45,panTo=panFrom)=>{
      let fast=0,slow=0;const span=end-start;
      for(let i=Math.max(0,Math.floor(start*rate));i<Math.min(length,Math.ceil(end*rate));i++){
        const t=i/rate,age=t-start,n=random();
        fast+=(n-fast)*(kind==='wood'?.16:.64);slow+=(n-slow)*(kind==='wood'?.018:.12);
        const edge=kind==='flight'?.2:Math.min(.16,span*.22);
        const tail=kind==='flight'?.2:.22;
        const envelope=smooth(age/edge)*(1-smooth((age-span+tail)/tail));
        const pulse=kind==='flight'?(.5+.5*Math.sin(t*11+phase))**3
          :kind==='wood'?.25+.75*(.5+.5*Math.sin(age*29+Math.sin(age*13)))**5
          :.3+.7*(.5+.5*Math.sin(age*23+Math.sin(age*17)))**2;
        const value=(fast-slow)*envelope*pulse*amplitude;
        const pan=panFrom+(panTo-panFrom)*smooth(age/span);
        left[i]+=value*Math.sqrt((1-pan)/2);right[i]+=value*Math.sqrt((1+pan)/2);
      }
    };
    if(stages.wood)brush(stages.wood.start,stages.wood.end,.10,'wood');
    if(stages.leaves)brush(stages.leaves.start,stages.leaves.end,.075,'leaf');
    for(const f of stages.flights||[])brush(f.start,f.end,.010,'flight',f.phase,f.panFrom,f.panTo);
    // 参考《风过之处》结尾的中音区延展感；不截取混合配乐，另做无固定音高的舒展声。
    const unfurl=(event,index)=>{
      const span=event.duration??.38,start=Math.floor(event.time*rate),count=Math.ceil(span*rate);
      const pan=Math.max(-.8,Math.min(.8,event.pan??0)),lg=Math.sqrt((1-pan)/2),rg=Math.sqrt((1+pan)/2);
      const b=1-Math.exp(-2*Math.PI*180/rate),c=1-Math.exp(-2*Math.PI*2800/rate);
      let seed=(Math.imul(index+1,2246822519)^73129)>>>0,body=0,velvet=0,low=0,air=0;
      for(let j=0;j<count&&start+j<length;j++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/2147483648-1;
        const u=j/(span*rate),a=1-Math.exp(-2*Math.PI*(720+(index%4)*90+360*smooth(u))/rate);
        low+=(n-low)*b;body+=(n-low-body)*a;velvet+=(body-velvet)*a;air+=(n-low-air)*c;
        const envelope=smooth(u/.42)*(1-smooth((u-.38)/.62));
        const texture=velvet*.105+(air-body)*(.003+.003*u);
        const value=texture*envelope;
        if(start+j>=0){left[start+j]+=value*lg;right[start+j]+=value*rg;}
      }
    };
    const shimmer=event=>{
      // 小玻璃片的几组共振先后消散；细微尺寸差异代替逐颗播放音阶。
      const index=event.note??0,frequency=1510*[1,1.048,.953,1.021,1.081,.978,1.064][index%7];
      const start=Math.floor(event.time*rate),span=STAR_SOUND_DURATION-.1,count=Math.ceil(span*rate);
      const pan=Math.max(-.8,Math.min(.8,event.pan??0)),lg=Math.sqrt((1-pan)/2),rg=Math.sqrt((1+pan)/2);
      const modes=[[1,.42,.27],[1.414,.33,.18],[2.318,.23,.115],[3.73,.075,.072],[5.09,.022,.042]];
      const dry=new Float32Array(count);
      let seed=(Math.imul(index+1,3266489917)^9511)>>>0,edge=0,body=0;
      for(let j=0;j<count;j++){
        const age=j/rate;let tone=0;
        for(const [ratio,weight,decay] of modes)tone+=weight*Math.sin(2*Math.PI*frequency*ratio*age)*Math.exp(-age/decay);
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/2147483648-1;
        edge+=(n-edge)*.45;body+=(n-body)*.15;
        const touch=(edge-body)*.045*Math.exp(-age/.018);
        dry[j]=(tone+touch)*.054*smooth(age/.024)*smooth((span-age)/.2);
      }
      // 很轻的左右短反射让余韵散开，避免单频电子提示音与长串回声。
      const taps=[[0,lg*.88,rg*.88],[.027,rg*.075,0],[.043,0,lg*.075],[.071,rg*.035,0],[.091,0,lg*.035]];
      for(const [delay,l,r] of taps){
        const offset=start+Math.round(delay*rate);let softened=0;
        for(let j=0;j<count&&offset+j<length;j++){
          softened+=(dry[j]-softened)*.38;
          const value=delay?softened:dry[j];
          if(offset+j>=0){left[offset+j]+=value*l;right[offset+j]+=value*r;}
        }
      }
    };
    (stages.blooms||[]).forEach(unfurl);
    (stages.sparkles||[]).forEach(shimmer);
    let peak=0;for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
    if(peak>.8)for(let i=0;i<length;i++){left[i]*=.8/peak;right[i]*=.8/peak;}
    return {left,right,rate};
  }
  function create({duration,wind,cues,stages={},onUnavailable=()=>{}}){
    let ctx=null,buffer=null,source=null,voiceGain=null,master=null,enabled=true,offset=0,started=0,failed=false,generation=0;
    let playbackRate=1;
    let starPrevious=null,starBuffers=[];const starVoices=new Set();
    function stopMain(){
      generation++;
      if(source){
        const old=source,gain=voiceGain;source=null;voiceGain=null;
        old.onended=()=>{old.disconnect();gain.disconnect();};
        gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(0,ctx.currentTime,.004);
        try{old.stop(ctx.currentTime+.024);}catch{old.disconnect();gain.disconnect();}
      }
    }
    function stop(){
      stopMain();starPrevious=null;
      for(const voice of starVoices){
        voice.gain.gain.cancelScheduledValues(ctx.currentTime);
        voice.gain.gain.setTargetAtTime(0,ctx.currentTime,.004);
        try{voice.node.stop(ctx.currentTime+.024);}catch{}
      }
      starVoices.clear();
    }
    function makeBuffer(samples){
      const result=ctx.createBuffer(2,samples.left.length,samples.rate);
      result.getChannelData(0).set(samples.left);result.getChannelData(1).set(samples.right);return result;
    }
    function unavailable(){stop();failed=true;onUnavailable();}
    function prepare(){
      if(ctx)return;
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio)throw new Error('此浏览器不支持音效');
      ctx=new Audio();master=ctx.createGain();master.gain.value=enabled?.8:0;master.connect(ctx.destination);
      buffer=makeBuffer(synthesize(duration,wind,cues,32000,stages));
      starBuffers=(stages.stars||[]).map(star=>makeBuffer(synthesize(STAR_SOUND_DURATION,{start:2,end:3},[],32000,
        {sparkles:[{time:0,pan:star.pan,note:star.note}]})));
    }
    return {
      play(time,rate=1){
        stop();playbackRate=Number.isFinite(rate)?Math.max(.5,Math.min(2,rate)):1;if(failed||time>=duration)return;
        try{
          prepare();starPrevious=time;offset=time;started=ctx.currentTime+.025;
          source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=playbackRate;
          voiceGain=ctx.createGain();voiceGain.gain.value=0;
          voiceGain.gain.setTargetAtTime(1,started,.006);source.connect(voiceGain);voiceGain.connect(master);
          const current=source,gain=voiceGain,token=generation;
          source.onended=()=>{current.disconnect();gain.disconnect();if(source===current){source=null;voiceGain=null;}};
          source.start(started,time);
          const resume=ctx.resume();
          if(resume&&resume.catch)resume.catch(()=>{if(token===generation)unavailable();});
        }catch{unavailable();}
      },
      stop,
      finish:stopMain,
      tickStars(time){
        const previous=starPrevious;starPrevious=time;
        if(!ctx||failed||!enabled||ctx.state!=='running'||previous===null||time<previous||time-previous>.25*playbackRate)return;
        for(const [i,star] of (stages.stars||[]).entries()){
          const cycle=Math.floor((time-star.first)/star.period),at=star.first+cycle*star.period;
          if(cycle<0||at<=previous||at>time||at>=(star.end??Infinity)||starVoices.size>=7)continue;
          const node=ctx.createBufferSource(),gain=ctx.createGain(),voice={node,gain};
          gain.gain.value=smooth((at-18)/1.2)*(star.end===undefined?1:1-smooth((at-star.fadeAt)/(star.end-star.fadeAt)));
          node.buffer=starBuffers[i];node.playbackRate.value=playbackRate;node.connect(gain);gain.connect(master);starVoices.add(voice);
          node.onended=()=>{node.disconnect();gain.disconnect();starVoices.delete(voice);};
          node.start(ctx.currentTime,Math.max(0,time-at));
        }
      },
      position(fallback){return source&&ctx.state==='running'?Math.min(duration,offset+Math.max(0,ctx.currentTime-started)*playbackRate):fallback;},
      setEnabled(value){enabled=value;if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled?.8:0,ctx.currentTime,.018);}},
      get enabled(){return enabled;}
    };
  }
  globalThis.NightTreeSound={create};
})();
