/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.drive=function(S,opt,def){

 with(S.env){
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

'use strict';
// 时间是唯一运动来源；暂停、跳转和低帧率不会累积运动误差。
const W=900,H=1200,DURATION=14,BLUE='#0e3cf1',WHITE='#ffffff';
const BALLOON_COUNT=35;
const CAR_SCALE=.64;
const COLORS=['#ff6862','#ffad46','#ffe365','#68d694','#67c9ed','#758be9','#ba91df'];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const ease=(t,a,b)=>smooth((t-a)/(b-a));
const pt=(x,y)=>({x,y});
const blend=(a,b,t)=>pt(mix(a.x,b.x,t),mix(a.y,b.y,t));
const ground=x=>1090-6*Math.sin(Math.PI*x/W);
// 先跟车；气球清空后镜头逐渐落后，汽车仍保持同一实际速度。
const DRIVE_SPEED=360,DEPART_SCREEN_SPEED=210,START_X=470,CAMERA_RELEASE_SECONDS=.7;
function driveDistance(t){return DRIVE_SPEED*t}
function cameraLag(t){
  const elapsed=Math.max(0,t-DEPART_AT),u=clamp(elapsed/CAMERA_RELEASE_SECONDS);
  // 平滑增加车在画面中的速度，积分后使位置与速度都连续。
  return DEPART_SCREEN_SPEED*(elapsed<CAMERA_RELEASE_SECONDS
    ?CAMERA_RELEASE_SECONDS*(u*u*u-.5*u*u*u*u):elapsed-CAMERA_RELEASE_SECONDS/2);
}
function carX(t){return START_X+cameraLag(t)}
function cameraTravel(t){return driveDistance(t)-cameraLag(t)}
let clock=0,paused=false,playbackRate=1,draggingProgress=false;
let seek,playButton,timeLabel,speedButton,soundButton,sceneSound,lastUI=-1;








function clockText(value){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.floor(value%60)).padStart(2,'0')}`}

function vehicleBob(t){return Math.sin(t*9)*.7+Math.sin(t*3.2)*.45}
function vehiclePose(t){const x=carX(t),bob=vehicleBob(t);return {x,y:ground(x)+bob,bob,angle:0}}
function trackedTether(t){return pt(START_X-152*CAR_SCALE,ground(START_X)+vehicleBob(t)-177*CAR_SCALE)}
function world(t,p){const car=vehiclePose(t);return pt(car.x+p.x*CAR_SCALE,car.y+p.y*CAR_SCALE)}
function tether(t){return world(t,pt(-152,-177))}
function release(i){return 1.1+Math.floor(i/7)*1.5+(i%7)*.105}
const variation=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const balloonSize=i=>.76+variation(i+41)*.45;
function attachedTilt(i,t){return -.38+(variation(i+19)-.5)*.22+Math.sin(t*1.3+i)*.055}
function balloonTilt(i,t){
  const r=release(i);
  if(t<=r)return attachedTilt(i,t);
  const free=-.13+Math.sin(t*1.15+i)*.13;
  return mix(attachedTilt(i,r),free,ease(t,r,r+1.6));
}
function attached(i,t){
  const anchor=trackedTether(t),r=Math.sqrt((i+.6)/BALLOON_COUNT);
  const a=i*2.39996+(variation(i+7)-.5)*.65;
  // 整簇被迎面风向左带起，绳子斜向后方；每只仍有独立轻摆。
  return pt(anchor.x-116+Math.cos(a)*94*r+(variation(i+51)-.5)*12+Math.sin(t*1.7)*6+Math.sin(t*(1.2+variation(i))+i)*3,
    anchor.y-285+Math.sin(a)*139*r+(variation(i+81)-.5)*20+Math.sin(t*.95+i*1.7)*4);
}
function attachedVelocity(i,t){
  const dt=.0001,before=attached(i,t-dt),after=attached(i,t+dt);
  return pt((after.x-before.x)/(2*dt),(after.y-before.y)/(2*dt));
}
function trackedBalloonState(i,t){
  const r=release(i);
  if(t<=r)return {p:attached(i,t),age:0,flight:0};
  const age=t-r,start=attached(i,r),velocity=attachedVelocity(i,r);
  // 向后漂移的速度换算到跟车镜头中，车与气球的相对运动保持连贯。
  const wind=-(DRIVE_SPEED*.6+variation(i+92)*32),rise=-68-variation(i+123)*23;
  // 松开时保留原速度，再受风与浮力影响向左上飘，位置和速度都不跳变。
  const dragX=.55,dragY=.42;
  const dx=wind*age+(velocity.x-wind)*dragX*(1-Math.exp(-age/dragX));
  const dy=rise*age+(velocity.y-rise)*dragY*(1-Math.exp(-age/dragY));
  return {p:pt(start.x+dx,start.y+dy),age,flight:1-Math.exp(-age/.8)};
}
function trackedBalloonString(i,t){
  const s=trackedBalloonState(i,t),size=balloonSize(i),tilt=balloonTilt(i,t),r=release(i);
  const tip=pt(s.p.x-Math.sin(tilt)*34*size,s.p.y+Math.cos(tilt)*34*size);
  const freeEnd=pt(s.p.x+22+Math.sin(t*1.4+i)*12,s.p.y+(100+variation(i+67)*28)*size);
  // 绳尾从车尾松开后自然垂落，不再跟着车走，也不随升空凭空消失。
  const end=t<=r?trackedTether(t):blend(trackedTether(r),freeEnd,ease(t,r,r+.9));
  return {tip,end,opacity:1};
}
// 球体用保守外接半径，绳子用曲线控制点边界，连描边也完全离开才放车走。
function trackedBalloonRightEdge(i,t){
  const {p}=trackedBalloonState(i,t),string=trackedBalloonString(i,t);
  return Math.max(p.x+40*balloonSize(i),string.tip.x+10,string.end.x)+2;
}
function findDepartureTime(){
  const lastRelease=release(BALLOON_COUNT-1);
  for(let frame=0;frame<Math.ceil((DURATION-lastRelease)*120);frame++){
    const t=lastRelease+frame/120;
    if(Array.from({length:BALLOON_COUNT},(_,i)=>trackedBalloonRightEdge(i,t)).every(x=>x<-8))return t;
  }
  return DURATION;
}
const DEPART_AT=findDepartureTime();
const MEOW_AT=release(BALLOON_COUNT-1),MEOW_DURATION=0.572;
function meowMouth(t){
  return ease(t,MEOW_AT,MEOW_AT+.07)*(1-ease(t,MEOW_AT+MEOW_DURATION-.18,MEOW_AT+MEOW_DURATION));
}
function balloonState(i,t){
  const state=trackedBalloonState(i,t);
  return {...state,p:pt(state.p.x+cameraLag(t),state.p.y)};
}
function balloonString(i,t){
  const string=trackedBalloonString(i,t),dx=cameraLag(t);
  return {...string,tip:pt(string.tip.x+dx,string.tip.y),end:pt(string.end.x+dx,string.end.y)};
}
function exhaustPuffs(t){
  const interval=.19,lifetime=.72,puffs=[];
  for(let index=Math.max(0,Math.ceil((t-lifetime)/interval));index<=Math.floor(t/interval);index++){
    const born=index*interval,age=t-born,origin=world(born,XIAOKUI_EXHAUST_PORT);
    if(origin.x>W+12)continue;
    // 出口处继承车速，随后被风留在身后；退镜后也沿原来的路径飘散。
    const drift=-24*age+(DRIVE_SPEED+24)*.12*(1-Math.exp(-age/.12));
    puffs.push({
      x:origin.x+cameraTravel(born)-cameraTravel(t)+drift,
      y:origin.y-18*age-Math.sin(index*1.7)*5*age,
      radius:(4+23*ease(age,0,lifetime))*CAR_SCALE,
      opacity:.42*ease(age,0,.045)*(1-ease(age,.10,lifetime))
    });
  }
  return puffs;
}
function drawExhaust(t){
  push();noStroke();
  for(const puff of exhaustPuffs(t)){
    fill(255);
    const radius=puff.radius;
    const haze=drawingContext.createRadialGradient(puff.x,puff.y,0,puff.x,puff.y,radius*1.3);
    haze.addColorStop(0,`rgba(241,250,255,${puff.opacity})`);
    haze.addColorStop(.45,`rgba(213,238,255,${puff.opacity*.55})`);
    haze.addColorStop(1,'rgba(213,238,255,0)');
    drawingContext.fillStyle=haze;
    ellipse(puff.x,puff.y,radius*2.6,radius*1.8);
  }
  pop();
}
function renderScene(t,part){
 const show=id=>!part||part===id;
  if(show('road')){background(BLUE);
  noStroke();fill('#1340e7');beginShape();vertex(-20,H);
  for(let x=-20;x<=W+20;x+=10)vertex(x,ground(x)+1);
  vertex(W+20,H);endShape(CLOSE);
  // 路面标记随镜头向后退，给出明确车速；不增加额外风景。
  noFill();stroke('#4272f4');strokeWeight(2.2);
  const offset=((cameraTravel(t)%160)+160)%160;
  for(let k=-1;k<8;k++){
    const x=k*160-offset;line(x,1132,x+38,1132);
    line(x+92,1176,x+113,1176);
  }
  }
  if(show('exhaust'))drawExhaust(t);
  if(show('balloons')){drawingContext.save();
  for(let i=BALLOON_COUNT-1;i>=0;i--)drawBalloon(i,t,'strings');
  for(let i=BALLOON_COUNT-1;i>=0;i--)drawBalloon(i,t,'body');
  if(t<release(BALLOON_COUNT-1)){
    const anchor=tether(t);noStroke();fill('#ffe365');circle(anchor.x,anchor.y,7);
  }
  drawingContext.restore();}
  if(show('car')){const car=vehiclePose(t);push();translate(car.x,car.y);scale(CAR_SCALE);
  // 猫与车统一缩小，绳锚点同步；轮胎按缩小后的半径计算滚动。
  drawXiaokuiCar(t,driveDistance(t)/CAR_SCALE,meowMouth(t));pop();}
}
function drawBalloon(i,t,layer='both'){
  const s=balloonState(i,t),p=s.p,color=COLORS[i%7];
  if(layer!=='body'){
    const string=balloonString(i,t),from=string.end,to=string.tip;
    noFill();stroke(255,255,255,178);strokeWeight(.95);
    bezier(from.x,from.y,from.x-20,from.y+(to.y-from.y)*.36,to.x+10,to.y-(to.y-from.y)*.27,to.x,to.y);
  }
  if(layer==='strings')return;
  // 始终保留完整球形、结口和反光，只随风离开画面。
  const size=balloonSize(i),tilt=balloonTilt(i,t),rx=26*size,ry=34*size;
  push();translate(p.x,p.y);rotate(tilt);
  noStroke();fill(color);
  const g=drawingContext.createRadialGradient(-rx*.35,-ry*.48,1,0,0,ry*1.25);
  g.addColorStop(0,tintHex(color,.16));g.addColorStop(.65,color);g.addColorStop(1,tintHex(color,-.04));
  drawingContext.fillStyle=g;
  beginShape();for(let j=0;j<96;j++){
    const q=j/96*Math.PI*2;vertex(Math.cos(q)*rx*(1-.14*Math.sin(q)),Math.sin(q)*ry);
  }endShape(CLOSE);
  fill(color);triangle(0,ry-1,-3*size,ry+3*size,4*size,ry+3*size);
  push();translate(-rx*.35,-ry*.53);rotate(-.5);
  fill(255,255,255,155);ellipse(0,0,6*size,12*size);pop();pop();
}
function tintHex(hex,k){
  const a=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));
  return '#'+a.map(v=>Math.round(k>=0?mix(v,255,k):v*(1+k)).toString(16).padStart(2,'0')).join('');
}

 return {draw(t,mode,part){
  if(mode==='full'){renderScene(t,part==='art'?null:part);return;}
  if(mode==='road'){background(BLUE);noStroke();fill('#1340e7');beginShape();vertex(-20,H);for(let x=-20;x<=W+20;x+=10)vertex(x,ground(x)+1);vertex(W+20,H);endShape(CLOSE);noFill();stroke('#4272f4');strokeWeight(2.2);const off=((cameraTravel(t)%160)+160)%160;for(let k=-1;k<8;k++){const x=k*160-off;line(x,1132,x+38,1132);line(x+92,1176,x+113,1176);}return;}
  // 离场动作保留原蓝色背景和路面标记，让镜头减速有地面参照。
  if(mode==='departure'){renderScene(t,'road');renderScene(t,'car');return;}
  if(mode==='balloons'){for(let i=BALLOON_COUNT-1;i>=0;i--)drawBalloon(i,t);return;}
  const i=opt.color||0,p=balloonState(i,0).p;push();translate(W/2-p.x,H/2-p.y);scale(1);drawBalloon(i,0);pop();
 },inspect:t=>({car:vehiclePose(t),distance:driveDistance(t),camera:cameraTravel(t),departure:DEPART_AT,balloon:balloonState(0,t)})};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("camera-lag-departure",{"family": "drive", "mode": "departure", "start": 9, "width": 900, "height": 1200});
WiseSceneRuntime.register("drive-balloon-illustration",{"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 0, "variants": {"0": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 0}, "1": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 1}, "2": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 2}, "3": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 3}, "4": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 4}, "5": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 5}, "6": {"family": "drive", "mode": "balloon", "start": 0, "width": 900, "height": 1200, "color": 6}}});
WiseSceneRuntime.register("drive-road-illustration",{"family": "drive", "mode": "road", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("balloon-drive-journey",{"family": "drive", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "road", "name": "道路后退", "start": 0, "end": 14000, "time": "0—14秒", "detail": "蓝色路面与短标记按镜头走过的路程向后移动。", "actions": ["drive-road-illustration"]}, {"id": "exhaust", "name": "尾气产生与飘散", "start": 0, "end": 14000, "time": "0—14秒", "detail": "尾气从车尾产生后脱离，随后在历史位置扩散。", "actions": ["emission-drift"]}, {"id": "balloons", "name": "七色气球依次松绳", "start": 0, "end": 14000, "time": "0—14秒", "detail": "气球与绳尾先跟车，逐只松开后沿各自风向飘离，七色球形和反光保留。", "actions": ["drive-balloon-release", "drive-balloon-illustration"]}, {"id": "car", "name": "驾驶、轮转与离场", "start": 0, "end": 14000, "time": "0—14秒", "detail": "前爪和方向盘共同摆动，车轮转角对应路程；气球清空后镜头减速，汽车保持速度驶出。", "actions": ["rolling-distance", "camera-lag-departure", "drive-car-illustration"]}], "layers": ["road", "exhaust", "balloons", "car"]});
