// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 原工程所选节点的绘制；当前时间直接求值，无全局时间线。
import {V} from './drawing.js';
import {Space3D} from './space3d.js';
import {SilkFlow} from './silk-flow.js';
import {LineGrowth} from './line-growth.js';
import {q,lerp,pose,opacity,enter} from './frame.js';
const {C,sm,win}=V;
// 原线条伸展末端的短亮纹、停顿和火花，跟随当前几何，不另走时间线。
function pathEffect(K,host,path){const length=path.getTotalLength();return LineGrowth.svgEffect(host,()=>({length,at:p=>{const q=path.getPointAtLength(p*length);return[q.x,q.y]}}),path);}
function arrowEffect(host,arrow){return LineGrowth.svgEffect(arrow,()=>{const [x,y,x2,y2]=arrow._ends;return{length:Math.hypot(x2-x,y2-y),at:p=>[lerp(x,x2,p),lerp(y,y2,p)]}},arrow);}
export const BITS=[[1,1,0,1,1,0,1,1],[1,1,0,1,1,0,1,0],[0,0,1,0,0,1,0,1]];

export function gauge(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      const G = { x: 540, y: 860, r: 330 };
      const ang = (v) => Math.PI + ((v + 1) / 2) * Math.PI;
      const gauge = K.s("g", {}, svg);
      const track = K.path(gauge, K.arcD(G.x, G.y, G.r, Math.PI, 2 * Math.PI), "ln dim", { "stroke-width": 18 });
      const fill = K.s("path", { fill: "none", stroke: "#e8b84a", "stroke-width": 18, "stroke-linecap": "round", class: "glow" }, gauge);
      const ticks = [];
      for (let i = 0; i <= 20; i++) {
        const v = -1 + i / 10, a = ang(v), big = i % 5 === 0;
        const r0 = G.r - 34, r1 = G.r - (big ? 66 : 48);
        ticks.push(K.s("line", { x1: G.x + r0 * Math.cos(a), y1: G.y + r0 * Math.sin(a), x2: G.x + r1 * Math.cos(a), y2: G.y + r1 * Math.sin(a), stroke: big ? "#f2f2f0" : "rgba(242,242,240,0.35)", "stroke-width": big ? 4 : 2 }, gauge));
        if (big) {
          const d = K.h("div", "s01-tk", v === 0 ? "0" : v.toFixed(1).replace(".0", ""), $("s01-ticks"));
          set(d, { left: G.x + (G.r + 44) * Math.cos(a), top: G.y + (G.r + 44) * Math.sin(a) - 22 });
        }
      }
      const needle = K.arrow(gauge, { color: "#ffe14d", w: 8, head: 30 });
      const hub = K.s("circle", { cx: G.x, cy: G.y, r: 16, fill: "#ffe14d", class: "glow" }, gauge);
      const NV = { v: -1 };
      function setGauge(v) {
        const a = ang(v);
        K.setArrow(needle, G.x, G.y, G.x + (G.r - 80) * Math.cos(a), G.y + (G.r - 80) * Math.sin(a));
        fill.setAttribute("d", K.arcD(G.x, G.y, G.r, Math.PI, a + 0.0001));
        $("s01-num").textContent = v.toFixed(2);
      }
      setGauge(-1);
const trackFx=pathEffect(K,gauge,track);


return t=>{
const a=q(t,T.test+.4,.5,'p1out');opacity([gauge,$('s01-ticks'),$('s01-num'),$('s01-cos')],a);
track.style.strokeDasharray='1';track.style.strokeDashoffset=1-LineGrowth.progress((t-T.test-.4)/.8);trackFx(t-T.test-.4,.8);
setGauge(lerp(-1,.74,q(t,T.sim,T.val-T.sim+.5,'p3io')));
const tap=t<T.val+.48?q(t,T.val+.3,.18,'p2out'):1-q(t,T.val+.48,.18,'p2in');
const color=q(t,T.val+.3,.3,'p1out');$('s01-num').style.color=`rgb(${[255,216,115].map((v,k)=>Math.round(lerp(v,[255,225,77][k],color))).join(',')})`;
pose($('s01-num'),{scale:1+.12*tap});
};
}

