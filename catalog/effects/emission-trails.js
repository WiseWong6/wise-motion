/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
 * 提取自有驾车原码 exhaustPuffs 与夕阳原码 contrailSegments。
 * 释出位置、相机位置及历史姿态通过函数传入；无需原工程、素材或声音。
 */
(function(global){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  // 位置函数返回观察画面中的释出点，相机函数返回累计平移量。
  // 每个粒子的出生位置只取出生时刻，避免后续随主体重新定位。
  function puffsAt(time,originAt,cameraTravelAt,options={}){
    const t=Math.max(0,time),interval=options.interval??.19,lifetime=options.lifetime??.72;
    if(!Number.isFinite(time)||!Number.isFinite(interval)||interval<=0||!Number.isFinite(lifetime)||lifetime<=.1)
      throw new RangeError('时间和间隔必须有限，间隔大于零，粒子寿命大于 0.1 秒');
    const speed=options.speed??360,scale=options.scale??.64,end=options.end??Infinity;
    const puffs=[];
    for(let index=Math.max(0,Math.ceil((t-lifetime)/interval));index<=Math.floor(Math.min(t,end)/interval);index++){
      const born=index*interval,age=t-born,origin=originAt(born);
      if(origin.x>(options.rightEdge??Infinity))continue;
      const drift=-24*age+(speed+24)*.12*(1-Math.exp(-age/.12));
      puffs.push({index,born,age,x:origin.x+cameraTravelAt(born)-cameraTravelAt(t)+drift,
        y:origin.y-18*age-Math.sin(index*1.7)*5*age,
        radius:(4+23*smooth(age/lifetime))*scale,
        opacity:.42*smooth(age/.045)*(1-smooth((age-.10)/(lifetime-.10)))});
    }
    return puffs;
  }
  // 姿态函数可求任意历史秒数，返回 x、y、pitch（弧度）、unit。
  // 两条尾流从同一主体的左右尾口出发；停住的采样区间不排放。
  function segmentsAt(time,poseAt,options={}){
    const t=Math.max(0,time),life=options.lifetime??12,step=options.step??.15;
    if(!Number.isFinite(time)||!Number.isFinite(step)||step<=0||!Number.isFinite(life)||life<=0)
      throw new RangeError('时间必须有限，采样间隔和尾流寿命必须为正数');
    const scale=options.scale??.6,fade=options.fade??1,segments=[];
    const start=Math.max(options.start??0,t-life),end=Math.min(t,options.end??Infinity);
    for(let emitted=start;emitted<end;emitted+=step){
      const next=Math.min(end,emitted+step),a=poseAt(emitted),b=poseAt(next);
      if(Math.hypot(b.x-a.x,b.y-a.y)<.05)continue;
      const age=t-(emitted+next)*.5;
      const alpha=Math.pow(Math.max(0,1-age/life),1.6)*.34*fade;
      if(alpha<.002)continue;
      const point=(state,sampleTime,side)=>{
        const elapsed=t-sampleTime,tailX=-state.unit*1.35,tailY=state.unit*(.08+side*.14);
        return {x:state.x+tailX*Math.cos(state.pitch)-tailY*Math.sin(state.pitch)-elapsed*scale*.9,
          y:state.y+tailX*Math.sin(state.pitch)+tailY*Math.cos(state.pitch)+elapsed*scale*.35
            +Math.sin(sampleTime*.7+side)*elapsed*scale*.1};
      };
      for(const side of [-1,1])segments.push({a:point(a,emitted,side),b:point(b,next,side),
        alpha,width:(.75+age*.23)*scale});
    }
    return segments;
  }

  const set=(node,attrs)=>{for(const [name,value]of Object.entries(attrs))if(node.getAttribute(name)!==String(value))node.setAttribute(name,String(value));};
  // 只承接原车用到的绘图指令。曲线、图层、配色与动作仍由原车函数决定。
  function carDrawing(root){
    const nodes=[],stack=[];let state,cursor,path;
    const reset=()=>{cursor=0;stack.length=0;state={transform:'',fill:'#fff',stroke:'#000',weight:1,cap:'round',join:'round'};};
    const emit=(tag,geometry)=>{
      let node=nodes[cursor];
      if(!node){node=root.ownerDocument.createElementNS('http://www.w3.org/2000/svg',tag);root.append(node);nodes.push(node);}
      if(node.localName!==tag)throw Error('原车绘制顺序改变');
      set(node,{...geometry,transform:state.transform,fill:state.fill,stroke:state.stroke,'stroke-width':state.weight,'stroke-linecap':state.cap,'stroke-linejoin':state.join});cursor++;
    };
    const api={CLOSE:'close',ROUND:'round',
      push(){stack.push({...state});},pop(){state=stack.pop();},
      translate(x,y){state.transform+=' translate('+x+' '+y+')';},
      scale(x,y=x){state.transform+=' scale('+x+' '+y+')';},
      rotate(radians){state.transform+=' rotate('+(radians*180/Math.PI)+')';},
      fill(color){state.fill=color;},noFill(){state.fill='none';},stroke(color){state.stroke=color;},noStroke(){state.stroke='none';},
      strokeWeight(weight){state.weight=weight;},strokeCap(cap){state.cap=cap;},strokeJoin(join){state.join=join;},
      beginShape(){path='';},vertex(x,y){path+=(path?'L':'M')+x+' '+y;},
      bezierVertex(...points){path+='C'+points.join(' ');},endShape(close){emit('path',{d:path+(close?'Z':'')});},
      ellipse(x,y,w,h=w){emit('ellipse',{cx:x,cy:y,rx:w/2,ry:h/2});},circle(x,y,d){api.ellipse(x,y,d,d);},
      line(x1,y1,x2,y2){emit('line',{x1,y1,x2,y2});},
      arc(x,y,w,h,start,end){const rx=w/2,ry=h/2;emit('path',{d:'M'+(x+rx*Math.cos(start))+' '+(y+ry*Math.sin(start))+'A'+rx+' '+ry+' 0 '+(end-start>Math.PI?1:0)+' 1 '+(x+rx*Math.cos(end))+' '+(y+ry*Math.sin(end))});}
    };
    const paint=carSource(api);
    return (t,travel)=>{reset();paint(t,travel,0);if(cursor!==nodes.length||stack.length)throw Error('原车图层或绘图状态未闭合');};
  }
  function carSource(api){
    const {CLOSE,ROUND,push,pop,translate,scale,rotate,fill,noFill,stroke,noStroke,strokeWeight,strokeCap,strokeJoin,beginShape,vertex,bezierVertex,endShape,ellipse,circle,line,arc}=api;
/* 小葵与敞篷车：按 xiaokui-car-arm-trimmed.png 的批准造型转绘。
 * 只用 p5.js 曲线，轮胎底为本地 y=0；整车位移由 scene.js 控制。
 */
const XIAOKUI_EXHAUST_PORT = {x: -253, y: -47};
function xiaokuiSteering(t) {
  return Math.sin(t * 2.1) * .14 + Math.sin(t * .85) * .035;
}
function drawXiaokuiCar(t, travel = t * 360, meow = 0) {
  const WHITE = '#FFFFFF';
  const FUR = '#958878';
  const INNER_EAR = '#78634E';
  const INK = '#09244F';
  const BLUE = '#0077FF';
  const DEEP_BLUE = '#064DDD';
  const EDGE = '#87BFFF';

  // 沿用批准图比例，每个闭合形状都恢复填充，避免受前一条线影响。
  function path(commands, color, outline, weight = 1) {
    if (color) fill(color); else noFill();
    if (outline) { stroke(outline); strokeWeight(weight); } else noStroke();
    beginShape();
    for (const [op, ...p] of commands) {
      if (op === 'M' || op === 'L') vertex(...p);
      else if (op === 'C') bezierVertex(...p);
    }
    if (color) endShape(CLOSE); else endShape();
  }

  function wheel(cx) {
    push();
    translate(cx, 1078);
    // 车轮转角跟随累计路程，速度变化时仍与行驶距离一致。
    rotate(travel / (96 * 0.52));
    noStroke();
    fill(DEEP_BLUE); ellipse(0, 0, 192, 192);
    fill(BLUE); ellipse(0, 0, 188, 188);
    fill(WHITE); ellipse(0, 0, 96, 96);
    // 三个较大的蓝色轮毂孔在小尺寸下也能读出转动。
    fill(BLUE);
    for (let i = 0; i < 3; i++) {
      push();
      rotate(i * Math.PI * 2 / 3);
      ellipse(0, -28, 18, 26);
      pop();
    }
    ellipse(0, 0, 15, 15);
    // 两侧短亮纹交替露出，车身遮到上沿时下半轮仍有运动标记。
    noFill(); stroke('#D9F4FF'); strokeWeight(9);
    arc(0, 0, 166, 166, 0.55, 0.88);
    stroke('#69CFFF'); strokeWeight(7);
    arc(0, 0, 166, 166, Math.PI + 0.58, Math.PI + 0.85);
    pop();
  }

  function cat() {
    // 圆润挺直的身体，白色胸腹分开灰色腰侧与短前臂。
    path([
      ['M', 600, 759], ['C', 579, 779, 574, 822, 582, 852],
      ['C', 586, 867, 592, 878, 614, 886],
      ['L', 760, 886], ['C', 778, 869, 779, 845, 768, 827],
      ['C', 769, 804, 759, 781, 744, 764],
      ['C', 702, 750, 645, 751, 600, 759]
    ], WHITE);
    path([
      ['M', 600, 759], ['C', 579, 779, 574, 822, 582, 852],
      ['C', 586, 867, 592, 878, 614, 886], ['L', 638, 883],
      ['C', 627, 859, 624, 841, 621, 819],
      ['C', 621, 796, 620, 783, 608, 776]
    ], FUR);

    // 前臂、前爪和方向盘一同轻摆，握持位置始终连在一起。
    const steering = xiaokuiSteering(t);
    push();translate(763, 854);rotate(steering * .55);translate(-763, -854);
    // 远侧短前臂自然搭向方向盘。
    path([
      ['M', 746, 768], ['C', 761, 774, 770, 792, 778, 803],
      ['C', 787, 806, 797, 812, 798, 824],
      ['C', 797, 841, 787, 854, 778, 861],
      ['C', 764, 864, 754, 851, 756, 837],
      ['C', 762, 815, 750, 804, 746, 768]
    ], FUR);

    // 小块灰色前臂止于白爪前，与灰色腰侧分开。
    path([
      ['M', 649, 811], ['C', 658, 814, 670, 819, 681, 823],
      ['C', 676, 832, 674, 841, 677, 850],
      ['C', 660, 848, 648, 839, 646, 827],
      ['C', 645, 821, 646, 816, 649, 811]
    ], FUR);
    path([
      ['M', 649, 839], ['C', 656, 848, 667, 854, 680, 856],
      ['C', 689, 856, 700, 851, 708, 844]
    ], null, '#E8E4DF', 1.8);

    // 方向盘位于两只白爪后方。
    push();
    translate(763, 854);
    rotate(-0.20);
    noFill(); stroke(DEEP_BLUE); strokeWeight(17);
    ellipse(0, 0, 96, 68);
    stroke(BLUE); strokeWeight(12);
    ellipse(0, -3, 96, 68);
    // 轮辐在椭圆轮圈内转动，缩小后也能看清轻微修正方向的动作。
    push();translate(0, -3);scale(1, .7);rotate(steering * 1.8);
    strokeWeight(8);
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*Math.PI*2/3;
      line(0, 0, Math.cos(a)*40, Math.sin(a)*40);
    }
    noStroke();fill(BLUE);circle(0, 0, 17);pop();
    pop();
    path([
      ['M', 692, 822], ['C', 704, 817, 719, 820, 727, 831],
      ['C', 735, 841, 730, 854, 719, 861],
      ['C', 708, 869, 690, 868, 679, 861],
      ['C', 670, 852, 675, 832, 692, 822]
    ], WHITE);
    path([
      ['M', 785, 803], ['C', 799, 799, 812, 805, 816, 818],
      ['C', 821, 831, 812, 841, 800, 843],
      ['C', 787, 845, 774, 838, 775, 826],
      ['C', 778, 818, 776, 808, 785, 803]
    ], WHITE);
    pop();

    // 头部与不对称花纹一起轻微转动。
    push();
    translate(670, 776);
    rotate(Math.sin(t * 0.72) * 0.007);
    translate(-670, -776);
    path([
      ['M', 583, 656], ['C', 576, 637, 576, 609, 590, 595],
      ['C', 599, 589, 626, 607, 641, 622],
      ['C', 662, 614, 684, 613, 706, 620],
      ['C', 720, 607, 739, 594, 750, 594],
      ['C', 760, 603, 761, 636, 756, 656],
      ['C', 772, 675, 780, 695, 780, 714],
      ['C', 780, 745, 765, 764, 742, 776],
      ['C', 706, 792, 651, 792, 609, 778],
      ['C', 577, 767, 561, 747, 560, 725],
      ['C', 558, 701, 568, 676, 583, 656]
    ], FUR);
    path([
      ['M', 589, 651], ['C', 585, 635, 587, 617, 594, 608],
      ['C', 606, 610, 617, 619, 627, 630],
      ['C', 612, 635, 600, 643, 589, 651]
    ], INNER_EAR);
    path([
      ['M', 718, 627], ['C', 727, 616, 739, 607, 747, 606],
      ['C', 753, 617, 754, 632, 750, 646],
      ['C', 741, 638, 728, 631, 718, 627]
    ], INNER_EAR);
    path([
      ['M', 560, 725], ['C', 580, 742, 603, 751, 629, 752],
      ['C', 649, 753, 665, 746, 674, 733],
      ['C', 687, 718, 680, 701, 675, 686],
      ['C', 669, 675, 678, 651, 682, 639],
      ['C', 690, 659, 696, 678, 705, 693],
      ['C', 714, 709, 720, 724, 733, 732],
      ['C', 746, 740, 761, 742, 775, 738],
      ['C', 765, 764, 739, 780, 710, 784],
      ['C', 678, 792, 641, 786, 609, 778],
      ['C', 581, 768, 562, 748, 560, 725]
    ], WHITE);

    const cycle = ((t % 7.2) + 7.2) % 7.2;
    const blink = Math.max(0, 1 - Math.abs(cycle - 4.3) / 0.14);
    noStroke(); fill(INK);
    ellipse(663, 715, 30, 31 * (1 - blink) + 3 * blink);
    ellipse(744, 710, 26, 29 * (1 - blink) + 3 * blink);
    path([
      ['M', 702, 728], ['C', 707, 725, 716, 725, 720, 730],
      ['C', 722, 735, 716, 741, 712, 742],
      ['C', 707, 741, 699, 734, 702, 728]
    ], INK);
    noStroke(); fill(FUR); ellipse(726, 747, 21, 19);
    const opening = Math.max(0, Math.min(1, meow));
    if(opening > .01){
      // 嘴、舌尖与下巴围绕上唇一起收小，保留原来的开合节奏。
      push();translate(708, 747);scale(.75);translate(-708, -747);
      const mouthWidth = 10 + 28 * opening, mouthHeight = 3 + 39 * opening;
      const mouthTop = 747, mouthBottom = mouthTop + mouthHeight;
      path([
        ['M', 686, 770], ['C', 685, 777, 688, mouthBottom + 8, 706, mouthBottom + 9],
        ['C', 724, mouthBottom + 10, 735, 781, 732, 769],
        ['C', 720, 765, 698, 765, 686, 770]
      ], WHITE);
      path([
        ['M', 708 - mouthWidth / 2, mouthTop + 5],
        ['C', 708 - mouthWidth / 2, mouthTop - 3, 708 + mouthWidth / 2, mouthTop - 3, 708 + mouthWidth / 2, mouthTop + 5],
        ['C', 708 + mouthWidth / 2, mouthBottom - 5, 718, mouthBottom, 708, mouthBottom],
        ['C', 698, mouthBottom, 708 - mouthWidth / 2, mouthBottom - 5, 708 - mouthWidth / 2, mouthTop + 5]
      ], INK);
      noStroke();fill('#B9DDFF');
      ellipse(708, mouthBottom - 7 * opening, 21 * opening, 9 * opening);
      pop();
    }else{
      path([
        ['M', 712, 740], ['C', 716, 745, 715, 751, 711, 754],
        ['C', 708, 757, 704, 757, 701, 755]
      ], null, INK, 4.3);
    }
    pop();
  }

  // 小排气管藏在后保险杠下，尾气使用同一出口坐标。
  push();strokeCap(ROUND);strokeWeight(6);stroke('#8AC9FF');
  line(XIAOKUI_EXHAUST_PORT.x+22, XIAOKUI_EXHAUST_PORT.y,
    XIAOKUI_EXHAUST_PORT.x, XIAOKUI_EXHAUST_PORT.y);
  noStroke();fill('#D9F4FF');
  ellipse(XIAOKUI_EXHAUST_PORT.x, XIAOKUI_EXHAUST_PORT.y, 4, 7);
  pop();

  push();
  scale(0.52);
  translate(-710, -1174);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  // 内饰与座椅位于小葵和车门后方。
  path([
    ['M', 504, 837], ['C', 528, 810, 568, 810, 605, 818],
    ['L', 805, 838], ['L', 849, 888], ['L', 526, 904],
    ['C', 510, 886, 502, 862, 504, 837]
  ], DEEP_BLUE);
  path([
    ['M', 547, 790], ['C', 565, 786, 582, 800, 588, 821],
    ['L', 598, 891], ['L', 544, 891],
    ['C', 529, 868, 519, 831, 524, 809],
    ['C', 526, 797, 535, 791, 547, 790]
  ], '#0765ED');
  path([
    ['M', 541, 793], ['C', 564, 790, 575, 808, 576, 832],
    ['L', 581, 883], ['L', 537, 880],
    ['C', 524, 866, 518, 837, 521, 816],
    ['C', 523, 802, 530, 794, 541, 793]
  ], BLUE);
  cat();

  // 淡蓝玻璃、白色窗框与一道清晰反光。
  path([
    ['M', 843, 881], ['L', 810, 776],
    ['C', 804, 755, 809, 741, 827, 738],
    ['C', 845, 735, 857, 742, 869, 757],
    ['L', 934, 854], ['L', 862, 881]
  ], WHITE);
  path([
    ['M', 864, 855], ['L', 828, 773],
    ['C', 821, 756, 827, 746, 840, 745],
    ['C', 851, 744, 858, 752, 866, 763],
    ['L', 922, 850], ['L', 882, 859]
  ], '#51CBF5');
  path([
    ['M', 859, 758], ['C', 877, 783, 892, 811, 902, 840]
  ], null, WHITE, 7.5);

  // 轮拱衬底在车身下方，轮胎底部对齐本地 y=0。
  path([
    ['M', 282, 1040], ['L', 334, 997], ['L', 512, 986],
    ['L', 542, 1099], ['L', 865, 1099], ['L', 895, 987],
    ['L', 1073, 987], ['L', 1123, 1076], ['L', 1063, 1104],
    ['L', 354, 1104], ['L', 288, 1084]
  ], DEEP_BLUE);
  wheel(426);
  wheel(976);

  // 白色车身为轮胎留出弧形缺口，车门遮住坐姿下半身。
  path([
    ['M', 367, 869], ['C', 406, 843, 469, 834, 511, 828],
    ['C', 505, 850, 511, 862, 534, 866], ['L', 838, 869],
    ['C', 847, 856, 860, 850, 883, 850],
    ['C', 958, 846, 1034, 864, 1090, 892],
    ['C', 1138, 916, 1157, 958, 1166, 1015],
    ['C', 1174, 1055, 1166, 1087, 1128, 1094],
    ['C', 1105, 1098, 1090, 1098, 1087, 1072],
    ['C', 1079, 1010, 1037, 968, 976, 968],
    ['C', 916, 968, 875, 1009, 867, 1073],
    ['C', 865, 1096, 857, 1102, 838, 1102],
    ['L', 559, 1102], ['C', 541, 1102, 536, 1099, 533, 1074],
    ['C', 525, 1012, 484, 968, 426, 968],
    ['C', 368, 968, 326, 1008, 317, 1068],
    ['C', 314, 1084, 307, 1089, 294, 1086],
    ['C', 269, 1086, 255, 1067, 255, 1038],
    ['C', 250, 1000, 262, 949, 286, 921],
    ['C', 306, 898, 336, 881, 367, 869]
  ], WHITE);

  // 细蓝色边线让缩小后的白色车身仍然清楚。
  path([
    ['M', 368, 868], ['C', 407, 857, 450, 853, 488, 854]
  ], null, EDGE, 4.8);
  path([
    ['M', 309, 1034], ['C', 327, 973, 373, 942, 426, 942],
    ['C', 492, 942, 538, 986, 552, 1068]
  ], null, EDGE, 5);
  path([
    ['M', 326, 998], ['C', 350, 960, 386, 942, 426, 942],
    ['C', 462, 942, 499, 960, 522, 998]
  ], null, EDGE, 11);
  path([
    ['M', 848, 1066], ['C', 859, 988, 908, 942, 975, 942],
    ['C', 1039, 942, 1088, 988, 1102, 1061]
  ], null, EDGE, 5);
  path([
    ['M', 876, 992], ['C', 901, 959, 938, 942, 975, 942],
    ['C', 1013, 942, 1050, 960, 1074, 992]
  ], null, EDGE, 11);
  path([
    ['M', 558, 883], ['C', 540, 917, 539, 954, 550, 994],
    ['C', 560, 1034, 581, 1064, 621, 1068],
    ['C', 670, 1074, 759, 1073, 798, 1068],
    ['C', 818, 1066, 826, 1059, 830, 1037],
    ['C', 838, 990, 840, 930, 841, 886]
  ], null, EDGE, 4.5);
  path([
    ['M', 559, 875], ['L', 835, 875]
  ], null, '#A7D8FF', 10);
  path([
    ['M', 874, 876], ['C', 946, 876, 1021, 886, 1074, 909]
  ], null, EDGE, 4.1);

  // 车门把手、尾灯、椭圆前灯与圆润保险杠。
  noStroke();
  fill('#086BFC'); ellipse(601, 921, 60, 27);
  fill('#8CCEFF'); ellipse(601, 917, 55, 22);
  fill('#B9E8FF'); ellipse(592, 913, 24, 7);
  push(); translate(277, 954); rotate(0.39);
  fill('#FF7451'); ellipse(0, 0, 25, 69);
  fill('#FF9472'); ellipse(-5, -8, 5, 38);
  pop();
  push(); translate(1125, 942); rotate(-0.18);
  fill('#176FFE'); ellipse(0, 0, 57, 94);
  fill('#A0D1FF'); ellipse(5, -1, 43, 83);
  fill(WHITE); ellipse(8, -2, 29, 66);
  pop();
  path([
    ['M', 252, 1013], ['C', 242, 1016, 236, 1028, 237, 1045],
    ['C', 237, 1061, 247, 1067, 262, 1068],
    ['L', 282, 1070], ['C', 294, 1070, 298, 1061, 298, 1049],
    ['C', 298, 1035, 292, 1024, 281, 1021]
  ], '#8AC9FF');
  path([
    ['M', 1136, 1033], ['C', 1124, 1036, 1118, 1048, 1119, 1063],
    ['C', 1120, 1077, 1130, 1081, 1144, 1079],
    ['L', 1163, 1075], ['C', 1178, 1071, 1184, 1061, 1183, 1049],
    ['C', 1182, 1036, 1174, 1026, 1163, 1028]
  ], '#8AC9FF');
  pop();
}


    return drawXiaokuiCar;
  }
  // 驾车片保持原车比例，整体从竖版道路重取景到横版；尾口与车身共用位置。
  const carPoseAt=t=>({x:450,y:266+Math.sin(t*9)*.7+Math.sin(t*3.2)*.45});
  const puffOriginAt=t=>{const p=carPoseAt(t);return {x:p.x-253*.64,y:p.y-47*.64};};
  const cameraTravelAt=t=>360*t;
  // 夕阳原片的接近阶段：2–14.5 秒沿水平航线减速，到达后固定同一姿态。
  const planeUnit=41.04*.34;
  function trailPoseAt(t){
    const q=clamp((t-2)/12.5),approach=1-(1-q)**2;
    return {x:-planeUnit*1.41+(450+planeUnit*1.41)*approach,y:264,pitch:0,unit:planeUnit};
  }
  function trailViewAt(t){
    const pose=trailPoseAt(t),approach=1-(1-clamp((t-2)/12.5))**2;
    return {x:174+282*approach-2*pose.x,y:170-2*pose.y,scale:2};
  }
  // 下列四层逐点来自 drawAirplane：机身、远翼、近翼、机窗。
  const planePaths=[
    ['#505969','M-1.5 -.04L-1.68 -.64L-1.48 -.61L-1.13 -.15L-.34 -.08L-.65 -.44L-.39 -.42L.18 -.12Q1.04 -.16 1.4 .08Q1.46 .25 .87 .26L-.1 .22L-.67 .52L-.89 .5L-.57 .19L-1.5 .08Z'],
    ['#687181','M-.34 -.08L-.65 -.44L-.39 -.42L.18 -.12Z'],
    ['#3e4859','M.22 .13L-.67 .52L-.89 .5L-.57 .19Z'],
    ['#303b4c','M.63 -.1L.89 -.035L1.06 .055L.77 .015Z']
  ];
  global.MotionEmission=Object.freeze({puffsAt,segmentsAt,puffOriginAt,cameraTravelAt,carPoseAt,trailPoseAt,trailViewAt});
  let serial=0;
  global.MotionFactories['emission-drift']=(root)=>{
    const id='motion-emission-'+ ++serial;
    root.dataset.art='original';
    const ground=Array.from({length:69},(_,i)=>{const x=i*10;return (i?'L':'M')+x+' '+(272-6*Math.sin(Math.PI*(x+20)/900));}).join('')+'V360H0Z';
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><defs>'+
      '<radialGradient id="'+id+'" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1.3"><stop stop-color="#f1faff"/><stop offset=".45" stop-color="#d5eeff" stop-opacity=".55"/><stop offset="1" stop-color="#d5eeff" stop-opacity="0"/></radialGradient></defs>'+
      '<rect width="640" height="360" fill="#0e3cf1"/><path d="'+ground+'" fill="#1340e7"/>'+
      '<g data-part="road" stroke="#4272f4" stroke-width="2.2">'+Array.from({length:7},(_,i)=>'<path data-mark="'+i+'" d="M'+(i*160-180)+' 314h38m54 44h21"/>').join('')+'</g>'+
      '<g data-part="puffs">'+Array.from({length:4},()=>'<ellipse cx="0" cy="0" rx="1.3" ry=".9" fill="url(#'+id+')"/>').join('')+'</g>'+
      '<g data-part="emitter" data-source="drawXiaokuiCar"></g></svg>';
    const nodes=[...root.querySelectorAll('[data-part="puffs"] ellipse')],car=root.querySelector('[data-part="emitter"]'),paint=carDrawing(car),road=root.querySelector('[data-part="road"]');
    const draw=ms=>{
      const t=Math.max(0,Math.min(3.6,(ms-150)/1000)),pose=carPoseAt(t);
      set(car,{transform:'translate('+pose.x+' '+pose.y+') scale(.64)'});paint(t,360*t/.64);
      set(road,{transform:'translate('+(-((360*t)%160))+' 0)'});
      const puffs=puffsAt(t,puffOriginAt,cameraTravelAt,{end:2.9});
      nodes.forEach((node,i)=>{
        const puff=puffs[i];
        set(node,puff?{'data-index':puff.index,transform:'translate('+puff.x+' '+puff.y+') scale('+puff.radius+')',opacity:puff.opacity}
          :{'data-index':-1,transform:'translate(0 0) scale(0)',opacity:0});
      });
    };
    draw(0);return draw;
  };
  global.MotionFactories['advected-trail']=(root)=>{
    const id='motion-trail-'+ ++serial;
    root.dataset.art='original';
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+
      [[0,'#f69b18'],[.36,'#e88d30'],[.67,'#ba6c50'],[.88,'#785b71'],[1,'#57576e']].map(([p,c])=>'<stop offset="'+p+'" stop-color="'+c+'"/>').join('')+'</linearGradient></defs><rect width="640" height="360" fill="url(#'+id+')"/>'+
      '<g data-part="view"><g data-part="tail" fill="none" stroke="#fff4e1" stroke-linecap="round">'+Array.from({length:162},()=>'<g data-segment><line data-layer="haze"/><line data-layer="core"/></g>').join('')+'</g>'+
      '<g data-part="emitter" data-source="drawAirplane">'+planePaths.map(([fill,d])=>'<path fill="'+fill+'" d="'+d+'"/>').join('')+'</g></g></svg>';
    const emitter=root.querySelector('[data-part="emitter"]'),view=root.querySelector('[data-part="view"]');
    const nodes=[...root.querySelectorAll('[data-segment]')].map(node=>[node.firstElementChild,node.lastElementChild]);
    const draw=ms=>{
      const t=2+24.5*clamp((ms-150)/6000),pose=trailPoseAt(t),camera=trailViewAt(t);
      set(view,{transform:'translate('+camera.x+' '+camera.y+') scale('+camera.scale+')'});
      set(emitter,{transform:'translate('+pose.x+' '+pose.y+') rotate('+(pose.pitch*180/Math.PI)+') scale('+pose.unit+')'});
      const segments=segmentsAt(t,trailPoseAt,{start:2,end:14.5,scale:4/3});
      nodes.forEach(([haze,core],i)=>{
        const segment=segments[i];
        if(!segment){const empty={x1:0,y1:0,x2:0,y2:0,'stroke-width':0,'stroke-opacity':0};set(haze,empty);set(core,empty);return;}
        const coordinates={x1:segment.a.x,y1:segment.a.y,x2:segment.b.x,y2:segment.b.y};
        set(haze,{...coordinates,'stroke-width':segment.width*3,'stroke-opacity':segment.alpha*.15});
        set(core,{...coordinates,'stroke-width':segment.width,'stroke-opacity':segment.alpha});
      });
    };
    draw(0);return draw;
  };
})(globalThis);
