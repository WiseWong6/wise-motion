/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(global){
'use strict';
// Original continuous aperture choreography. No reference-project code is used.
// Coordinates stay in composition pixels. The same state survives picture cuts.
const clamp = n => Math.max(0,Math.min(1,n));
const smooth = n => {const p=clamp(n);return p*p*(3-2*p);};
const tween = (f,a,b,x,y) => x+(y-x)*smooth((f-a)/(b-a));
function key(f,points){
  if(f<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(f<=points[i][0])return tween(f,points[i-1][0],points[i][0],points[i-1][1],points[i][1]);
  return points.at(-1)[1];
}
const circle=(cx,cy,r)=>({type:'circle',cx,cy,r:Math.max(0,r)});
const rect=(cx,cy,width,height,angle=0)=>({type:'rect',cx,cy,width:Math.max(0,width),height:Math.max(0,height),angle});
const FULL=[rect(960,540,1924,1084)];

function originalWindowState(f){
  if(f<80){
    const opening=key(f,[[0,150],[18,285],[45,350],[60,500],[76,1720]]);
    return {phrase:'dial-introduction',shapes:[circle(430,530,opening)]};
  }
  // The entire drawing / board sequence remains full-frame by editorial choice.
  if(f>=320&&f<460){
    // A standard Greek cross: equal arm lengths and one shared stroke width.
    // The complete cross rotates along the screwdriver axis across the cut.
    const cx=key(f,[[320,960],[358,960],[398,1190],[460,1190]]);
    const cy=key(f,[[320,540],[358,540],[398,450],[460,450]]);
    const angle=key(f,[[320,0],[358,0],[411,-28],[438,-28],[460,0]]);
    const h=key(f,[[320,1084],[344,590],[358,590],[388,450],[422,440],[436,460],[460,2400]]);
    return {phrase:'structure-to-axis',shapes:[rect(cx,cy,2800,h,angle),rect(cx,cy,h,2800,angle)]};
  }
  if(f>=548&&f<720){
    // One quiet architectural window. Four edges move through three shots;
    // no merged circles, decorative lobes or overlapping diagonal bands.
    const width=key(f,[[548,1924],[575,1280],[600,1360],[636,1460],[660,1580],[692,1660],[720,1924]]);
    const height=key(f,[[548,1084],[575,680],[600,700],[636,720],[660,740],[692,800],[720,1084]]);
    const cy=key(f,[[548,540],[575,560],[620,555],[660,540],[720,540]]);
    return {phrase:'connected-mechanism',shapes:[rect(960,cy,width,height)]};
  }
  if(f>=788&&f<910){
    const middle=key(f,[[788,2300],[810,400],[842,420],[880,520],[910,2300]]);
    const left=key(f,[[788,0],[800,110],[825,230],[852,310],[880,390],[910,1100]]);
    const right=key(f,[[788,0],[806,100],[838,240],[858,330],[880,430],[910,1100]]);
    return {phrase:'three-column-shutter',shapes:[rect(970,540,middle,2400),rect(510,540,left,2400),rect(1430,540,right,2400)]};
  }
  return {phrase:'full',shapes:FULL};
}

function contains(shape,x,y){
  if(shape.type==='circle')return Math.hypot(x-shape.cx,y-shape.cy)<=shape.r;
  const r=-shape.angle*Math.PI/180,dx=x-shape.cx,dy=y-shape.cy;
  return Math.abs(dx*Math.cos(r)-dy*Math.sin(r))<=shape.width/2&&Math.abs(dx*Math.sin(r)+dy*Math.cos(r))<=shape.height/2;
}

const clips={"cross-aperture-turn":{"start":320,"frames":140},"rect-aperture-breathe":{"start":548,"frames":172},"three-column-aperture":{"start":788,"frames":122},"next-shot-preentry":{"start":788,"frames":13},"offset-aperture":{"start":0,"frames":80},"registered-drawing":{"start":80,"frames":64},"mechanical-window-sequence":{"start":0,"frames":960}};
function frameFor(id,ms){if(!Number.isFinite(ms))throw new TypeError('时间必须为有限数字');const c=clips[id];if(!c)throw new Error('未知窗口动作：'+id);return c.start+Math.max(0,Math.min(c.frames-1,Math.floor(ms*30/1000+1e-9)));}
function windowState(frame){if(!Number.isFinite(frame))throw new TypeError('帧必须为有限数字');return originalWindowState(frame);}
function stateFor(id,ms){const frame=frameFor(id,ms);return id==='next-shot-preentry'?{frame,phrase:'next-shot-preentry',shapes:[circle(1430,540,tween(frame,788,800,0,1900))]}:{frame,...windowState(frame)};}
function isDrawingFlash(ms){const frame=frameFor('registered-drawing',ms);return [[90,97],[110,119]].some(([a,b])=>frame>=a&&frame<b);}
global.WiseMechanicalWindows={stateFor,isDrawingFlash,windowState,contains,tween,key,frameFor,DRAWING_FLASHES:[[90,97],[110,119]],clips,sequence:{"id":"mechanical-window-sequence","kind":"composition","duration_ms":32000,"source":{"frame_cache":{"video":"catalog/assets/mechanical-windows/movie.mp4","start_frame":0,"frames":960,"fps":30,"width":1280,"height":720,"poster":"catalog/assets/mechanical-windows/posters/F0400.jpg"}}},breakdown:[{"id":"Dial","name":"偏心圆窗聚焦","detail":"偏心圆窗聚焦；画面轨道与窗口轨道独立读取当前帧。","start":0.0,"end":2666.6666666666665,"time":"0.00–2.67秒","actions":["iris-open-transition"]},{"id":"Board","name":"同位线稿短闪与陈列归位","detail":"同位线稿短闪与陈列归位；画面轨道与窗口轨道独立读取当前帧。","start":2666.6666666666665,"end":10666.666666666666,"time":"2.67–10.67秒","actions":["rapid-cut","inventory-contour-fit"]},{"id":"Structure","name":"等臂十字与结构分层","detail":"等臂十字与结构分层；画面轨道与窗口轨道独立读取当前帧。","start":10666.666666666666,"end":13333.333333333334,"time":"10.67–13.33秒","actions":["cross-aperture-turn","axial-layer-reseat"]},{"id":"Tool","name":"十字跨镜与螺丝锁紧","detail":"十字跨镜与螺丝锁紧；画面轨道与窗口轨道独立读取当前帧。","start":13333.333333333334,"end":18666.666666666668,"time":"13.33–18.67秒","actions":["cross-aperture-turn","helical-screw-seat"]},{"id":"Barrel","name":"矩窗与发条","detail":"矩窗与发条；画面轨道与窗口轨道独立读取当前帧。","start":18666.666666666668,"end":20000.0,"time":"18.67–20.00秒","actions":["rect-aperture-breathe","barrel-stored-energy"]},{"id":"Train","name":"矩窗与轮系","detail":"矩窗与轮系；画面轨道与窗口轨道独立读取当前帧。","start":20000.0,"end":22000.0,"time":"20.00–22.00秒","actions":["rect-aperture-breathe","meshed-gears-drive"]},{"id":"Balance","name":"矩窗与摆轮","detail":"矩窗与摆轮；画面轨道与窗口轨道独立读取当前帧。","start":22000.0,"end":24000.0,"time":"22.00–24.00秒","actions":["rect-aperture-breathe","balance-reciprocate"]},{"id":"Whole","name":"整表回撤与后镜预入","detail":"整表回撤与后镜预入；画面轨道与窗口轨道独立读取当前帧。","start":24000.0,"end":26666.666666666668,"time":"24.00–26.67秒","actions":["next-shot-preentry","three-column-aperture"]},{"id":"Material","name":"三列窗口与材质接管","detail":"三列窗口与材质接管；画面轨道与窗口轨道独立读取当前帧。","start":26266.666666666664,"end":29333.333333333332,"time":"26.27–29.33秒","actions":["next-shot-preentry","three-column-aperture"]},{"id":"Finale","name":"三列展开与标题收束","detail":"三列展开与标题收束；画面轨道与窗口轨道独立读取当前帧。","start":29333.333333333332,"end":32000.0,"time":"29.33–32.00秒","actions":["three-column-aperture"]}]};
})(globalThis);