export function angle(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      const O = [300, 1040], L = 560, A1 = -0.6;
      const at = (a, l = L) => [O[0] + l * Math.cos(a), O[1] + l * Math.sin(a)];

      const grid = K.s("g", { opacity: 1 }, svg);
      // SILVER_GRID: identical geometry/material across the S01 -> S02 cut.
      {
        const left = 60, top = 480, step = 80, columns = 12, rows = 9;
        const right = left + columns * step, bottom = top + rows * step;
        const defs = K.s("defs", {}, grid), prefix = `${svg.id}-silver-grid`;
        const stops = [[0, "#aeb6c4", .56], [.22, "#e1e5ec", .78],
          [.42, "#ffffff", .94], [.64, "#bdc5d0", .66],
          [.82, "#f5f7fb", .88], [1, "#aeb6c4", .56]];
        for (const vertical of [false, true]) {
          const gradient = K.s("linearGradient", {
            id: `${prefix}-${vertical ? "v" : "h"}`, gradientUnits: "userSpaceOnUse",
            x1: left, y1: top, x2: vertical ? left : right, y2: vertical ? bottom : top,
          }, defs);
          stops.forEach(([offset, color, opacity]) => K.s("stop", {
            offset, "stop-color": color, "stop-opacity": opacity,
          }, gradient));
        }
        // Four symmetric hairlines, no solid base stroke or blurred halo.
        const strands = [[-.9, .4, .54], [-.3, .48, .82], [.3, .48, .82], [.9, .4, .54]];
        function gridLine(position, vertical) {
          const bundle = K.s("g", { "data-grid-direction": vertical ? "v" : "h",
            "data-grid-position": position }, grid);
          strands.forEach(([offset, width, opacity]) => K.s("line", {
            x1: vertical ? position + offset : left, y1: vertical ? top : position + offset,
            x2: vertical ? position + offset : right, y2: vertical ? bottom : position + offset,
            stroke: `url(#${prefix}-${vertical ? "v" : "h"})`,
            "stroke-width": width, "stroke-opacity": opacity, "stroke-linecap": "butt",
          }, bundle));
        }
        for (let i = 0; i <= columns; i++) gridLine(left + i * step, true);
        for (let i = 0; i <= rows; i++) gridLine(top + i * step, false);
      }
      // /SILVER_GRID
      const axX = K.line(grid, 120, O[1], 1000, O[1], "ln", { style: "stroke:rgba(196,196,195,0.73);stroke-width:2.5" });
      const axY = K.line(grid, O[0], 1160, O[0], 470, "ln", { style: "stroke:rgba(196,196,195,0.73);stroke-width:2.5" });
      const main = K.s("g", {}, svg);
      const v1 = K.arrow(main, { color: "#e8b84a", w: 7, head: 38, from: O, to: at(A1) });
      const v2 = K.arrow(main, { color: "#d6d9e0", w: 7, head: 38, glow: false });
      const origin = K.s("circle", { cx: O[0], cy: O[1], r: 9, fill: "#f2f2f0" }, main);

      // size bracket parallel to v1, direction arc from the x axis
      const nx = -Math.sin(A1), ny = Math.cos(A1);
      const b0 = [O[0] + nx * 46, O[1] + ny * 46], b1 = [at(A1)[0] + nx * 46, at(A1)[1] + ny * 46];
      const bracket = K.path(main, `M${b0[0] - nx * 14} ${b0[1] - ny * 14}L${b0[0]} ${b0[1]}L${b1[0]} ${b1[1]}L${b1[0] - nx * 14} ${b1[1] - ny * 14}`, "ln", { "stroke-width": 3 });
      set("#s02-size", { left: (b0[0] + b1[0]) / 2 + nx * 60 + 20, top: (b0[1] + b1[1]) / 2 + ny * 60 - 10 });
      const dirArc = K.path(main, K.arcD(O[0], O[1], 150, 0, A1), "ln gold", { "stroke-width": 4 });
      set("#s02-dir", { left: O[0] + 170, top: O[1] + 24 });

      const theta = K.s("path", { fill: "rgba(255,225,77,0.14)", stroke: "#ffe14d", "stroke-width": 4 }, main);
      const thetaT = K.s("text", { "font-size": 52, "font-style": "italic", "font-family": "Smiley Sans, sans-serif", fill: "#ffe14d" }, main);
      thetaT.textContent = "θ";
      const S = { a: -1.45, base: A1, x: O[0], y: O[1], l1: L, l2: L, frame: 0, v2grow: 0 };
      const readNumber = $("s02-read").querySelector(".num");
      function setVectors() {
        const point = (a, length) => [S.x + length * Math.cos(a), S.y + length * Math.sin(a)];
        K.setArrow(v1, S.x, S.y, ...point(S.base, S.l1));
        v2._size = V.lerp(38, 28, S.frame);
        K.setArrow(v2, S.x, S.y, ...point(S.a, S.l2 * S.v2grow));
        v1._shaft.setAttribute("stroke-width", V.lerp(7, 9, S.frame));
        v2._shaft.setAttribute("stroke-width", V.lerp(7, 4, S.frame));
        origin.setAttribute("cx", S.x);
        origin.setAttribute("cy", S.y);
        axX.setAttribute("d", `M120 ${S.y}L${V.lerp(1000, 960, S.frame)} ${S.y}`);
        axY.setAttribute("d", `M${S.x} ${V.lerp(1160, 1080, S.frame)}L${S.x} ${V.lerp(470, 380, S.frame)}`);
        const delta = S.a - S.base, r = V.lerp(220, 128, S.frame);
        const isRightAngle = S.frame > 0.999 && Math.abs(Math.abs(delta) - Math.PI / 2) < 0.001;
        if (Math.abs(delta) < 0.001) {
          theta.setAttribute("d", "");
        } else if (isRightAngle) {
          theta.setAttribute("d", `M${S.x + 42} ${S.y}v-42h-42`);
        } else {
          const [sx, sy] = point(S.base, r);
          theta.setAttribute("d", `M${S.x} ${S.y}L${sx} ${sy}` + K.arcD(S.x, S.y, r, S.base, S.a).replace(/^M[^A]+/, "") + "Z");
        }
        theta.setAttribute("fill", isRightAngle ? "none" : "rgba(255,225,77,0.14)");
        const m = (S.base + S.a) / 2, labelR = V.lerp(260, 172, S.frame);
        thetaT.setAttribute("x", S.x + labelR * Math.cos(m) - 12);
        thetaT.setAttribute("y", S.y + labelR * Math.sin(m) + 16);
        thetaT.setAttribute("fill-opacity", (1 - S.frame) * Math.min(1, Math.abs(delta) / 0.12));
        const cosine = Math.cos(delta);
        readNumber.textContent = (Math.abs(cosine) < 0.0005 ? 0 : cosine).toFixed(2);
      }
      setVectors();
const vectorFx=arrowEffect(main,v2);

return t=>{
S.a=lerp(-1.45,-.85,q(t,T.two+.6,T.close-T.two,'p2io'));
S.a=lerp(S.a,-1.55,q(t,T.cos+.3,1.1,'p2io'));
S.a=lerp(S.a,-.72,q(t,T.name+.3,1,'p2io'));
S.v2grow=LineGrowth.progress((t-T.two)/.45);setVectors();vectorFx(t-T.two,.45,true);
opacity(v2,q(t,T.two,.3,'p1out'));opacity([theta,thetaT],q(t,T.two+.3,.3,'p1out'));
opacity([bracket,dirArc],0);
enter($('s02-read'),t,T.cos+.2,.45,{blur:12},'expoout');
enter($('s02-fx'),t,T.cos,.45,{blur:12},'expoout');
enter($('s02-fxn'),t,T.name+.1,.4,{blur:12,y:20},'expoout');
$('s02-fx').querySelector('.box').style.borderColor=`rgba(232,184,74,${q(t,T.name,.3,'p1out')})`;
};
}

