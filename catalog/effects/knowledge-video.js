/* Knowledge video selected drawings. Apache-2.0; see catalog/assets/knowledge-video. */
(()=>{var jn=Object.defineProperty;var Ln=(S,d)=>{for(var G in d)jn(S,G,{get:d[G],enumerable:!0})};var zn=Object.freeze([{id:"dimensions-unfold-fold",name:"\u5750\u6807\u5C55\u5F00\u6210\u4E07\u7EF4",scene:"s03-itemcf",draw:"dimensions",start:17.65,end:22.2,poster:19.8,view:[45,200,990,990],nodes:["s03-many","s03-dim","s03-space-note"]},{id:"related-sentences-converge",name:"\u76F8\u5173\u53E5\u5B50\u9010\u6E10\u9760\u8FD1",scene:"s04-embedding",draw:"sentences",start:46.88,end:52.35,poster:51.5,view:[65,90,950,1150],nodes:["s04-step"]},{id:"context-silk-flow",name:"\u5149\u4E1D\u4F20\u9012\u8BCD\u8BED\u5173\u8054",variant:"context",label:"\u4E0A\u4E0B\u6587\u6C47\u5165\u5173\u952E\u8BCD",scene:"s04-embedding",draw:"contextSilk",start:31.32,end:34.38,poster:33.5,view:[65,70,950,900],nodes:["s04-att"]},{id:"context-silk-flow",factory:"context-silk-flow-cross",name:"\u5149\u4E1D\u4F20\u9012\u8BCD\u8BED\u5173\u8054",variant:"cross",label:"\u4EA4\u9519\u5173\u8054\u4E0E\u4E0B\u65B9\u8F93\u51FA",scene:"s07-rerank",draw:"crossSilk",start:11.86,end:15.85,poster:14.8,view:[120,740,880,390],nodes:[]},{id:"cosine-gauge-sweep",name:"\u4EEA\u8868\u6307\u9488\u4E0E\u8BFB\u6570\u8054\u52A8",scene:"s01-hook",draw:"gauge",start:5.58,end:10.4,poster:9.55,view:[120,430,840,760],nodes:["s01-ticks","s01-num","s01-cos"]},{id:"vector-angle-swing",name:"\u5411\u91CF\u5939\u89D2\u6765\u56DE\u6446\u52A8",scene:"s02-vector",draw:"angle",start:4.55,end:11.2,poster:10.75,view:[60,200,960,1030],nodes:["s02-read","s02-fx","s02-fxn"]},{id:"purchase-table-vector",name:"\u8D2D\u4E70\u8868\u683C\u7A81\u51FA\u4E00\u884C",scene:"s03-itemcf",draw:"table",start:0,end:14.1,poster:12.3,pace:2,view:[0,180,1600,900],nodes:["s03-users","s03-rows","s03-cells","s03-rowbox","s03-vecn","s03-vecl"]},{id:"paper-card-drop",name:"\u8BBA\u6587\u8D44\u6599\u4F9D\u6B21\u5165\u573A",scene:"s04-embedding",draw:"paper",start:34.7,end:38.5,poster:38.2,view:[0,0,1080,1440],nodes:["s04-sheet","s04-year","s04-yl","s04-fig"]},{id:"cat-context-links",name:"\u4E2D\u5FC3\u8BCD\u8FDE\u63A5\u5468\u56F4\u8BCD\u8BED",scene:"s04-embedding",draw:"catLinks",start:11.7,end:15.5,poster:14.4,view:[100,570,880,540],nodes:["s04-graph"]},{id:"farewell-actions",name:"\u4EBA\u7269\u544A\u522B\u4E0E\u4E09\u8FDE\u70B9\u4EAE",scene:"s08-outro",draw:"farewell",start:12.96,end:17.03,poster:15.7,view:[200,220,680,1020],nodes:["s08-avatar","s08-name","s08-farewell","s08-action0","s08-action1","s08-action2"]}].map(S=>{let d=1.3*(S.pace??1);return Object.freeze({...S,rate:d,factory:S.factory||S.id,duration:(S.end-S.start)/d,preview:(S.poster-S.start)/d})}));function Sn(S,d){if(!Number.isFinite(d))throw TypeError("\u64AD\u653E\u65F6\u95F4\u5FC5\u987B\u662F\u6709\u9650\u6570\u5B57");return Math.max(S.start,Math.min(S.end,S.start+d*S.rate))}var mn={"s01-hook":{css:`
    /*VIZCSS*/

#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/
    #s01-lines { left: 0; top: 230px; width: 1080px; height: 86px; transform-origin: 50% 0%; }
    .s01-l { position: absolute; top: 0; width: 416px; text-align: center; font-size: 56px; font-weight: 800; line-height: 1.4; letter-spacing: 0.02em; white-space: nowrap; }
    #s01-l1 { left: 92px; }
    #s01-l2 { left: 572px; }
    #s01-photos { left: 0; top: 340px; width: 1080px; height: 690px; }
    .s01-photo { position: absolute; top: 0; width: 416px; height: 690px; overflow: hidden; border: 0; background: transparent; }
    #s01-photo-left { left: 92px; }
    #s01-photo-right { left: 572px; }
    /* \u5C0F\u8475\u539F\u52A8\u4F5C\u56FE\u7684\u7B2C\u4E00\u683C\uFF1A\u53EA\u5728\u753B\u5E03\u5185\u88C1\u53BB\u900F\u660E\u8FB9\uFF0C\u4E0D\u751F\u6210\u6216\u6539\u5199\u6E90\u56FE\u7247\u3002 */
    .s01-cat-frame { position: absolute; left: 16px; top: 95px; width: 160px; height: 208px; overflow: hidden; transform: scale(2.4); transform-origin: 0 0; }
    .s01-cat-frame img { position: absolute; left: -16px; top: 0; display: block; width: 1536px; height: 2288px; max-width: none; object-fit: fill; }
    .s01-cat-hiss { left: 5.6px; top: 115px; width: 176px; transform: scale(2.3); }
    /* \u539F\u5BA0\u7269\u52A8\u4F5C\u56FE\u7B2C\u56DB\u884C\u7B2C\u4E09\u683C\uFF0C\u4FDD\u7559\u4E24\u4FA7\u5C3E\u5DF4\u4E0E\u5B8C\u6574\u8033\u6735\u3002 */
    #s01-cat-right { left: -392px; top: -624px; }
    #s01-l2 .hi { text-shadow: 0 0 40px rgba(255, 225, 77, 0.6); }
    .s01-ml { position: absolute; font-size: 64px; font-weight: 700; white-space: nowrap; }
    #s01-mean { left: 0; right: 0; top: 560px; text-align: center; font-size: 48px; font-weight: 700; color: rgba(242, 242, 240, 0.75); letter-spacing: 0.4em; }
    #s01-panel { left: 80px; top: 210px; width: 920px; height: 970px; border: 0; }
    #s01-num { left: 0; right: 0; top: 890px; text-align: center; font-size: 186px; }
    #s01-cos { left: 0; right: 0; top: 1120px; text-align: center; font-size: 30px; color: rgba(242, 242, 240, 0.6); }
    .s01-tk { position: absolute; width: 80px; margin-left: -40px; text-align: center; font-family: "Smiley Sans", sans-serif; font-size: 30px; color: rgba(242, 242, 240, 0.55); }
    .s01-doc { position: absolute; width: 200px; height: 104px; padding: 18px 20px; border: 1.5px solid rgba(242, 242, 240, 0.18); border-radius: 10px; background: rgba(20, 19, 22, 0.9); }
    .s01-doc i { display: block; height: 8px; margin-bottom: 12px; border-radius: 4px; background: rgba(184, 188, 198, 0.28); }
    .s01-doc b { display: block; font-size: 34px; font-weight: 700; white-space: nowrap; line-height: 64px; text-align: center; }
    .s01-compare-card { position: absolute; box-sizing: border-box; top: 396px; width: 408px; height: 144px; display: flex; align-items: center; justify-content: center; padding: 24px; border: 1.5px solid rgba(242, 242, 240, 0.22); border-radius: 14px; background: rgba(16, 16, 15, 0.9); font-size: 58px; line-height: 1.3; font-weight: 700; white-space: nowrap; }
    #s01-big1 { left: 104px; }
    #s01-big2 { right: 104px; border-color: rgba(232, 184, 74, 0.55); }
    #s01-like { left: 104px; right: 104px; top: 612px; text-align: center; }
    .s01-contrast { font-size: 64px; line-height: 88px; font-weight: 700; }
    .s01-doubt-line { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 16px; font-size: 88px; line-height: 124px; font-weight: 800; }
    #s01-qm { display: block; flex: 0 0 96px; width: 96px; height: 124px; font-size: 88px; line-height: 124px; color: #ffe14d; }
  `,html:{"s01-ticks":'<div id="s01-ticks"></div>',"s01-num":'<div id="s01-num" class="big-num">0.00</div>',"s01-cos":'<div id="s01-cos" class="ab">\u4F59\u5F26\u76F8\u4F3C\u5EA6\u3000cos \u03B8</div>'},T:{l1:.67,l2:1.68,opp:3.68,test:5.18,sim:7.38,val:8.9,kb:10.809,rel:12.24,iff:14.06,doubt:16.94,vec:19.3,from:20.72,end:22.02}},"s02-vector":{css:`
    /*VIZCSS*/

#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/
    .s02-lb { position: absolute; font-size: 44px; font-weight: 700; white-space: nowrap; }
    .s02-lb small { display: block; font-size: 28px; font-weight: 500; color: rgba(242, 242, 240, 0.6); }
    /* \u4E0E\u672C\u9636\u6BB5\u524D\u666F\u8303\u56F4\u5171\u7528\u4E2D\u7EBF\uFF0C\u6574\u7EC4\u5E73\u79FB\u540E\u4F4D\u4E8E\u753B\u5E03\u6B63\u4E2D\u3002 */
    #s02-fx { left: 118px; top: 230px; width: 884px; height: 88px; line-height: 88px; text-align: center; font-size: 54px; }
    #s02-fxn { left: 118px; top: 342px; width: 884px; height: 44px; line-height: 44px; text-align: center; }
    #s02-fxn .note { position: relative; font-size: 30px; }
    #s02-read { left: 640px; top: 560px; width: 360px; height: 112px; line-height: 112px; text-align: center; font-size: 40px; }
    #s02-read .num { font-size: 76px; color: #ffd873; }
    #s02-p1, #s02-p2 { font-size: 46px; display: flex; align-items: center; gap: 14px; padding: 10px 24px 10px 14px; }
    #s02-qm { left: 346px; top: 170px; width: 720px; height: 140px; line-height: 140px; text-align: center; font-size: 72px; font-weight: 800; }
    #s02-qm .hi { font-size: 96px; }
  `,html:{"s02-read":'<div id="s02-read" class="ab">cos \u03B8 = <span class="num">0.00</span></div>',"s02-fx":'<div id="s02-fx" class="fx"><span class="box">cos \u03B8</span> = <span>a \xB7 b</span> / ( |a| |b| )</div>',"s02-fxn":'<div id="s02-fxn" class="ab"><span class="note">\u2191 \u4F59\u5F26\u76F8\u4F3C\u5EA6</span></div>'},T:{size:.87,dir:1.41,draw:2.67,two:4.55,close:6.21,cos:7.17,name:9.91,but:11.55,why:13.03,end:15.505}},"s03-itemcf":{css:`
    /*VIZCSS*/




#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/
    .s03-rl { position: absolute; left: 196px; width: 200px; height: 104px; display: flex; align-items: center; gap: 12px; font-size: 40px; font-weight: 700; white-space: nowrap; }
    .s03-u { position: absolute; width: 92px; text-align: center; }
    .s03-u span { display: block; font-size: 28px; color: rgba(242, 242, 240, 0.75); }
    .s03-c { position: absolute; width: 76px; height: 76px; border-radius: 12px; text-align: center; line-height: 76px; font-family: "Smiley Sans", sans-serif; font-size: 44px; font-weight: 500; }
    .s03-c.b1 { background: #e8b84a; color: #120f08; box-shadow: 0 0 22px rgba(232, 184, 74, 0.45); }
    .s03-c.b0 { border: 2px solid rgba(242, 242, 240, 0.25); color: rgba(242, 242, 240, 0.4); }
    #s03-rowbox { position: absolute; box-sizing: border-box; left: 184px; width: 712px; height: 112px; border: 3px solid #ffe14d; border-radius: 16px; box-shadow: 0 0 30px rgba(255, 225, 77, 0.35); }
    #s03-vecn { left: 184px; width: 712px; top: 890px; height: 84px; line-height: 84px; text-align: center; font-family: "Smiley Sans", sans-serif; font-size: 58px; }
    #s03-vecn .k { font-family: "Smiley Sans", sans-serif; font-weight: 700; }
    #s03-vecl { left: 184px; width: 712px; top: 1000px; height: 60px; line-height: 60px; text-align: center; font-size: 36px; }
    #s03-dim { left: 400px; top: 950px; width: 280px; height: 112px; line-height: 112px; text-align: center; font-size: 44px; font-weight: 700; }
    #s03-dim-value { font-size: 60px; color: #ffd873; }
    #s03-many { left: 72px; top: 240px; width: 936px; height: 248px; line-height: 248px; text-align: center; }
    #s03-many .num { font-size: 190px; color: #ffd873; text-shadow: 0 0 40px rgba(232, 184, 74, 0.5); }
    #s03-many .u { font-size: 64px; font-weight: 800; }
    #s03-space-note { left: 300px; top: 1100px; width: 480px; height: 56px; line-height: 56px; text-align: center; font-size: 32px; color: rgba(242, 242, 240, 0.75); }
    .s03-pc { font-size: 40px; display: flex; align-items: center; gap: 12px; padding: 10px 24px 10px 14px; }
    .s03-cos { position: absolute; display: flex; align-items: center; gap: 10px; height: 84px; font-size: 40px; line-height: 1; font-weight: 600; white-space: nowrap; }
    .s03-cos .num { font-size: 60px; }
    #s03-shop { left: 84px; top: 180px; width: 912px; height: 936px; overflow: visible; white-space: normal; }
    #s03-shop * { box-sizing: border-box; }
    .s03-shop-page { position: absolute; left: 0; top: 0; width: 432px; height: 936px; overflow: hidden; border-radius: 28px; background: linear-gradient(160deg, #151517, #101012 72%); font-family: "Source Han Sans SC", sans-serif; font-style: normal; font-weight: 400; color: #f3f1eb; }
    .s03-shop-page button { padding: 0; font: inherit; color: inherit; cursor: pointer; }
    .s03-shop-status { height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 4px 20px 0; font-size: 20px; line-height: 28px; font-weight: 500; }
    .s03-shop-status svg { width: 64px; height: 20px; }
    .s03-shop-home { position: absolute; left: 0; right: 0; bottom: 0; height: 28px; background: #101012; }
    .s03-shop-home::after { content: ""; position: absolute; left: 156px; bottom: 9px; width: 120px; height: 4px; border-radius: 2px; background: #e4e1da; }
    .s03-shop-nav { position: relative; height: 64px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    .s03-shop-nav h3 { margin: 0; font-size: 28px; line-height: 44px; font-weight: 600; }
    .s03-shop-back { position: absolute; left: 20px; top: 18px; width: 28px; height: 28px; }
    .s03-shop-address { display: flex; align-items: center; gap: 16px; height: 100px; margin: 16px 20px 0; padding: 12px 16px; border-radius: 18px; background: linear-gradient(120deg, #232327, #1d1d20); }
    .s03-shop-address svg { flex: 0 0 30px; width: 30px; height: 36px; color: #ffd873; }
    .s03-shop-address > div { flex: 1; }
    .s03-shop-address::after { content: "\u203A"; font-size: 32px; color: #b8b6b4; }
    .s03-shop-address strong { display: block; font-size: 22px; line-height: 30px; font-weight: 400; color: #b8b6b4; }
    .s03-shop-address span { display: block; font-size: 25px; line-height: 38px; font-weight: 500; }
    .s03-shop-order-panel { margin: 16px 20px 0; padding: 16px 16px 12px; border-radius: 20px; background: linear-gradient(145deg, #1d1d21, #18181b); }
    .s03-shop-store { height: 36px; margin: 0; font-size: 24px; line-height: 36px; font-weight: 500; }
    .s03-shop-store span { padding-left: 12px; color: #b8b6b4; }
    .s03-shop-order { display: flex; gap: 16px; height: 168px; margin: 16px 0 0; }
    .s03-shop-photo { position: relative; flex: none; overflow: hidden; border-radius: 14px; background-color: #efe4d6; background-image: url("assets/img/xiaokui-commerce-products-photo-v2.png"); background-size: 300% 200%; background-repeat: no-repeat; }
    .s03-shop-food { width: 168px; height: 168px; background-position: 0 0; }
    .s03-shop-litter { background-position: 50% 0; }
    .s03-shop-tray { background-position: 100% 0; }
    .s03-shop-treat { background-position: 0 100%; }
    .s03-shop-toy { background-position: 50% 100%; }
    .s03-shop-order-copy { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .s03-shop-order-copy h4 { margin: 0; font-size: 26px; line-height: 42px; font-weight: 600; }
    .s03-shop-order-copy p { margin: 6px 0 0; font-size: 22px; line-height: 30px; color: #b8b6b4; }
    .s03-shop-price-line { display: flex; align-items: center; justify-content: space-between; margin-top: auto; height: 48px; }
    .s03-shop-price-line strong { font-size: 32px; font-weight: 700; color: #ffd873; }
    .s03-shop-price-line span { font-size: 22px; color: #b8b6b4; }
    .s03-shop-delivery { display: flex; align-items: center; justify-content: space-between; height: 64px; margin: 20px 0 0; border-top: 1px solid #39393d; border-bottom: 1px solid #39393d; font-size: 22px; }
    .s03-shop-totals { margin: 8px 0 0; }
    .s03-shop-totals div { display: flex; align-items: center; justify-content: space-between; height: 48px; font-size: 22px; }
    .s03-shop-totals .discount { color: #ffd873; }
    .s03-shop-message { display: flex; align-items: center; justify-content: space-between; height: 56px; margin: 0; font-size: 22px; }
    .s03-shop-message span:last-child { color: #b8b6b4; }
    .s03-shop-paybar { position: absolute; left: 0; right: 0; bottom: 28px; height: 112px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; background: #202023; }
    .s03-shop-paybar div { font-size: 22px; line-height: 30px; color: #b8b6b4; }
    .s03-shop-paybar strong { display: block; font-size: 38px; line-height: 54px; font-weight: 700; color: #ffd873; }
    #s03-pay { flex: 0 0 180px; width: 180px; height: 64px; border: 0; border-radius: 18px; background: linear-gradient(110deg, #ffd873, #e8b84a); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22); color: #15120c; font-size: 25px; font-weight: 600; }
    .s03-shop-done { position: absolute; right: 20px; top: 50px; font-size: 22px; line-height: 36px; font-weight: 500; }
    #s03-paid-state { position: absolute; top: 96px; left: 0; right: 0; text-align: center; }
    .s03-shop-success-title { display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 30px; line-height: 48px; font-weight: 600; }
    .s03-shop-success-title svg { width: 64px; height: 64px; }
    .s03-shop-paid-price { height: 62px; margin-top: 6px; font-size: 44px; line-height: 62px; font-weight: 700; color: #ffd873; }
    .s03-shop-actions { position: absolute; top: 308px; left: 20px; right: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .s03-shop-actions button { height: 56px; background: #202023; border: 1px solid #48484d; border-radius: 16px; font-size: 22px; font-weight: 500; }
    .s03-shop-actions button:last-child { border-color: transparent; background: linear-gradient(110deg, #ffd873, #e8b84a); color: #15120c; font-weight: 700; }
    #s03-shop-recs { position: absolute; top: 384px; left: 12px; right: 12px; bottom: 28px; padding: 12px 8px 0; overflow: hidden; border-radius: 20px 20px 0 0; background: linear-gradient(150deg, #1d1d21, #17171a); }
    .s03-shop-rec-title { display: flex; align-items: center; gap: 12px; height: 40px; margin: 0 0 16px; font-size: 25px; line-height: 40px; font-weight: 600; }
    .s03-shop-rec-title svg { width: 28px; height: 28px; color: #ffd873; }
    .s03-shop-grid { display: grid; grid-template-columns: 188px 188px; column-gap: 16px; row-gap: 20px; }
    .s03-shop-card { min-width: 0; }
    .s03-shop-card .s03-shop-photo { width: 188px; height: 188px; }
    .s03-shop-card h4 { margin: 8px 4px 0; min-height: 34px; font-size: 22px; line-height: 34px; font-weight: 500; }
    .s03-shop-card p { height: 28px; margin: 0 0 0 4px; font-size: 20px; line-height: 28px; color: #b8b6b4; }
    .s03-shop-card-price { display: flex; justify-content: space-between; align-items: center; height: 44px; margin: 0 4px; }
    .s03-shop-card-price strong { font-size: 28px; line-height: 44px; font-weight: 700; color: #ffd873; }
    .s03-shop-card-price svg { width: 36px; height: 36px; padding: 6px; border: 1px solid rgba(255, 216, 115, 0.45); border-radius: 50%; color: #ffd873; }
    .s03-shop-more { height: 108px; overflow: hidden; }
    .s03-shop-more .s03-shop-photo { width: 188px; height: 188px; }
    #s03-click-ring { position: absolute; left: 290px; top: 820px; width: 64px; height: 64px; border: 3px solid #ffe14d; border-radius: 50%; pointer-events: none; }
    #s03-shop-cursor { position: absolute; left: 0; top: 0; width: 52px; height: 64px; pointer-events: none; }
    #s03-title { left: 0; right: 0; top: 470px; text-align: center; }
    #s03-title .a { font-family: "Smiley Sans", sans-serif; font-weight: 500; font-size: 200px; line-height: 1; color: #ffd873; text-shadow: 0 0 50px rgba(232, 184, 74, 0.45); }
    #s03-title .b { margin-top: 24px; font-size: 56px; font-weight: 800; }
    #s03-title .c { margin-top: 12px; font-family: "Smiley Sans", sans-serif; font-style: italic; font-size: 36px; color: rgba(242, 242, 240, 0.6); }
    #s03-next { left: 0; right: 0; top: 450px; text-align: center; font-size: 96px; font-weight: 800; }
    #s03-next .hi { font-family: "Smiley Sans", sans-serif; }
    #s03-next3 { left: 180px; top: 850px; width: 720px; height: 310px; }
    #s03-number-links { position: absolute; left: 0; top: 0; width: 720px; height: 250px; overflow: visible; }
    .s03-number-link { fill: none; stroke: #e8b84a; stroke-width: 3; stroke-linecap: round; }
    .s03-number-node { position: absolute; width: 104px; height: 104px; border: 2px solid rgba(242,242,240,.4); border-radius: 50%; background: #12110f; color: #f2f2f0; display: flex; align-items: center; justify-content: center; font-size: 44px; line-height: 1; }
    #s03-number-note { position: absolute; left: 0; right: 0; top: 265px; text-align: center; font-size: 32px; line-height: 1.3; color: #c7c4bd; }
    #s03-next2 { left: 0; right: 0; top: 700px; text-align: center; font-family: "Smiley Sans", sans-serif; font-size: 52px; color: rgba(242, 242, 240, 0.55); }
  `,html:{"s03-users":'<div id="s03-users"></div>',"s03-rows":'<div id="s03-rows"></div>',"s03-cells":'<div id="s03-cells"></div>',"s03-rowbox":'<div id="s03-rowbox"></div>',"s03-vecn":'<div id="s03-vecn" class="ab"><span class="k gold">\u732B\u7CAE</span> = ( <span id="s03-bits"></span> )</div>',"s03-vecl":'<div id="s03-vecl" class="ab gold">\u2191 \u4E00\u4E32\u6570\u5B57 = \u4E00\u4E2A\u5411\u91CF</div>',"s03-many":'<div id="s03-many" class="ab"><span class="num" id="s03-cnt">3</span><span class="u"> \u7EF4</span></div>',"s03-dim":'<div id="s03-dim" class="ab"><span id="s03-dim-value">\u4E8C\u7EF4</span></div>',"s03-space-note":'<div id="s03-space-note" class="ab">\u5546\u54C1\u5411\u91CF \xB7 \u4F4E\u7EF4\u793A\u610F</div>'},T:{ex:.245,order:2.305,one:4.905,zero:6.325,rest:7.745,row:10.405,vec:13.385,two:14.465,three:16.005,many:17.885,calc:20.205,close:25.355,near:28.225,far:29.825,wide:32.365,buy:33.675,rec:35.035,cf:36.855,text:40.395,how:42.115,insight:44.705,understand:45.775,end:47.165}},"s04-embedding":{css:`
    /*VIZCSS*/

#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/
    .s04-tok { position: absolute; top: 200px; height: 110px; line-height: 106px; text-align: center; font-size: 72px; font-weight: 800; border: 2.5px solid rgba(232, 184, 74, 0); border-radius: 16px; white-space: nowrap; }
    #s04-toks .s04-tok { top: 192px; }
    .s04-token-id { position: absolute; top: 330px; width: 180px; text-align: center; }
    .s04-token-id .token-label { font-size: 32px; line-height: 44px; color: #b8bcc6; }
    .s04-token-id .token-number { margin-top: 8px; font-family: "Smiley Sans", sans-serif; font-style: italic; font-size: 46px; line-height: 60px; color: #ffd873; }
    #s04-model { left: 72px; top: 506px; width: 936px; height: 128px; display: flex; align-items: center; justify-content: center; font-size: 44px; line-height: 56px; font-weight: 800; }
    #s04-model .model-label { display: flex; align-items: baseline; gap: 24px; white-space: nowrap; }
    #s04-model .serif { font-size: 32px; line-height: 40px; font-style: italic; font-weight: 500; color: #ffd873; }
    #s04-vector-table { left: 72px; top: 686px; width: 936px; }
    .s04-token-id sub, .s04-row-id sub { font-size: 0.65em; vertical-align: -0.22em; line-height: 0; }
    .s04-table-title { height: 46px; margin-bottom: 26px; font-size: 32px; line-height: 46px; font-weight: 600; color: #b8bcc6; }
    .s04-vector-row { position: relative; height: 52px; display: grid; grid-template-columns: 96px 1fr; gap: 20px; align-items: center; border-bottom: 2px solid rgba(242, 242, 240, 0.16); }
    .s04-vector-row:first-child { border-top: 2px solid rgba(242, 242, 240, 0.16); }
    .s04-row-id { padding-left: 12px; font-family: "Smiley Sans", sans-serif; font-style: italic; font-size: 38px; line-height: 48px; color: #b8bcc6; }
    .s04-vector-row.selected .s04-row-id { color: #ffd873; }
    .s04-vector-row.selected { background: rgba(232, 184, 74, 0.055); }
    .s04-vector-row svg { display: block; width: 100%; height: 48px; }
    .s04-col { position: absolute; width: 150px; }
    .s04-cell { height: 52px; margin-bottom: 8px; border-radius: 8px; text-align: center; line-height: 52px; font-family: "Smiley Sans", sans-serif; font-size: 32px; }
    #s04-pool .s04-cell { height: 60px; margin-bottom: 10px; line-height: 60px; font-size: 40px; }
    .s04-w { position: absolute; box-sizing: border-box; padding: 10px 22px; border-radius: 999px; border: 2px solid rgba(242, 242, 240, 0.35); background: rgba(16, 15, 18, 0.95); font-size: 38px; line-height: 1.448; font-weight: 700; white-space: nowrap; text-align: center; }
    #s04-wc { padding: 18px 40px; font-size: 64px; border-color: #ffe14d; color: #ffe14d; box-shadow: 0 0 40px rgba(255, 225, 77, 0.35); }
    #s04-company { left: 0; right: 0; top: 1150px; text-align: center; font-size: 36px; font-weight: 700; color: #ffd873; }
    #s04-space { left: 70px; top: 650px; width: 940px; height: 500px; border: 0; background: none; box-shadow: none; }
    .s04-cl { position: absolute; width: 240px; text-align: center; font-size: 28px; font-weight: 600; color: rgba(242, 242, 240, 0.5); letter-spacing: 0.1em; }
    .s04-example { position: absolute; top: 248px; width: 400px; height: 744px; text-align: center; }
    .s04-picture { width: 400px; height: 540px; box-sizing: border-box; overflow: hidden; border: 0; border-radius: 0; background: none; }
    .s04-picture img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .s04-example .ex-sentence { position: absolute; left: 0; right: 0; top: 580px; font-size: 44px; line-height: 64px; font-weight: 700; }
    .s04-example .ex-key { position: absolute; left: 0; right: 0; top: 652px; font-size: 64px; line-height: 92px; font-weight: 800; }
    #s04-neq { left: 488px; top: 466px; width: 104px; height: 104px; line-height: 104px; text-align: center; font-size: 104px; font-weight: 800; color: #ffe14d; text-shadow: 0 0 24px rgba(255, 225, 77, 0.35); }

    #s04-apw { left: 0; right: 0; top: 520px; text-align: center; }
    #s04-apw .s04-q2 { margin-top: 40px; font-size: 48px; font-weight: 700; color: #ffd873; }
    .s04-at { position: absolute; height: 96px; line-height: 92px; padding: 0 22px; border-radius: 14px; border: 2px solid rgba(242, 242, 240, 0.3); font-size: 54px; font-weight: 800; white-space: nowrap; text-align: center; }
    .s04-at.key { border-color: #ffe14d; color: #ffe14d; }
    #s04-ctx { left: 0; right: 0; top: 1130px; text-align: center; font-size: 36px; font-weight: 700; color: rgba(242, 242, 240, 0.75); }
    #s04-year { left: 90px; top: 780px; font-size: 200px; }
    #s04-yl { left: 96px; top: 1000px; font-size: 34px; line-height: 1.5; }
    #s04-yl .serif { font-style: italic; font-size: 40px; }
    #s04-sv { left: 0; right: 0; top: 1110px; text-align: center; font-size: 40px; font-weight: 800; color: #ffd873; }
    #s04-step { left: 0; right: 0; top: 120px; display: flex; align-items: center; justify-content: center; gap: 12px; line-height: 1; font-size: 34px; color: rgba(242, 242, 240, 0.6); }
    #s04-step .num { font-size: 72px; color: #ffd873; }
    .s04-cmp { position: absolute; top: 250px; width: 440px; height: 860px; border-radius: 22px; border: 2px solid rgba(242, 242, 240, 0.25); background: rgba(16, 15, 18, 0.9); }
    .s04-cmp .k-t { margin-top: 40px; text-align: center; font-size: 50px; font-weight: 800; }
    .s04-cmp .k-s { margin-top: 18px; text-align: center; font-size: 32px; color: rgba(242, 242, 240, 0.65); }
    .s04-cmp .k-row { position: absolute; left: 40px; right: 40px; top: 310px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .s04-cmp .k-c { height: 150px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-family: "Smiley Sans", sans-serif; font-size: 26px; color: rgba(242, 242, 240, 0.6); }
    .s04-cmp .k-v { position: absolute; left: 30px; right: 30px; top: 540px; text-align: center; font-family: "Smiley Sans", sans-serif; font-size: 40px; }
    .s04-cmp .k-f { position: absolute; left: 30px; right: 30px; bottom: 40px; text-align: center; font-size: 36px; font-weight: 800; }
  `,html:{"s04-graph":'<div id="s04-graph"></div>',"s04-att":'<div id="s04-att"></div>',"s04-sheet":`<div id="s04-sheet" class="sheet" data-layout-ignore="">
        <div class="sh-side">arXiv:1706.03762</div>
        <div class="sh-title">Attention Is All You Need</div>
        <div class="sh-auth">
          <div class="me"><b>Ashish Vaswani</b><i>Google Brain</i></div>
          <div><b>Noam Shazeer</b><i>Google Brain</i></div>
          <div><b>Niki Parmar</b><i>Google Research</i></div>
          <div><b>Jakob Uszkoreit</b><i>Google Research</i></div>
          <div><b>Llion Jones</b><i>Google Research</i></div>
          <div><b>Aidan N. Gomez</b><i>University of Toronto</i></div>
          <div><b>\u0141ukasz Kaiser</b><i>Google Brain</i></div>
          <div><b>Illia Polosukhin</b><i>&nbsp;</i></div>
        </div>
        <div class="sh-head">Abstract</div>
        <div class="sh-abs">The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.</div>
        <div class="sh-foot">31st Conference on Neural Information Processing Systems (NIPS 2017), Long Beach, CA, USA.</div>
        <div class="tape" style="left: 345px; top: -18px; transform: rotate(-3deg)"></div>
      </div>`,"s04-step":'<div id="s04-step" class="ab">\u8BAD\u7EC3 step <span class="num" id="s04-stepn">0</span></div>',"s04-fig":'<div id="s04-fig" class="polaroid"><div class="pin"></div><div style="width: 300px; height: 440px; background: #fff; display: flex; align-items: center; justify-content: center"><img src="__TRANSFORMER__" style="width: 290px"></div><div class="pl-cap" style="font-size: 26px">Transformer \u7ED3\u6784\u56FE</div><div class="pl-credit">Figure: Google \xB7 CC BY-SA 4.0</div></div>',"s04-year":'<div id="s04-year" class="big-num">2017</div>',"s04-yl":'<div id="s04-yl" class="ab"><span class="serif">Vaswani et al.</span><br>\u8C37\u6B4C \xB7 NIPS 2017</div>'},T:{model:.24,emb:2.3,tok:3.54,map:7.06,firth:8.94,see:11.9,know:14,miko:15.92,train0:18.76,poly:21.12,eat:23.58,buyp:25.18,diff:26.62,att:28.6,ctxw:31.52,paper:34.7,title:37.22,fruit:39.74,elec:42.18,pool:43.8,sent:45.64,train:46.88,closer:49.64,same:52.68,dim:54.76,shift:55.4,feat:56.86,end:59.105}},"s07-rerank":{css:`
    /*VIZCSS*/

#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/



    #s07-big { left: 0; right: 0; top: 400px; text-align: center; }
    #s07-big .n { font-family: "Smiley Sans", sans-serif; font-weight: 500; font-size: 300px; line-height: 1; color: #ffd873; text-shadow: 0 0 60px rgba(232, 184, 74, 0.5); }
    #s07-big .t { margin-top: 20px; font-size: 80px; font-weight: 800; }
    #s07-big .e { margin-top: 10px; font-family: "Smiley Sans", sans-serif; font-size: 64px; color: rgba(242, 242, 240, 0.7); }



    .s07-pl { position: absolute; box-sizing: border-box; left: 70px; width: 940px; border-radius: 22px; border: 2px solid rgba(242, 242, 240, 0.22); background: rgba(16, 15, 18, 0.9); }
    .s07-pl .pl-t { position: absolute; left: 30px; top: 20px; font-size: 30px; font-weight: 700; color: rgba(242, 242, 240, 0.6); }
    .s07-box { position: absolute; box-sizing: border-box; height: 80px; line-height: 76px; padding: 0 22px; border-radius: 14px; border: 2px solid rgba(242, 242, 240, 0.35); font-size: 34px; font-weight: 700; white-space: nowrap; background: #141317; text-align: center; }
    .s07-box.input { width: 290px; }
    .s07-box.recall { width: 248px; padding: 0 12px; font-size: 30px; }
    .s07-box.encoder { width: 132px; padding: 0 12px; font-size: 30px; }
    .s07-box.enc { border-color: rgba(184, 188, 198, 0.7); color: #d6d9e0; }
    .s07-box.cos { width: 190px; padding: 0; border: 0; line-height: 80px; background: none; font-size: 28px; }
    .s07-box.ce { width: 340px; border-color: #ffe14d; color: #ffe14d; font-size: 40px; }
    #s07-silk { position: absolute; left: 160px; top: 850px; width: 760px; height: 86px; pointer-events: none; }
    #s07-feed-silk { position: absolute; left: 522px; top: 908px; width: 36px; height: 88px; pointer-events: none; }
    #s07-x { left: 0; right: 0; top: 470px; text-align: center; font-size: 34px; font-weight: 700; color: rgba(242, 242, 240, 0.5); }
    #s07-score { left: 800px; top: 980px; width: 210px; font-size: 92px; line-height: 120px; text-align: center; }
    #s07-scl { left: 800px; top: 932px; width: 210px; line-height: 36px; text-align: center; font-size: 26px; color: rgba(242, 242, 240, 0.55); }
    .s07-fl { position: absolute; left: 0; right: 0; text-align: center; font-weight: 800; white-space: nowrap; }
    .s07-fl .f-label { font-size: 40px; line-height: 54px; }
    .s07-fl .f-value { display: flex; justify-content: center; align-items: baseline; gap: 14px; margin-top: 4px; font-size: 30px; line-height: 90px; }
    .s07-fl .f-value .num { font-size: 76px; }
    #s07-f0 { top: 280px; }
    #s07-f1 { top: 514px; }
    #s07-f1 .f-value { line-height: 82px; }
    #s07-f1 .f-value .num { font-size: 68px; }
    #s07-f2 { top: 756px; color: #211a0c; }
    #s07-f2 .f-label { font-size: 46px; line-height: 60px; }
    #s07-f2 .f-en { font-family: "Smiley Sans", sans-serif; font-size: 28px; line-height: 38px; letter-spacing: 0.04em; }
    #s07-f2 .f-label, #s07-f2 .f-en { width: fit-content; margin: 0 auto; background: #e8b84a; }
    #s07-fnote { top: 1058px; font-size: 36px; line-height: 44px; }
    #s07-fnote small { display: block; margin-top: 6px; font-size: 28px; line-height: 38px; font-weight: 500; color: #b8bcc6; }
    #s07-chart { position: absolute; left: 90px; top: 246px; width: 900px; height: 704px; opacity: 0; }
    #s07-lt { left: 0; top: 56px; font-size: 30px; line-height: 44px; color: #b8bcc6; }
    #s07-axis { position: absolute; left: 318px; top: 56px; width: 480px; height: 648px; }
    .s07-tick { position: absolute; top: 0; width: 64px; margin-left: -32px; text-align: center; font-size: 30px; line-height: 44px; color: #b8bcc6; }
    .s07-grid { position: absolute; top: 48px; bottom: 0; width: 1px; background: rgba(189,200,219,.66); }
    .s07-row { position: absolute; left: 0; top: 124px; width: 900px; height: 80px; display: grid; grid-template-columns: 306px 480px 90px; column-gap: 12px; align-items: center; white-space: nowrap; }
    .s07-row .w { font-size: 40px; line-height: 80px; }
    .s07-row .bar { height: 44px; border-radius: 5px; background: rgba(184,188,198,.07); position: relative; }
    .s07-row .bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 5px; background: linear-gradient(90deg,#a87a22,#ffd873); transform-origin: 0 50%; }
    .s07-row .num { width: 90px; text-align: right; font-size: 52px; line-height: 80px; color: #ffd873; font-variant-numeric: tabular-nums; }
    #s07-thline { position: absolute; left: 557px; top: 104px; width: 2px; height: 600px; background: repeating-linear-gradient(to bottom,#ffe14d 0 10px,transparent 10px 18px); transform-origin: 50% 0; pointer-events: none; }
    #s07-thl { left: 478px; top: 0; width: 160px; text-align: center; line-height: 44px; font-size: 30px; color: #ffe14d; }
    .s07-flow-card { position: absolute; box-sizing: border-box; padding: 0; }
    .s07-flow-label { display: flex; align-items: center; justify-content: center; gap: 12px; color: #b8bcc6; font-size: 28px; line-height: 40px; font-weight: 600; }
    .s07-flow-label svg { display: block; flex: none; }
    .s07-flow-copy { height: 112px; margin-top: 18px; display: flex; flex-direction: column; justify-content: center; text-align: center; font-size: 40px; line-height: 56px; font-weight: 750; white-space: nowrap; }
    #s07-in1 { left: 100px; top: 220px; width: 400px; height: 170px; }
    #s07-in2 { left: 580px; top: 220px; width: 400px; height: 170px; }
    #s07-in2 .s07-flow-copy { font-size: 36px; }
    #s07-llm { left: 360px; top: 522px; width: 360px; height: 430px; display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 48px; line-height: 62px; }
    #s07-llm img { display: block; width: 360px; height: 360px; object-fit: contain; flex: none; }
    #s07-ans { left: 100px; top: 1032px; width: 880px; height: 134px; }
    #s07-ans .s07-flow-label { color: #e8b84a; }
    #s07-ans .s07-answer-copy { margin-top: 18px; display: flex; align-items: baseline; justify-content: center; gap: 10px; white-space: nowrap; font-size: 34px; line-height: 76px; }
    #s07-ans strong { font-size: 52px; font-weight: 800; }
  `,html:{},T:{second:.3,rr:2,ce:3.67,tf:5.91,sep:8,tog:10.31,score:13.13,fine:16.19,few:19.37,sort:23.07,th:25.69,llm:28.31,gen:32.75,end:33.99}},"s08-outro":{css:`
    /*VIZCSS*/

#root {
  font-synthesis: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Smiley Sans", sans-serif;
  color: #f2f2f0;
}
.vz {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
}
.scene-viewport,
.scene-stage {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.ab {
  position: absolute;
  white-space: nowrap;
}
.plate {
  position: absolute;
  border: 1.5px solid rgba(242, 242, 240, 0.72);
}
.plate > .pt {
  position: absolute;
  left: 0;
  right: 0;
  top: -30px;
  text-align: center;
  line-height: 56px;
  white-space: nowrap;
}
.plate > .pt > span {
  display: inline-block;
  padding: 0 20px;
  background: #050505;
  font-size: 42px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.01em;
}
.lbl {
  position: absolute;
  white-space: nowrap;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 30px;
  color: #e8b84a;
}
.zh-lbl {
  position: absolute;
  white-space: nowrap;
  font-size: 32px;
  font-weight: 600;
  color: #f2f2f0;
}
.num {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
}
.gold {
  color: #e8b84a;
}
.hi {
  color: #ffe14d;
}
.dim {
  color: rgba(242, 242, 240, 0.5);
}
.serif {
  font-family: "Smiley Sans", sans-serif;
}
.big-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
  font-weight: 700;
  font-size: 84px;
  letter-spacing: 0.02em;
}
.paper {
  position: absolute;
  width: 600px;
  height: 780px;
  padding: 54px 52px;
  background: linear-gradient(160deg, #1b1b1e 0%, #121214 60%, #0d0d0f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.8);
  font-family: "Smiley Sans", sans-serif;
  color: rgba(236, 236, 232, 0.86);
  white-space: normal;
}
.paper .pp-venue {
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232, 184, 74, 0.85);
  text-align: center;
}
.paper .pp-title {
  margin-top: 26px;
  font-size: 40px;
  line-height: 1.15;
  text-align: center;
  color: #f2f2f0;
}
.paper .pp-auth {
  margin-top: 22px;
  font-size: 22px;
  line-height: 1.35;
  text-align: center;
  font-style: italic;
  color: rgba(236, 236, 232, 0.7);
}
.paper .pp-head {
  margin-top: 34px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}
.paper .pp-abs {
  margin-top: 12px;
  font-size: 19px;
  line-height: 1.45;
  text-align: justify;
  color: rgba(236, 236, 232, 0.66);
}
.paper .pp-bar {
  height: 7px;
  margin-top: 13px;
  border-radius: 2px;
  background: rgba(236, 236, 232, 0.13);
}
.cite {
  position: absolute;
  white-space: nowrap;
}
.cite .c-year {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 96px;
  line-height: 1;
  color: #e8b84a;
}
.cite .c-who {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 46px;
  color: #f2f2f0;
}
.cite .c-what {
  margin-top: 6px;
  font-size: 28px;
  color: rgba(242, 242, 240, 0.6);
}
.archive {
  position: absolute;
  width: 900px;
  padding: 34px 40px 38px 40px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 60%),
    linear-gradient(170deg, #efe6d2 0%, #e4d8bd 70%, #d9caa9 100%);
  color: #221d16;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), inset 0 0 60px rgba(120, 90, 40, 0.18);
  white-space: normal;
}
.archive .ar-tag {
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  letter-spacing: 0.28em;
  color: rgba(34, 29, 22, 0.6);
  border-bottom: 1.5px solid rgba(34, 29, 22, 0.25);
  padding-bottom: 10px;
}
.archive .ar-body {
  display: flex;
  gap: 36px;
  margin-top: 26px;
}
.archive .ar-photo {
  position: relative;
  flex: none;
  width: 268px;
  height: 330px;
  padding: 12px 12px 40px 12px;
  background: #f8f5ee;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  transform: rotate(-2.5deg);
}
.archive .ar-photo img,
.archive .ar-photo svg {
  display: block;
  width: 244px;
  height: 278px;
  object-fit: cover;
}
.archive .ar-photo .ar-credit {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  font-size: 15px;
  line-height: 1.2;
  color: rgba(34, 29, 22, 0.6);
  white-space: nowrap;
  overflow: hidden;
}
.archive .ar-info {
  flex: 1;
  min-width: 0;
}
.archive .ar-role {
  font-size: 26px;
  color: rgba(34, 29, 22, 0.7);
}
.archive .ar-name {
  margin-top: 6px;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 54px;
  line-height: 1.05;
}
.archive .ar-org {
  margin-top: 8px;
  font-size: 24px;
  color: rgba(34, 29, 22, 0.75);
}
.archive .ar-rule {
  height: 1.5px;
  margin: 20px 0 16px;
  background: rgba(34, 29, 22, 0.22);
}
.archive .ar-paper {
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 34px;
  line-height: 1.18;
}
.archive .ar-venue {
  margin-top: 10px;
  font-family: "Smiley Sans", sans-serif;
  font-size: 22px;
  line-height: 1.3;
  color: rgba(34, 29, 22, 0.72);
}
.archive .stamp {
  position: absolute;
  right: 40px;
  bottom: 30px;
  padding: 4px 26px;
  border: 3px solid rgba(166, 52, 38, 0.85);
  border-radius: 50%;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: rgba(166, 52, 38, 0.9);
  transform: rotate(-9deg);
  box-shadow: inset 0 0 0 4px rgba(239, 230, 210, 1), inset 0 0 0 5.5px rgba(166, 52, 38, 0.6);
}
.sheet {
  position: absolute;
  width: 860px;
  padding: 46px 56px 40px 70px;
  background: linear-gradient(175deg, #f6f3ec 0%, #ece7dc 100%);
  color: #16130f;
  font-family: "Smiley Sans", sans-serif;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75);
  white-space: normal;
}
.sheet .sh-title {
  font-weight: 700;
  font-size: 50px;
  line-height: 1.12;
  text-align: center;
}
.sheet .sh-auth {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-top: 26px;
  text-align: center;
  font-size: 20px;
  line-height: 1.2;
}
.sheet .sh-auth b {
  display: block;
  font-size: 22px;
}
.sheet .sh-auth i {
  font-style: normal;
  color: rgba(22, 19, 15, 0.6);
  font-size: 17px;
}
.sheet .sh-auth .me {
  box-shadow: inset 0 -10px 0 rgba(255, 225, 77, 0.75);
}
.sheet .sh-head {
  margin-top: 26px;
  text-align: center;
  font-weight: 700;
  font-size: 26px;
}
.sheet .sh-abs {
  margin-top: 8px;
  font-size: 21px;
  line-height: 1.42;
  text-align: justify;
  color: rgba(22, 19, 15, 0.82);
}
.sheet .sh-foot {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(22, 19, 15, 0.3);
  font-size: 17px;
  color: rgba(22, 19, 15, 0.7);
}
.sheet .sh-side {
  position: absolute;
  left: 22px;
  top: 50%;
  font-size: 18px;
  color: rgba(22, 19, 15, 0.45);
  transform: translate(-50%, -50%) rotate(-90deg) translateY(16px);
  white-space: nowrap;
}
.tape {
  position: absolute;
  width: 170px;
  height: 40px;
  background: rgba(240, 232, 205, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.polaroid {
  position: absolute;
  padding: 14px 14px 58px 14px;
  background: #f7f4ec;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.7);
}
.polaroid img {
  display: block;
  object-fit: cover;
}
.polaroid .pl-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  color: #221d16;
  white-space: nowrap;
}
.polaroid .pl-credit {
  position: absolute;
  right: 14px;
  bottom: 2px;
  font-size: 12px;
  color: rgba(34, 29, 22, 0.45);
  white-space: nowrap;
}
.pin {
  position: absolute;
  left: 50%;
  top: -12px;
  width: 30px;
  height: 30px;
  margin-left: -15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff2c0 0%, #f0c050 35%, #a8741c 100%);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.55);
}
.chip {
  position: absolute;
  padding: 14px 30px;
  border: 2px solid rgba(232, 184, 74, 0.9);
  border-radius: 14px;
  background: rgba(14, 12, 8, 0.92);
  font-size: 42px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0 30px rgba(232, 184, 74, 0.18);
}
.chip.ghost {
  border-color: rgba(242, 242, 240, 0.35);
  box-shadow: none;
}
.bubble {
  position: absolute;
  padding: 22px 34px;
  border-radius: 34px;
  font-size: 44px;
  font-weight: 700;
  white-space: nowrap;
}
.bubble.me {
  background: #e8b84a;
  color: #120f08;
  border-bottom-right-radius: 8px;
}
.bubble.doc {
  background: #17161a;
  border: 2px solid rgba(242, 242, 240, 0.3);
  border-bottom-left-radius: 8px;
}
.bubble .b-tag {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 500;
  opacity: 0.65;
}
.big-num {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-weight: 500;
  line-height: 1;
  color: #ffd873;
  text-shadow: 0 0 40px rgba(232, 184, 74, 0.5);
  white-space: nowrap;
}
.fx {
  position: absolute;
  font-family: "Smiley Sans", sans-serif;
  font-style: italic;
  font-size: 64px;
  white-space: nowrap;
  color: #f2f2f0;
}
.fx .box {
  padding: 0 10px;
  border: 2.5px solid #e8b84a;
  border-radius: 8px;
}
.note {
  position: absolute;
  font-size: 30px;
  font-weight: 600;
  color: #e8b84a;
  white-space: nowrap;
}
.tag {
  position: absolute;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  white-space: nowrap;
}
.tag.ok {
  background: rgba(255, 225, 77, 0.16);
  color: #ffe14d;
  border: 1.5px solid rgba(255, 225, 77, 0.7);
}
.tag.no {
  background: rgba(242, 242, 240, 0.06);
  color: rgba(242, 242, 240, 0.6);
  border: 1.5px solid rgba(242, 242, 240, 0.3);
}
svg.full {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1440px;
  overflow: visible;
}
svg .ln {
  fill: none;
  stroke: #f2f2f0;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .ln.gold {
  stroke: #e8b84a;
}
svg .ln.hi {
  stroke: #ffe14d;
}
svg .ln.dim {
  stroke: rgba(242, 242, 240, 0.3);
}
svg .glow {
  filter: drop-shadow(0 0 8px rgba(255, 216, 115, 0.75));
}
svg text {
  font-family: "Smiley Sans", sans-serif;
  fill: #f2f2f0;
}
/*/VIZCSS*/
    #s08-c1 { left: 110px; top: 250px; font-size: 54px; }
    #s08-c2 { right: 110px; top: 250px; font-size: 54px; }
    #s08-num { left: 0; right: 0; top: 820px; text-align: center; font-size: 190px; }
    #s08-g { left: 0; top: 0; width: 1080px; height: 1440px; transform-origin: 540px 300px; }
    .s08-st { position: absolute; left: 110px; height: 150px; width: 860px; border-radius: 24px; display: flex; align-items: center; gap: 30px; padding: 0 40px; font-size: 54px; font-weight: 800; white-space: nowrap; }
    #s08-s1 { top: 720px; border: 2px dashed rgba(242, 242, 240, 0.3); color: rgba(242, 242, 240, 0.5); }
    #s08-s1 s { text-decoration-thickness: 4px; }
    .s08-big { position: absolute; left: 120px; right: 120px; text-align: center; font-size: 130px; line-height: 176px; font-weight: 800; white-space: nowrap; }
    .s08-big .hi { font-family: "Smiley Sans", sans-serif; text-shadow: 0 0 40px rgba(255, 225, 77, 0.5); }
    .s08-big .s08-en { margin-top: 8px; font-size: 46px; line-height: 64px; font-weight: 400; color: #b8bcc6; }
    #s08-avatar { left: 290px; top: 250px; width: 500px; height: 500px; transform-origin: 50% 50%; }
    #s08-avatar img { display: block; width: 100%; height: 100%; object-fit: contain; mask-image: linear-gradient(to bottom, #000 78%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%); }
    #s08-name { left: 0; right: 0; top: 796px; text-align: center; font-size: 64px; line-height: 88px; }
    #s08-name span { color: #ffd873; }
    #s08-farewell { left: 0; right: 0; top: 906px; text-align: center; font-size: 44px; line-height: 64px; color: #b8bcc6; }
    .s08-action { position: absolute; top: 1056px; width: 180px; height: 152px; color: #f2f2f0; text-align: center; transform-origin: 90px 40px; }
    .s08-action-icon { display: block; width: 80px; height: 80px; margin: 0 auto; overflow: visible; }
    .s08-action-icon path { fill: #e8b84a; fill-opacity: 0; stroke: currentColor; stroke-width: 0.8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
    .s08-action-label { margin-top: 12px; font-size: 38px; line-height: 60px; }
    .s08-action-burst { position: absolute; left: -10px; top: -60px; width: 200px; height: 120px; overflow: visible; pointer-events: none; }
    .s08-action-burst line { stroke: #ffd873; stroke-width: 3; stroke-linecap: round; }
  `,html:{"s08-avatar":'<div id="s08-avatar" class="ab"><img id="s08-avatar-float" src="__AVATAR__" width="500" height="500" alt="Wise \u4EBA\u7269\u5934\u50CF"></div>',"s08-name":'<div id="s08-name" class="ab">\u6211\u662F <span>Wise</span></div>',"s08-farewell":'<div id="s08-farewell" class="ab">\u6211\u4EEC\u4E0B\u4E00\u671F\u518D\u89C1</div>',"s08-action0":'<div id="s08-action0" class="s08-action" style="left: 220px"><svg class="s08-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path></svg><svg class="s08-action-burst" viewBox="0 0 200 120" aria-hidden="true"></svg><div class="s08-action-label">\u70B9\u8D5E</div></div>',"s08-action1":'<div id="s08-action1" class="s08-action" style="left: 450px"><svg class="s08-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4"></path></svg><svg class="s08-action-burst" viewBox="0 0 200 120" aria-hidden="true"></svg><div class="s08-action-label">\u6536\u85CF</div></div>',"s08-action2":'<div id="s08-action2" class="s08-action" style="left: 680px"><svg class="s08-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M16 19h6 M19 16v6 M6 21v-2a4 4 0 0 1 4 -4h4"></path></svg><svg class="s08-action-burst" viewBox="0 0 200 120" aria-hidden="true"></svg><div class="s08-action-label">\u5173\u6CE8</div></div>'},T:{so:.34,why:2.88,val:4.02,because:5.3,never:7.35,s1:9.42,s2:11.11,intro:13.11,bye:13.85,end:17.03}}};var sn=(()=>{let S="http://www.w3.org/2000/svg",d=a=>Math.max(0,Math.min(1,a)),G=a=>(a=d(a),a*a*(3-2*a)),C=(a,x,h)=>a+(x-a)*h,i=.5517241379310346,o=16,E=.38,B=0;function Y(a){return G(a/i)}let v=a=>x=>Y(x,a),L=(a,x,h)=>{let $=h.ownerDocument.createElementNS(S,a);for(let[z,k]of Object.entries(x))$.setAttribute(z,k);return a==="path"&&($.style.strokeDasharray="none",$.style.strokeDashoffset="0"),h.appendChild($),$},M=(a,x)=>{(a._lineGrowth||(a._lineGrowth=[])).push(x)};function R(a,x){let h=a/x,$=h>=i&&h<1;return{p:Y(h),holding:$,charge:$?G((h-i)/(1-i)):0,burstAge:a-x,active:a>=0&&a<x+E}}let u=a=>a.holding?.4*a.charge:a.burstAge>=0?.9*Math.pow(d(1-a.burstAge/.18),2):0;function P(a,x,h=1){let $=[];for(let z=0;z<o;z++){let k=.24+z%5*.03,q=a-z%3*.008;if(q<=0||q>=k)continue;let y=x+(z%2?1:-1)*(.35+z*7%11*.17),U=(72+z*37%110)*h,t=.8+z%7*.2,c=m=>{let f=-Math.expm1(-t*m)/t;return[Math.cos(y)*U*f,Math.sin(y)*U*f+80*h*m*m]};$.push({head:c(q),tail:c(Math.max(0,q-.016-.035*(1-q/k))),alpha:Math.pow(1-q/k,.8)*.8})}return $}function O(a,x,h=null){let $=L("g",{"data-line-growth":"","data-layout-ignore":"","pointer-events":"none",opacity:0},a),z=L("defs",{},$),k=`line-growth-${++B}`,q=L("linearGradient",{id:k,gradientUnits:"userSpaceOnUse"},z),y=h?._shaft?.getAttribute("stroke")||h?.style?.stroke||h?.getAttribute("stroke")||(h?getComputedStyle(h).stroke:"#e8b84a"),U=/196|242|214|f2f2|ddd|d3d|c9c|d6d9|b8bc|8589|fff|white|silver/i.test(y);L("stop",{offset:0,"stop-color":U?"#9aa8b5":"#e8b84a","stop-opacity":0},q),L("stop",{offset:".7","stop-color":U?"#dbe5eb":"#ffe4a0","stop-opacity":".72"},q),L("stop",{offset:1,"stop-color":"#fffdf4","stop-opacity":1},q);let t=`${k}-glow`,c=L("radialGradient",{id:t},z);L("stop",{offset:0,"stop-color":"#fffdf4","stop-opacity":1},c),L("stop",{offset:".16","stop-color":"#fffdf4","stop-opacity":".85"},c),L("stop",{offset:".42","stop-color":U?"#dbe5eb":"#ffe4a0","stop-opacity":".22"},c),L("stop",{offset:1,"stop-color":U?"#9aa8b5":"#e8b84a","stop-opacity":0},c);let m=L("path",{fill:"none",stroke:`url(#${k})`,"stroke-width":3,opacity:".26","stroke-linecap":"round"},$),f=L("path",{fill:"none",stroke:`url(#${k})`,"stroke-width":1.25,"stroke-linecap":"round"},$),N=h?._shaft?null:L("circle",{r:9,fill:`url(#${t})`,opacity:0},$),n=Array.from({length:o},(r,p)=>{let s=`${k}-tail-${p}`,e=L("linearGradient",{id:s,gradientUnits:"userSpaceOnUse"},z);return L("stop",{offset:0,"stop-color":U?"#9aa8b5":"#dda746","stop-opacity":0},e),L("stop",{offset:".55","stop-color":U?"#dbe5eb":"#ffdda0","stop-opacity":".7"},e),L("stop",{offset:1,"stop-color":"#fff9e9","stop-opacity":1},e),{gradient:e,el:L("path",{fill:"none",stroke:`url(#${s})`,"stroke-width":p%5?".55":".85","stroke-linecap":"round"},$)}});return(r,p,s=!1)=>{let e=R(r,p);if(!e.active){$.setAttribute("opacity",0);return}if(h&&!h._shaft){let J=h.style.opacity||h.getAttribute("opacity")||1;$.setAttribute("opacity",J);let nn=h.getAttribute("transform");nn?$.setAttribute("transform",nn):$.removeAttribute("transform")}else $.setAttribute("opacity",1);let l=x(),b=s?1:e.p,g=Math.min(.24,28/Math.max(1,l.length)),I=b*(e.holding?C(.55,1,e.charge):1),w=Math.max(0,I-g),j=[];for(let J=0;J<=6;J++)j.push(l.at(C(w,I,J/6)));let H=j[0],W=j[6];q.setAttribute("x1",H[0]),q.setAttribute("y1",H[1]),q.setAttribute("x2",W[0]+.01),q.setAttribute("y2",W[1]+.01);let K=j.map((J,nn)=>`${nn?"L":"M"}${J[0]} ${J[1]}`).join(""),Q=r>=p?0:e.holding?Math.sin(Math.PI*e.charge):.8;for(let J of[f,m])J.setAttribute("d",K),J.style.opacity=J===m?Q*.26:Q;let X=l.at(b),on=l.at(Math.max(0,b-.01));N&&(N.setAttribute("cx",X[0]),N.setAttribute("cy",X[1]),N.setAttribute("opacity",u(e)));let pn=P(e.burstAge,Math.atan2(X[1]-on[1],X[0]-on[0]));n.forEach(({el:J,gradient:nn},cn)=>{let en=pn[cn];if(J.setAttribute("opacity",en?en.alpha:0),en){let fn=[X[0]+en.tail[0],X[1]+en.tail[1]],hn=[X[0]+en.head[0],X[1]+en.head[1]];J.setAttribute("d",`M${fn[0]} ${fn[1]}L${hn[0]} ${hn[1]}`),nn.setAttribute("x1",fn[0]),nn.setAttribute("y1",fn[1]),nn.setAttribute("x2",hn[0]+.001),nn.setAttribute("y2",hn[1]+.001)}})}}function F(a,x,h,$=1){let z=a==="v",k=x/Math.max(1,h-1);return{start:(z?.24+k*13*.075:.68+k*9*.088)*$,duration:(z?1.03:1.13)*$}}function _(a,x,h,$,z=1){let k=F(x,h,$,z);return G((a-k.start)/k.duration)}function T(a,x,h,$,z,k=!1){let q=h[0]-x[0],y=h[1]-x[1],U=Math.hypot(q,y);if(U<2)return;let t=Math.max(0,$-20/U),c=[x[0]+q*t,x[1]+y*t],m=[x[0]+q*$,x[1]+y*$],f=a.createLinearGradient(c[0],c[1],m[0]+.01,m[1]+.01);f.addColorStop(0,k?"rgba(189,200,219,0)":"rgba(232,184,74,0)"),f.addColorStop(.75,k?"rgba(219,229,235,.7)":"rgba(255,233,177,.7)"),f.addColorStop(1,"#fffdf4"),a.globalAlpha=z,a.strokeStyle=f,a.lineWidth=1.25,a.beginPath(),a.moveTo(...c),a.lineTo(...m),a.stroke()}function V(a,x,h,$,{alpha:z=1}={}){$<=0||$>=1||(a.save(),a.shadowBlur=0,T(a,x,h,1,z),a.restore())}function A(a,x,h,$,z,{burst:k=!0,alpha:q=1}={}){if(!Number.isFinite($))return;let y=R($,z);if(y.active){if(a.save(),a.globalAlpha=q,a.shadowBlur=0,$<z&&T(a,x,h,y.holding?C(.55,1,y.charge):1,q*(y.holding?Math.sin(Math.PI*y.charge):.8)),k){let U=u(y);if(U>0){let t=a.createRadialGradient(h[0],h[1],0,h[0],h[1],7);t.addColorStop(0,"#fffdf4"),t.addColorStop(.16,"rgba(255,253,244,.85)"),t.addColorStop(.42,"rgba(255,228,160,.22)"),t.addColorStop(1,"rgba(232,184,74,0)"),a.globalAlpha=q*U,a.fillStyle=t,a.beginPath(),a.arc(...h,7,0,Math.PI*2),a.fill()}for(let t of P(y.burstAge,Math.atan2(h[1]-x[1],h[0]-x[0]),.75)){let c=[h[0]+t.tail[0],h[1]+t.tail[1]],m=[h[0]+t.head[0],h[1]+t.head[1]],f=a.createLinearGradient(...c,m[0]+.001,m[1]+.001);f.addColorStop(0,"rgba(221,167,70,0)"),f.addColorStop(.55,"rgba(255,221,160,.7)"),f.addColorStop(1,"#fff9e9"),a.globalAlpha=q*t.alpha,a.strokeStyle=f,a.lineWidth=.65,a.beginPath(),a.moveTo(...c),a.lineTo(...m),a.stroke()}}a.restore()}}return{progress:Y,phase:R,gridTiming:F,gridProgress:_,canvas:A,canvasGrid:V,svgEffect:O}})();var bn=(()=>{let S=Math.PI*2,d={body:"#e8b84a",light:"#ffd873",core:"#fff0c2"},G={body:[184,188,198],core:[242,242,240]};function C(t){let c=t*.61803398875%1;return`rgb(${G.core.map((m,f)=>Math.round(m+(G.body[f]-m)*c)).join(",")})`}let i=t=>[[0,"#ffffff",.98],[.25,"#f2f2f0",.96],[.62,t,.78],[1,"#b8bcc6",0]],o=new Map;function E(t,c){let m=`${t}:${c}`;if(o.has(m))return o.get(m);let f=document.createElement("canvas");f.width=f.height=t;let N=f.getContext("2d"),n=N.createRadialGradient(t*.34,t*.3,0,t*.5,t*.5,t*.68);for(let[r,p,s]of i(c)){let e=p.startsWith("#")?[1,3,5].map(l=>parseInt(p.slice(l,l+2),16)):p.match(/\d+/g).slice(0,3);n.addColorStop(r,`rgba(${e.join(",")},${s})`)}return N.fillStyle=n,N.fillRect(0,0,t,t),o.set(m,f),f}let B=(t,c=0,m=1)=>Math.min(m,Math.max(c,t));function Y(t){let c=t>>>0;return()=>(c=Math.imul(c,1664525)+1013904223>>>0,c/4294967296)}function v(t,c=0){let m=(t.yaw??.3)+Math.sin(c*.35)*(t.spin??.08),f=(t.pitch??-.22)+Math.sin(c*.21)*(t.sway??.025),N=t.roll??0;return{...t,depth:t.depth??5,cyaw:Math.cos(m),syaw:Math.sin(m),cp:Math.cos(f),sp:Math.sin(f),cr:Math.cos(N),sr:Math.sin(N)}}function L(t,c){let m=t[0]*c.cyaw+t[2]*c.syaw,f=-t[0]*c.syaw+t[2]*c.cyaw,N=t[1]*c.cp-f*c.sp,n=t[1]*c.sp+f*c.cp,r=m*c.cr-N*c.sr,p=m*c.sr+N*c.cr,s=c.depth/Math.max(.5,c.depth+n),e=B((1.8-n)/3.6);return{x:c.cx+r*c.scale*s,y:c.cy-p*c.scale*s,z:n,scale:s,light:.3+.7*e}}function M(t,c,m={}){let f=Y(t),N=m.radii??[1,1,1],n=m.center??[0,0,0],r=m.shell??.5;return Array.from({length:c},(p,s)=>{let e=f()*S,l=f()*2-1,b=Math.sqrt(1-l*l),g=Math.pow(f(),1/3)*(1-r)+r;return{p:[n[0]+Math.cos(e)*b*g*N[0],n[1]+Math.sin(e)*b*g*N[1],n[2]+l*g*N[2]],color:m.color??(s%5?"#b8bcc6":"#ffd873"),size:.65+f()*1.2,alpha:.3+f()*.6,phase:f()*S,star:s%23===0}})}function R(t,c,m={}){let f=Y(t),N=m.radii??[1,1,1],n=m.half??1.3,r=Math.PI*(3-Math.sqrt(5)),p=f()*S;return Array.from({length:c},(s,e)=>{let l=1-2*(e+.5)/c,b=Math.sqrt(1-l*l),g=p+e*r,I=.95+f()*.05,w=[0,1,2].map(()=>(f()*2-1)*n),j=w.map(H=>H*.5+(f()*2-1)*n*.5);return{p:[Math.cos(g)*b,Math.sin(g)*b,l].map((H,W)=>H*I*N[W]),from:w,control:j,delay:f()*.18,size:1.35+f()*.9,alpha:.66+f()*.27,color:C(e)}})}function u(t,c,m={}){let f=m.center??[0,0,0],N=m.duration??1.35;return t.map(n=>{let r=B((c-(m.delay??0)-n.delay)/N),p=r*r*(3-2*r),s=1-p;return{...n,settled:p,p:n.p.map((e,l)=>s*s*n.from[l]+2*s*p*n.control[l]+p*p*(e+f[l]))}})}let P=new Map;function O(t){if(P.has(t))return P.get(t);let c=document.createElement("canvas");c.width=c.height=32;let m=c.getContext("2d"),f=m.createRadialGradient(16,16,0,16,16,16);return f.addColorStop(0,"#fff8e8"),f.addColorStop(.13,t),f.addColorStop(.4,t+"55"),f.addColorStop(1,t+"00"),m.fillStyle=f,m.fillRect(0,0,32,32),P.set(t,c),c}let F,_=[[0,"rgba(255,252,246,.96)"],[.075,"rgba(255,247,233,.94)"],[.18,"rgba(242,228,207,.48)"],[.43,"rgba(193,179,162,.1)"],[1,"rgba(160,135,110,0)"]],T=[[0,"rgba(255,240,218,0)"],[.29,"rgba(241,232,218,.03)"],[.46,"rgba(244,237,224,.13)"],[.5,"rgba(255,255,246,.7)"],[.54,"rgba(244,237,224,.13)"],[.71,"rgba(241,232,218,.03)"],[1,"rgba(255,240,218,0)"]],V=[[0,"#fff0c2f5"],[.075,"#ffe4a1f0"],[.18,"#ffd8737a"],[.43,"#e8b84a1a"],[1,"#e8b84a00"]],A=[[0,"#e8b84a00"],[.29,"#e8b84a08"],[.46,"#ffd87321"],[.5,"#fff0c2b3"],[.54,"#ffd87321"],[.71,"#e8b84a08"],[1,"#e8b84a00"]];function a(t,c,m,f=1,N=1.5,n=!1){if(f<=.001)return;t.save(),t.globalCompositeOperation="screen",t.globalAlpha=f;let r=t.createRadialGradient(c,m,0,c,m,8*N);(n?V:_).forEach(([e,l])=>r.addColorStop(e,l)),t.fillStyle=r,t.beginPath(),t.arc(c,m,8*N,0,S),t.fill();let p=10*N,s=t.createLinearGradient(c-p,m,c+p,m);(n?A:T).forEach(([e,l])=>s.addColorStop(e,l)),t.strokeStyle=s,t.lineWidth=.5*N,t.beginPath(),t.moveTo(c-p,m),t.lineTo(c+p,m),t.stroke(),t.fillStyle=n?d.core:"#fffefa",t.beginPath(),t.arc(c,m,.48*N,0,S),t.fill(),t.restore()}function x(){if(F)return F;let t=document.createElement("canvas");return t.width=t.height=96,a(t.getContext("2d"),48,48,1,4.5),F=t,t}let h=0;function $(t,{x:c=0,y:m=0,radius:f=1.25,opacity:N=1,color:n=C(0)}={}){let r=(g,I,w)=>{let j=document.createElementNS("http://www.w3.org/2000/svg",g);for(let[H,W]of Object.entries(I))j.setAttribute(H,String(W));return w.appendChild(j),j},p=r("g",{transform:`translate(${c} ${m})`,opacity:N},t),s=`space3d-silver-grain-${++h}`,e=r("defs",{},p),l=r("radialGradient",{id:s,cx:".5",cy:".5",r:".68",fx:".34",fy:".3"},e);i(n).forEach(([g,I,w])=>r("stop",{offset:g,"stop-color":I,"stop-opacity":w},l));let b=Math.min(2.5,Math.max(1,f*2));return r("rect",{x:-b/2,y:-b/2,width:b,height:b,fill:`url(#${s})`},p),p}function z(t,c,m,f={}){let N=f.alpha??1;if(N<=.001)return;let n=f.time??0,r=B(f.darkLift??0),p=c.map(s=>({p:s,q:L(s.p,m)})).sort((s,e)=>e.q.z-s.q.z);t.save(),t.globalCompositeOperation=f.grainPoints?"source-over":"lighter",f.grainPoints&&(t.imageSmoothingEnabled=!1,t.shadowBlur=0);for(let{p:s,q:e}of p){if(f.grainPoints){let w=B(Math.round(s.size*e.scale*(f.pointSize??1)),1,3);t.globalAlpha=B(N*s.alpha*(.72+.28*e.light)*(.6+.4*(s.settled??1))),t.drawImage(E(w,s.color),Math.round(e.x-w/2),Math.round(e.y-w/2));continue}let l=.78+.22*Math.sin(n*.8+s.p[0]*1.7+s.phase),b=s.alpha*l,g=r===0?N*s.alpha*e.light*l:N*(b+(1-b)*r)*e.light,I=B(s.size*e.scale*(f.pointSize??1),.65,3.4);if(f.starPoints&&s.star){let w=6.5*e.scale;t.globalAlpha=B(g*(1.1+.12*Math.sin(n*3+s.phase))),t.drawImage(x(),e.x-w,e.y-w,w*2,w*2);continue}if(t.globalAlpha=g,t.fillStyle=s.color,t.fillRect(e.x-I/2,e.y-I/2,I,I),s.star){let w=7*e.scale;t.globalAlpha=g*(.15+.1*Math.sin(n*3+s.phase)),t.drawImage(O(s.color),e.x-w,e.y-w,w*2,w*2)}}t.restore()}function k(t,c,m,f,N,n=1,r,p=!1){let s,e;if(p){let b=c.map(j=>L(j,m)),g=b[0],I=b[b.length-1];Math.hypot(I.x-g.x,I.y-g.y)<.01&&(g={x:Math.min(...b.map(j=>j.x)),y:Math.min(...b.map(j=>j.y))},I={x:Math.max(...b.map(j=>j.x)),y:Math.max(...b.map(j=>j.y))});let w=j=>{let H=t.createLinearGradient(g.x,g.y,I.x,I.y);return j.forEach(([W,K])=>H.addColorStop(W,K)),H};s=w([[0,"#e8b84a80"],[.2,"#ffd873c7"],[.34,"#fff6dce8"],[.53,"#ffd87399"],[.76,"#fffefaed"],[1,"#e8b84a99"]]),e=w([[0,"#fff0c200"],[.2,"#fff0c25c"],[.34,"#fffefadc"],[.53,"#fff0c22e"],[.76,"#fffefae6"],[1,"#fff0c200"]])}let l=()=>{t.strokeStyle=p?s:f,t.lineWidth=n,t.stroke(),p&&(t.save(),t.shadowBlur=0,t.globalAlpha*=.54,t.strokeStyle=e,t.lineWidth=n*.48,t.stroke(),t.restore())};if(r){let[b,g]=r,w=(c.length===2?Array.from({length:9},(j,H)=>c[0].map((W,K)=>W+(c[1][K]-W)*H/8)):c).map(j=>L(j,m));for(let j=1;j<w.length;j++){let H=w[j-1],W=w[j],K=B((g-(H.z+W.z)/2)/Math.max(.001,g-b));t.globalAlpha=B(N*(p?.56+.44*K:.42+.58*K)),t.beginPath(),t.moveTo(H.x,H.y),t.lineTo(W.x,W.y),l()}return}t.globalAlpha=N,t.beginPath(),c.forEach((b,g)=>{let I=L(b,m);g?t.lineTo(I.x,I.y):t.moveTo(I.x,I.y)}),l()}function q(t,c,m={}){let f=m.half??1.4,N=m.alpha??.8;if(!Number.isFinite(f)||f<=0)throw new Error("Space3D.frame requires one positive cube half-edge length");if(N<=.001)return;let n=m.color??d.body,r=m.lineWidth??1.05,p=m.age??1/0,s=(w,j=.65)=>sn.progress(B((p-w)/j),j),e=[-1,1].flatMap(w=>[-1,1].flatMap(j=>[-1,1].map(H=>L([w*f,j*f,H*f],c).z))),l=[Math.min(...e),Math.max(...e)],b=[-f,-f,-f],g=[];t.save(),t.lineCap="butt",t.globalCompositeOperation="lighter",t.shadowColor=n,t.shadowBlur=1.2;for(let w=0;w<3;w++)for(let j of[-1,1])for(let H of[-1,1]){let W=[0,1,2].filter(en=>en!==w),K=[-f,-f,-f],Q=[...K];K[W[0]]=Q[W[0]]=j*f,K[W[1]]=Q[W[1]]=H*f,Q[w]=f;let X=j===-1&&H===-1,on=(j+H+2)*.1+w*.09,pn=s(on);if(pn<=0)continue;let J=K.map((en,fn)=>en+(Q[fn]-en)*pn);X?g.push({a:K,b:J}):k(t,[K,J],c,n,N*.9,r,l,!0);let nn=L(J,c),cn=L(K,c);sn.canvas(t,[cn.x,cn.y],[nn.x,nn.y],p-on,.65,{burst:X,alpha:N*.8})}t.setLineDash([18.6,5.1,2.9,5.1]),g.forEach(({a:w,b:j})=>k(t,[w,j],c,d.light,N,r*1.12,void 0,!0)),t.setLineDash([]),t.shadowBlur=.6;for(let w=1;w<8;w++){let j=-f+2*f*w/8;for(let H of["v","h"]){let W=sn.gridProgress(p,H,w-1,7),K=-f+2*f*W;if(W<=0)continue;let[Q,X]=H==="v"?[[j,-f,-f],[j,-f,K]]:[[-f,-f,j],[K,-f,j]];k(t,[Q,X],c,d.body,N*.8,r*.85,l,!0);let on=L(Q,c),pn=L(X,c);sn.canvasGrid(t,[on.x,on.y],[pn.x,pn.y],W,{alpha:N*.5})}}t.shadowBlur=0;let I=L(b,c);a(t,I.x,I.y,N*s(0,.3),1.65,!0),t.restore()}function y(t,c,m,f,N={}){let n=L(m,c),r=Math.hypot(f[0]*c.syaw*c.cp,f[1]*c.sp,f[2]*c.cyaw*c.cp),p=N.depthShading?[n.z-r,n.z+r]:null;t.save();for(let s=0;s<3;s++){let e=Array.from({length:65},(l,b)=>{let g=b/64*S,I=[...m];return I[(s+1)%3]+=Math.cos(g)*f[(s+1)%3],I[(s+2)%3]+=Math.sin(g)*f[(s+2)%3],I});k(t,e,c,N.color??d.body,(N.alpha??.2)*(p||s===1?1:.5),N.lineWidth??.9,p,!0)}t.restore()}function U(t,c,m={}){let f=m.alpha??1;if(f<=.001)return;let N=m.color??"#ffd873",n=(m.radius??6)*c.scale;t.save(),t.globalCompositeOperation="lighter",t.globalAlpha=f*c.light*.6,t.drawImage(O(N),c.x-n*3,c.y-n*3,n*6,n*6),t.globalAlpha=f,t.fillStyle=N,t.beginPath(),t.arc(c.x,c.y,n,0,S),t.fill(),t.restore()}return{gold:d,camera:v,project:L,cloud:M,formation:R,gather:u,render:z,frame:q,ring:y,dot:U,svgParticle:$}})();var D=(()=>{let G=Math.PI*2;function C(n){let r=n>>>0;return()=>{r=r+1831565813|0;let p=Math.imul(r^r>>>15,1|r);return p=p+Math.imul(p^p>>>7,61|p)^p,((p^p>>>14)>>>0)/4294967296}}function i(n){let r=0;for(;!r;)r=n();return Math.sqrt(-2*Math.log(r))*Math.cos(G*n())}let o=(n,r=0,p=1)=>Math.min(p,Math.max(r,n)),E=(n,r,p)=>n+(r-n)*p,B=(n,r,p)=>o((n-r)/(p-r)),Y={lin:n=>n,o2:n=>1-(1-n)*(1-n),o3:n=>1-Math.pow(1-n,3),io2:n=>n<.5?2*n*n:1-Math.pow(-2*n+2,2)/2,io3:n=>n<.5?4*n*n*n:1-Math.pow(-2*n+2,3)/2,expo:n=>n>=1?1:1-Math.pow(2,-10*n),back:n=>1+2.70158*Math.pow(n-1,3)+1.70158*Math.pow(n-1,2)},v=(n,r,p,s=Y.io3)=>s(B(n,r,p)),L=(n,r,p,s,e,l=Y.io2)=>Math.min(l(B(n,r,p)),1-l(B(n,s,e))),M={white:[242,242,240],silver:[184,188,198],gold:[232,184,74],goldHi:[255,216,115],yellow:[255,225,77],amber:[214,140,52],pink:[255,140,190],blue:[128,172,255],mint:[130,228,200]},R=(n,r)=>`rgba(${n[0]|0},${n[1]|0},${n[2]|0},${Math.max(0,r).toFixed(3)})`,u=(n,r,p)=>[E(n[0],r[0],p),E(n[1],r[1],p),E(n[2],r[2],p)];function P(n,r=.35){let p=(n%1+1)%1,s=p<.34?u(M.pink,M.blue,p/.34):p<.67?u(M.blue,M.goldHi,(p-.34)/.33):u(M.goldHi,M.pink,(p-.67)/.33);return u(M.white,s,r)}function O(n){n.setTransform(1,0,0,1,0,0),n.globalCompositeOperation="source-over",n.globalAlpha=1,n.clearRect(0,0,1080,1440),n.globalCompositeOperation="lighter",n.lineCap="round",n.lineJoin="round"}function F(n,r=1400,p=[0,0,1080,1440]){let s=C(n),e=[];for(let l=0;l<r;l++){let b=s();e.push({x:p[0]+s()*p[2],y:p[1]+s()*p[3],s:.6+s()*s()*1.5,a:.03+s()*s()*.26,ph:s()*G,w:.5+s()*2.2,c:b<.1?P(s(),.75):b<.14?M.goldHi:b<.6?M.silver:M.white,vx:(s()-.5)*5,vy:(s()-.5)*4})}return e}function _(n,r,p,s=1){if(s<=.002)return;let e=bn.camera({cx:540,cy:720,scale:550,depth:6,yaw:.08,pitch:-.04,spin:.025,sway:.01},p);for(let l of r){let b=bn.project([(l.x-540+l.vx*p)/550,(720-l.y-l.vy*p)/550,Math.sin(l.ph)*.85],e),g=l.a*s*b.light*(.6+.4*Math.sin(p*l.w+l.ph));if(g<.004)continue;n.fillStyle=R(l.c,g);let I=l.s*b.scale;n.fillRect(b.x,b.y,I,I)}}function T(n,r,p,s,e){let l=1-e,b=l*l*l,g=3*l*l*e,I=3*l*e*e,w=e*e*e;return[b*n[0]+g*r[0]+I*p[0]+w*s[0],b*n[1]+g*r[1]+I*p[1]+w*s[1]]}function V(n,r,p,s,e=40){let l=[];for(let b=0;b<=e;b++)l.push(T(n,r,p,s,b/e));return l}function A(n,r,p=2){let s=[];for(let e=0;e<=p;e++)s.push([E(n[0],r[0],e/p),E(n[1],r[1],e/p)]);return s}function a(n){let r=C(n.seed),p=n.K||28,s=[],e=n.jitter??60;for(let l=0;l<n.n;l++){let b=[n.a[0]+i(r)*n.sa,n.a[1]+i(r)*(n.say??n.sa)],g=[n.b[0]+i(r)*n.sb,n.b[1]+i(r)*(n.sby??n.sb)],I=[n.c1[0]+i(r)*e,n.c1[1]+i(r)*e],w=[n.c2[0]+i(r)*e,n.c2[1]+i(r)*e],j=new Float32Array((p+1)*2);for(let W=0;W<=p;W++){let K=T(b,I,w,g,W/p);j[W*2]=K[0],j[W*2+1]=K[1]}let H;n.color?H=r()<(n.irisP??.22)?P(r(),.6):u(n.color,M.white,r()*(n.whiten??.35)):H=P(r(),(n.irisAmt??.32)*(.4+r())),s.push({pts:j,K:p,d:r()*(n.lag??.3),a:(n.alpha??.08)*(.35+r()*1.1),w:(n.width??.8)*(.55+r()*.9),c:H})}return s.lag=n.lag??.3,s}function x(n,r){let p=Math.min(n.K-1,Math.floor(r)),s=r-p,e=n.pts;return[E(e[p*2],e[p*2+2],s),E(e[p*2+1],e[p*2+3],s)]}function h(n,r,p,s=1,e={}){if(s<=.002||p<=0)return;let l=r.lag;for(let b of r){let g=o(p*(1+l)-b.d);if(g<=0)continue;let I=g*b.K,w=e.tail?Math.max(0,I-e.tail*b.K):(e.from??0)*b.K;if(I-w<.05)continue;n.strokeStyle=R(b.c,b.a*s),n.lineWidth=b.w,n.beginPath();let j=x(b,w);n.moveTo(j[0],j[1]);for(let W=Math.floor(w)+1;W<I;W++)n.lineTo(b.pts[W*2],b.pts[W*2+1]);let H=x(b,I);n.lineTo(H[0],H[1]),n.stroke(),e.heads&&g<1&&(n.fillStyle=R(M.white,Math.min(1,b.a*s*6)),n.fillRect(H[0]-.8,H[1]-.8,1.6,1.6))}}function $(n,r,p){let s=n.length-1,e=o(r)*s,l=o(p)*s,b=I=>{let w=Math.min(s-1,Math.floor(I)),j=I-w;return[E(n[w][0],n[w+1][0],j),E(n[w][1],n[w+1][1],j)]},g=[b(e)];for(let I=Math.floor(e)+1;I<l;I++)g.push(n[I]);return g.push(b(l)),g}function z(n,r){n.beginPath(),n.moveTo(r[0][0],r[0][1]);for(let p=1;p<r.length;p++)n.lineTo(r[p][0],r[p][1]);n.stroke()}function k(n,r,p,s=M.gold,e=3,l=1,b=0){if(p<=b)return r[0];let g=$(r,b,p);if(l<=.002)return g[g.length-1];let I=[[e*9,.035],[e*4.5,.08],[e*2.2,.22],[e,.75]];for(let[w,j]of I)n.strokeStyle=R(s,j*l),n.lineWidth=w,z(n,g);return n.strokeStyle=R(u(s,M.white,.7),.85*l),n.lineWidth=Math.max(.8,e*.38),z(n,g),g[g.length-1]}function q(n,r,p,s,e=M.goldHi,l=1,b=!0){if(l<=.002)return;let g=n.createRadialGradient(r,p,0,r,p,s);g.addColorStop(0,R(e,.55*l)),g.addColorStop(.25,R(e,.18*l)),g.addColorStop(1,R(e,0)),n.fillStyle=g,n.fillRect(r-s,p-s,s*2,s*2),b&&(n.fillStyle=R(u(e,M.white,.8),l),n.beginPath(),n.arc(r,p,Math.max(1.2,s*.09),0,G),n.fill())}function y(n,r,p,s,e,l,b){n.fillStyle=R(u(l,M.white,.35),b),n.beginPath(),n.moveTo(r,p),n.lineTo(r-Math.cos(s-.42)*e,p-Math.sin(s-.42)*e),n.lineTo(r-Math.cos(s)*e*.72,p-Math.sin(s)*e*.72),n.lineTo(r-Math.cos(s+.42)*e,p-Math.sin(s+.42)*e),n.closePath(),n.fill()}function U(n,r=90,p=7){let s=C(n),e=[];for(let l=0;l<r;l++)e.push({amp:i(s)*p,f:1+s()*3,ph:s()*G,a:.05+s()*.16,w:.5+s()*.7,c:s()<.3?P(s(),.6):null});return e}function t(n,r,p,s,e,l,b={}){let g=b.alpha??1,I=Math.hypot(e-p,l-s);if(g<=.002||I<2)return;let w=b.color||M.gold,j=b.head??30,H=b.t??0,W=Math.atan2(l-s,e-p),K=Math.cos(W),Q=Math.sin(W),X=e-K*j*.7,on=l-Q*j*.7,pn=18;for(let J of r){n.strokeStyle=R(J.c||u(w,M.white,.3),J.a*g),n.lineWidth=J.w,n.beginPath();for(let nn=0;nn<=pn;nn++){let cn=nn/pn,en=J.amp*Math.sin(Math.PI*cn)*Math.sin(J.f*cn*Math.PI+J.ph+H*.6),fn=E(p,X,cn)-Q*en,hn=E(s,on,cn)+K*en;nn?n.lineTo(fn,hn):n.moveTo(fn,hn)}n.stroke()}k(n,[[p,s],[X,on]],1,w,b.w??3.2,g),y(n,e,l,W,j,w,g)}function c(n,r,p,s,e,l,b={}){let g=C(n),I=[];for(let w=0;w<r;w++){let j=g();I.push({x:p+i(g)*e,y:s+i(g)*l,s:.7+g()*g()*(b.size??1.8),a:(b.alpha??.5)*(.25+g()*.75),c:b.color?j<(b.irisP??.15)?P(g(),.7):u(b.color,M.white,g()*.4):P(g(),.2+g()*.55),ph:g()*G,w:.6+g()*2,r1:g(),r2:g()})}return I}function m(n,r,p,s=1,e={}){if(s<=.002)return;let l=e.dx??0,b=e.dy??0,g=e.scale??1,I=e.cx??540,w=e.cy??720,j=e.twinkle??.3;for(let H of r){let W=H.a*s*(1-j+j*Math.sin(p*H.w+H.ph));W<.004||(n.fillStyle=R(H.c,W),n.fillRect(I+(H.x-I)*g+l,w+(H.y-w)*g+b,H.s,H.s))}}function f(n,r,p,s,e,l,b,g,I={}){let w=I.alpha??1;if(w<=.002)return;let j=I.color||M.silver,H=C(I.seed??7),W=I.speed??1.2;for(let K=0;K<e;K++)for(let Q=0;Q<s;Q++){let X=H(),on=.5+.5*Math.sin(Q*.35-g*W*3+K*.12+X*1.5),pn=(.08+.55*Math.pow(on,3))*w*(.5+X*.8);n.fillStyle=R(X<.07?P(X*14,.7):X<.12?M.goldHi:j,pn),n.fillRect(r+Q*l,p+K*b,1.6,1.6)}}function N(n,r=2){return(Math.abs(n)<Math.pow(10,-r)/2?0:n).toFixed(r)}return{W:1080,H:1440,TAU:G,rng:C,gauss:i,clamp:o,lerp:E,seg:B,ease:Y,sm:v,win:L,C:M,rgba:R,mix:u,iris:P,begin:O,makeDust:F,dust:_,cubic:T,curvePts:V,linePts:A,makeFibers:a,fibers:h,subPath:$,strokePts:z,glowPath:k,glowDot:q,arrowHead:y,makeBeam:U,vector:t,makeCloud:c,cloud:m,lattice:f,fmt:N}})();function Mn(S){let d="http://www.w3.org/2000/svg";function G(R,u={},P){let O=S.createElementNS(d,R);for(let F in u)O.setAttribute(F,u[F]);return P&&P.appendChild(O),O}function C(R,u,P,O,F){let _=S.createElement(R);return u&&(_.className=u),P!=null&&(_.innerHTML=P),F&&Object.assign(_.style,F),O&&O.appendChild(_),_}let i=(R,u,P="ln",O={})=>G("path",{d:u,class:P,pathLength:1,...O},R),o=(R,u,P,O,F,_="ln",T={})=>i(R,`M${u} ${P}L${O} ${F}`,_,T),E=(R,u,P,O,F)=>{let _=Math.abs(F-O)>Math.PI?1:0,T=F>O?1:0;return`M${R+P*Math.cos(O)} ${u+P*Math.sin(O)}A${P} ${P} 0 ${_} ${T} ${R+P*Math.cos(F)} ${u+P*Math.sin(F)}`};function B(R,u={}){let P=G("g",{class:u.glow===!1?"":"glow"},R),O=u.color||"#e8b84a";return P._shaft=G("path",{fill:"none",stroke:O,"stroke-width":u.w||6,"stroke-linecap":"round"},P),P._head=G("path",{fill:O},P),P._size=u.head||30,u.from&&Y(P,...u.from,...u.to),P}function Y(R,u,P,O,F){R._ends=[u,P,O,F];let _=Math.hypot(O-u,F-P),T=Math.atan2(F-P,O-u),V=Math.min(R._size,_*.45),A=O-Math.cos(T)*V*.8,a=F-Math.sin(T)*V*.8;R._shaft.setAttribute("d",`M${u} ${P}L${A} ${a}`);let x=[O-Math.cos(T-.4)*V,F-Math.sin(T-.4)*V],h=[O-Math.cos(T+.4)*V,F-Math.sin(T+.4)*V];R._head.setAttribute("d",`M${O} ${F}L${x[0]} ${x[1]}L${A} ${a}L${h[0]} ${h[1]}Z`),R.style.display=_<2?"none":""}let v={catfood:'<path d="M26 18h48l6 70q-30 8-60 0z"/><path d="M26 28h48"/><path d="M38 56l4-12 6 7h4l6-7 4 12q0 12-12 12t-12-12z"/><circle cx="45" cy="57" r="1.6" fill="currentColor"/><circle cx="55" cy="57" r="1.6" fill="currentColor"/>',litter:'<path d="M12 50h76l-8 32H20z"/><path d="M24 50q4-12 14-10 6-12 18-6 12-6 18 6 8 0 6 10"/><path d="M62 22l14 18"/><path d="M70 18l14 6-6 10z"/>',dogfood:'<path d="M26 18h48l6 70q-30 8-60 0z"/><path d="M26 28h48"/><path d="M36 58h28"/><circle cx="34" cy="53" r="5"/><circle cx="34" cy="63" r="5"/><circle cx="66" cy="53" r="5"/><circle cx="66" cy="63" r="5"/>',user:'<circle cx="50" cy="36" r="16"/><path d="M20 86q2-28 30-28t30 28"/>',doc:'<path d="M24 10h36l18 18v62H24z"/><path d="M60 10v18h18"/><path d="M34 46h32M34 58h32M34 70h22"/>',search:'<circle cx="42" cy="42" r="24"/><path d="M60 60l24 24"/>',funnel:'<path d="M12 16h76L58 54v28l-16 8V54z"/>',chip:'<rect x="24" y="24" width="52" height="52" rx="8"/><path d="M36 24v-12M50 24v-12M64 24v-12M36 88v-12M50 88v-12M64 88v-12M24 36h-12M24 50h-12M24 64h-12M88 36h-12M88 50h-12M88 64h-12"/>',db:'<ellipse cx="50" cy="22" rx="32" ry="10"/><path d="M18 22v56q0 10 32 10t32-10V22"/><path d="M18 41q0 10 32 10t32-10M18 60q0 10 32 10t32-10"/>',check:'<path d="M18 52l20 20 44-46"/>',cross:'<path d="M24 24l52 52M76 24L24 76"/>',bubble:'<path d="M14 20h72v46H46l-18 16V66H14z"/><path d="M28 36h44M28 50h30"/>',scissors:'<circle cx="28" cy="72" r="10"/><circle cx="72" cy="72" r="10"/><path d="M34 64L74 14M66 64L26 14"/>'};function L(R,u=80,P={}){let O=P.color||"#e8b84a";return`<svg viewBox="0 0 100 100" width="${u}" height="${u}" style="display:block;overflow:visible;color:${O}" fill="none" stroke="currentColor" stroke-width="${P.w||5}" stroke-linecap="round" stroke-linejoin="round">${v[R]}</svg>`}function M(R,u){let P=C("div","polaroid",`<div class="pin"></div><img src="${u.src}" style="width:${u.w}px;height:${u.h}px">`+(u.cap?`<div class="pl-cap">${u.cap}</div>`:"")+(u.credit?`<div class="pl-credit">${u.credit}</div>`:""),R);return u.id&&(P.id=u.id),P.setAttribute("data-layout-ignore",""),P}return{s:G,h:C,path:i,line:o,arcD:E,arrow:B,setArrow:Y,icon:L,photo:M}}var vn={};Ln(vn,{BITS:()=>xn,angle:()=>_n,catLinks:()=>qn,contextSilk:()=>Gn,crossSilk:()=>Dn,dimensions:()=>On,farewell:()=>Wn,gauge:()=>In,paper:()=>Nn,sentences:()=>Fn,table:()=>Rn});var un=(()=>{let S=i=>Math.max(0,Math.min(1,i));function d(i,o){let[E,B,Y,v]=i,L=new Path2D;L.moveTo(...E),L.bezierCurveTo(...B,...Y,...v);let M=0,R=E;for(let u=1;u<=64;u++){let P=u/64,O=1-P,F=[0,1].map(_=>O**3*E[_]+3*O*O*P*B[_]+3*O*P*P*Y[_]+P**3*v[_]);M+=Math.hypot(F[0]-R[0],F[1]-R[1]),R=F}return{...o,path:L,length:M}}function G(i,o=0){let E=i-o;if(E<=0)return{reveal:0,from:0,to:0};let B=E%1.85/1.25;return{reveal:S(E/1.25),from:S(B-.2),to:S(B)}}function C(i,o,E,B=1){let Y=G(E,o.delay);if(Y.reveal<=0||B<=0)return;let{length:v,path:L}=o;i.lineWidth=o.width,i.strokeStyle=o.stroke,i.lineDashOffset=0,i.setLineDash(Y.reveal<1?[v*Y.reveal,v+1]:[]),i.globalAlpha=o.alpha*B*.72,i.stroke(L),Y.to>Y.from&&(i.setLineDash([v*(Y.to-Y.from),v+1]),i.lineDashOffset=-v*Y.from,i.globalAlpha=o.alpha*B*1.35,i.stroke(L)),i.setLineDash([]),i.lineDashOffset=0}return{create:d,state:G,draw:C}})();var An=S=>Math.max(0,Math.min(1,S)),rn=(S,d,G)=>S+(d-S)*G;function Z(S,d,G,C="linear"){let i=An((S-d)/G),o=1-i;if(C==="smooth")return i*i*(3-2*i);if(C==="expoout")return i===1?1:1-2**(-10*i);if(C==="sineout")return Math.sin(i*Math.PI/2);if(C==="sinein")return 1-Math.cos(i*Math.PI/2);if(C.startsWith("back")){let Y=C==="back13"?1.3:2;return 1+(Y+1)*(i-1)**3+Y*(i-1)**2}let E=C.match(/^p([123])(in|out|io)$/);if(!E)return i;let B=Number(E[1])+1;return E[2]==="in"?i**B:E[2]==="out"?1-o**B:i<.5?(2*i)**B/2:1-(2*o)**B/2}function an(S,d){for(let G of Array.isArray(S)?S:[S])G&&(G.style.opacity=String(d))}function dn(S,d){if(!S)return;let G=S._motionPose||={x:0,y:0,scale:1,rotation:0,xPercent:0,yPercent:0};Object.assign(G,d);let{x:C,y:i,scale:o,rotation:E,xPercent:B,yPercent:Y}=G;S.namespaceURI==="http://www.w3.org/2000/svg"?S.setAttribute("transform",`translate(${C} ${i}) rotate(${E}) scale(${o})`):S.style.transform=`translate(${B}%,${Y}%) translate(${C}px,${i}px) rotate(${E}deg) scale(${o})`}function tn(S,d,G,C,i={},o="expoout"){let E=Z(d,G,C,o);an(S,An(E)),dn(S,{x:(i.x||0)*(1-E),y:(i.y||0)*(1-E),scale:rn(i.scale??1,1,E),rotation:(i.rotation||0)*(1-E)}),S.style.filter=i.blur?`blur(${Math.max(0,i.blur*(1-E))}px)`:"none"}var{C:ln,sm:gn,win:$n}=D;function En(S,d,G){let C=G.getTotalLength();return sn.svgEffect(d,()=>({length:C,at:i=>{let o=G.getPointAtLength(i*C);return[o.x,o.y]}}),G)}function Cn(S,d){return sn.svgEffect(d,()=>{let[G,C,i,o]=d._ends;return{length:Math.hypot(i-G,o-C),at:E=>[rn(G,i,E),rn(C,o,E)]}},d)}var xn=[[1,1,0,1,1,0,1,1],[1,1,0,1,1,0,1,0],[0,0,1,0,0,1,0,1]];function In(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v={x:540,y:860,r:330},L=A=>Math.PI+(A+1)/2*Math.PI,M=i.s("g",{},G),R=i.path(M,i.arcD(v.x,v.y,v.r,Math.PI,2*Math.PI),"ln dim",{"stroke-width":18}),u=i.s("path",{fill:"none",stroke:"#e8b84a","stroke-width":18,"stroke-linecap":"round",class:"glow"},M),P=[];for(let A=0;A<=20;A++){let a=-1+A/10,x=L(a),h=A%5===0,$=v.r-34,z=v.r-(h?66:48);if(P.push(i.s("line",{x1:v.x+$*Math.cos(x),y1:v.y+$*Math.sin(x),x2:v.x+z*Math.cos(x),y2:v.y+z*Math.sin(x),stroke:h?"#f2f2f0":"rgba(242,242,240,0.35)","stroke-width":h?4:2},M)),h){let k=i.h("div","s01-tk",a===0?"0":a.toFixed(1).replace(".0",""),d("s01-ticks"));E(k,{left:v.x+(v.r+44)*Math.cos(x),top:v.y+(v.r+44)*Math.sin(x)-22})}}let O=i.arrow(M,{color:"#ffe14d",w:8,head:30}),F=i.s("circle",{cx:v.x,cy:v.y,r:16,fill:"#ffe14d",class:"glow"},M),_={v:-1};function T(A){let a=L(A);i.setArrow(O,v.x,v.y,v.x+(v.r-80)*Math.cos(a),v.y+(v.r-80)*Math.sin(a)),u.setAttribute("d",i.arcD(v.x,v.y,v.r,Math.PI,a+1e-4)),d("s01-num").textContent=A.toFixed(2)}T(-1);let V=En(i,M,R);return A=>{let a=Z(A,o.test+.4,.5,"p1out");an([M,d("s01-ticks"),d("s01-num"),d("s01-cos")],a),R.style.strokeDasharray="1",R.style.strokeDashoffset=1-sn.progress((A-o.test-.4)/.8),V(A-o.test-.4,.8),T(rn(-1,.74,Z(A,o.sim,o.val-o.sim+.5,"p3io")));let x=A<o.val+.48?Z(A,o.val+.3,.18,"p2out"):1-Z(A,o.val+.48,.18,"p2in"),h=Z(A,o.val+.3,.3,"p1out");d("s01-num").style.color=`rgb(${[255,216,115].map(($,z)=>Math.round(rn($,[255,225,77][z],h))).join(",")})`,dn(d("s01-num"),{scale:1+.12*x})}}function _n(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=[300,1040],L=560,M=-.6,R=(m,f=L)=>[v[0]+f*Math.cos(m),v[1]+f*Math.sin(m)],u=i.s("g",{opacity:1},G);{let I=function(w,j){let H=i.s("g",{"data-grid-direction":j?"v":"h","data-grid-position":w},u);g.forEach(([W,K,Q])=>i.s("line",{x1:j?w+W:60,y1:j?480:w+W,x2:j?w+W:1020,y2:j?1200:w+W,stroke:`url(#${l}-${j?"v":"h"})`,"stroke-width":K,"stroke-opacity":Q,"stroke-linecap":"butt"},H))},e=i.s("defs",{},u),l=`${G.id}-silver-grid`,b=[[0,"#aeb6c4",.56],[.22,"#e1e5ec",.78],[.42,"#ffffff",.94],[.64,"#bdc5d0",.66],[.82,"#f5f7fb",.88],[1,"#aeb6c4",.56]];for(let w of[!1,!0]){let j=i.s("linearGradient",{id:`${l}-${w?"v":"h"}`,gradientUnits:"userSpaceOnUse",x1:60,y1:480,x2:w?60:1020,y2:w?1200:480},e);b.forEach(([H,W,K])=>i.s("stop",{offset:H,"stop-color":W,"stop-opacity":K},j))}let g=[[-.9,.4,.54],[-.3,.48,.82],[.3,.48,.82],[.9,.4,.54]];for(let w=0;w<=12;w++)I(60+w*80,!0);for(let w=0;w<=9;w++)I(480+w*80,!1)}let P=i.line(u,120,v[1],1e3,v[1],"ln",{style:"stroke:rgba(196,196,195,0.73);stroke-width:2.5"}),O=i.line(u,v[0],1160,v[0],470,"ln",{style:"stroke:rgba(196,196,195,0.73);stroke-width:2.5"}),F=i.s("g",{},G),_=i.arrow(F,{color:"#e8b84a",w:7,head:38,from:v,to:R(M)}),T=i.arrow(F,{color:"#d6d9e0",w:7,head:38,glow:!1}),V=i.s("circle",{cx:v[0],cy:v[1],r:9,fill:"#f2f2f0"},F),A=-Math.sin(M),a=Math.cos(M),x=[v[0]+A*46,v[1]+a*46],h=[R(M)[0]+A*46,R(M)[1]+a*46],$=i.path(F,`M${x[0]-A*14} ${x[1]-a*14}L${x[0]} ${x[1]}L${h[0]} ${h[1]}L${h[0]-A*14} ${h[1]-a*14}`,"ln",{"stroke-width":3});E("#s02-size",{left:(x[0]+h[0])/2+A*60+20,top:(x[1]+h[1])/2+a*60-10});let z=i.path(F,i.arcD(v[0],v[1],150,0,M),"ln gold",{"stroke-width":4});E("#s02-dir",{left:v[0]+170,top:v[1]+24});let k=i.s("path",{fill:"rgba(255,225,77,0.14)",stroke:"#ffe14d","stroke-width":4},F),q=i.s("text",{"font-size":52,"font-style":"italic","font-family":"Smiley Sans, sans-serif",fill:"#ffe14d"},F);q.textContent="\u03B8";let y={a:-1.45,base:M,x:v[0],y:v[1],l1:L,l2:L,frame:0,v2grow:0},U=d("s02-read").querySelector(".num");function t(){let m=(e,l)=>[y.x+l*Math.cos(e),y.y+l*Math.sin(e)];i.setArrow(_,y.x,y.y,...m(y.base,y.l1)),T._size=D.lerp(38,28,y.frame),i.setArrow(T,y.x,y.y,...m(y.a,y.l2*y.v2grow)),_._shaft.setAttribute("stroke-width",D.lerp(7,9,y.frame)),T._shaft.setAttribute("stroke-width",D.lerp(7,4,y.frame)),V.setAttribute("cx",y.x),V.setAttribute("cy",y.y),P.setAttribute("d",`M120 ${y.y}L${D.lerp(1e3,960,y.frame)} ${y.y}`),O.setAttribute("d",`M${y.x} ${D.lerp(1160,1080,y.frame)}L${y.x} ${D.lerp(470,380,y.frame)}`);let f=y.a-y.base,N=D.lerp(220,128,y.frame),n=y.frame>.999&&Math.abs(Math.abs(f)-Math.PI/2)<.001;if(Math.abs(f)<.001)k.setAttribute("d","");else if(n)k.setAttribute("d",`M${y.x+42} ${y.y}v-42h-42`);else{let[e,l]=m(y.base,N);k.setAttribute("d",`M${y.x} ${y.y}L${e} ${l}`+i.arcD(y.x,y.y,N,y.base,y.a).replace(/^M[^A]+/,"")+"Z")}k.setAttribute("fill",n?"none":"rgba(255,225,77,0.14)");let r=(y.base+y.a)/2,p=D.lerp(260,172,y.frame);q.setAttribute("x",y.x+p*Math.cos(r)-12),q.setAttribute("y",y.y+p*Math.sin(r)+16),q.setAttribute("fill-opacity",(1-y.frame)*Math.min(1,Math.abs(f)/.12));let s=Math.cos(f);U.textContent=(Math.abs(s)<5e-4?0:s).toFixed(2)}t();let c=Cn(F,T);return m=>{y.a=rn(-1.45,-.85,Z(m,o.two+.6,o.close-o.two,"p2io")),y.a=rn(y.a,-1.55,Z(m,o.cos+.3,1.1,"p2io")),y.a=rn(y.a,-.72,Z(m,o.name+.3,1,"p2io")),y.v2grow=sn.progress((m-o.two)/.45),t(),c(m-o.two,.45,!0),an(T,Z(m,o.two,.3,"p1out")),an([k,q],Z(m,o.two+.3,.3,"p1out")),an([$,z],0),tn(d("s02-read"),m,o.cos+.2,.45,{blur:12},"expoout"),tn(d("s02-fx"),m,o.cos,.45,{blur:12},"expoout"),tn(d("s02-fxn"),m,o.name+.1,.4,{blur:12,y:20},"expoout"),d("s02-fx").querySelector(".box").style.borderColor=`rgba(232,184,74,${Z(m,o.name,.3,"p1out")})`}}function Rn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=["\u732B\u7CAE","\u732B\u7802","\u72D7\u7CAE"],L=["catfood","litter","dogfood"],M=320,R=160,u=390,P=164,O=230,F=A=>M+A*R,_=[];for(let A=0;A<8;A++){let a=i.h("div","s03-u",i.icon("user",64,{color:"#d6d9e0"}).replace("display:block","display:block;margin:0 auto")+`<span>\u7528\u6237 ${A+1}</span>`,d("s03-users"));E(a,{left:F(A),top:O}),_.push(a)}let T=v.map((A,a)=>{let x=i.h("div","s03-rl",i.icon(L[a],60,{color:a===2?"#d6d9e0":"#e8b84a"})+A,d("s03-rows"));return E(x,{top:u+a*P-14}),x}),V=xn.map((A,a)=>A.map((x,h)=>{let $=i.h("div","s03-c "+(x?"b1":"b0"),String(x),d("s03-cells"));return E($,{left:F(h)+8,top:u+a*P}),$}));return E("#s03-rowbox",{top:u-18}),d("s03-bits").textContent=xn[0].join(", "),T.forEach(A=>E(A,{left:60})),E("#s03-rowbox",{left:48,width:1504}),E("#s03-vecn",{left:48,width:1504,fontSize:58}),E("#s03-vecl",{left:48,width:1504}),A=>{_.forEach((a,x)=>tn(a,A,Math.max(0,o.ex-.4)+x*.06,.4,{y:-30},"expoout")),T.forEach((a,x)=>tn(a,A,(x?o.rest:o.one-.4)+x*.15,.4,{x:-30,blur:12},"expoout")),V.forEach((a,x)=>a.forEach((h,$)=>{let z=x?o.rest+.3+(x-1)*.5+$*.06:xn[0][$]?o.one+.1+$*.25:o.zero+($-2)*.06;tn(h,A,z,x?.3:.35,{scale:.6},"back2"),x&&(h.style.opacity=Number(h.style.opacity)*(1-.75*Z(A,o.row,.4,"p1out")))})),[1,2].forEach(a=>T[a].style.opacity=Number(T[a].style.opacity)*(1-.75*Z(A,o.row,.4,"p1out"))),tn(d("s03-rowbox"),A,o.row,.4,{scale:1.05},"expoout"),tn(d("s03-vecn"),A,o.row+.6,.5,{y:-40,blur:12},"expoout"),tn(d("s03-vecl"),A,o.row+.6,.45,{blur:12},"expoout")}}function On(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=i.s("g",{id:"s03-space",opacity:0},G),L=i.s("g",{},v),M=[540,800],R=[[870,800],[540,390],M],u=400,P=([e,l,b])=>{let g=-.72*e+b,I=l-.42*e;return[M[0]+g*u,M[1]-I*u]},O=[[1,0,0],[0,1,0],[0,0,1]].map(P),F=O.map(()=>i.arrow(L,{color:"rgba(242,242,240,0.45)",w:3,head:22,glow:!1})),_=O.map((e,l)=>{let b=i.s("text",{"font-size":32,"text-anchor":l===0?"start":l===1?"middle":"end"},L);return b.textContent="\u7528\u6237 "+(l+1),b}),T=i.s("g",{},v),V=i.arrow(T,{color:"#e8b84a",w:8,head:34}),A=i.arrow(T,{color:"#b8bcc6",w:6,head:30,glow:!1}),a=i.s("text",{"font-size":34},T);a.textContent="\u732B\u7CAE";let x=i.s("text",{"font-size":34,"text-anchor":"middle"},T);x.textContent="\u72D7\u7CAE";let h=i.s("path",{fill:"none",stroke:"rgba(255,225,77,0.35)","stroke-width":2,"stroke-dasharray":"8 8"},T),$=i.s("circle",{cx:M[0],cy:M[1],r:7,fill:"#f2f2f0"},v),z={depth:0,grow:0,axisGrow:0,labelOpacity:1};function k(){v.setAttribute("transform",`translate(${-190.5*(1-z.depth)} 0)`);let e=R.map((W,K)=>W.map((Q,X)=>D.lerp(Q,O[K][X],z.depth)));e.forEach((W,K)=>{i.setArrow(F[K],...M,...W.map((Q,X)=>D.lerp(M[X],Q,z.axisGrow))),_[K].setAttribute("x",W[0]+(K===0?20:K===2?-16:0)),_[K].setAttribute("y",W[1]+(K===1?-30:38)),_[K].setAttribute("opacity",K===2?z.depth:1)});let l=(W,K)=>e[W].map((Q,X)=>(Q-M[X])*K*.66*z.grow),b=l(0,xn[0][0]),g=l(1,xn[0][1]),I=l(2,xn[0][2]),w=M.map((W,K)=>W+b[K]+g[K]+I[K]);i.setArrow(V,...M,...w),a.setAttribute("x",w[0]+18),a.setAttribute("y",w[1]-18),a.setAttribute("opacity",z.grow*z.labelOpacity);let j=l(2,xn[2][2]),H=M.map((W,K)=>W+j[K]);i.setArrow(A,...M,...H),x.setAttribute("x",H[0]),x.setAttribute("y",H[1]+54),x.setAttribute("opacity",z.depth*z.grow*z.labelOpacity),h.setAttribute("d",`M${M[0]+b[0]} ${M[1]+b[1]}L${w[0]} ${w[1]}L${M[0]+g[0]} ${M[1]+g[1]}`),d("s03-dim-value").textContent=z.depth<.5?"\u4E8C\u7EF4":"\u4E09\u7EF4"}k();let q=i.s("g",{opacity:0},v),y=[-60,-36,-136,-98,18,68,145],U=[380,380,340,250,280,220,260],t=["#e8b84a","#ffe14d","#b8bcc6","#858996","#858996","#858996","#858996"],c=y.map((e,l)=>i.arrow(q,{color:t[l],w:l<3?6:3,head:l<3?28:22,glow:l<2})),m=y.map(()=>({u:0})),f=()=>c.forEach((e,l)=>{let b=y[l]*Math.PI/180,g=U[l]*m[l].u;i.setArrow(e,...M,M[0]+Math.cos(b)*g,M[1]+Math.sin(b)*g)});f();let N=c.map(e=>Cn(q,e)),n=D.rng(303),r=Array.from({length:4200},()=>n()<.42?1:0),p=O.map(e=>{let l=Math.hypot(e[0]-M[0],e[1]-M[1]);return e.map((b,g)=>M[g]+(b-M[g])*(1-22*.8/l))});function s(e){if(e<=o.many||e>=o.calc+1.1)return;let l=gn(e,o.many,o.many+.75),b=gn(e,o.calc,o.calc+1.1),g=l*(1-b),I=gn(e,o.many,o.many+.25)*(1-gn(e,o.calc+.85,o.calc+1.1)),w=(Math.min(e,o.calc)-o.many)*260;C.save(),C.lineCap="butt",C.lineWidth=D.lerp(3,6,g);for(let j=0;j<7;j++)for(let H=0;H<120;H++){let W=60+H*8-w*(1+j*.15)%8,K=690+j*24,Q=(H+Math.floor(w/8)*(j+1)+j*997)%r.length,X=r[Q],on=j*120+H,pn=on%3,J=Math.floor(on/3),nn=p[pn],cn=M.map((wn,yn)=>D.lerp(wn,nn[yn],J/280)),en=M.map((wn,yn)=>D.lerp(wn,nn[yn],(J+1)/280)),fn=X?j===3?ln.yellow:ln.gold:ln.silver,hn=(X?.85:.12)*(j===3?1:.55);C.strokeStyle=D.rgba(D.mix(ln.white,fn,g),D.lerp(.45,hn,g)*I),C.beginPath(),C.moveTo(D.lerp(cn[0],W+3,g),D.lerp(cn[1],K,g)),C.lineTo(D.lerp(en[0],W+3,g),D.lerp(en[1],K+18,g)),C.stroke()}C.restore()}return e=>{D.begin(C),z.depth=1,z.axisGrow=1,z.grow=1-Z(e,o.many,.55,"p2io"),z.labelOpacity=1-Z(e,o.many-.18,.18,"p2in"),k(),an(v,1),an(T,e<o.calc?1:0),an([L,$],1-Z(e,o.many,.6,"p2io")+Z(e,o.calc+.85,.25,"p2io")),an(q,e>=o.calc+.8?1:0),m.forEach((I,w)=>I.u=sn.progress((e-o.calc-.8-w*.08)/.6)),f(),N.forEach((I,w)=>I(e-o.calc-.8-w*.08,.6,!0)),s(e);let l=Z(e,o.many,.75,"p2io"),b=Z(e,o.calc+.05,.45,"p2in");dn(d("s03-many"),{y:572*(1-l)-36*b,scale:(.5+.5*l)*(1-.08*b)}),an(d("s03-many"),l*(1-b));let g=rn(3,1e4,Z(e,o.many+.2,2.2,"p2out"));d("s03-cnt").textContent=g>=9999?"10,000+":Math.round(g).toLocaleString("en-US"),an(d("s03-dim"),1-Z(e,o.many,.12,"p2in")),dn(d("s03-dim"),{y:-70}),tn(d("s03-space-note"),e,o.calc+.8,.3,{blur:12},"expoout")}}function qn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=[540,850],L=["\u732B\u7CAE","\u732B\u7802","\u5BA0\u7269","\u53EF\u7231","\u5582\u98DF","\u6293\u8001\u9F20"],M=[148,132.672],R=79.024,u=i.s("g",{},G);function P(T,V,A,a){let x=V[0]-T[0],h=V[1]-T[1],$=Math.hypot(x,h),z=x/$,k=h/$,q=a/2+1.5,y=(A-a)/2,U=Math.abs(k)>1e-6?q/Math.abs(k):1/0,t=Math.abs(z)*U<=y?U:y*Math.abs(z)+Math.sqrt(q*q-y*y*k*k);return[T[0]+z*t,T[1]+k*t]}let O=i.h("div","s04-w","\u732B",d("s04-graph"));O.id="s04-wc",E(O,{left:v[0]-M[0]/2,top:v[1]-M[1]/2,width:M[0],height:M[1]});let F=L.map((T,V)=>{let A=-Math.PI/2+V*Math.PI*2/L.length+.3,a=[v[0]+Math.cos(A)*330,v[1]+Math.sin(A)*190],x=T.length*38+48,h=i.h("div","s04-w",T,d("s04-graph"));E(h,{left:a[0]-x/2,top:a[1]-R/2,width:x,height:R});let $=i.line(u,...P(v,a,...M),...P(a,v,x,R),"ln gold",{"stroke-width":3});return{d:h,ln:$}}),_=F.map(T=>{let V=T.ln.getTotalLength();return sn.svgEffect(u,()=>({length:V,at:A=>{let a=T.ln.getPointAtLength(A*V);return[a.x,a.y]}}),T.ln)});return T=>{D.begin(C),D.glowDot(C,...v,260,ln.yellow,.35*Z(T,o.know-.1,.5,"smooth")),tn(O,T,o.see-.2,.5,{scale:.6},"back2"),an(u,Z(T,o.see,.01,"p1out")),F.forEach((V,A)=>{tn(V.d,T,o.see+.2+A*.12,.4,{scale:.6},"back2");let a=T-o.see-.3-A*.12;V.ln.style.strokeDasharray="1",V.ln.style.strokeDashoffset=1-sn.progress(a/.4),_[A](a,.4)})}}function Gn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=[[["\u5403",.9],["\u4E86",.1],["\u4E00\u4E2A",.2],["\u82F9\u679C",-1]],[["\u4E70",.3],["\u4E86",.1],["\u4E00\u53F0",.25],["\u82F9\u679C",-1],["\u624B\u673A",.95]]],L=[400,850],M=[],R=[],u=O=>Math.max(8,O-42*Math.log1p(Math.exp((O-360)/42)));v.forEach((O,F)=>{let _=O.map(([h])=>h.length*54+48),T=26,A=540-(_.reduce((h,$)=>h+$,0)+T*(O.length-1))/2,a=[];O.forEach(([h,$],z)=>{let k=i.h("div","s04-at"+($<0?" key":""),h,d("s04-att"));E(k,{left:A,top:L[F],width:_[z]}),a.push(A+_[z]/2),A+=_[z]+T,M.push(k)});let x=O.findIndex(([,h])=>h<0);O.forEach(([,h],$)=>{if($===x)return;let z=a[x],k=a[$],q=L[F]-8,y=k-z,U=D.rng(4400+F*100+$),t=h>.7,c=Math.min(450,Math.abs(y)),m=160+c*.3,f=42+c*.09,N=Array.from({length:Math.round(30+600*h)},(n,r)=>{let p=u(m+D.gauss(U)*f),s=u(p*D.lerp(.2,1.2,U())+D.gauss(U)*f*.6),e=D.clamp(z+y*D.lerp(.12,.45,U())+D.gauss(U)*f*.08,Math.min(z,k)+2,Math.max(z,k)-2),l=D.clamp(z+y*D.lerp(.55,.9,U())+D.gauss(U)*f*.08,Math.min(z,k)+2,Math.max(z,k)-2),b=D.clamp(U()*1.1),g=D.mix(ln.white,t?ln.goldHi:ln.silver,b),I=C.createLinearGradient(0,q,0,q-Math.max(p,s)*.75);return I.addColorStop(0,D.rgba(g,.8)),I.addColorStop(.55,D.rgba(g,.8)),I.addColorStop(1,D.rgba(D.mix(g,ln.white,.35),1)),un.create([[k,q],[l,q-s],[e,q-p],[z,q]],{stroke:I,delay:r%19*.012,alpha:1.25*(t?.085:.065)*D.clamp(Math.exp(D.gauss(U)*.55),.2,3),width:D.lerp(.55,.75,U())})});R.push({x0:z,x1:k,y:q,strands:N,delay:$*.025})})});function P(O){let F=o.ctxw-.2,_=1-gn(O,o.paper-.3,o.paper);if(!(O<=F||_<=0)){C.save(),C.globalCompositeOperation="lighter";for(let T of R)for(let V of T.strands)un.draw(C,V,O-F-T.delay,_);C.restore()}}return O=>{D.begin(C),P(O)}}function Dn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=Y("s07-silk",760,86),L=Y("s07-feed-silk",36,88),M=[];for(let _=0;_<7;_++)for(let T=0;T<7;T++){let V=170+_*40,A=670+T*40,a=858,x=A-V,h=D.rng(7700+_*100+T),$=_===T,z=Math.min(450,Math.abs(x)),k=44+z*.07,q=18+z*.025,y=Array.from({length:$?24:5},(U,t)=>{let c=D.clamp(k+D.gauss(h)*q,8,92),m=D.clamp(c*D.lerp(.2,1.2,h())+D.gauss(h)*q*.6,8,92),f=D.clamp(V+x*D.lerp(.12,.45,h())+D.gauss(h)*q*.08,V+2,A-2),N=D.clamp(V+x*D.lerp(.55,.9,h())+D.gauss(h)*q*.08,V+2,A-2),n=D.mix(ln.white,$?ln.goldHi:ln.silver,D.clamp(h()*1.1)),r=[[V,a],[f,a+c],[N,a+m],[A,a]];return(_+T+t)%2&&r.reverse(),un.create(r,{stroke:D.rgba(n,1),delay:t%19*.012,alpha:($?.065:.04)*D.clamp(Math.exp(D.gauss(h)*.55),.2,3),width:D.lerp(.55,.75,h())})});M.push({x0:V,x1:A,y:a,strands:y,delay:(_+T)%7*.025})}let R=D.rng(7714),u=Array.from({length:36},()=>{let _=D.clamp(D.gauss(R)*7,-14,14),T=D.mix(ln.white,ln.goldHi,D.lerp(.35,.95,R()));return un.create([[540,914],[540+_,938],[540+_*.7,964],[540,988]],{stroke:D.rgba(T,1),delay:0,alpha:D.lerp(.07,.12,R()),width:D.lerp(.55,.75,R())})});function P(_){D.begin(L);let T=o.tog+2.1,V=gn(_,T,T+.35),A=.65*(1-gn(_,o.fine-.3,o.fine+.05));if(!(V<=0||A<=0)){L.save(),L.translate(-522,-908),L.beginPath(),L.rect(522,913,36,1+75*V),L.clip();for(let a of u)un.draw(L,a,_-T+1.25,A);L.restore()}}function O(_){D.begin(v);let T=o.tog+1.55,V=1-gn(_,o.fine-.3,o.fine);if(!(_<=T||V<=0)){v.save(),v.translate(-160,-850);for(let A of M)for(let a of A.strands)un.draw(v,a,_-T-A.delay,V);v.restore()}}let F=(_,T,V,A)=>{let a=i.h("div","s07-box "+T,_,S.stage);return E(a,{left:V,top:A}),a};return F("\u5C0F\u738B\u559C\u6B22\u732B\u5417\uFF1F","input",145,770),F("\u5C0F\u738B\u4E0D\u559C\u6B22\u732B\u3002","input",645,770),F("Cross-Encoder","ce",370,1e3),_=>{O(_),P(_)}}function Fn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=G,L=(x,h,$,z)=>{x._spaceParticle=bn.svgParticle(x,{x:h,y:$,radius:z})},M=[["\u6211\u559C\u6B22\u732B",190,440,380,620,1],["\u732B\u5F88\u53EF\u7231",740,1020,560,740,1],["\u4ECA\u5929\u4E0B\u96E8",760,400,760,360,0],["\u6211\u4E70\u4E86\u624B\u673A",190,1040,140,1110,0]],R=i.s("g",{opacity:0},v),u=i.s("line",{stroke:"#ffe14d","stroke-width":3,"stroke-dasharray":"10 10"},R),P=M.map(([x,h,$,,,z],k)=>{let q=i.s("g",{},R);return L(q,0,0,1.25),i.s("text",{x:k===0?-22:22,y:12,"text-anchor":k===0?"end":"start","font-size":36,"font-weight":700,fill:z?"#ffe14d":"rgba(242,242,240,0.6)"},q).textContent=x,E(q,{x:h,y:$}),q}),O={u:0},F=()=>{d("s04-stepn").textContent=Math.round(O.u*3e4).toLocaleString("en-US")};F();let _=bn,T=[[-.85,.7,-.3],[.8,-.7,.45],[.8,.8,.35],[-.9,-.8,-.4]],V=[[-.25,.1,-.1],[.1,-.05,-.08],[.85,.85,.4],[-.9,-.8,-.45]],A=T.map((x,h)=>_.formation(44048+h,h===0?107:106,{radii:[.21,.19,.2],half:1.31}));function a(x,h,$,z){let k=_.project(h,$);return E(x,{x:k.x-z[0],y:k.y-z[1]}),x._spaceParticle.setAttribute("transform",`translate(${z[0]} ${z[1]}) scale(${k.scale.toFixed(4)})`),x._spaceParticle.setAttribute("opacity",(.75+.25*k.light).toFixed(3)),k}return x=>{D.begin(C),O.u=Z(x,o.train+.4,o.same-o.train-.8,"p2io"),F(),an(R,Z(x,o.train,.4,"p1out")),tn(d("s04-step"),x,o.train,.45,{blur:12},"expoout");let h=$n(x,o.train,o.train+.4,o.same-.3,o.same);if(h>.001){let $=_.camera({cx:550,cy:710,scale:200,depth:8,yaw:.48,pitch:-.29,spin:.04,sway:.015},x-o.train);C.save(),C.beginPath(),C.rect(80,350,920,870),C.clip(),_.frame(C,$,{half:1.45,age:x-o.train,alpha:h*.84});let z=T.map((t,c)=>t.map((m,f)=>D.lerp(m,V[c][f],O.u)));A.forEach((t,c)=>_.render(C,_.gather(t,x-o.train,{center:z[c],delay:c*.07}),$,{alpha:h,grainPoints:!0}));let k=z.map((t,c)=>a(P[c],t,$,[0,0])),q=x-o.train,y=sn.progress(q/.8,.8),U=[D.lerp(k[0].x,k[1].x,y),D.lerp(k[0].y,k[1].y,y)];u.setAttribute("x1",k[0].x),u.setAttribute("y1",k[0].y),u.setAttribute("x2",U[0]),u.setAttribute("y2",U[1]),sn.canvas(C,[k[0].x,k[0].y],U,q,.8,{alpha:h}),C.restore()}}}function Nn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S;E("#s04-sheet",{left:110,top:150}),E("#s04-fig",{left:640,top:690});let v=(L,M,R,u)=>{let P=Z(M,R,.7,"expoout");dn(d(L),{y:-80*(1-P),rotation:u-6+6*P,scale:1.06-.06*P}),an(d(L),P)};return L=>{v("s04-sheet",L,o.paper,-1),tn(d("s04-year"),L,o.paper+.4,.5,{scale:.85,blur:12},"expoout"),tn(d("s04-yl"),L,o.paper+.7,.45,{blur:12},"expoout"),v("s04-fig",L,o.title-.2,4)}}function Wn(S){let{$:d,svg:G,ctx:C,K:i,T:o,set:E,add:B,canvas:Y}=S,v=bn,L=v.cloud(808,1400,{radii:[1.15,.7,.9],shell:.5}).map((u,P)=>({...u,color:P%3?"#e5d9b9":"#d9e1ef"})),M=d("s08-avatar-float"),R=Array.from({length:3},(u,P)=>Array.from({length:5},(O,F)=>i.s("line",{},d("s08-action"+P).querySelector(".s08-action-burst"))));return u=>{D.begin(C);let P=$n(u,o.bye-.3,o.bye+.6,o.end-.9,o.end-.1),O=v.camera({cx:540,cy:690,scale:430,depth:6,yaw:.32,pitch:-.28,spin:.12,sway:.035},u-o.bye);v.render(C,L,O,{alpha:P*.16,pointSize:1.2,darkLift:.22,starPoints:!0,time:u}),M.style.transform=`translateY(${(4*Math.sin(Math.max(0,u-o.bye)*1.6)).toFixed(3)}px)`,tn(d("s08-avatar"),u,o.intro-.15,.45,{y:20,scale:.8},"back13"),tn(d("s08-name"),u,o.intro+.05,.3,{y:24,scale:.94},"back13"),tn(d("s08-farewell"),u,o.bye+.2,.3,{y:20},"p3out");for(let F=0;F<3;F++){let _=d("s08-action"+F),T=_.querySelector(".s08-action-icon path"),V=o.bye+.35+F*.12,A=o.bye+.8+F*.18,a=Z(u,V,.35,"p3out"),x=.15*(Z(u,A,.17,"sineout")-Z(u,A+.17,.17,"sinein"));an(_,a),dn(_,{scale:.85+.15*a+x}),T.style.strokeDashoffset=1-a;let h=Z(u,A+.1,.16,"p1out");_.style.color=`rgb(${[242,242,240].map(($,z)=>Math.round(rn($,[255,216,115][z],h))).join(",")})`,T.style.fillOpacity=F<2?.9*h:0,R[F].forEach(($,z)=>{let k=-Math.PI+(z+.5)*Math.PI/5,q=Z(u,A,.34,"p2out"),y=[Math.cos(k),Math.sin(k)];for(let[U,t]of Object.entries({x1:100+rn(58,86,q)*y[0],y1:100+rn(58,86,q)*y[1],x2:100+rn(74,102,q)*y[0],y2:100+rn(74,102,q)*y[1],opacity:u<A?0:1-q}))$.setAttribute(U,t)})}}}var kn=new WeakMap;function Hn(S,d){let G=kn.get(S);if(!G){let C=new FontFace("Smiley Sans",`url(${JSON.stringify(new URL("SmileySans-Oblique.otf",d).href)})`,{weight:"400",style:"normal"});G={count:0,face:C,promise:C.load().then(i=>(S.fonts.add(i),i))},kn.set(S,G)}return G.count++,{ready:G.promise,release(){--G.count===0&&(kn.delete(S),G.promise.then(C=>{G.count||S.fonts.delete(C)},()=>{}))}}}function Pn(S,d,G,{width:C=640,height:i=360}={}){let o=S.ownerDocument,E=mn[d.scene],B=Mn(o),Y=o.createElement("div");S.append(Y);let v=Y.attachShadow({mode:"open"}),[L,M,R,u]=d.view,P=Math.min(C/R,i/u),O=d.nodes.map(k=>E.html[k]).join("").replaceAll("__AVATAR__",new URL("wise-avatar.png",G).href).replaceAll("__TRANSFORMER__",new URL("transformer.png",G).href);v.innerHTML=`<style>*{box-sizing:border-box;margin:0;padding:0}${E.css}.viewport{position:absolute;left:${(C-R*P)/2}px;top:${(i-u*P)/2}px;width:${R}px;height:${u}px;overflow:hidden;transform:scale(${P});transform-origin:0 0;background:#050505}#root{inset:auto;left:${-L}px;top:${-M}px;width:1080px;height:1440px;overflow:visible}.full{position:absolute;inset:0;width:1080px;height:1440px}#s03-dim{transform:translateY(-70px)}</style><div class="viewport"><div id="root"><div class="scene-stage"><canvas id="main-canvas" class="vz" width="1080" height="1440"></canvas><svg id="selected-svg" class="full" viewBox="0 0 1080 1440"></svg>${O}</div></div></div>`;let F=v.querySelector(".scene-stage"),_=k=>v.getElementById(k),T=_("selected-svg"),V=_("main-canvas").getContext("2d");if(!V)throw Error("\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u51C6\u5907\u7ED8\u56FE\u753B\u5E03");function A(k,q){for(let y of typeof k=="string"?[...v.querySelectorAll(k)]:Array.isArray(k)?k:[k]){if(!y)continue;let U={};for(let[t,c]of Object.entries(q))["x","y","xPercent","yPercent","scale","rotation"].includes(t)?U[t]=c:y.style[t]=typeof c=="number"&&["left","right","top","bottom","width","height","fontSize"].includes(t)?c+"px":c;Object.keys(U).length&&dn(y,U)}}function a(k,q,y){let U=B.h("canvas","",null,F);return U.id=k,U.width=q,U.height=y,U.getContext("2d")}let x=vn[d.draw]({$:_,svg:T,ctx:V,K:B,T:E.T,set:A,stage:F,canvas:a,add:(k,q,y)=>B.h(k,q,y,F)}),h=!1,$=Hn(o,G),z=k=>{if(!h){let q=Sn(d,k);Y.dataset.sourceTime=String(q),x(q)}};return z.ready=Promise.all([$.ready,...[...v.querySelectorAll("img")].map(k=>k.decode())]).then(()=>{h||z(0)}),z.destroy=(k=!1)=>{if(!h){if(h=!0,k){let q=o.createElement("div");q.innerHTML=v.innerHTML;let y=q.querySelectorAll("canvas");v.querySelectorAll("canvas").forEach((c,m)=>{let f=o.createElement("img");for(let N of y[m].attributes)f.setAttribute(N.name,N.value);f.src=c.toDataURL(),y[m].replaceWith(f)});let U=o.createElement("iframe");U.title="\u52A8\u6548\u9759\u6001\u753B\u9762",U.setAttribute("aria-hidden","true"),U.style.cssText=`position:absolute;inset:0;width:${C}px;height:${i}px;border:0;pointer-events:none`,U.srcdoc=`<!doctype html><style>html,body{margin:0;background:#050505;overflow:hidden}@font-face{font-family:"Smiley Sans";src:url(${JSON.stringify(new URL("SmileySans-Oblique.otf",G).href)})}</style>`+q.innerHTML,Y.replaceChildren(U);let t=o.createElement("div");t.append(U),Y.replaceWith(t)}else Y.remove();$.release()}},z.shadow=v,z}function Un(S){let d=mn[S.scene].T,G={paper:[["sheet","\u8BBA\u6587\u9875\u843D\u5B9A","\u8BBA\u6587\u9875\u4ECE\u4E0A\u65B9\u503E\u659C\u843D\u4E0B\u5E76\u56DE\u7A33\u3002",d.paper,d.paper+.7,["tilt-drop-settle"]],["credits","\u5E74\u4EFD\u4E0E\u4F5C\u8005\u663E\u73B0","\u5E74\u4EFD\u5148\u653E\u5927\u663E\u73B0\uFF0C\u4F5C\u8005\u4FE1\u606F\u968F\u540E\u7531\u6A21\u7CCA\u53D8\u6E05\u6670\u3002",d.paper+.4,d.paper+1.15,["stagger-in"]],["figure","\u7ED3\u6784\u56FE\u8FDB\u5165","\u7ED3\u6784\u56FE\u4ECE\u4E0A\u65B9\u503E\u659C\u843D\u5B9A\uFF0C\u4E0E\u8BBA\u6587\u9875\u548C\u4F5C\u8005\u4FE1\u606F\u7EC4\u6210\u5B8C\u6574\u8D44\u6599\u3002",d.title-.2,d.title+.5,["tilt-drop-settle"]]],catLinks:[["center","\u4E2D\u5FC3\u8BCD\u5F39\u51FA","\u4E2D\u5FC3\u8BCD\u4ECE\u5C0F\u5C3A\u5BF8\u5F39\u51FA\uFF0C\u5EFA\u7ACB\u5173\u7CFB\u56FE\u7684\u4E2D\u5FC3\u3002",d.see-.2,d.see+.3,[]],["words","\u5468\u56F4\u8BCD\u8BED\u51FA\u73B0","\u516D\u4E2A\u5468\u56F4\u8BCD\u8BED\u6309\u5148\u540E\u987A\u5E8F\u7F29\u653E\u8FDB\u5165\u3002",d.see+.2,d.see+1.2,["stagger-in"]],["links","\u8FDE\u7EBF\u4F9D\u6B21\u957F\u51FA","\u8FDE\u7EBF\u4ECE\u4E2D\u5FC3\u6807\u7B7E\u8FB9\u7F18\u4F38\u5230\u5404\u8BCD\u8BED\u8FB9\u7F18\uFF0C\u7AEF\u70B9\u95EA\u5149\u540E\u505C\u7559\u3002",d.see+.3,d.see+1.3,["stroke-draw"]]],farewell:[["avatar","\u4EBA\u7269\u4E0E\u7F72\u540D\u51FA\u73B0","\u4EBA\u7269\u5934\u50CF\u5148\u5F39\u5165\uFF0C\u7F72\u540D\u968F\u540E\u51FA\u73B0\uFF1B\u5934\u50CF\u7EE7\u7EED\u8F7B\u5FAE\u6D6E\u52A8\u3002",d.intro-.15,d.intro+.35,["stagger-in"]],["icons","\u544A\u522B\u6587\u5B57\u4E0E\u56FE\u6807\u5165\u573A","\u544A\u522B\u6587\u5B57\u51FA\u73B0\uFF0C\u70B9\u8D5E\u3001\u6536\u85CF\u548C\u5173\u6CE8\u56FE\u6807\u4F9D\u6B21\u63CF\u51FA\u8F6E\u5ED3\u3002",d.bye+.2,d.bye+.94,["stagger-in","stroke-draw"]],["highlight","\u4E09\u8FDE\u5F39\u52A8\u70B9\u4EAE","\u4E09\u4E2A\u56FE\u6807\u4F9D\u6B21\u5F39\u52A8\u5E76\u53D8\u4E3A\u91D1\u8272\uFF0C\u540C\u65F6\u6563\u51FA\u77ED\u5C04\u7EBF\u3002",d.bye+.8,d.bye+1.5,["material-like-pop"]]]}[S.draw],C=i=>Math.round((Math.max(S.start,Math.min(S.end,i))-S.start)/S.rate*1e3);return G?.map(([i,o,E,B,Y,v])=>{let L=C(B),M=C(Y);return{id:i,name:o,detail:E,start:L,end:M,actions:v,time:`${(L/1e3).toFixed(2)}\u2013${(M/1e3).toFixed(2)} \u79D2`}})}var Tn=globalThis.document?.currentScript?.src;for(let S of zn){let d=(C,i)=>{let o=new URL(Tn?"../assets/knowledge-video/":"assets/knowledge-video/",Tn||C.ownerDocument.baseURI).href,E=Pn(C,S,o,i),B=Y=>E(Y/1e3);return B.ready=E.ready,B.destroy=E.destroy,B},G=Un(S);G&&(d.breakdown=G),(globalThis.MotionFactories||={})[S.factory]=d}})();
