// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 古老旋律独立排谱；不读取现代曲谱、音乐字库或原工程。
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),checking=process.argv.includes('--check');
const round=n=>Number(n.toFixed(6));
const melody=[[[60,1],[60,1],[67,1],[67,1]],[[69,1],[69,1],[67,2]],[[65,1],[65,1],[64,1],[64,1]],[[62,1],[62,1],[60,2]],[[67,1],[67,1],[65,1],[65,1]],[[64,1],[64,1],[62,2]],[[67,1],[67,1],[65,1],[65,1]],[[64,1],[64,1],[62,2]]];
// 本项目新增的简单二声部伴奏；没有复制莫扎特或现代编配的伴奏。
const bass=[[48,55],[53,48],[53,48],[55,48],[48,53],[48,55],[48,53],[48,55]];
function ellipse(rx,ry){return Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2,c=Math.cos(Math.PI/9),s=Math.sin(Math.PI/9),x=rx*Math.cos(a),y=ry*Math.sin(a);return [round(x*c-y*s),round(x*s+y*c)];});}
const contour=ellipse(157,100),hole=ellipse(103,57).reverse();
const path=points=>points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join('')+'Z';
const xs=contour.map(p=>p[0]),ys=contour.map(p=>p[1]),bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
const scale=2.26/bounds[2],headHeight=round(bounds[3]*scale);
const glyphs={quarter:{path:path(contour),bounds},half:{path:path(contour)+path(hole),bounds}};
const white={0:0,2:1,4:2,5:3,7:4,9:5,11:6};
const degree=p=>Math.floor(p/12)*7+white[p%12];
const events=[];
for(let bar=0;bar<8;bar++)for(const staff of [1,2]){
 let beat=0;
 for(const [pitch,length] of staff===1?melody[bar]:bass[bar].map(p=>[p,2])){
  events.push({id:`m${bar+1}s${staff}b${beat}`,glyph:length===2?'half':'quarter',attack:true,staff,system:0,pitch,time:round(.4+(bar*4+beat)*.75),duration:length*.75,headWidth:2.26,headHeight,x:round(42+bar*48.2+beat*9.2),z:round(staff===1?19.8-(degree(pitch)-degree(64))*.9:32.4-(degree(pitch)-degree(43))*.9)});
  beat+=length;
 }
}
events.sort((a,b)=>a.time-b.time||a.staff-b.staff);
const data={title:'小星星（古老旋律）',composer:'法国传统旋律 Ah, vous dirai-je, maman',arranger:'Wise Motion 独立排谱与简单伴奏',melody_rights:'public-domain',license:'Apache-2.0',source_url:'https://kv.mozarteum.at/de/work/zwolf-variationen-in-c-uber-4057',tempo:80,excerptMeasures:[1,8],musicDuration:24,entrance:.4,tail:1.4,instrument:'静音五线谱',arrangement:'古老旋律前八小节；二声部简单伴奏由本项目重新编写，谱纸、符号与音符坐标由代码生成。',duration:25.8,fps:30,videoWidth:1080,videoHeight:1440,musicEnd:24.4,width:432.8,height:42.4,systemCount:1,noteheadGlyphs:glyphs,events};
const line=(x1,y1,x2,y2,extra='')=>`<path d="M${round(x1*100)} ${round(y1*100)}L${round(x2*100)} ${round(y2*100)}" fill="none" stroke="#161616" stroke-width="12" ${extra}/>`;
let measures='';
for(let bar=0;bar<8;bar++){
 const left=32+bar*48.2,right=left+48.2;
 let staves='';
 for(const staff of [1,2]){
  const bottom=staff===1?19.8:32.4;
  staves+=`<g class="staff" data-staff="${staff}">${Array.from({length:5},(_,i)=>line(left,bottom-i*1.8,right,bottom-i*1.8)).join('')}`;
  for(const e of events.filter(e=>e.staff===staff&&e.id.startsWith(`m${bar+1}s`))){
   const up=e.pitch<(staff===1?71:50),stemX=e.x+(up?.95:-.95);
   if(e.z>bottom)for(let z=bottom+1.8;z<=e.z+.05;z+=1.8)staves+=line(e.x-1.7,z,e.x+1.7,z);
   if(e.z<bottom-7.2)for(let z=bottom-9;z>=e.z-.05;z-=1.8)staves+=line(e.x-1.7,z,e.x+1.7,z);
   staves+=`<g class="note" id="${e.id}" data-pitch="${e.pitch}" data-x="${e.x}" data-z="${e.z}"><path class="notehead" d="${glyphs[e.glyph].path}" transform="translate(${round(e.x*100)} ${round(e.z*100)}) scale(${round(scale*100)} ${round(-scale*100)})" fill="#161616" fill-rule="evenodd"/>${line(stemX,e.z,stemX,e.z+(up?-6.3:6.3),'class="stem"')}</g>`;
  }
  staves+='</g>';
 }
 measures+=`<g class="measure" data-number="${bar+1}">${staves}${line(right,12.6,right,32.4)}</g>`;
}
// 谱号由本项目的曲线绘制；不采用音乐字体中的字形。
const clefs='<g stroke="#161616" stroke-width="28" fill="none"><path d="M2580 1130C2310 1430 2320 1780 2600 1770C2840 1760 2810 1470 2610 1480C2430 1490 2460 1680 2580 1700C2690 1720 2740 1660 2690 1600M2630 1070C2480 1010 2450 1220 2560 1410L2690 1990C2740 2190 2510 2240 2470 2110"/><path d="M2460 2700C2500 2510 2840 2490 2820 2740C2800 2930 2640 3060 2460 3120"/><circle cx="2880" cy="2630" r="28" fill="#161616"/><circle cx="2880" cy="2820" r="28" fill="#161616"/></g>';
const meter='<g fill="#161616"><path d="M2990 1320v170h-35l140-170h40v250h-50v-210l-72 90h120v40h-143zM2990 1650v170h-35l140-170h40v250h-50v-210l-72 90h120v40h-143zM2990 2580v170h-35l140-170h40v250h-50v-210l-72 90h120v40h-143zM2990 2910v170h-35l140-170h40v250h-50v-210l-72 90h120v40h-143z"/></g>';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43280 4240" width="4096" height="401" role="img" aria-label="小星星古老旋律前八小节，项目独立排谱"><!-- Wise Motion 独立排谱；古老旋律为公有领域；新排谱 Apache-2.0。 --><g class="page-margin" transform="translate(0 0)">${clefs}${meter}${measures}</g></svg>\n`;
const block=`/* wise-score:start */var ce=${JSON.stringify(data)};var Yd=${JSON.stringify(svg)};/* wise-score:end */`;
const bundlePath=new URL('catalog/assets/particle-scenes/notes-source.js',root),bundle=await readFile(bundlePath,'utf8');
const pattern=bundle.includes('/* wise-score:start */')?/\/\* wise-score:start \*\/[\s\S]*?\/\* wise-score:end \*\//:/var ce=[\s\S]*?;var Yd=`[\s\S]*?`;/;
if(!pattern.test(bundle))throw new Error('离线绘制包中的谱面位置未找到');
const generated=bundle.replace(pattern,()=>block);
for(const [url,content] of [[new URL('catalog/assets/particle-scenes/notes/assets/score-data.json',root),JSON.stringify(data,null,2)+'\n'],[new URL('catalog/assets/particle-scenes/notes/assets/score-clean.svg',root),svg],[bundlePath,generated]]){
 if(checking){if(await readFile(url,'utf8')!==content)throw new Error('谱面生成内容不一致：'+fileURLToPath(url));}
 else await writeFile(url,content);
}
console.log(`古老旋律谱面、${events.length} 个音符事件与离线绘制包${checking?'已核对':'已生成'}。`);