export function table(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      const NAMES = ["猫粮", "猫砂", "狗粮"], ICONS = ["catfood", "litter", "dogfood"];
      const CX0 = 320, CW = 160, RY0 = 390, RH = 164, UY = 230;
      const columnX = (j) => CX0 + j * CW;
      const users = [];
      for (let j = 0; j < 8; j++) {
        const u = K.h("div", "s03-u", K.icon("user", 64, { color: "#d6d9e0" }).replace("display:block", "display:block;margin:0 auto") + `<span>用户 ${j + 1}</span>`, $("s03-users"));
        set(u, { left: columnX(j), top: UY });
        users.push(u);
      }
      const rows = NAMES.map((n, i) => {
        const r = K.h("div", "s03-rl", K.icon(ICONS[i], 60, { color: i === 2 ? "#d6d9e0" : "#e8b84a" }) + n, $("s03-rows"));
        set(r, { top: RY0 + i * RH - 14 });
        return r;
      });
      const cells = BITS.map((row, i) => row.map((b, j) => {
        const c = K.h("div", "s03-c " + (b ? "b1" : "b0"), String(b), $("s03-cells"));
        set(c, { left: columnX(j) + 8, top: RY0 + i * RH });
        return c;
      }));
      set("#s03-rowbox", { top: RY0 - 18 });
      $("s03-bits").textContent = BITS[0].join(", ");


// 用户明确要求完整横向记录；仍然沿用同一批八列数据。
rows.forEach(r=>set(r,{left:60}));set('#s03-rowbox',{left:48,width:1504});set('#s03-vecn',{left:48,width:1504,fontSize:58});set('#s03-vecl',{left:48,width:1504});
return t=>{
users.forEach((u,j)=>enter(u,t,Math.max(0,T.ex-.4)+j*.06,.4,{y:-30},'expoout'));
rows.forEach((r,i)=>enter(r,t,(i?T.rest:T.one-.4)+i*.15,.4,{x:-30,blur:12},'expoout'));
cells.forEach((row,i)=>row.forEach((c,j)=>{
const at=i?T.rest+.3+(i-1)*.5+j*.06:(BITS[0][j]?T.one+.1+j*.25:T.zero+(j-2)*.06);
enter(c,t,at,i?.3:.35,{scale:.6},'back2');
if(i)c.style.opacity=Number(c.style.opacity)*(1-.75*q(t,T.row,.4,'p1out'));
}));
[1,2].forEach(i=>rows[i].style.opacity=Number(rows[i].style.opacity)*(1-.75*q(t,T.row,.4,'p1out')));
enter($('s03-rowbox'),t,T.row,.4,{scale:1.05},'expoout');
enter($('s03-vecn'),t,T.row+.6,.5,{y:-40,blur:12},'expoout');
enter($('s03-vecl'),t,T.row+.6,.45,{blur:12},'expoout');
};
}

