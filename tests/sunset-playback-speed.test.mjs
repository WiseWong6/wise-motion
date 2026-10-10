// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
import {getEffectMetadata} from '../remotion/clock.mjs';
import {getAudioPlan,trackVolume} from '../remotion/audio-plan.mjs';

const effect=data.effects.find(e=>e.id==='sunset-pickup-journey');

test('海面上的夕阳只播放原作前43秒的二倍速版本，回看和末帧与原作对应',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const originalRoot=w.document.createElement('div');root.after(originalRoot);
 let render,original;
 try{
  w.WiseSceneDiagnostics=true;
  assert.equal(effect.duration_ms,21500);
  assert.equal(effect.preview_ms,17875,'缩略图仍对应原作35.75秒的画面');
  assert.equal(effect.loop,false);
  assert.equal(getEffectMetadata(effect.id,{fps:60}).durationInFrames,1291,'包含21.5秒的准确末帧');
  assert.ok(w.MotionFactories[effect.id].breakdown.every(layer=>layer.end===21500&&layer.time==='0—21.5秒'));
  render=w.MotionKit.createRenderer(root,effect);
  original=w.MotionKit.createRenderer(originalRoot,{...effect,duration_ms:65000,scene:{...effect.scene,playback_rate:1}});
  await Promise.all([render.ready,original.ready]);
  for(const time of [0,5000,10000,17875,21500-1000/60,21500,10000,0,21500]){
   render(time);original(time*2);
   assert.equal(root.dataset.pose,originalRoot.dataset.pose,'应对应原作的同一姿态：'+time);
  }
  const end=root.dataset.pose;render(65000);assert.equal(root.dataset.pose,end,'播放不会越过原作43秒的画面');
  w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  const copied=w.MotionExport.code(effect);
  const definition=JSON.parse(copied.match(/const effect = ([\s\S]*?);\s*const player =/)[1]);
  assert.equal(definition.duration_ms,21500);
  assert.equal(definition.scene.playback_rate,2);
  assert.equal(definition.scene.speed_after,undefined);
  assert.deepEqual(definition.audio,effect.audio,'复制源码保留声音的变速与截取设置');
 }finally{render?.destroy();original?.destroy();env.close();}
});

test('音效和海浪只截取前43秒并以二倍速播放，整体变速仍同步',()=>{
 for(const fps of [30,60])for(const speed of [.5,1,2]){
  const tracks=getAudioPlan(effect,fps,speed);
  assert.equal(tracks.length,2);
  for(const track of tracks){
   assert.equal(track.from,0);assert.equal(track.trimBefore,0);
   assert.equal(track.playbackRate,speed*2);
   assert.equal(track.durationInFrames,Math.ceil(21.5*fps/speed-1e-9));
   const sourceEnd=43*fps;
   assert.ok((track.durationInFrames-1)*track.playbackRate<sourceEnd,'最后一帧从原录音43秒之前开始');
   assert.ok(track.durationInFrames*track.playbackRate>=sourceEnd,'声音覆盖到原录音43秒的截点');
   assert.equal(trackVolume(track,track.durationInFrames/2),track.volume);
  }
 }
});
