/* 离线生成当前作品专用声音；页面播放时不合成。运行：node scripts/build-audio.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const SAMPLE_RATE=16000,TAU=Math.PI*2;
const ROOT=path.resolve(__dirname,'..');
const RATES=[1,.5,1.5,2];
const CLIPS=[
  {kind:'typing',pitch:0,duration:8},
  {kind:'send',pitch:0,duration:.18},
  ...[-3,3].map(pitch=>({kind:'ripple',pitch,duration:2.8/1.2})),
  {kind:'wind',pitch:0,duration:1.8},
  ...[0,7,-5,2].map(pitch=>({kind:'flight',pitch,duration:1.8})),
  ...[0,2,4,7,9].map(pitch=>({kind:'leafTouch',pitch,duration:.95})),
  ...[0,-5].map(pitch=>({kind:'galaxy',pitch,duration:8}))
];
class SoundAssets {
  constructor(){this.noise=new Float32Array(SAMPLE_RATE*6);for(const _ of this.prepareNoise()){} }
  sendKey(rate,length){
    // 同一段键盘实录中的一次按下和回键，发送时只响一次。
    const filters=['atrim=start=0.432:end=0.61','asetpts=PTS-STARTPTS','highpass=f=110','lowpass=f=3200',
      'acompressor=threshold=0.07:ratio=2:attack=2:release=30','apad=pad_dur=0.15',
      `atempo=${rate}`,`atrim=duration=${length/SAMPLE_RATE}`];
    const result=spawnSync('ffmpeg',['-v','error','-i',path.join(ROOT,'audio/source/typing.mp3'),
      '-af',filters.join(','),'-f','f32le','-ac','1','-ar',String(SAMPLE_RATE),'pipe:1'],{maxBuffer:1024*1024});
    if(result.status!==0)throw new Error(result.error?.message||result.stderr.toString());
    if(result.stdout.length/4<length)throw new Error('发送按键声音长度不足。');
    const data=new Float32Array(length);let peak=0;
    for(let i=0;i<length;i++){
      const edge=Math.min(1,i/SAMPLE_RATE*rate/.002,(length-1-i)/SAMPLE_RATE*rate/.018);
      data[i]=result.stdout.readFloatLE(i*4)*Math.max(0,edge);peak=Math.max(peak,Math.abs(data[i]));
    }
    for(let i=0;i<length;i++)data[i]*=peak?.65/peak:0;
    return data;
  }
  leafTouch(event,rate,length){
    // C、D、E、G、A 调音风铃：圆润主音和很轻、很快消退的金属泛音。
    // 振荡频率使用真实时间，只有包络随倍速变化，音高保持不变。
    const frequency=1046.502261*2**(event.pitch/12),data=new Float32Array(length);
    const decay=.215-event.pitch*.003,upperGain=.065*Math.min(1,3800/(frequency*2.756));
    let peak=0;
    for(let i=0;i<length;i++){
      const t=i/SAMPLE_RATE,age=t*rate,attack=1-Math.exp(-age/.0045);
      const edge=Math.max(0,Math.min(1,(length-1-i)/SAMPLE_RATE*rate/.12));
      const tone=Math.sin(TAU*frequency*t)*Math.exp(-age/decay);
      const sheen=upperGain*Math.sin(TAU*frequency*2.756*t)*Math.exp(-age/.068);
      data[i]=(tone+sheen)*attack*edge;peak=Math.max(peak,Math.abs(data[i]));
    }
    for(let i=0;i<length;i++)data[i]*=peak?.55/peak:0;
    return data;
  }
  keyboard(rate,length){
    if(!this.keyboardSource){
      // 原录音包含连续按键；去掉开头静音，保留自然的轻重和回键。
      const decoded=spawnSync('ffmpeg',['-v','error','-i',path.join(ROOT,'audio/source/typing.mp3'),
        '-af','atrim=start=0.43:end=1.5,asetpts=PTS-STARTPTS,highpass=f=90,lowpass=f=2600,acompressor=threshold=0.08:ratio=2:attack=3:release=35',
        '-f','f32le','-ac','1','-ar',String(SAMPLE_RATE),'pipe:1'],{maxBuffer:1024*1024});
      if(decoded.status!==0)throw new Error(decoded.error?.message||decoded.stderr.toString());
      const count=decoded.stdout.length/4,overlap=Math.round(.055*SAMPLE_RATE),step=count-overlap;
      if(step<=overlap)throw new Error('连续打字素材过短。');
      const segment=Float32Array.from({length:count},(_,i)=>decoded.stdout.readFloatLE(i*4));
      // 相邻段交叠 55 毫秒，消除循环接缝。多留余量供保持音高的变速裁切。
      const continuous=new Float32Array(Math.ceil(8.2*SAMPLE_RATE));
      for(let start=0;start<continuous.length;start+=step){
        for(let i=0;i<count&&start+i<continuous.length;i++){
          let weight=1;
          if(start>0&&i<overlap)weight=Math.sin(i/overlap*Math.PI/2)**2;
          if(i>=step)weight*=Math.cos((i-step)/overlap*Math.PI/2)**2;
          continuous[start+i]+=segment[i]*weight;
        }
      }
      this.keyboardSource=Buffer.alloc(continuous.length*4);
      for(let i=0;i<continuous.length;i++)this.keyboardSource.writeFloatLE(continuous[i],i*4);
    }
    const result=spawnSync('ffmpeg',['-v','error','-f','f32le','-ar',String(SAMPLE_RATE),'-ac','1','-i','pipe:0',
      '-af',`atempo=${rate}`,'-f','f32le','-ac','1','-ar',String(SAMPLE_RATE),'pipe:1'],
      {input:this.keyboardSource,maxBuffer:2*1024*1024});
    if(result.status!==0)throw new Error(result.stderr.toString());
    if(result.stdout.length/4<length)throw new Error('连续打字声音长度不足。');
    const data=new Float32Array(length);let peak=0;
    for(let i=0;i<length;i++){
      const t=i/SAMPLE_RATE,edge=Math.min(1,t/.004,(length-1-i)/SAMPLE_RATE/.025);
      data[i]=result.stdout.readFloatLE(i*4)*Math.max(0,edge);peak=Math.max(peak,Math.abs(data[i]));
    }
    for(let i=0;i<length;i++)data[i]*=peak?.55/peak:0;
    return data;
  }
    *prepareNoise() {
      let seed = 4738291;
      for (let i = 0; i < this.noise.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        this.noise[i] = seed / 2147483648 - 1;
        if ((i + 1) % 2048 === 0) yield;
      }
      this.noiseReady = true;
    }

    *renderSamples(event, rate) {
      // 倍速只改变音效时长，飞行与星河的音高保持。
      const duration = Math.round(event.duration / rate * 1000) / 1000;
      const length = Math.max(2, Math.round(duration * SAMPLE_RATE));
      const data = new Float32Array(length);
      if (event.kind === 'typing') return this.keyboard(rate, length);
      if (event.kind === 'send') return this.sendKey(rate, length);
      if (event.kind === 'leafTouch') return this.leafTouch(event, rate, length);
      const pitch = 2 ** (event.pitch / 12);
      const noiseOffset = Math.floor((event.pitch + 25) * 977) % this.noise.length;
      // 星河是一片互相交叠的柔音颗粒；每粒缓缓亮起，没有敲钟式音头。
      const grains = [];
      if (event.kind === 'galaxy') {
        let seed = 8941 + Math.round((event.pitch + 24) * 631);
        const next = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;return seed / 4294967296;};
        const notes = [220, 261.626, 293.665, 329.628, 391.995, 440];
        for (let j = 0; j < 18; j++) grains.push({
          at: next() * .84, span: .17 + next() * .24,
          frequency: notes[Math.floor(next() * notes.length)] * pitch,
          phase: next() * TAU, level: .05 + next() * .08
        });
      }
      let low = 0, deep = 0, air = 0, peak = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE, u = i / (length - 1);
        const white = this.noise[(i + noiseOffset) % this.noise.length];
        const airCutoff = event.kind === 'wind' ? 280 + 220 * Math.sin(Math.PI * u) : event.kind === 'flight' ? 550 + 380 * Math.sin(Math.PI * u) : 1500;
        low += (1 - Math.exp(-TAU * airCutoff / SAMPLE_RATE)) * (white - low);
        deep += (1 - Math.exp(-TAU * 105 / SAMPLE_RATE)) * (low - deep);
        air += (1 - Math.exp(-TAU * 3100 / SAMPLE_RATE)) * (white - air);
        let sample = 0;
        if (event.kind === 'ripple') {
          // 连续的轻水面声，从静止中升起，再散开；不再使用三次滴水敲击。
          const envelope = Math.sin(Math.PI * u) ** 2;
          const ripple = .8 + .2 * Math.sin(TAU * u * 2.4);
          sample = ((low - deep) * .46 + (air - low) * .025) * envelope * ripple;
        } else if (event.kind === 'wind') {
          const envelope = Math.sin(Math.PI * u) ** 2;
          const breath = .92 + .08 * Math.sin(TAU * u * 1.3);
          sample = (low - deep) * .5 * envelope * breath;
        } else if (event.kind === 'flight') {
          const envelope = Math.sin(Math.PI * u) ** 1.8 * (1 - .42 * u);
          // 短而低的掠过声，不叠加哨音，削掉高频气流。
          sample = ((low - deep) * .30 + (air - low) * .008) * envelope;
        } else if (event.kind === 'galaxy') {
          for (const grain of grains) {
            const q = (u - grain.at) / grain.span;
            if (q <= 0 || q >= 1) continue;
            const local = (u - grain.at) * duration;
            const envelope = Math.sin(Math.PI * q) ** 2;
            const tone = .72 * Math.sin(TAU * grain.frequency * local + grain.phase)
              + .18 * Math.sin(TAU * grain.frequency * .997 * local + grain.phase)
              + .10 * Math.sin(TAU * grain.frequency * 1.003 * local + grain.phase);
            sample += tone * envelope * grain.level;
          }
          // 整片缓慢起落，交叠后成为星河的余光，听不出规则的逐颗提示。
          sample *= Math.sin(Math.PI * u) ** 1.4;
        }
        // 每个缓存样本两端归零；短音的结束与中途暂停都不制造尖锐瞬变。
        const edge = Math.min(1, t / .012, (duration - t) / .04);
        data[i] = sample * Math.max(0, edge);
        peak = Math.max(peak, Math.abs(data[i]));
        if ((i + 1) % 1024 === 0) yield;
      }
      // 不将本来很轻的水声和风声强行放大到与飞行声一样响。
      const normalizer = peak > 0 ? .72 / Math.max(.38, peak) : 0;
      for (let i = 0; i < length; i++) {
        data[i] *= normalizer;
        if ((i + 1) % 2048 === 0) yield;
      }
      return data;
    }

}
function build(){
  const maker=new SoundAssets(),clips=[];
  for(const rate of RATES)for(const event of CLIPS){
    const generator=maker.renderSamples(event,rate);let result;do{result=generator.next()}while(!result.done);
    const data=result.value,pcm=Buffer.alloc(data.length*2);
    for(let i=0;i<data.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data[i]))*32767),i*2);
    clips.push({key:`${event.kind}:${event.pitch}:${rate}`,pcm:pcm.toString('base64')});
  }
  const output='/* 本作品预生成音频；由 scripts/build-audio.cjs 生成。 */\n'+
    'globalThis.STAR_LETTER_AUDIO='+JSON.stringify({sampleRate:SAMPLE_RATE,clips})+';\n';
  fs.writeFileSync(path.join(ROOT,'audio/sound-bank.js'),output);
  console.log(`已生成 ${clips.length} 个声音缓存，${(Buffer.byteLength(output)/1024/1024).toFixed(2)} MB。`);
}
module.exports={SoundAssets,CLIPS,RATES,SAMPLE_RATE};
if(require.main===module)build();