export function dimensions(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      // One coordinate frame grows a third axis; the first three purchase values stay intact.
      const space = K.s("g", { id: "s03-space", opacity: 0 }, svg);
      const axisLayer = K.s("g", {}, space);
      const SO = [540, 800];
      const AX2 = [[870, 800], [540, 390], SO];
      // 按用户红箭头的方向：用户1向左下，用户2竖直向上，用户3水平向右。
      // 三条轴共用原点，商品向量和投影虚线跟随同一组基向量。
      const axisLength = 400;
      const projectAxis = ([x, y, z]) => {
        const screenX = -0.72 * x + z;
        const screenY = y - 0.42 * x;
        return [SO[0] + screenX * axisLength, SO[1] - screenY * axisLength];
      };
      const AX3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(projectAxis);
      const spaceAxes = AX3.map(() => K.arrow(axisLayer, { color: "rgba(242,242,240,0.45)", w: 3, head: 22, glow: false }));
      const axisLabels = AX3.map((_, i) => {
        const label = K.s("text", { "font-size": 32, "text-anchor": i === 0 ? "start" : i === 1 ? "middle" : "end" }, axisLayer);
        label.textContent = "用户 " + (i + 1);
        return label;
      });
      const dimVectors = K.s("g", {}, space);
      const catVector = K.arrow(dimVectors, { color: "#e8b84a", w: 8, head: 34 });
      const dogVector = K.arrow(dimVectors, { color: "#b8bcc6", w: 6, head: 30, glow: false });
      const catLabel = K.s("text", { "font-size": 34 }, dimVectors);
      catLabel.textContent = "猫粮";
      const dogLabel = K.s("text", { "font-size": 34, "text-anchor": "middle" }, dimVectors);
      dogLabel.textContent = "狗粮";
      const guide = K.s("path", { fill: "none", stroke: "rgba(255,225,77,0.35)", "stroke-width": 2, "stroke-dasharray": "8 8" }, dimVectors);
      const spaceOrigin = K.s("circle", { cx: SO[0], cy: SO[1], r: 7, fill: "#f2f2f0" }, space);
      const D = { depth: 0, grow: 0, axisGrow: 0, labelOpacity: 1 };
      function setD() {
        // 二维图按轴标签的实际外沿居中；展开第三轴时平滑回到三维中心。
        space.setAttribute("transform", `translate(${-190.5 * (1 - D.depth)} 0)`);
        const ends = AX2.map((p, i) => p.map((v, k) => V.lerp(v, AX3[i][k], D.depth)));
        ends.forEach((p, i) => {
          K.setArrow(spaceAxes[i], ...SO, ...p.map((v, k) => V.lerp(SO[k], v, D.axisGrow)));
          axisLabels[i].setAttribute("x", p[0] + (i === 0 ? 20 : i === 2 ? -16 : 0));
          axisLabels[i].setAttribute("y", p[1] + (i === 1 ? -30 : 38));
          axisLabels[i].setAttribute("opacity", i === 2 ? D.depth : 1);
        });
        const component = (i, value) => ends[i].map((v, k) => (v - SO[k]) * value * 0.66 * D.grow);
        const u = component(0, BITS[0][0]), v = component(1, BITS[0][1]), w = component(2, BITS[0][2]);
        const catTip = SO.map((q, k) => q + u[k] + v[k] + w[k]);
        K.setArrow(catVector, ...SO, ...catTip);
        catLabel.setAttribute("x", catTip[0] + 18);
        catLabel.setAttribute("y", catTip[1] - 18);
        catLabel.setAttribute("opacity", D.grow * D.labelOpacity);
        const dog = component(2, BITS[2][2]);
        const dogTip = SO.map((q, k) => q + dog[k]);
        K.setArrow(dogVector, ...SO, ...dogTip);
        dogLabel.setAttribute("x", dogTip[0]);
        dogLabel.setAttribute("y", dogTip[1] + 54);
        dogLabel.setAttribute("opacity", D.depth * D.grow * D.labelOpacity);
        guide.setAttribute("d", `M${SO[0] + u[0]} ${SO[1] + u[1]}L${catTip[0]} ${catTip[1]}L${SO[0] + v[0]} ${SO[1] + v[1]}`);
        $("s03-dim-value").textContent = D.depth < 0.5 ? "二维" : "三维";
      }
      setD();

      // These are illustrative product vectors, not extra coordinate axes.
      const fan = K.s("g", { opacity: 0 }, space);
      const fanAngles = [-60, -36, -136, -98, 18, 68, 145];
      const fanLengths = [380, 380, 340, 250, 280, 220, 260];
      const fanColors = ["#e8b84a", "#ffe14d", "#b8bcc6", "#858996", "#858996", "#858996", "#858996"];
      const fanArrows = fanAngles.map((_, i) => K.arrow(fan, { color: fanColors[i], w: i < 3 ? 6 : 3, head: i < 3 ? 28 : 22, glow: i < 2 }));
      const fanState = fanAngles.map(() => ({ u: 0 }));
      const setFan = () => fanArrows.forEach((arrow, i) => {
        const a = fanAngles[i] * Math.PI / 180, length = fanLengths[i] * fanState[i].u;
        K.setArrow(arrow, ...SO, SO[0] + Math.cos(a) * length, SO[1] + Math.sin(a) * length);
      });
      setFan();
const fanFx=fanArrows.map(a=>arrowEffect(fan,a));


      // The same 840 short strokes unfold from, and fold back into, the three axes.
      // The seeded bit stream and seven independently scrolling rows preserve the dense barcode.
      const barcodeRandom = V.rng(303);
      const BAR = Array.from({ length: 4200 }, () => barcodeRandom() < 0.42 ? 1 : 0);
      const axisShafts = AX3.map((end) => {
        const length = Math.hypot(end[0] - SO[0], end[1] - SO[1]);
        return end.map((value, k) => SO[k] + (value - SO[k]) * (1 - 22 * 0.8 / length));
      });
      function barcode(t) {
        if (t <= T.many || t >= T.calc + 1.1) return;
        const unfold = sm(t, T.many, T.many + 0.75);
        const fold = sm(t, T.calc, T.calc + 1.1);
        const spread = unfold * (1 - fold);
        const alpha = sm(t, T.many, T.many + 0.25) * (1 - sm(t, T.calc + 0.85, T.calc + 1.1));
        const sh = (Math.min(t, T.calc) - T.many) * 260;
        ctx.save();
        ctx.lineCap = "butt";
        ctx.lineWidth = V.lerp(3, 6, spread);
        for (let row = 0; row < 7; row++) {
          for (let i = 0; i < 120; i++) {
            const x = 60 + i * 8 - ((sh * (1 + row * 0.15)) % 8);
            const y = 690 + row * 24;
            const index = (i + Math.floor(sh / 8) * (row + 1) + row * 997) % BAR.length;
            const on = BAR[index];
            const n = row * 120 + i, axis = n % 3, part = Math.floor(n / 3);
            const end = axisShafts[axis];
            const a = SO.map((v, k) => V.lerp(v, end[k], part / 280));
            const b = SO.map((v, k) => V.lerp(v, end[k], (part + 1) / 280));
            const ink = on ? (row === 3 ? C.yellow : C.gold) : C.silver;
            const bitAlpha = (on ? 0.85 : 0.12) * (row === 3 ? 1 : 0.55);
            ctx.strokeStyle = V.rgba(V.mix(C.white, ink, spread), V.lerp(0.45, bitAlpha, spread) * alpha);
            ctx.beginPath();
            ctx.moveTo(V.lerp(a[0], x + 3, spread), V.lerp(a[1], y, spread));
            ctx.lineTo(V.lerp(b[0], x + 3, spread), V.lerp(b[1], y + 18, spread));
            ctx.stroke();
          }
        }
        ctx.restore();
      }


return t=>{
V.begin(ctx);D.depth=1;D.axisGrow=1;D.grow=1-q(t,T.many,.55,'p2io');D.labelOpacity=1-q(t,T.many-.18,.18,'p2in');setD();
opacity(space,1);opacity(dimVectors,t<T.calc?1:0);opacity([axisLayer,spaceOrigin],1-q(t,T.many,.6,'p2io')+q(t,T.calc+.85,.25,'p2io'));
opacity(fan,t>=T.calc+.8?1:0);fanState.forEach((s,i)=>s.u=LineGrowth.progress((t-T.calc-.8-i*.08)/.6));setFan();
fanFx.forEach((fx,i)=>fx(t-T.calc-.8-i*.08,.6,true));
barcode(t);
const a=q(t,T.many,.75,'p2io'),b=q(t,T.calc+.05,.45,'p2in');
pose($('s03-many'),{y:572*(1-a)-36*b,scale:(.5+.5*a)*(1-.08*b)});opacity($('s03-many'),a*(1-b));
const count=lerp(3,10000,q(t,T.many+.2,2.2,'p2out'));$('s03-cnt').textContent=count>=9999?'10,000+':Math.round(count).toLocaleString('en-US');
opacity($('s03-dim'),1-q(t,T.many,.12,'p2in'));pose($('s03-dim'),{y:-70});
enter($('s03-space-note'),t,T.calc+.8,.3,{blur:12},'expoout');
};
}

