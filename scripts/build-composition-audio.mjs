// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 将随包原合成程序与固定排程离线生成声音；不访问来源工程，不启动服务器。
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {openBrowser} from '@remotion/renderer';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = path.join(root, 'catalog/assets/composition-audio');
const read = (group, file) => readFile(path.join(base, group, file), 'utf8');
const browser = await openBrowser('chrome', {logLevel: 'error'});
try {
  const page = await browser.newPage({context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {}});
  const selected = process.argv.slice(2);
  for (const group of ['drive', 'ocean', 'osmanthus', 'letter', 'factory'].filter(group => !selected.length || selected.includes(group))) {
    const recipe = JSON.parse(await read(group, 'recipe.json'));
    const code = await read(group, 'sound.js');
    const auxiliary = group === 'drive' ? await read(group, 'meow.js') : group === 'letter' ? await read(group, 'sound-bank.js') : '';
    const clips = group === 'factory' ? Object.fromEntries(await Promise.all([...new Set(recipe.recipes.flatMap(cues => cues.map(cue => cue.clip)))].map(async name => [name, (await readFile(path.join(base, group, name + '.wav'))).toString('base64')]))) : {};
    const count = group === 'factory' ? recipe.recipes.length : group === 'osmanthus' ? recipe.variants.length : 1;
    for (let variant = 0; variant < count; variant++) {
      const result = await page.evaluate(async ({group, recipe, code, auxiliary, clips, variant}) => {
        const rate = 48000, context = new OfflineAudioContext(2, Math.ceil(recipe.duration * rate), rate);
        let now = 0;
        // 先把所有时刻的参数写入离线时钟，再统一生成波形。
        Object.defineProperty(context, 'currentTime', {get: () => now});
        Object.defineProperty(context, 'state', {get: () => 'running'});
        globalThis.AudioContext = function() {return context;};
        globalThis.Audio = class {constructor(){this.paused=false;this.readyState=3;this.currentTime=0;}addEventListener(){}play(){return Promise.resolve();}pause(){}load(){}};
        if (group === 'drive') globalThis.XIAOKUI_MEOW = new Function(auxiliary + '\nreturn XIAOKUI_MEOW;')();
        else if (auxiliary) new Function(auxiliary)();
        if (group === 'drive' || group === 'ocean') {
          const Sound = new Function(code + '\nreturn ' + (group === 'drive' ? 'DrivingSound' : 'SceneSound') + ';')();
          const sound = new Sound(recipe.events);sound.create();sound.enabled = true;
          if (group === 'ocean') sound.setEvents(recipe.events);
          for (const frame of recipe.frames) {
            now = frame.time;
            // 离线节点尚未结束；这里只清理计数，保留已安排的声音连接。
            sound.voices.clear();sound.update(frame);
          }
        } else if (group === 'letter') {
          new Function(code)();
          const Sound = globalThis.StarLetterSound;Sound.prototype.warmCache = () => {};
          const sound = new Sound();sound.create();sound.setEvents(recipe.events);
          for (const event of sound.events) {sound.voices.clear();sound.schedule(event, event.time, 1, 0);}
          sound.suspendWhenIdle = () => {};
        } else if (group === 'osmanthus') {
          new Function(code.replace('globalThis.NightTreeSound={create};', 'globalThis.NightTreeSound={create,synthesize};'))();
          const synthesize = globalThis.NightTreeSound.synthesize;
          const samples = synthesize(recipe.duration, recipe.wind, recipe.cues, 32000, recipe.stages);
          const master = context.createGain();master.gain.value = .8;master.connect(context.destination);
          const add = (samples, at, volume = 1) => {
            const buffer = context.createBuffer(2, samples.left.length, samples.rate);
            buffer.copyToChannel(samples.left, 0);buffer.copyToChannel(samples.right, 1);
            const source = context.createBufferSource(), gain = context.createGain();
            source.buffer = buffer;gain.gain.value = volume;source.connect(gain);gain.connect(master);source.start(at);
          };
          add(samples, 0);
          const smooth = x => {x = Math.max(0, Math.min(1, x));return x*x*(3-2*x);};
          for (const star of recipe.stages.stars || []) {
            const buffer = synthesize(1.25, {start:2,end:3}, [], 32000, {sparkles:[{time:0,pan:star.pan,note:star.note}]});
            for (let at = star.first; at < Math.min(recipe.duration, star.end ?? Infinity); at += star.period) {
              const volume = smooth((at-18)/1.2) * (star.end === undefined ? 1 : 1-smooth((at-star.fadeAt)/(star.end-star.fadeAt)));
              add(buffer, at, volume);
            }
          }
        } else {
          for (const cue of recipe.recipes[variant]) {
            const bytes = Uint8Array.from(atob(clips[cue.clip]), char => char.charCodeAt(0));
            const buffer = await context.decodeAudioData(bytes.buffer);
            const source = context.createBufferSource(), gain = context.createGain();
            const duration = Math.min(cue.duration, buffer.duration / cue.pitch);
            source.buffer = buffer;source.playbackRate.value = cue.pitch;
            gain.gain.setValueAtTime(0, cue.start);gain.gain.linearRampToValueAtTime(cue.gain, cue.start + Math.min(.008,duration/3));
            gain.gain.setValueAtTime(cue.gain, cue.start + Math.max(duration/3,duration-.012));gain.gain.linearRampToValueAtTime(0,cue.start+duration);
            source.connect(gain);gain.connect(context.destination);source.start(cue.start,0,duration*cue.pitch);
          }
        }
        const rendered = await context.startRendering();
        const left = rendered.getChannelData(0), right = rendered.getChannelData(1);
        const bytes = new Uint8Array(left.length * 4), view = new DataView(bytes.buffer);
        let peak = 0, energy = 0;
        for (let i = 0; i < left.length; i++) for (const [channel, samples] of [[0,left],[1,right]]) {
          const value = samples[i];if (!Number.isFinite(value)) throw new Error('声音出现无效数值');
          peak = Math.max(peak,Math.abs(value));energy += value * value;
          view.setInt16(i*4+channel*2,Math.round(Math.max(-1,Math.min(1,value))*32767),true);
        }
        if (!peak || peak > 1) throw new Error('声音无声或超出有效范围：' + peak);
        let binary = '';for (let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
        return {pcm:btoa(binary),peak,rms:Math.sqrt(energy/(left.length*2))};
      }, {group, recipe: group === 'osmanthus' ? recipe.variants[variant].recipe : recipe, code, auxiliary, clips, variant});
      const filename = group === 'factory' ? `mix-${variant}.mp3` : group === 'osmanthus' ? `mix-${recipe.variants[variant].id}.mp3` : 'mix.mp3';
      const encoded = spawnSync('ffmpeg', ['-v','error','-y','-f','s16le','-ar','48000','-ac','2','-i','pipe:0','-c:a','libmp3lame','-b:a','192k',path.join(base,group,filename)], {input:Buffer.from(result.pcm,'base64'), maxBuffer:1024*1024});
      if (encoded.status !== 0) throw new Error(encoded.stderr.toString() || '声音编码失败');
      await writeFile(path.join(base,group,filename+'.json'),JSON.stringify({duration:recipe.duration,peak:result.peak,rms:result.rms,source:'sound.js + recipe.json',sampleRate:48000},null,2)+'\n');
      console.log(`已生成 ${group}/${filename}（${recipe.duration} 秒）`);
    }
  }
} finally {await browser.close({silent:true});}
