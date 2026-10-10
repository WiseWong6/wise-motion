// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 仅供旧播放接口测试；不携带已剔除历史条目的内容或真实媒体。
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const names=['main.js','values.js'];
const source_files=Object.fromEntries(await Promise.all(names.map(async name=>{
 const url=new URL('./fixtures/history/'+name,import.meta.url);
 return [fileURLToPath(url),{name:'history/'+name,content:await readFile(url,'utf8')}];
})));
export function historyTestData(){
 const recipes=Array.from({length:4},(_,i)=>{
  const id='history-fixture-'+i,name='兼容测试 '+i,duration=4+i,files=Object.keys(source_files);
  const code=[{file:files[0],source:'fixture',anchors:[{symbol:'result',line:5}]}];
  const preview={type:i<2?'original-crop':'web-isolated',duration,poster:i<2?'file:///fixtures/poster.svg':.65,file:'file:///fixtures/clip.mp4',start:0,engine:'fixture',mode:'fixture'};
  const entry={id:id+'-case',name,summary:'按绝对时间移动并淡出。',preview,code,entry:{preview},source_files:files,source_packages:['fixture-package'],source_inputs:['history/paper.png'],cases:[{title:name,note:'按绝对时间移动并淡出。',source:'fixture',start:0,end:duration}]};
  return {id,history_id:id,kind:'recipe',category:'history-fixture',name,summary:entry.summary,purpose:entry.summary,objects:'一个测试对象',phases:['出现。','移动。','淡出。'],aliases:[name,'接口测试'],behaviors:['move'],retain:'保持绝对时间',avoid:'不添加声音',duration_ms:duration*1000,preview_ms:duration*650,loop:false,default_ease:'linear',parameters:{speed:{label:'播放速度',min:.5,max:2,step:.25,default:1}},actions:[],source:{path:files[0],origin:'history',license:'Apache-2.0'},source_clock:'绝对时间',source_parameters:'统一时钟',trigger:'打开后播放',analogy:'移动',assumptions:'测试',tempo_note:'单次播放',original_sources:['接口测试'],related_history:[],review:{preserve:['保持绝对时间'],dependencies:[],label:'兼容验证',reuse_contract:{primary_control:'位置',input:'绝对秒数',invariant:'对象身份保持',case_boundary:'仅验证接口'}},entries:[entry]};
 });
 return {version:1,recipes,categories:[{id:'history-fixture',name:'接口测试'}],redirects:{},originals:{clips:[],sources:{fixture:{title:'接口测试'}}},source_root:new URL('./fixtures/history/',import.meta.url).href,source_files:structuredClone(source_files),counts:{recipes:4,entries:4}};
}