export function catLinks(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      // C: co-occurrence graph around 猫
      const GC = [540, 850], NB = ["猫粮", "猫砂", "宠物", "可爱", "喂食", "抓老鼠"];
      // Keep the original pill sizes; draw links behind the labels, from border to border.
      const CAT_BOX = [148, 132.672], WORD_H = 79.024;
      const graph = K.s("g", {}, svg);
      function pillEdge(from, to, width, height) {
        const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
        const ux = dx / length, uy = dy / length, radius = height / 2 + 1.5, halfStraight = (width - height) / 2;
        const toFlat = Math.abs(uy) > 0.000001 ? radius / Math.abs(uy) : Infinity;
        const distance = Math.abs(ux) * toFlat <= halfStraight ? toFlat
          : halfStraight * Math.abs(ux) + Math.sqrt(radius * radius - halfStraight * halfStraight * uy * uy);
        // Intersect the border expanded by the round cap radius so the visible cap just touches it.
        return [from[0] + ux * distance, from[1] + uy * distance];
      }
      const wc = K.h("div", "s04-w", "猫", $("s04-graph"));
      wc.id = "s04-wc";
      set(wc, { left: GC[0] - CAT_BOX[0] / 2, top: GC[1] - CAT_BOX[1] / 2, width: CAT_BOX[0], height: CAT_BOX[1] });
      const nbs = NB.map((w, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / NB.length + 0.3;
        const p = [GC[0] + Math.cos(a) * 330, GC[1] + Math.sin(a) * 190];
        const width = w.length * 38 + 48;
        const d = K.h("div", "s04-w", w, $("s04-graph"));
        set(d, { left: p[0] - width / 2, top: p[1] - WORD_H / 2, width, height: WORD_H });
        const ln = K.line(graph, ...pillEdge(GC, p, ...CAT_BOX), ...pillEdge(p, GC, width, WORD_H), "ln gold", { "stroke-width": 3 });
        return { d, ln };
      });


const fx=nbs.map(n=>{const length=n.ln.getTotalLength();return LineGrowth.svgEffect(graph,()=>({length,at:p=>{const q=n.ln.getPointAtLength(p*length);return[q.x,q.y]}}),n.ln)});
return t=>{
V.begin(ctx);V.glowDot(ctx,...GC,260,C.yellow,.35*q(t,T.know-.1,.5,'smooth'));
enter(wc,t,T.see-.2,.5,{scale:.6},'back2');
opacity(graph,q(t,T.see,.01,'p1out'));
nbs.forEach((n,i)=>{enter(n.d,t,T.see+.2+i*.12,.4,{scale:.6},'back2');const age=t-T.see-.3-i*.12;n.ln.style.strokeDasharray='1';n.ln.style.strokeDashoffset=1-LineGrowth.progress(age/.4);fx[i](age,.4);});
};
}

