/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
import {loadAssets} from './assets.mjs';
import {DRAW,renderFrame,sourceTime} from './render.mjs';
import {BOUNDS,DURATION} from './math.mjs';

export const sequenceId='civilization-growth-sequence';
export const segments=[
 {id:'cursive-regular-morph',name:'草楷墨迹换形',start:0,end:2500,first:0,last:0,detail:'6800个墨点沿真实草书火的轮廓汇入颜体火；保持纸墨与字形中心。'},
 {id:'glyph-multiply-structure',name:'字形增殖与点线接续',start:2500,end:5200,first:1,last:3,detail:'双火由细字符合拢，三火转墨点，四火以线结构组成；三火和四火不叠实心书法。'},
 {id:'row-flash-transform',name:'横排闪烁换形',start:5200,end:7800,first:4,last:4,detail:'四个线结构先从方阵移成一行，再局部闪烁转为四颗种子，最后下落到生长位置。'},
 {id:'botanical-grow-bloom',name:'抽芽闪变与绽放',start:7800,end:11700,first:5,last:6,detail:'四颗种子抽芽成植物，茎叶伸展后花朵开放；两次变化各有局部短闪。'},
 {id:'motifs-gather-atlas',name:'缩拢收入群像',start:11700,end:15054,first:7,last:7,detail:'四朵原花闪烁后缩到左上整齐排列；35个分区组成紧密群像，烟火、齿轮、织梭、摆锤和探索尾焰持续运动。'},
 {id:'image-particles-wordmark',name:'群像散点聚字',start:15054,end:18600,first:8,last:8,detail:'完整群像短闪，从真实墨迹位置散出7000个粒子，错峰聚成 WISE MOTION 后停留。'}
];
export function definitionFor(id){
 if(id===sequenceId)return null;
 const segment=segments.find(s=>s.id===id);if(!segment)throw new Error('未知动效：'+id);return segment;
}
export function paintEffect(ctx,assets,id,ms,width=1920,height=1080){
 if(!Number.isFinite(ms))throw new TypeError('定位时间必须为有限数字');
 const segment=definitionFor(id),limit=segment?segment.end-segment.start:DURATION*1000;
 const local=Math.max(0,Math.min(limit,ms));
 if(!segment)return renderFrame(ctx,assets,local/1000,width,height);
 // Half-frame boundaries keep the full film's 30 fps grid. The segment endpoint
 // belongs to its own final painter rather than the next scene's entrance.
 const time=Math.max(segment.start/1000,sourceTime((segment.start+local)/1000));
 let i=segment.first;while(i<segment.last&&time>=BOUNDS[i+1])i++;
 ctx.setTransform(width/640,0,0,height/360,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=true;
 ctx.clearRect(0,0,640,360);ctx.drawImage(assets.paper,0,0,640,360);
 DRAW[i](ctx,assets,time-BOUNDS[i]);return {i,time,local:time-BOUNDS[i]};
}
export {loadAssets};
