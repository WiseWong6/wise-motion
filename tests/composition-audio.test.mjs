// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {getAudioPlan, trackVolume} from '../remotion/audio-plan.mjs';
import {resolveEffect, effectDefinitions} from '../remotion/clock.mjs';
import {createFrameDocument} from '../remotion/frame-document.mjs';
import {environment} from './helpers.mjs';
const root = new URL('../', import.meta.url);

test('目录的声音、播放和重播按钮把本次点击传给播放器',async()=>{
  const calls=[];let current;
  const env=await environment(true,{staticPreview:true,beforeApp(w){
    const create=w.MotionRuntime.create;
    w.MotionRuntime.create=(...args)=>{
      const player=create(...args);
      current=player;
      player.muted=true;
      player.setMuted=(value,event)=>calls.push({name:'sound',value,event});
      for(const name of ['play','restart']){
        const original=player[name];
        player[name]=function(...params){calls.push({name,params});return original.apply(this,params);};
      }
      return player;
    };
  }});
  try {
    const {w}=env,d=w.document;
    const sound=new w.MouseEvent('click',{bubbles:true});
    d.getElementById('toggle-sound').dispatchEvent(sound);
    assert.equal(calls.at(-1).event,sound);assert.equal(calls.at(-1).value,false);
    current.pause();
    const play=new w.MouseEvent('click',{bubbles:true});
    d.getElementById('toggle-play').dispatchEvent(play);
    assert.equal(calls.at(-1).name,'play');assert.equal(calls.at(-1).params[0],play);
    const restart=new w.MouseEvent('click',{bubbles:true});
    d.getElementById('restart').dispatchEvent(restart);
    const lastRestart=calls.findLast(call=>call.name==='restart');
    assert.equal(lastRestart.params[0],true);assert.equal(lastRestart.params[1],restart);
  } finally {env.w.MotionThumbs.disposeAll();env.close();}
});

test('声音资源仅登记在完整组合，所有外观、时间与文件可独立复用', async () => {
  const voiced = effectDefinitions.filter(effect => effect.audio);
  assert.equal(voiced.length, 18);
  for (const effect of effectDefinitions) {
    if (effect.kind !== 'composition') assert.equal(effect.audio, undefined, effect.id);
    for (const variant of effect.variants || [null]) {
      const resolved = resolveEffect(effect.id, variant?.id);
      for (const track of resolved.audio?.tracks || []) {
        assert.equal(effect.kind, 'composition');
        assert.match(track.src, /^catalog\/assets\/composition-audio\//);
        assert.ok((await stat(new URL(track.src, root))).size > 0);
        assert.ok(effect.source.assets.includes(track.src));
        assert.ok(track.start_ms >= 0 && track.duration_ms > 0);
        assert.ok(track.start_ms + track.duration_ms <= effect.duration_ms + 1e-6);
        assert.ok((track.offset_ms ?? 0) >= 0);
        assert.ok(track.volume >= 0 && track.volume <= 1);
      }
    }
  }
  assert.equal(resolveEffect('cat-factory-journey','14').audio.tracks[0].src.endsWith('mix-14.mp3'), true);
  assert.equal(resolveEffect('osmanthus-butterfly-journey','flowers').audio.tracks[0].src.endsWith('mix-flowers.mp3'), true);
});

test('变速同步改变声音入点、时长和播放速度，源文件截取偏移不改变', () => {
  const effect = {kind:'composition',duration_ms:6000,audio:{tracks:[{src:'score.mp3',start_ms:1000,duration_ms:3000,offset_ms:54000,volume:.4,fade_in_ms:200,fade_out_ms:400}]}};
  for (const speed of [.5,1,2]) {
    const [track] = getAudioPlan(effect,60,speed);
    assert.equal(track.from,60/speed);assert.equal(track.durationInFrames,180/speed);
    assert.equal(track.trimBefore,3240);assert.equal(track.playbackRate,speed);
    assert.equal(trackVolume(track,0),0);assert.equal(trackVolume(track,track.fadeInFrames),.4);
    assert.equal(trackVolume(track,track.durationInFrames),0);
    assert.equal(trackVolume(track,track.durationInFrames-track.fadeOutFrames/2),.2);
  }
  assert.deepEqual(getAudioPlan({...effect,kind:'action'}),[]);
  assert.deepEqual(getAudioPlan({...effect,kind:'illustration'}),[]);
});

test('原声截取与实际组合画面对应；复制源码保留文件、合成程序和静音选项', async () => {
  assert.equal(resolveEffect('material-phone-sequence').audio.tracks[0].offset_ms,33000);
  assert.throws(() => resolveEffect('ink-ocean-journey'), /未知动效/);
  const env = await environment();
  try {
    env.w.eval(await readFile(new URL('catalog/export.js',root),'utf8'));
    const effect = resolveEffect('balloon-drive-journey');
    const code = env.w.MotionExport.remotionCode(effect);
    assert.match(code,/composition-audio\/drive\/mix\.mp3/);
    assert.match(code,/composition-audio\/drive\/sound\.js/);
    assert.match(code,/composition-audio\/drive\/recipe\.json/);
    assert.match(code,/includeAudio=\{false\}/);
    const html = env.w.MotionExport.code(effect);
    assert.match(html,/id="sound"/);assert.match(html,/catalog\/remotion-player\.js/);
    for (const composition of effectDefinitions.filter(item => item.audio)) {
      const copied = env.w.MotionExport.code(composition);
      const definition = JSON.parse(copied.match(/const effect = ([\s\S]*?);\s*const player =/)[1]);
      assert.equal(definition.source.path, composition.source.path, composition.id);
      assert.deepEqual(definition.source.dependencies, composition.source.dependencies, composition.id);
      assert.equal(definition.kind, 'composition');
      assert.ok(createFrameDocument({assetBaseUrl:'file:///wise-motion/',definition}).includes(composition.source.path));
    }
    const silent = env.w.MotionExport.code(resolveEffect('factory-handle-transfer'));
    assert.doesNotMatch(silent,/id="sound"|composition-audio/);
    assert.match(env.w.MotionExport.prompt(effect,{speed:2}),/声音：[\s\S]*0\.00–7\.00 秒/);
  } finally {env.close();}
});

test('合成音轨保留非零声音、有效峰值和原场景事件排程', async () => {
  for (const [group,filename] of [['drive','mix'],['ocean','mix'],['letter','mix'],['factory','mix-0'],['factory','mix-14'],['osmanthus','mix-flowers']]) {
    const metrics = JSON.parse(await readFile(new URL(`catalog/assets/composition-audio/${group}/${filename}.mp3.json`,root),'utf8'));
    assert.ok(metrics.peak > .001 && metrics.peak <= 1);assert.ok(metrics.rms > 0);
  }
  const drive = JSON.parse(await readFile(new URL('catalog/assets/composition-audio/drive/recipe.json',root),'utf8'));
  assert.equal(drive.events.filter(event=>event.type==='release').length,35);
  assert.equal(drive.events.find(event=>event.type==='meow').time,drive.events.at(-2).time);
  const ocean = JSON.parse(await readFile(new URL('catalog/assets/composition-audio/ocean/recipe.json',root),'utf8'));
  assert.ok(ocean.events.some(event=>event.type==='splash'));assert.equal(ocean.frames.length,3900);
});