export function contextSilk(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      // F: context flows along fixed silk curves into the highlighted word.
      const ROWS = [[["吃", 0.9], ["了", 0.1], ["一个", 0.2], ["苹果", -1]], [["买", 0.3], ["了", 0.1], ["一台", 0.25], ["苹果", -1], ["手机", 0.95]]];
      const RY = [400, 850];
      const attEls = [], attentionBundles = [];
      // Ease into the height limit instead of flattening many strands at 360px.
      const attentionHeight = (h) => Math.max(8, h - 42 * Math.log1p(Math.exp((h - 360) / 42)));
      ROWS.forEach((row, ri) => {
        const ws = row.map(([w]) => w.length * 54 + 48), gap = 26, tot = ws.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
        let x = 540 - tot / 2;
        const cx = [];
        row.forEach(([w, a], k) => {
          const d = K.h("div", "s04-at" + (a < 0 ? " key" : ""), w, $("s04-att"));
          set(d, { left: x, top: RY[ri], width: ws[k] });
          cx.push(x + ws[k] / 2);
          x += ws[k] + gap;
          attEls.push(d);
        });
        const ki = row.findIndex(([, a]) => a < 0);
        row.forEach(([, a], k) => {
          if (k === ki) return;
          const x0 = cx[ki], x1 = cx[k], y = RY[ri] - 8, dx = x1 - x0;
          const random = V.rng(4400 + ri * 100 + k), strong = a > 0.7;
          const span = Math.min(450, Math.abs(dx)), bow = 160 + span * 0.3, spread = 42 + span * 0.09;
          // The reference uses correlated control-point offsets, fixed seeds and
          // additive hairlines. Keep every strand clear of both rows of word boxes.
          const strands = Array.from({ length: Math.round(30 + 600 * a) }, (_, strandIndex) => {
            const h1 = attentionHeight(bow + V.gauss(random) * spread);
            const h2 = attentionHeight(h1 * V.lerp(0.2, 1.2, random()) + V.gauss(random) * spread * 0.6);
            const c1x = V.clamp(x0 + dx * V.lerp(0.12, 0.45, random()) + V.gauss(random) * spread * 0.08, Math.min(x0, x1) + 2, Math.max(x0, x1) - 2);
            const c2x = V.clamp(x0 + dx * V.lerp(0.55, 0.9, random()) + V.gauss(random) * spread * 0.08, Math.min(x0, x1) + 2, Math.max(x0, x1) - 2);
            const tint = V.clamp(random() * 1.1);
            const color = V.mix(C.white, strong ? C.goldHi : C.silver, tint);
            // Cache the gentle white crest once; endpoints keep their original brightness.
            const stroke = ctx.createLinearGradient(0, y, 0, y - Math.max(h1, h2) * 0.75);
            stroke.addColorStop(0, V.rgba(color, 0.8));
            stroke.addColorStop(0.55, V.rgba(color, 0.8));
            stroke.addColorStop(1, V.rgba(V.mix(color, C.white, 0.35), 1));
            return SilkFlow.create([
              [x1, y], [c2x, y - h2], [c1x, y - h1], [x0, y],
            ], {
              stroke,
              delay: (strandIndex % 19) * 0.012,
              alpha: 1.25 * (strong ? 0.085 : 0.065) * V.clamp(Math.exp(V.gauss(random) * 0.55), 0.2, 3),
              width: V.lerp(0.55, 0.75, random()),
            });
          });
          attentionBundles.push({ x0, x1, y, strands, delay: k * 0.025 });
        });
      });

      function drawAttention(t) {
        const start = T.ctxw - 0.2, fade = 1 - sm(t, T.paper - 0.3, T.paper);
        if (t <= start || fade <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const bundle of attentionBundles) {
          for (const strand of bundle.strands) {
            SilkFlow.draw(ctx, strand, t - start - bundle.delay, fade);
          }
        }
        ctx.restore();
      }


return t=>{V.begin(ctx);drawAttention(t);};
}

