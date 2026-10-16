// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build,transform} from 'esbuild';
import {exportEffect} from '../scripts/export.mjs';
import {getAudioPlan,trackVolume} from '../remotion/audio-plan.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
const ids=['aboutlove-monologue-sequence','aboutlove-motion-sequence','aboutlove-word-world-sequence'];
const root=new URL('../',import.meta.url);
const read=file=>readFile(new URL(file,root),'utf8');

test('new full sequences export independently with the original audio and bundle using only their delivered files',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-motion-aboutlove-'));
 try{
  for(const id of ids){
   const out=path.join(dir,id),result=await exportEffect(id,{outDir:out});
   assert.equal(result.kind,'standalone');
   const spec=resolveEffect(id).source.remotion;
   assert.equal(spec.width,1080);assert.equal(spec.height,1440);
   for(const asset of spec.binary_files){
    const bytes=await readFile(path.join(out,asset.target));assert.equal(bytes.length,asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
   }
   const verify=spawnSync(process.execPath,['catalog/assets/aboutlove/verify-source.mjs'],{cwd:out,encoding:'utf8'});
   assert.equal(verify.status,0,id+' '+verify.stderr);
   const bundled=await build({entryPoints:[path.join(out,'index.jsx')],bundle:true,write:false,packages:'external',platform:'browser',logLevel:'silent'});
   assert.ok(bundled.outputFiles[0].contents.length>0);
   const readme=await readFile(path.join(out,'README.md'),'utf8');
   assert.match(readme,/includeAudio=\{false\}/);assert.match(readme,/1080×1440/);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('standalone audio uses the same frame plan as the catalog at every speed, and can be switched off',async()=>{
 const entries={};runInNewContext(await read('catalog/effects/aboutlove-entries.js'),entries);
 const jsx=(await transform(await read('catalog/remotion/aboutlove.jsx'),{loader:'jsx',format:'cjs'})).code;
 const React={createElement:(type,props,...children)=>({type,props:{...props,children}}),useLayoutEffect(){},useRef:()=>({current:null}),useState:()=>[null,()=>{}]};
 let frame=0;
 const remotion={AbsoluteFill:'AbsoluteFill',Html5Audio:'Html5Audio',Sequence:'Sequence',staticFile:src=>'/'+src,
  useCurrentFrame:()=>frame,useVideoConfig:()=>({fps:60,width:1080,height:1440}),useDelayRender:()=>({delayRender(){},continueRender(){},cancelRender(){}})};
 const module={exports:{}};
 runInNewContext(jsx,{module,exports:module.exports,WiseAboutLoveEntries:entries.WiseAboutLoveEntries,require:name=>name==='react'?React:name==='remotion'?remotion:{}});
 const component=module.exports.WiseAboutLove;
 const all=node=>Array.isArray(node)?node.flatMap(all):node&&typeof node==='object'?[node,...all(node.props?.children)]:[];
 for(const id of ids)for(const speed of [.5,.75,1,1.25,1.75,2])for(const position of [0,.5,.945]){
  const effect=resolveEffect(id);frame=Math.round(effect.duration_ms*60/(1000*speed)*position);
  const tree=component({effectId:id,speed}),sequences=all(tree).filter(n=>n.type==='Sequence'),plan=getAudioPlan(effect,60,speed);
  assert.equal(sequences.length,plan.length);
  plan.forEach((track,index)=>{
   const seq=sequences[index],audio=all(seq).find(n=>n.type==='Html5Audio');
   assert.equal(seq.props.from,track.from);assert.equal(seq.props.durationInFrames,track.durationInFrames);
   assert.equal(audio.props.src,'/'+track.src);assert.equal(audio.props.trimBefore,track.trimBefore);assert.equal(audio.props.playbackRate,track.playbackRate);
   assert.equal(audio.props.volume,trackVolume(track,frame-track.from));
  });
  assert.equal(all(tree).find(n=>n.type==='div').props.style.transform,'scale(4)','独立工程完整填入原竖幅');
  assert.equal(all(component({effectId:id,speed,includeAudio:false})).filter(n=>n.type==='Sequence').length,0);
 }
 assert.equal(all(component({effectId:'lap-outline-echo'})).filter(n=>n.type==='Sequence').length,0,'独立动作无声');
 const world=resolveEffect(ids[2]);
 assert.equal(world.audio.tracks.find(t=>t.src.endsWith('world-sfx.flac')).duration_ms,75110,'逐字输入的键击音效不保留');
 assert.equal(world.audio.tracks.find(t=>t.src.endsWith('world-bgm.flac')).duration_ms,79600,'配乐保持至片尾');
});
