/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){
'use strict';
const DEFAULT_TEXT='那些凌晨时分敲下的代码，是不会说谎的星星。';
const font='400 17.82px "LXGW WenKai"';
// 原历史适配器从 126 件物品中每隔九件选一件；固定一次原生成过程以支持回拖。
const originals=[
{"type":"symbol","x":338.08380454955625,"y":614.2467268845066,"kind":"notes","r":8.917234342801384,"outline":false,"start":1.4485873647929315,"speed":33.127103808122875,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":2,"luminosity":0.7,"endX":402.32016,"endY":453.36984,"gust":3.16275543813128,"wave":1.2944798259995878,"depthEnd":3.0684399366844444,"nearScale":0.6721677647903562,"phase":1.400802541048524,"spin":-0.5805877204053105,"material":"silver","duration":5.249414082823528,"flashAt":2.4147304780988232,"flashGap":1.9947773514729408,"settle":{"accent":false,"anchor":false,"period":5.398025373229757,"offset":3.7787870472297067,"scale":0.31891579038463536,"color":"rgb(221,240,255)","radius":0.32448501156643034,"brightness":0.6571220043231734,"twinkleSize":4.98415,"twinkleGain":0.72,"c1":{"x":349.64634853063615,"y":545.0696655241688},"c2":{"x":393.9694337914423,"y":488.01529112721505}}},
{"type":"symbol","x":263.3976259441115,"y":615.2760361162946,"kind":"spark","r":7.405305000860244,"outline":false,"start":1.9600158506156438,"speed":95.47449672753187,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":2,"luminosity":0.7,"endX":288.06624,"endY":121.54736,"gust":3.1513803192833434,"wave":1.5825099465437233,"depthEnd":3.4048386639449744,"nearScale":0.681317098159343,"phase":1.031729042124439,"spin":-0.553536215890199,"material":"silver","duration":5.178239134580104,"flashAt":2.381990001906848,"flashGap":1.9677308711404395,"settle":{"accent":false,"anchor":false,"period":7.665010883333162,"offset":7.740663943067192,"scale":0.27355100723914805,"color":"rgb(185,215,255)","radius":0.5825536723993718,"brightness":0.6729014257551171,"twinkleSize":5.01235,"twinkleGain":0.72,"c1":{"x":267.8379764741714,"y":402.9727053862879},"c2":{"x":284.8593201727345,"y":173.48483349688783}}},
{"type":"symbol","x":467.6080427048263,"y":616.2529976498336,"kind":"moon","r":8.601977329235524,"outline":false,"start":2.5429769800824196,"speed":25.259027823805916,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":2,"luminosity":0.7,"endX":554.862,"endY":474.64119999999997,"gust":2.898215280398726,"wave":1.5338486244436353,"depthEnd":3.417670014966279,"nearScale":0.6917729718843475,"phase":5.003463245139018,"spin":0.21267431876622134,"material":"silver","duration":6.630647401357743,"flashAt":3.050097804624562,"flashGap":2.5196460125159423,"settle":{"accent":false,"anchor":false,"period":6.535195192508399,"offset":6.281158284237608,"scale":0.41362995078787207,"color":"rgb(214,228,255)","radius":0.4474682882707566,"brightness":0.5666365299373866,"twinkleSize":5.01475,"twinkleGain":0.72,"c1":{"x":483.31375501795753,"y":555.3599246604051},"c2":{"x":543.5189855516273,"y":507.90809303032995}}},
{"type":"symbol","x":503.9400191102643,"y":615.4444463178515,"kind":"note","r":8.623398859100417,"outline":false,"start":3.007732921879894,"speed":54.47495236069861,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":2,"luminosity":0.7,"endX":600.44226,"endY":292.92823999999996,"gust":2.4637315917480733,"wave":1.4824086104054004,"depthEnd":3.2283030219376085,"nearScale":0.6823658670997247,"phase":1.1649632865397943,"spin":-0.43261826927773656,"material":"silver","duration":6.194574146389238,"flashAt":2.8495041073390497,"flashGap":2.3539381756279103,"settle":{"accent":false,"anchor":false,"period":5.547169263428077,"offset":5.462412178982048,"scale":0.4194628651905805,"color":"rgb(192,227,255)","radius":0.49205292377620935,"brightness":0.7455782386357896,"twinkleSize":5.0074000000000005,"twinkleGain":0.72,"c1":{"x":521.3104224704167,"y":476.76247760117536},"c2":{"x":587.8969686843344,"y":346.642160680806}}},
{"type":"symbol","x":330.29582482622936,"y":613.9803813053295,"kind":"star","r":7.757757415343075,"outline":true,"start":1.4159018603345017,"speed":55.28059040061499,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":1,"luminosity":0.88,"endX":386.51910000000004,"endY":243.70192,"gust":4.685896806826349,"wave":1.9759806753136218,"depthEnd":2.075715503282845,"nearScale":0.7950814851839095,"phase":3.146917597863667,"spin":-0.16854760805144908,"material":"white","duration":6.7796097395411286,"flashAt":3.1186204801889192,"flashGap":2.5762517010256287,"settle":{"accent":false,"anchor":false,"period":5.785929510649294,"offset":3.571700003230944,"scale":0.3637472040206194,"color":"rgb(211,244,255)","radius":0.3367804224882275,"brightness":0.6382511154050008,"twinkleSize":5.0038,"twinkleGain":0.72,"c1":{"x":340.41601435750806,"y":454.76064294403784},"c2":{"x":379.21007422740985,"y":307.63146005976205}}},
{"type":"symbol","x":386.37800567848615,"y":616.3816361119971,"kind":"note","r":9.95939833286684,"outline":false,"start":1.9277402463640765,"speed":89.56289522850135,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":1,"luminosity":0.88,"endX":422.37557999999996,"endY":159.22632,"gust":3.9914547616126943,"wave":1.6244508526287973,"depthEnd":1.9332319373264908,"nearScale":0.8696582538820803,"phase":3.4849142812165015,"spin":0.1849008050747215,"material":"white","duration":5.121119438392473,"flashAt":2.3557149416605374,"flashGap":1.9460253865891397,"settle":{"accent":false,"anchor":false,"period":6.46554282810539,"offset":1.544529462000355,"scale":0.3480120370350778,"color":"rgb(232,237,255)","radius":0.3664231704454869,"brightness":0.6873971486464143,"twinkleSize":5.1421,"twinkleGain":0.72,"c1":{"x":392.8575690563586,"y":419.8048501838383},"c2":{"x":417.6958953382032,"y":222.69410316400013}}},
{"type":"symbol","x":243.08622664636934,"y":621.8054080437869,"kind":"moon","r":8.46396007342264,"outline":true,"start":2.121920048178923,"speed":67.9351944182371,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":1,"luminosity":0.88,"endX":246.13248,"endY":281.38088,"gust":4.382769373320043,"wave":1.1561987136956304,"depthEnd":2.4199857536703346,"nearScale":0.8003788426960818,"phase":2.233739358267434,"spin":0.21266786805354065,"material":"silver","duration":5.01123180596753,"flashAt":2.3051666307450636,"flashGap":1.9042680862676613,"settle":{"accent":false,"anchor":false,"period":6.274089878145605,"offset":5.2612368282396345,"scale":0.2682264135405421,"color":"rgb(215,228,255)","radius":0.4154970316309482,"brightness":0.6773879789514468,"twinkleSize":5.00125,"twinkleGain":0.72,"c1":{"x":243.63455225002286,"y":475.42286098495856},"c2":{"x":245.736467064028,"y":340.8417787479005}}},
{"type":"symbol","x":228.8174429139588,"y":616.1156790591776,"kind":"star","r":6.836972923763096,"outline":true,"start":2.3344879874751974,"speed":40.99291093634885,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":1,"luminosity":0.88,"endX":237.62442,"endY":388.95032000000003,"gust":4.5143577686743805,"wave":1.8846232837531716,"depthEnd":2.345965776592493,"nearScale":0.896306337194983,"phase":3.534974657632117,"spin":-0.060179202770814344,"material":"silver","duration":5.546000870656119,"flashAt":2.5511604005018147,"flashGap":2.107480330849325,"settle":{"accent":false,"anchor":false,"period":6.312425839481875,"offset":3.261834785621613,"scale":0.40273888275958597,"color":"rgb(244,255,255)","radius":0.3704545921832323,"brightness":0.6179935956723057,"twinkleSize":5.1382,"twinkleGain":0.72,"c1":{"x":230.40269878944622,"y":518.4345746637313},"c2":{"x":236.47951297881463,"y":434.41752277381454}}},
{"type":"symbol","x":197.95088193649428,"y":618.8635389087722,"kind":"star","r":8.467479835171252,"outline":true,"start":2.561448994324748,"speed":43.296111384843734,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":1,"luminosity":0.88,"endX":144.64097999999998,"endY":343.36984,"gust":3.5133547561406155,"wave":1.4511141409166157,"depthEnd":1.7011817621067167,"nearScale":0.7984459458570927,"phase":4.226599042152419,"spin":0.5176791834644973,"material":"white","duration":6.4881117467626215,"flashAt":2.984531403510806,"flashGap":2.465482463769796,"settle":{"accent":false,"anchor":false,"period":5.982916823402047,"offset":0.7545577615033835,"scale":0.3420420438237488,"color":"rgb(255,241,221)","radius":0.36229304811917246,"brightness":0.569660355290398,"twinkleSize":5.1226,"twinkleGain":0.72,"c1":{"x":188.3550995879253,"y":500.40124837800016},"c2":{"x":151.57126725174425,"y":391.85250623611563}}},
{"type":"symbol","x":499.6502090492752,"y":616.7401735987514,"kind":"moon","r":9.075007234606893,"outline":false,"start":2.9349208059997833,"speed":53.53633185405431,"revealDuration":1.1666666666666667,"hasTrail":true,"layer":1,"luminosity":0.88,"endX":592.5414,"endY":314.19872,"gust":2.6854633229412137,"wave":1.3274811150040478,"depthEnd":2.291216068342328,"nearScale":0.8608141351374798,"phase":5.955156795475398,"spin":0.5069533334579318,"material":"white","duration":5.926604089844559,"flashAt":2.726237881328497,"flashGap":2.252109554140932,"settle":{"accent":false,"anchor":false,"period":5.773286420712248,"offset":2.501671085320413,"scale":0.34705000824294985,"color":"rgb(231,250,255)","radius":0.4770578669197857,"brightness":0.5964586506714114,"twinkleSize":5.0512,"twinkleGain":0.72,"c1":{"x":516.3706234204056,"y":486.6473485512883},"c2":{"x":580.4655451764057,"y":359.2648803263579}}},
{"type":"symbol","x":345.8841487355065,"y":613.6675745937973,"kind":"spark","r":9.079915146529675,"outline":false,"start":1.4014127820702518,"speed":46.858991891802454,"revealDuration":1.1666666666666667,"hasTrail":false,"layer":0,"luminosity":1,"endX":402.32016,"endY":312.37536,"gust":3.320387098006904,"wave":1.3475046202074736,"depthEnd":1.1184112907387316,"nearScale":1.005892945160158,"phase":4.910278482431045,"spin":-0.2613489784765989,"material":"white","duration":6.548326284618169,"flashAt":3.012230090924358,"flashGap":2.4883639881549042,"settle":{"accent":false,"anchor":false,"period":6.5851131160743535,"offset":2.596594315068796,"scale":0.25653773818165065,"color":"rgb(217,234,255)","radius":0.5662045692373067,"brightness":0.6631328217452392,"twinkleSize":5.0912500000000005,"twinkleGain":0.72,"c1":{"x":356.04263076311537,"y":484.1119223184645},"c2":{"x":394.98347853561586,"y":371.286165903608}}},
{"type":"symbol","x":381.57877357676625,"y":616.2123751165345,"kind":"butterfly","r":9.947087642108091,"outline":false,"start":1.8153498437306852,"speed":88.68884685545329,"revealDuration":1.1666666666666667,"hasTrail":true,"layer":0,"luminosity":1,"endX":420.55266,"endY":95.41399999999999,"gust":5.299331588437781,"wave":1.206816105172038,"depthEnd":1.3881176757160574,"nearScale":0.9759686756972223,"phase":5.247824208119683,"spin":-0.7476431066170335,"material":"white","duration":5.88973457840944,"flashAt":2.7092779060683427,"flashGap":2.238099139795587,"settle":{"accent":false,"anchor":false,"period":7.638889520196244,"offset":8.17597205294296,"scale":0.38651664049364626,"color":"rgb(255,252,244)","radius":0.4715237935632467,"brightness":0.7005177639774047,"twinkleSize":5.20705,"twinkleGain":0.72,"c1":{"x":388.5940731329483,"y":392.2690738164247},"c2":{"x":415.4860547649796,"y":159.4239528459832}}},
{"type":"symbol","x":243.50002283742654,"y":621.453295073472,"kind":"flower","r":10.218815077166074,"outline":false,"start":2.1863549766198664,"speed":78.69411749303747,"revealDuration":1.1666666666666667,"hasTrail":true,"layer":0,"luminosity":1,"endX":246.74034,"endY":171.38088000000002,"gust":4.792446699226275,"wave":1.3500778446905315,"depthEnd":1.2363008878659456,"nearScale":1.0361693078279495,"phase":2.558457448742147,"spin":-0.7479868023656309,"material":"white","duration":5.7194218322143175,"flashAt":2.6309340428185863,"flashGap":2.1733802962414406,"settle":{"accent":false,"anchor":false,"period":7.420000341674313,"offset":5.937122213188558,"scale":0.37847963568754495,"color":"rgb(242,250,255)","radius":0.4779289674386382,"brightness":0.7112721711280756,"twinkleSize":5.0473,"twinkleGain":0.72,"c1":{"x":244.08327992668976,"y":427.922156591879},"c2":{"x":246.31909876886544,"y":231.21845597580554}}},
{"type":"symbol","x":185.05778092830445,"y":615.7149026002735,"kind":"moon","r":8.301138877961785,"outline":true,"start":2.769122210733129,"speed":77.83146585917632,"revealDuration":1.1666666666666667,"hasTrail":true,"layer":0,"luminosity":1,"endX":118.50828,"endY":210.88407999999998,"gust":4.526637090370059,"wave":1.103684047004208,"depthEnd":1.454644591268152,"nearScale":1.0283202340686695,"phase":3.846562852073958,"spin":0.17134506865404553,"material":"gold","duration":5.276066134245267,"flashAt":2.426990421752823,"flashGap":2.004905131013201,"settle":{"accent":true,"anchor":true,"period":4.550384597480297,"offset":5.636626946320757,"scale":0.54,"color":"rgb(246,247,255)","radius":1.0330797167727725,"brightness":0.9992221383261495,"twinkleSize":9,"twinkleGain":1,"c1":{"x":173.07887076120966,"y":441.6376488821559},"c2":{"x":127.15971512067958,"y":255.41810800834736}}}
];
let fontTask;
function readyFont(){
  if(!fontTask)fontTask=document.fonts?.load(font,DEFAULT_TEXT)||Promise.resolve();
  return fontTask;
}
global.MotionFactories['letter-ripple']=root=>{
  root.dataset.art='original';
  root.innerHTML='<canvas class="letter-ripple-canvas" width="1280" height="720" style="display:block;width:640px;height:360px" aria-hidden="true"></canvas>';
  const canvas=root.firstElementChild,ctx=canvas.getContext('2d');
  const W=660,H=880,SKY_LOOP=9,reduce=false,TRANSFORM_RATE=1.2,WATER_SPEED=91*TRANSFORM_RATE,WATER_LEAD=1.35/TRANSFORM_RATE;
  const MATERIALS={white:{color:'#ffffff',light:'#ffffff',trail:'#ffffff'},silver:{color:'#f1f4f8',light:'#ffffff',trail:'#f1f4f8'},gold:{color:'#ffe39a',light:'#fff9e6',trail:'#ffe39a'}};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const water={start:0,x:W*.14,y:H*.7-W*.08/2,width:W*.72,height:W*.08};
  const cycle={sendAt:0,lightEnd:9};
  let clock=0,particles=[],ordered=[],loaded=false,disposed=false,preserved=false,last=0,previous;
  // 以下函数保留原 animation.js 的画布实现：柔光、字形像素重采样和飞行不重写。
function makeButterflyWing(r,side){
  const path=new Path2D(),x=v=>side*v*r;
  path.moveTo(x(.04),-.22*r);
  path.bezierCurveTo(x(.38),-.92*r,x(1.12),-1.08*r,x(1),-.35*r);
  path.bezierCurveTo(x(.96),-.04*r,x(.61),.06*r,x(.4),.08*r);
  path.bezierCurveTo(x(.98),.18*r,x(.76),.94*r,x(.34),.66*r);
  path.bezierCurveTo(x(.14),.54*r,x(.09),.29*r,x(.04),.12*r);
  path.closePath();return path;
}

// 造型保持固定轮廓，只旋转与等比缩放。
function makeShape(kind,r){
  const path=new Path2D();
  if(kind==='heart'){
    path.moveTo(0,-.46*r);
    path.bezierCurveTo(-.46*r,-1.12*r,-1.14*r,-.64*r,-.86*r,-.06*r);
    path.bezierCurveTo(-.69*r,.3*r,-.22*r,.65*r,0,.9*r);
    path.bezierCurveTo(.22*r,.65*r,.69*r,.3*r,.86*r,-.06*r);
    path.bezierCurveTo(1.14*r,-.64*r,.46*r,-1.12*r,0,-.46*r);
  }else if(kind==='flower'){
    // 四瓣圆润小花，花瓣在中心轻轻收腰。
    path.moveTo(0,-.34*r);
    path.bezierCurveTo(.28*r,-1.28*r,1.28*r,-.28*r,.34*r,0);
    path.bezierCurveTo(1.28*r,.28*r,.28*r,1.28*r,0,.34*r);
    path.bezierCurveTo(-.28*r,1.28*r,-1.28*r,.28*r,-.34*r,0);
    path.bezierCurveTo(-1.28*r,-.28*r,-.28*r,-1.28*r,0,-.34*r);
  }else if(kind==='butterfly'){
    for(const side of [-1,1])path.addPath(makeButterflyWing(r,side));
    path.moveTo(.1*r,0);path.ellipse(0,0,.1*r,.53*r,0,0,Math.PI*2);path.closePath();
    return path;
  }else if(kind==='note'||kind==='notes'){
    // 实心符头、细符杆；直接画轮廓，避免依赖字体中的音乐字形。
    const head=(x,y)=>{
      path.moveTo((x+.36*Math.cos(-.3))*r,(y+.36*Math.sin(-.3))*r);
      path.ellipse(x*r,y*r,.36*r,.24*r,-.3,0,Math.PI*2);path.closePath();
    };
    if(kind==='note'){
      head(-.25,.63);path.rect(.02*r,-.94*r,.15*r,1.55*r);
      path.moveTo(.17*r,-.94*r);
      path.bezierCurveTo(.25*r,-.64*r,.9*r,-.56*r,.58*r,-.13*r);
      path.bezierCurveTo(.6*r,-.48*r,.23*r,-.43*r,.17*r,-.55*r);
      path.closePath();
    }else{
      head(-.54,.69);head(.49,.45);
      path.rect(-.27*r,-.62*r,.15*r,1.31*r);path.rect(.76*r,-.9*r,.15*r,1.35*r);
      path.moveTo(-.27*r,-.62*r);path.lineTo(.91*r,-.94*r);
      path.lineTo(.91*r,-.67*r);path.lineTo(-.27*r,-.35*r);path.closePath();
    }
    return path;
  }else if(kind==='moon'){
    path.moveTo(.48*r,-.96*r);
    path.bezierCurveTo(-.73*r,-1.06*r,-1.32*r,.13*r,-.62*r,.87*r);
    path.bezierCurveTo(-.13*r,1.4*r,.79*r,1.04*r,1.03*r,.38*r);
    path.bezierCurveTo(.33*r,.91*r,-.45*r,.27*r,-.33*r,-.34*r);
    path.bezierCurveTo(-.25*r,-.67*r,.08*r,-.89*r,.48*r,-.96*r);
  }else if(kind==='spark'){
    path.moveTo(0,-r);
    path.bezierCurveTo(.12*r,-.18*r,.18*r,-.12*r,.8*r,0);
    path.bezierCurveTo(.18*r,.12*r,.12*r,.18*r,0,r);
    path.bezierCurveTo(-.12*r,.18*r,-.18*r,.12*r,-.8*r,0);
    path.bezierCurveTo(-.18*r,-.12*r,-.12*r,-.18*r,0,-r);
  }else if(kind==='diamond'){
    path.moveTo(0,-r);path.lineTo(r*.62,0);path.lineTo(0,r);path.lineTo(-r*.62,0);
  }else if(kind==='cross'){
    for(const [i,[x,y]] of [[-.16,-1],[.16,-1],[.16,-.16],[1,-.16],[1,.16],[.16,.16],[.16,1],[-.16,1],[-.16,.16],[-1,.16],[-1,-.16],[-.16,-.16]].entries()){
      if(i===0)path.moveTo(x*r,y*r);else path.lineTo(x*r,y*r);
    }
  }else{
    for(let i=0;i<10;i++){
      const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
      if(i===0)path.moveTo(x,y);else path.lineTo(x,y);
    }
  }
  path.closePath();return path;
}


function flightPoint(p,travel){
  if(p.settle){
    const t=travel,v=1-t,{c1,c2}=p.settle;
    return {x:v*v*v*p.x+3*v*v*t*c1.x+3*v*t*t*c2.x+t*t*t*p.endX,
      y:v*v*v*p.y+3*v*v*t*c1.y+3*v*t*t*c2.y+t*t*t*p.endY,perspective:1};
  }
  const t=travel,perspective=1/(1+p.depthEnd*t);
  const dx=p.endX-p.x,dy=p.endY-p.y,length=Math.hypot(dx,dy);
  // 气流沿右上方向持续输送，仅叠加细微横向起伏，不绕弯或盘旋。
  const envelope=Math.sin(Math.PI*t)**2;
  const sway=(Math.sin(t*Math.PI*2)*p.gust+
    Math.sin(t*Math.PI*4+p.phase)*p.wave)*envelope;
  return {x:p.x+dx*t-sway*dy/length,
    y:p.y+dy*t+sway*dx/length,perspective};
}

function buildFlight(p){
  const points=[];let distance=0;
  for(let i=0;i<=128;i++){
    const point=flightPoint(p,i/128),previous=points.at(-1);
    if(previous)distance+=Math.hypot(point.x-previous.x,point.y-previous.y);
    points.push({...point,distance});
  }
  return points;
}

function position(p,age){
  const u=clamp(age/p.duration),points=p.flight;
  const distance=u*points.at(-1).distance;
  let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].distance<distance)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],t=(distance-a.distance)/(b.distance-a.distance||1);
  const perspective=a.perspective+(b.perspective-a.perspective)*t;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
    scale:p.nearScale*Math.pow(perspective,.7),
    alpha:p.luminosity*(.68+.32*Math.sqrt(perspective))*(1-smooth((u-.78)/.22))};
}

function catchRecoil(p,age){
  if(!p.kite)return 0;
  const t=age-p.kite.brakeAt-.6;
  if(t<=0||age>=p.kite.releaseAt)return 0;
  // 沿原轨迹轻轻退回，再逐渐收住；起止位移和速度均连续。
  const pulse=t=>t>0?Math.exp(-1.35*t)*(1-Math.cos(7.5*t)):0;
  const settle=pulse(t);
  return -p.kite.recoil*settle*smooth((p.kite.releaseAt-age)/.45);
}

function kiteWind(p,age){
  if(!p.kite)return 0;
  const {windAt,releaseAt}=p.kite;
  return smooth((age-windAt)/(releaseAt-windAt))*(1-smooth((age-releaseAt)/1));
}

function flightAgeAt(p,age){
  // 风先沿原路把物品和光丝轻轻带紧，松开后接上飞行，不突然跳变。
  const windAdvance=p.kite?kiteWind(p,age)*p.kite.windPush/p.speed:0;
  if(p.kite&&age>p.kite.brakeAt){
    const {brakeAt,releaseAt,departSpeed}=p.kite;
    // 半秒多的减速、牵住、加速连续衔接，避免突然停住或跳到前方。
    if(age<brakeAt+.6){const u=(age-brakeAt)/.6;age=brakeAt+.6*(u-u*u*.5);}
    else if(age<releaseAt)age=brakeAt+.3+catchRecoil(p,age)/p.speed;
    else if(age<releaseAt+.6){const u=(age-releaseAt)/.6;age=brakeAt+.3+departSpeed*.3*u*u;}
    else age=brakeAt+.3+departSpeed*(age-releaseAt-.3);
  }
  // 显形时由风渐渐带起，速度平滑接上各自的匀速飞行，没有停顿或突然起飞。
  if(age>=p.revealDuration)return age-p.revealDuration*.5+windAdvance;
  const t=clamp(age/p.revealDuration);
  return p.revealDuration*(t*t*t-.5*t*t*t*t)+windAdvance;
}

function windSway(p,age){
  if(!p.kite)return {x:0,y:0,turn:0};
  const strength=kiteWind(p,age),phase=(age-p.kite.windAt)*Math.PI*2/1.15;
  const wave=Math.sin(phase)*strength,offset=wave*p.kite.windSway;
  const dx=p.endX-p.x,dy=p.endY-p.y,length=Math.hypot(dx,dy);
  return {x:-dy/length*offset,y:dx/length*offset,turn:wave*.09};
}

function poseAt(p,age){
  if(p.settle){
    const t=clamp(age/p.duration),travel=t*t*t*(10+t*(-15+6*t));
    const q=flightPoint(p,travel);
    return {...q,scale:p.nearScale+(p.settle.scale-p.nearScale)*smooth(t),alpha:p.luminosity};
  }
  const q=position(p,flightAgeAt(p,age)),sway=windSway(p,age);
  return {...q,x:q.x+sway.x,y:q.y+sway.y};
}


function flashPulse(age,start){
  const t=age-start;
  if(t<0||t>.27)return 0;
  if(t<.045)return smooth(t/.045);
  if(t<.085)return 1;
  return 1-smooth((t-.085)/.185);
}

// 缓存物品与星空的光芒图，避免每枚每帧重复创建渐变。
const glintTextures = new Map();
function glintTexture(material){
  const key=material==='star'?'star':material==='gold'?'gold':'white';
  if(glintTextures.has(key))return glintTextures.get(key);
  const texture=document.createElement('canvas');texture.width=texture.height=160;
  const g=texture.getContext('2d');g.setTransform(2,0,0,2,80,80);
  const tint=key==='gold'?'255,238,189':'255,255,255';
  // 闪光独立叠在纯色物体上：白亮核、尖细星芒与紧贴亮核的小光晕。
  const halo=g.createRadialGradient(0,0,0,0,0,6.5);
  halo.addColorStop(0,'#ffffff');halo.addColorStop(.16,`rgba(${tint},.95)`);
  halo.addColorStop(.42,`rgba(${tint},.3)`);halo.addColorStop(1,`rgba(${tint},0)`);
  g.fillStyle=halo;g.fillRect(-6.5,-6.5,13,13);
  const reach=key==='star'?26:12*2.6,halfWidth=key==='star'?1.25:1.3;
  const rays=key==='star'?[[0,reach,1],[Math.PI/2,reach,1]]:
    [[.1,reach,1],[Math.PI/2+.1,reach*.75,1],[Math.PI/4+.1,reach*.43,.38],[Math.PI*.75+.1,reach*.43,.38]];
  for(const [angle,length,gain] of rays){
    g.save();g.rotate(angle);g.globalAlpha*=gain;
    const ray=g.createLinearGradient(-length,0,length,0);
    ray.addColorStop(0,`rgba(${tint},0)`);ray.addColorStop(.25,`rgba(${tint},.5)`);
    ray.addColorStop(.45,'#ffffff');ray.addColorStop(.55,'#ffffff');
    ray.addColorStop(.75,`rgba(${tint},.5)`);ray.addColorStop(1,`rgba(${tint},0)`);
    // 尖端收至零宽，亮核附近保留可见宽度，缩小画面后仍然读得出闪光。
    g.fillStyle=ray;g.beginPath();g.moveTo(-length,0);
    g.quadraticCurveTo(-2,-halfWidth*.27,0,-halfWidth);g.quadraticCurveTo(2,-halfWidth*.27,length,0);
    g.quadraticCurveTo(2,halfWidth*.27,0,halfWidth);g.quadraticCurveTo(-2,halfWidth*.27,-length,0);g.fill();g.restore();
  }
  g.fillStyle='#ffffff';g.beginPath();g.arc(0,0,1.2,0,Math.PI*2);g.fill();
  glintTextures.set(key,texture);return texture;
}

function glint(x,y,energy,r,material){
  if(energy<.015)return;
  const texture=glintTexture(material),size=80*(r/12)*(.68+.32*energy);
  ctx.save();ctx.globalAlpha*=energy;ctx.globalCompositeOperation='screen';
  ctx.drawImage(texture,x-size/2,y-size/2,size,size);ctx.restore();
}

function butterflySpread(age,phase,side){
  if(reduce)return 1;
  const beat=age*(2.1+.25*Math.sin(phase))*Math.PI*2+phase+side*.07;
  return .24+.76*(.5+.5*Math.sin(beat));
}

function drawButterfly(p,age,alpha,depthScale){
  const {r}=p,material=MATERIALS[p.material];
  for(let i=0;i<2;i++){
    const side=i===0?-1:1,spread=butterflySpread(age,p.phase,side);
    ctx.save();ctx.scale(spread,1);
    ctx.globalAlpha=alpha*(.82+.18*spread);ctx.fillStyle=material.color;ctx.fill(p.wings[i]);
    ctx.globalAlpha=alpha*.8;ctx.strokeStyle=material.light;
    ctx.lineWidth=Math.min(1.1,.55/Math.max(.5,depthScale));ctx.stroke(p.wings[i]);ctx.restore();
  }
  // 身体和触角不随翅膀压缩，双翼从同一条身体中轴开合。
  ctx.globalAlpha=alpha;ctx.fillStyle=material.light;
  ctx.beginPath();ctx.ellipse(0,0,r*.1,r*.53,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=.65;ctx.strokeStyle=material.light;ctx.beginPath();
  for(const side of [-1,1]){
    ctx.moveTo(0,-r*.42);ctx.quadraticCurveTo(side*r*.09,-r*.64,side*r*.24,-r*.7);
  }
  ctx.stroke();
}

function drawSymbol(p,age,alpha,depthScale=1){
  const material=MATERIALS[p.material],r=p.r;
  const rotationAge=p.settle?Math.min(age,p.duration):p.kite?flightAgeAt(p,age):age;
  const tilt=p.spin*rotationAge*.06+Math.sin(rotationAge*.45+p.phase)*.12+kiteWind(p,age)*.12+windSway(p,age).turn;
  const shimmer=Math.pow(.5+.5*Math.sin(age*1.65+p.phase),4);
  const stroke=Math.min(r*.28,Math.max(1.9,.85/depthScale));
  ctx.save();ctx.rotate(tilt);ctx.lineJoin='round';ctx.lineCap='round';
  if(p.kind==='butterfly'){
    drawButterfly(p,age,alpha,depthScale);
  }else{
  // 明亮轮廓直接描绘；移除每枚每帧的模糊运算，避免密集起飞时卡顿。
  // 纯色本体与清晰轮廓；不拉伸、不压扁，内外形状始终一致。
  ctx.shadowBlur=0;ctx.globalAlpha=alpha*(p.outline?1:.9);
  ctx.fillStyle=material.color;ctx.strokeStyle=material.color;ctx.lineWidth=stroke;
  if(p.outline)ctx.stroke(p.path);else ctx.fill(p.path);
  // 空心物品在粗亮边中再留一道亮芯；实心物品用薄亮边增加透亮感。
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*(.5+shimmer*.22);
  ctx.strokeStyle=material.light;ctx.lineWidth=p.outline?stroke*.4:.65;ctx.stroke(p.path);
  // 借鉴金叶化蝶：短亮纹贴着物体轮廓移动，不覆盖成灰暗的渐变面。
  if(depthScale>.55){
    ctx.globalAlpha=alpha*(.5+.4*shimmer);ctx.lineWidth=p.outline?stroke*.65:.95;
    ctx.setLineDash([r*.65,r*6]);ctx.lineDashOffset=-age*r*.65-p.phase*r;
    ctx.stroke(p.path);
  }
  ctx.restore();
  }
  ctx.restore();
  const shine=Math.max(flashPulse(age,p.flashAt),flashPulse(age,p.flashAt+p.flashGap));
  const tip=p.kind==='moon'?{x:.48*r,y:-.96*r}:{x:0,y:-r};
  ctx.save();ctx.globalAlpha=alpha;
  glint(tip.x*Math.cos(tilt)-tip.y*Math.sin(tilt),tip.x*Math.sin(tilt)+tip.y*Math.cos(tilt),shine,r,p.material);
  ctx.restore();
}


function waterCenter(){return {x:water.x+water.width*.5,y:water.y+water.height*.5};}

function waterWaves(time){
  if(!water||reduce)return [];
  const age=(time-water.start)*TRANSFORM_RATE;
  if(age<=0||age>=4.4)return [];
  // 一次扰动形成向外传播、逐渐展宽的波包；没有等间隔重复生成的圆圈。
  const radius=age*WATER_SPEED/TRANSFORM_RATE;
  const gain=smooth(age/.22)*Math.exp(-age*.38)/Math.sqrt(1+radius/75)*
    (1-smooth((age-3.1)/1.3));
  return [{...waterCenter(),
    radius,width:12+age*3.6,frequency:Math.PI*2/(27+age*2.8),gain}];
}

function waterSlope(x,y,waves){
  let dx=0,dy=0;
  for(const wave of waves){
    const vx=x-wave.x,vy=y-wave.y,distance=Math.hypot(vx,vy);
    if(distance<.001)continue;
    const d=distance-wave.radius,z=d/wave.width;
    if(Math.abs(z)>3.5)continue;
    const envelope=Math.exp(-z*z),phase=d*wave.frequency;
    // 高度的径向变化同时决定折射和明暗，使两者确实来自同一片水。
    const slope=1.65*wave.gain*envelope*(-wave.frequency*Math.sin(phase)-
      2*d/(wave.width*wave.width)*Math.cos(phase));
    // 中心与胶囊边缘平滑收住，避免圆心刺点或边沿突然截断。
    const boundary=smooth(Math.min(x-water.x,water.x+water.width-x,
      y-water.y,water.y+water.height-y)/5);
    const strength=slope*smooth(distance/6)*boundary;
    dx+=vx/distance*strength;dy+=vy/distance*strength;
  }
  return {x:dx,y:dy};
}

let waterLight=null;
function drawWater(waves){
  if(!waves.length)return;
  // 只在胶囊大小的低分辨率透明层上计算柔光，不扫描整幅画面。
  const width=Math.ceil(water.width*.75),height=Math.ceil(water.height*.75);
  if(!waterLight||waterLight.width!==width||waterLight.height!==height){
    const surface=document.createElement('canvas');surface.width=width;surface.height=height;
    const context=surface.getContext('2d');
    waterLight={surface,context,width,height,pixels:context.createImageData(width,height),
      dx:new Float32Array(width*height),dy:new Float32Array(width*height)};
  }
  const {pixels,context,surface}=waterLight,data=pixels.data;
  for(let row=0;row<height;row++){
    const y=water.y+(row+.5)*water.height/height;
    for(let col=0;col<width;col++){
      const x=water.x+(col+.5)*water.width/width,slope=waterSlope(x,y,waves);
      // 左上方柔光照到朝向不同的波面：宽柔的亮暗对，不描画完整轮廓。
      waterLight.dx[row*width+col]=slope.x*5.5;waterLight.dy[row*width+col]=slope.y*5.5;
      const light=slope.x*.55-slope.y*.83;
      const i=(row*width+col)*4,bright=light>0;
      data[i]=bright?239:0;data[i+1]=bright?246:0;data[i+2]=bright?255:0;
      data[i+3]=Math.round(255*Math.min(.16,Math.abs(light)*(bright?.72:.24)));
    }
  }
  context.putImageData(pixels,0,0);
  ctx.save();ctx.beginPath();ctx.roundRect(water.x+1,water.y+1,water.width-2,water.height-2,(water.height-2)/2);ctx.clip();
  ctx.imageSmoothingEnabled=true;ctx.drawImage(surface,water.x,water.y,water.width,water.height);ctx.restore();
}

function waterRefraction(x,y,waves){
  const slope=waterSlope(x,y,waves);
  return {x:slope.x*5.5,y:slope.y*5.5};
}


function waterGlyph(p){
  const ratio=Math.min(2,canvas.width/W),key=`${p.font}|${ratio}`;
  if(p.waterGlyph&&p.waterGlyph.key===key)return p.waterGlyph;
  const size=parseFloat(p.font.split(' ')[1]),surface=document.createElement('canvas');
  const g=surface.getContext('2d');g.font=p.font;
  const width=Math.ceil(g.measureText(p.ch).width+8),height=Math.ceil(size*1.6+8);
  surface.width=Math.ceil(width*ratio);surface.height=Math.ceil(height*ratio);
  g.setTransform(surface.width/width,0,0,surface.height/height,0,0);
  g.font=p.font;g.fillStyle='#f9f3fb';g.textAlign='center';g.textBaseline='middle';
  g.fillText(p.ch,width/2,height/2);
  const refracted=document.createElement('canvas');refracted.width=surface.width;refracted.height=surface.height;
  const layer=refracted.getContext('2d'),pixels=layer.createImageData(surface.width,surface.height);
  for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=249;pixels.data[i+1]=243;pixels.data[i+2]=251;}
  p.waterGlyph={key,surface,refracted,layer,width,height,pixels,
    original:g.getImageData(0,0,surface.width,surface.height).data};return p.waterGlyph;
}

function drawRefractedGlyph(p,waves){
  const {surface,refracted,layer,width,height,pixels,original}=waterGlyph(p);
  const left=p.x-width/2,top=p.y-height/2,pw=surface.width,ph=surface.height;
  // 波前未到或已离开的字直接画原字，不反复重采样平静区域。
  const affected=waves.some(w=>{
    const near=Math.hypot(Math.max(0,Math.abs(w.x-p.x)-width/2),Math.max(0,Math.abs(w.y-p.y)-height/2));
    const far=Math.hypot(Math.abs(w.x-p.x)+width/2,Math.abs(w.y-p.y)+height/2);
    return near<w.radius+w.width*2.8&&far>w.radius-w.width*2.8;
  });
  if(!affected||!waterLight){ctx.fillText(p.ch,p.x,p.y);return;}
  const fw=waterLight.width,fh=waterLight.height,rx=pw/width,ry=ph/height;
  const sx=fw/water.width,sy=fh/water.height,fx=waterLight.dx,fy=waterLight.dy;
  const output=pixels.data;
  // 重采样缓存字形的透明度，连续扭动笔画。只读字形一次，没有切片接缝。
  for(let row=0;row<ph;row++){
    const y=top+(row+.5)/ry,gy=Math.max(0,Math.min(fh-1,(y-water.y)*sy-.5));
    const y0=Math.floor(gy),y1=Math.min(fh-1,y0+1),v=gy-y0;
    for(let col=0;col<pw;col++){
      const x=left+(col+.5)/rx,gx=Math.max(0,Math.min(fw-1,(x-water.x)*sx-.5));
      const x0=Math.floor(gx),x1=Math.min(fw-1,x0+1),u=gx-x0;
      const a=y0*fw+x0,b=y0*fw+x1,c=y1*fw+x0,d=y1*fw+x1;
      const dx=((fx[a]*(1-u)+fx[b]*u)*(1-v)+(fx[c]*(1-u)+fx[d]*u)*v)*rx;
      const dy=((fy[a]*(1-u)+fy[b]*u)*(1-v)+(fy[c]*(1-u)+fy[d]*u)*v)*ry;
      const px=col-dx,py=row-dy,index=(row*pw+col)*4+3;
      if(px<0||py<0||px>=pw-1||py>=ph-1){output[index]=0;continue;}
      const ix=Math.floor(px),iy=Math.floor(py),tx=px-ix,ty=py-iy;
      const o=(iy*pw+ix)*4+3,n=o+pw*4;
      output[index]=(original[o]*(1-tx)+original[o+4]*tx)*(1-ty)+
        (original[n]*(1-tx)+original[n+4]*tx)*ty;
    }
  }
  layer.putImageData(pixels,0,0);
  // 折射先合成完整字形，随后只对整字应用一次模糊。
  ctx.drawImage(refracted,left,top,width,height);
}

function drawDepartingText(p,age,waves=[]){
  const u=clamp(age/p.duration),blur=reduce?0:4*smooth(u/.8);
  ctx.save();
  ctx.globalAlpha=1-smooth(u);ctx.font=p.font;ctx.fillStyle='#f9f3fb';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.filter=blur>0?`blur(${blur*canvas.width/W}px)`:'none';
  // 先折射，再从波心向外逐字模糊；比波纹经过保留一小段清晰时间。
  if(waves.length){drawRefractedGlyph(p,waves);}
  else{
    const refraction=waterRefraction(p.x,p.y,waves);
    ctx.fillText(p.ch,p.x+refraction.x,p.y+refraction.y);
  }
  ctx.restore();
}


function starAmount(p,time){return smooth((time-p.start-p.duration)/.95);}
function landingFlash(p,time){
  const age=time-p.start-p.duration;
  return smooth(age/.16)*(1-smooth((age-.28)/.95))*(p.settle.anchor?1:p.settle.accent?.8:.52);
}
// 参考花落成蝶的停驻星光：亮核升起、细长十字展开，再缓缓收回。
function starTwinkle(age,period,offset){
  if(reduce||age<=0)return 0;
  // 星芒的周期整齐落在尾段循环内，随机相位保留错落感，循环接缝不会跳亮。
  period=SKY_LOOP/Math.max(1,Math.round(SKY_LOOP/period));
  const phase=(age+offset)%period;
  return smooth(age/1.2)*smooth(phase/.3)*(1-smooth((phase-.5)/.95));
}
// 银河亮起后提高星芒的清晰度，随底图收尾渐进增强，避免被亮星云淹没。
function skySparkleStrength(time){
  return cycle?.sky?smooth((time-cycle.sky.end+2.4)/2.4):0;
}

function drawSettlingItem(p,age){
  const q=poseAt(p,age),star=starAmount(p,clock),visible=smooth(age/p.revealDuration);
  if(star<.999){
    ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.scale,q.scale);
    drawSymbol(p,Math.min(age,p.duration),visible*q.alpha*(1-star),q.scale);ctx.restore();
  }
  const landing=landingFlash(p,clock);
  const clarity=skySparkleStrength(clock);
  const gain=p.settle.twinkleGain+(1-p.settle.twinkleGain)*.8*clarity;
  const flash=starTwinkle(clock-p.start-p.duration,p.settle.period,p.settle.offset)*gain;
  if(star>0){
    const shimmer=.86+.14*Math.sin(clock*Math.PI*2/SKY_LOOP+p.phase),r=p.settle.radius+flash*(.25+.3*clarity);
    ctx.save();ctx.globalAlpha=star*(shimmer*p.settle.brightness*(1-flash)+flash);ctx.fillStyle=p.settle.color;
    ctx.beginPath();ctx.arc(p.endX,p.endY,r,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // 每件物品都在自己的落点继续闪烁；落定的亮芒与后续星芒共用同一处亮核。
  const light=Math.max(landing,star*flash);
  if(light>.015){
    const baseSize=p.settle.twinkleSize+landing*(p.settle.anchor?4:1.5);
    const size=baseSize*(1+clarity*(p.settle.accent?.45:.35));
    // 只伸展尖芒和亮核；外围光晕沿用原大小，保持暗部清透。
    drawStarGlow(p.endX,p.endY,baseSize*2,light*(p.settle.anchor||p.settle.accent?.52:.32));
    ctx.save();ctx.globalAlpha=1;glint(p.endX,p.endY,light,size,'star');ctx.restore();
  }
}

let galaxyStarGlow=null;
function drawStarGlow(x,y,size,alpha){
  if(!galaxyStarGlow){
    galaxyStarGlow=document.createElement('canvas');galaxyStarGlow.width=galaxyStarGlow.height=48;
    const g=galaxyStarGlow.getContext('2d'),light=g.createRadialGradient(24,24,0,24,24,24);
    light.addColorStop(0,'rgba(255,255,255,.9)');light.addColorStop(.12,'rgba(230,241,255,.58)');
    light.addColorStop(.34,'rgba(153,193,255,.15)');light.addColorStop(1,'rgba(121,173,255,0)');
    g.fillStyle=light;g.fillRect(0,0,48,48);
  }
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;
  ctx.drawImage(galaxyStarGlow,x-size/2,y-size/2,size,size);ctx.restore();
}

// 仅适配目录的横向画板和统一播放时钟，原水面、字形与物品绘制函数保持不变。
function paint(ms){
  const t=Math.min(5.4,Math.max(0,ms-150)/1000);
  if(previous===t)return;
  previous=t;clock=t;canvas.dataset.time=String(t);
  if(!ctx)return;
  const scale=canvas.width/W;
  ctx.setTransform(scale,0,0,scale,0,canvas.height*.7-H*.7*scale);
  ctx.clearRect(0,0,W,H);
  ctx.save();ctx.beginPath();ctx.roundRect(water.x,water.y,water.width,water.height,water.height/2);
  const g=ctx.createLinearGradient(water.x,water.y,water.x+water.width,water.y+water.height);
  g.addColorStop(0,'#ffffff29');g.addColorStop(.54,'#ffffff0d');g.addColorStop(1,'#ffffff17');
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#ffffff60';ctx.lineWidth=.65;ctx.stroke();ctx.clip();
  if(loaded){
    const waves=waterWaves(t);drawWater(waves);
    for(const p of particles)if(!p.hidden)drawDepartingText(p,t-p.start,waves);
  }
  ctx.restore();
  if(loaded)for(const p of ordered)if(t>=p.start)drawSettlingItem(p,t-p.start);
}
function initialize(){
  if(!ctx||disposed&&!preserved)return;
  const chars=Array.from(DEFAULT_TEXT);ctx.font=font;
  const widths=chars.map(ch=>ctx.measureText(ch).width+.4455),total=widths.reduce((a,b)=>a+b,0);
  let pen=water.x+18-Math.max(0,total-(water.width-65));
  for(let i=0;i<chars.length;i++){
    const x=pen+widths[i]/2;pen+=widths[i];
    particles.push({type:'text',ch:chars[i],x,y:H*.7,font,
      hidden:x<water.x+18||x>water.x+water.width-45,
      start:WATER_LEAD+Math.abs(x-W/2)/WATER_SPEED,duration:2.05/TRANSFORM_RATE});
  }
  ordered=originals.map(source=>{
    const p={...source,path:makeShape(source.kind,source.r)};
    if(p.kind==='butterfly')p.wings=[makeButterflyWing(p.r,-1),makeButterflyWing(p.r,1)];
    return p;
  });
  loaded=true;previous=undefined;paint(last);
  if(disposed)release();
}
function release(){
  for(const p of particles)if(p.waterGlyph){
    p.waterGlyph.surface.width=p.waterGlyph.surface.height=1;
    p.waterGlyph.refracted.width=p.waterGlyph.refracted.height=1;
    delete p.waterGlyph;
  }
  for(const surface of [...glintTextures.values(),waterLight?.surface,galaxyStarGlow])if(surface)surface.width=surface.height=1;
  glintTextures.clear();waterLight=null;galaxyStarGlow=null;particles=[];ordered=[];
}
const render=ms=>{if(!disposed){last=ms;paint(ms);}};
render.ready=ctx?readyFont().then(initialize,error=>{
  if(!disposed||preserved)root.dataset.fontError='letter-ripple';
  throw error;
}):Promise.resolve();
// 缩略图先定位再释放；字体到达后仍须补画该帧，不能留下空胶囊。
render.ready.catch(()=>{});
render.destroy=(preserve=false)=>{
  if(disposed)return;
  disposed=true;preserved=preserve;
  if(loaded||!preserve)release();
};
return render;
};
})(globalThis);