export function crossSilk(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;
const silkCtx=canvas("s07-silk",760,86),feedCtx=canvas("s07-feed-silk",36,88);

      // Same seeded, additive hairlines as the Transformer attention scene,
      // with fewer strands so crossing bundles retain visible gaps.
      // Draw above the panel on a separate canvas; the text/arrow layer stays above it.
      const rerankSilk = [];
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const x0 = 170 + i * 40, x1 = 670 + j * 40, y = 858, dx = x1 - x0;
        const random = V.rng(7700 + i * 100 + j), strong = i === j;
        const span = Math.min(450, Math.abs(dx)), bow = 44 + span * 0.07, spread = 18 + span * 0.025;
        const strands = Array.from({ length: strong ? 24 : 5 }, (_, strandIndex) => {
          // With both controls at most 92px below the endpoints, the curve
          // stays above y927, clear of the score label at y932.
          const h1 = V.clamp(bow + V.gauss(random) * spread, 8, 92);
          const h2 = V.clamp(h1 * V.lerp(0.2, 1.2, random()) + V.gauss(random) * spread * 0.6, 8, 92);
          const c1x = V.clamp(x0 + dx * V.lerp(0.12, 0.45, random()) + V.gauss(random) * spread * 0.08, x0 + 2, x1 - 2);
          const c2x = V.clamp(x0 + dx * V.lerp(0.55, 0.9, random()) + V.gauss(random) * spread * 0.08, x0 + 2, x1 - 2);
          const color = V.mix(C.white, strong ? C.goldHi : C.silver, V.clamp(random() * 1.1));
          const points = [[x0, y], [c1x, y + h1], [c2x, y + h2], [x1, y]];
          // Two sentences exchange context sideways, along the same fixed arc.
          if ((i + j + strandIndex) % 2) points.reverse();
          return SilkFlow.create(points, {
            stroke: V.rgba(color, 1),
            delay: (strandIndex % 19) * 0.012,
            alpha: (strong ? 0.065 : 0.04) * V.clamp(Math.exp(V.gauss(random) * 0.55), 0.2, 3),
            width: V.lerp(0.55, 0.75, random()),
          });
        });
        rerankSilk.push({ x0, x1, y, strands, delay: ((i + j) % 7) * 0.025 });
      }

      // The vertical feed shares the context fibers' material, pinched at both ends.
      const feedRandom = V.rng(7714);
      const feedStrands = Array.from({ length: 36 }, () => {
        const bow = V.clamp(V.gauss(feedRandom) * 7, -14, 14);
        const color = V.mix(C.white, C.goldHi, V.lerp(0.35, 0.95, feedRandom()));
        return SilkFlow.create([
          [540, 914], [540 + bow, 938], [540 + bow * 0.7, 964], [540, 988],
        ], {
          stroke: V.rgba(color, 1), delay: 0,
          alpha: V.lerp(0.07, 0.12, feedRandom()),
          width: V.lerp(0.55, 0.75, feedRandom()),
        });
      });

      function drawFeedSilk(t) {
        V.begin(feedCtx);
        const start = T.tog + 2.1;
        const reveal = sm(t, start, start + 0.35);
        const fade = 0.65 * (1 - sm(t, T.fine - 0.3, T.fine + 0.05));
        if (reveal <= 0 || fade <= 0) return;
        feedCtx.save();
        feedCtx.translate(-522, -908);
        feedCtx.beginPath();
        feedCtx.rect(522, 913, 36, 1 + 75 * reveal);
        feedCtx.clip();
        for (const strand of feedStrands) {
          // Reveal with the original 0.35s window; light keeps the shared flow cadence.
          SilkFlow.draw(feedCtx, strand, t - start + 1.25, fade);
        }
        feedCtx.restore();
      }

      function drawRerankSilk(t) {
        V.begin(silkCtx);
        const start = T.tog + 1.55, fade = 1 - sm(t, T.fine - 0.3, T.fine);
        if (t <= start || fade <= 0) return;
        silkCtx.save();
        silkCtx.translate(-160, -850);
        for (const bundle of rerankSilk) {
          for (const strand of bundle.strands) {
            SilkFlow.draw(silkCtx, strand, t - start - bundle.delay, fade);
          }
        }
        silkCtx.restore();
      }

// 只保留所选光丝区域；两句输入与输出卡在起点已经就位。
const box=(text,cls,left,top)=>{const el=K.h('div','s07-box '+cls,text,env.stage);set(el,{left,top});return el;};
box('小王喜欢猫吗？','input',145,770);box('小王不喜欢猫。','input',645,770);box('Cross-Encoder','ce',370,1000);
return t=>{drawRerankSilk(t);drawFeedSilk(t);};
}

export function sentences(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;
const svg2=svg;const addSpaceParticle=(g,x,y,radius)=>{g._spaceParticle=Space3D.svgParticle(g,{x,y,radius});};

      // J: training pulls related sentences together
      const SEN = [["我喜欢猫", 190, 440, 380, 620, 1], ["猫很可爱", 740, 1020, 560, 740, 1], ["今天下雨", 760, 400, 760, 360, 0], ["我买了手机", 190, 1040, 140, 1110, 0]];
      const tr = K.s("g", { opacity: 0 }, svg2);
      const tlink = K.s("line", { stroke: "#ffe14d", "stroke-width": 3, "stroke-dasharray": "10 10" }, tr);
      const tpts = SEN.map(([w, x, y, , , rel], i) => {
        const g = K.s("g", {}, tr);
        addSpaceParticle(g, 0, 0, 1.25);
        K.s("text", { x: i === 0 ? -22 : 22, y: 12, "text-anchor": i === 0 ? "end" : "start", "font-size": 36, "font-weight": 700, fill: rel ? "#ffe14d" : "rgba(242,242,240,0.6)" }, g).textContent = w;
        set(g, { x, y });
        return g;
      });
      const TP = { u: 0 };
      const setTr = () => {
        $("s04-stepn").textContent = Math.round(TP.u * 30000).toLocaleString("en-US");
      };
      setTr();


const S3=Space3D;
      const trainFrom = [[-.85,.7,-.3],[.8,-.7,.45],[.8,.8,.35],[-.9,-.8,-.4]];
      const trainTo = [[-.25,.1,-.1],[.1,-.05,-.08],[.85,.85,.4],[-.9,-.8,-.45]];
      const trainingDust = trainFrom.map((_,i)=>S3.formation(44048+i,i===0?107:106,{radii:[.21,.19,.2],half:1.31}));
      function positionWord(g, position, cam, base) {
        const q=S3.project(position,cam);
        set(g,{x:q.x-base[0],y:q.y-base[1]});
        g._spaceParticle.setAttribute('transform',`translate(${base[0]} ${base[1]}) scale(${q.scale.toFixed(4)})`);
        g._spaceParticle.setAttribute('opacity',(0.75+0.25*q.light).toFixed(3));
        return q;
      }

return t=>{V.begin(ctx);TP.u=q(t,T.train+.4,T.same-T.train-.8,'p2io');setTr();opacity(tr,q(t,T.train,.4,'p1out'));enter($('s04-step'),t,T.train,.45,{blur:12},'expoout');
        const training=win(t,T.train,T.train+.4,T.same-.3,T.same);
        if(training>.001){
          const cam=S3.camera({cx:550,cy:710,scale:200,depth:8,yaw:.48,pitch:-.29,spin:.04,sway:.015},t-T.train);
          ctx.save();ctx.beginPath();ctx.rect(80,350,920,870);ctx.clip();
          S3.frame(ctx,cam,{half:1.45,age:t-T.train,alpha:training*.84});
          const centers=trainFrom.map((p,i)=>p.map((v,k)=>V.lerp(v,trainTo[i][k],TP.u)));
          trainingDust.forEach((points,i)=>S3.render(ctx,S3.gather(points,t-T.train,{center:centers[i],delay:i*.07}),cam,{alpha:training,grainPoints:true}));
          const q=centers.map((p,i)=>positionWord(tpts[i],p,cam,[0,0]));
          const linkAge = t - T.train, linkProgress = LineGrowth.progress(linkAge / .8, .8);
          const linkTip = [V.lerp(q[0].x, q[1].x, linkProgress), V.lerp(q[0].y, q[1].y, linkProgress)];
          tlink.setAttribute('x1',q[0].x);tlink.setAttribute('y1',q[0].y);tlink.setAttribute('x2',linkTip[0]);tlink.setAttribute('y2',linkTip[1]);
          LineGrowth.canvas(ctx, [q[0].x, q[0].y], linkTip, linkAge, .8, { alpha: training });
          ctx.restore();
        }

};
}

export function paper(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

set('#s04-sheet',{left:110,top:150});
set('#s04-fig',{left:640,top:690});
const drop=(id,t,at,rotation)=>{const p=q(t,at,.7,'expoout');pose($(id),{y:-80*(1-p),rotation:rotation-6+6*p,scale:1.06-.06*p});opacity($(id),p);};
return t=>{
 drop('s04-sheet',t,T.paper,-1);
 enter($('s04-year'),t,T.paper+.4,.5,{scale:.85,blur:12},'expoout');
 enter($('s04-yl'),t,T.paper+.7,.45,{blur:12},'expoout');
 drop('s04-fig',t,T.title-.2,4);
};
}

export function farewell(env){
const {$,svg,ctx,K,T,set,add,canvas}=env;

      const S3 = Space3D;
      const spark = S3.cloud(808, 1400, { radii: [1.15, 0.7, 0.9], shell: 0.5 }).map((p, i) => ({
        ...p, color: i % 3 ? "#e5d9b9" : "#d9e1ef",
      }));
      const avatarFloat = $("s08-avatar-float");


const bursts=Array.from({length:3},(_,i)=>Array.from({length:5},(_,k)=>K.s('line',{},$('s08-action'+i).querySelector('.s08-action-burst'))));
return t=>{
V.begin(ctx);const sa=win(t,T.bye-.3,T.bye+.6,T.end-.9,T.end-.1);
const cam=S3.camera({cx:540,cy:690,scale:430,depth:6,yaw:.32,pitch:-.28,spin:.12,sway:.035},t-T.bye);
S3.render(ctx,spark,cam,{alpha:sa*.16,pointSize:1.2,darkLift:.22,starPoints:true,time:t});
avatarFloat.style.transform=`translateY(${(4*Math.sin(Math.max(0,t-T.bye)*1.6)).toFixed(3)}px)`;
enter($('s08-avatar'),t,T.intro-.15,.45,{y:20,scale:.8},'back13');
enter($('s08-name'),t,T.intro+.05,.3,{y:24,scale:.94},'back13');
enter($('s08-farewell'),t,T.bye+.2,.3,{y:20},'p3out');
for(let i=0;i<3;i++){
const el=$('s08-action'+i),icon=el.querySelector('.s08-action-icon path'),at=T.bye+.35+i*.12,tap=T.bye+.8+i*.18;
const p=q(t,at,.35,'p3out'),bounce=.15*(q(t,tap,.17,'sineout')-q(t,tap+.17,.17,'sinein'));
opacity(el,p);pose(el,{scale:.85+.15*p+bounce});icon.style.strokeDashoffset=1-p;
const color=q(t,tap+.1,.16,'p1out');el.style.color=`rgb(${[242,242,240].map((v,k)=>Math.round(lerp(v,[255,216,115][k],color))).join(',')})`;icon.style.fillOpacity=i<2?.9*color:0;
bursts[i].forEach((line,k)=>{const a=-Math.PI+(k+.5)*Math.PI/5,p=q(t,tap,.34,'p2out'),d=[Math.cos(a),Math.sin(a)];for(const[n,v]of Object.entries({x1:100+lerp(58,86,p)*d[0],y1:100+lerp(58,86,p)*d[1],x2:100+lerp(74,102,p)*d[0],y2:100+lerp(74,102,p)*d[1],opacity:t<tap?0:1-p}))line.setAttribute(n,v);});
}
};
}
