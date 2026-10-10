/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0.
 * Accepted seed → dandelion → flock → sun → circular O → WISE MOTION.
 * Outfit Medium outline data: SIL OFL 1.1 (catalog/fonts/OFL-Outfit.txt).
 * The original 1066×600 geometry and 2132×1200 backing canvas are retained.
 * Every instance owns its textures, palette and cached flock; no clock here.
 */
(function(global){
'use strict';
function createEngine(canvas) {
  const window = {}, textures = [];
  const hostDocument = canvas.ownerDocument || global.document;
  const document = {getElementById:id=>{if(id!=='stage')throw Error('Unknown canvas');return canvas;},
    createElement:tag=>{const node=hostDocument.createElement(tag);textures.push(node);return node;}};
  let visible=null,dead=false;
  const show=id=>!visible||visible.has(id);
/* WISE MOTION 基础字形：Outfit Medium，SIL OFL 1.1；程序 Apache-2.0。
 * 八个字母保持字体自然比例，两枚O按相同笔画比例制成正圆。
 * 横向揭示借鉴复刻 scenes-middle.js 第六幕；中心内孔接飞行小点为本次改造。 */
(() => {
  'use strict';
  const glyphs = [{"name":"W","center":[61.725714,300.0],"contours":[[[-29.542857,44.0],[-58.457143,-44.0],[-44.251429,-44.0],[-22.502857,23.76],[-26.274286,23.76],[-5.028571,-44.0],[5.028571,-44.0],[26.274286,23.76],[22.502857,23.76],[44.251429,-44.0],[58.457143,-44.0],[29.542857,44.0],[19.485714,44.0],[-1.885714,-23.634286],[1.885714,-23.634286],[-19.485714,44.0]]]},{"name":"I","center":[140.234286,300.0],"contours":[[[-7.228571,44.0],[-7.228571,-44.0],[7.228571,-44.0],[7.228571,44.0]]]},{"name":"S","center":[191.148571,300.0],"contours":[[[-0.062857,45.257143],[-2.622321,45.198214],[-5.083571,45.021429],[-7.446607,44.726786],[-9.711429,44.314286],[-11.878036,43.783929],[-13.946429,43.135714],[-15.916607,42.369643],[-17.788571,41.485714],[-19.84105,40.336327],[-21.831953,39.043265],[-23.761283,37.606531],[-25.629038,36.026122],[-27.435219,34.302041],[-29.179825,32.434286],[-30.862857,30.422857],[-21.057143,20.617143],[-19.803492,22.31254],[-18.473016,23.87873],[-17.065714,25.315714],[-15.581587,26.623492],[-14.020635,27.802063],[-12.382857,28.851429],[-11.0825,29.543839],[-9.695714,30.143929],[-8.2225,30.651696],[-6.662857,31.067143],[-5.016786,31.390268],[-3.284286,31.621071],[-1.465357,31.759554],[0.44,31.805714],[2.216696,31.758571],[3.901071,31.617143],[5.493125,31.381429],[6.992857,31.051429],[8.400268,30.627143],[9.715357,30.108571],[10.938125,29.495714],[12.068571,28.788571],[13.085089,27.998929],[13.966071,27.138571],[14.711518,26.2075],[15.321429,25.205714],[15.795804,24.133214],[16.134643,22.99],[16.337946,21.776071],[16.405714,20.491429],[16.342857,19.070159],[16.154286,17.739683],[15.84,16.5],[15.4,15.351111],[14.834286,14.293016],[14.142857,13.325714],[13.179886,12.257143],[12.101257,11.264],[10.906971,10.346286],[9.597029,9.504],[8.171429,8.737143],[6.27,7.849286],[4.274286,7.008571],[2.184286,6.215],[0.0,5.468571],[-2.975238,4.462857],[-5.950476,3.373333],[-8.925714,2.2],[-11.11,1.229643],[-13.2,0.141429],[-15.195714,-1.064643],[-17.097143,-2.388571],[-18.293175,-3.355873],[-19.408889,-4.413968],[-20.444286,-5.562857],[-21.399365,-6.80254],[-22.274127,-8.133016],[-23.068571,-9.554286],[-23.668921,-10.860175],[-24.17691,-12.263557],[-24.592536,-13.764431],[-24.915802,-15.362799],[-25.146706,-17.058659],[-25.285248,-18.852012],[-25.331429,-20.742857],[-25.271518,-22.655089],[-25.091786,-24.494643],[-24.792232,-26.261518],[-24.372857,-27.955714],[-23.833661,-29.577232],[-23.174643,-31.126071],[-22.395804,-32.602232],[-21.497143,-34.005714],[-20.346472,-35.515569],[-19.085481,-36.920233],[-17.714169,-38.219708],[-16.232536,-39.413994],[-14.640583,-40.50309],[-12.938309,-41.486997],[-11.125714,-42.365714],[-9.227172,-43.132828],[-7.267055,-43.781924],[-5.245364,-44.313003],[-3.162099,-44.726064],[-1.017259,-45.021108],[1.189155,-45.198134],[3.457143,-45.257143],[5.898309,-45.187872],[8.265073,-44.980058],[10.557434,-44.633703],[12.775394,-44.148805],[14.91895,-43.525364],[16.988105,-42.763382],[18.982857,-41.862857],[20.887813,-40.854577],[22.68758,-39.769329],[24.382157,-38.607114],[25.971545,-37.36793],[27.455743,-36.051778],[28.834752,-34.658659],[30.108571,-33.188571],[20.302857,-23.382857],[19.036984,-24.746508],[17.753651,-25.987937],[16.452857,-27.107143],[15.134603,-28.104127],[13.798889,-28.978889],[12.445714,-29.731429],[11.050635,-30.365238],[9.589206,-30.88381],[8.061429,-31.287143],[6.467302,-31.575238],[4.806825,-31.748095],[3.08,-31.805714],[1.269971,-31.751837],[-0.424606,-31.590204],[-2.003732,-31.320816],[-3.467405,-30.943673],[-4.815627,-30.458776],[-6.048397,-29.866122],[-7.165714,-29.165714],[-8.034911,-28.472321],[-8.788214,-27.712143],[-9.425625,-26.885179],[-9.947143,-25.991429],[-10.352768,-25.030893],[-10.6425,-24.003571],[-10.816339,-22.909464],[-10.874286,-21.748571],[-10.811429,-20.45127],[-10.622857,-19.24127],[-10.308571,-18.118571],[-9.868571,-17.083175],[-9.302857,-16.135079],[-8.611429,-15.274286],[-7.648457,-14.323886],[-6.569829,-13.433829],[-5.375543,-12.604114],[-4.0656,-11.834743],[-2.64,-11.125714],[-0.738571,-10.288929],[1.257143,-9.475714],[3.347143,-8.686071],[5.531429,-7.92],[8.506667,-6.872381],[11.481905,-5.740952],[14.457143,-4.525714],[16.212114,-3.728686],[17.906743,-2.846171],[19.541029,-1.878171],[21.114971,-0.824686],[22.628571,0.314286],[23.824603,1.34619],[24.940317,2.472381],[25.975714,3.692857],[26.930794,5.007619],[27.805556,6.416667],[28.6,7.92],[29.20035,9.297726],[29.708338,10.772945],[30.123965,12.345656],[30.44723,14.01586],[30.678134,15.783557],[30.816676,17.648746],[30.862857,19.611429],[30.804802,21.546905],[30.630635,23.414286],[30.340357,25.213571],[29.933968,26.944762],[29.411468,28.607857],[28.772857,30.202857],[28.018135,31.729762],[27.147302,33.188571],[26.160357,34.579286],[25.057302,35.901905],[23.838135,37.156429],[22.502857,38.342857],[20.934545,39.542857],[19.26961,40.628571],[17.508052,41.6],[15.64987,42.457143],[13.695065,43.2],[11.643636,43.828571],[9.495584,44.342857],[7.250909,44.742857],[4.90961,45.028571],[2.471688,45.2]]]},{"name":"E","center":[266.074286,300.0],"contours":[[[-29.605714,44.0],[-29.605714,-44.0],[-15.148571,-44.0],[-15.148571,44.0]],[[-19.674286,44.0],[-19.674286,30.8],[29.605714,30.8],[29.605714,44.0]],[[-19.674286,5.405714],[-19.674286,-7.291429],[25.331429,-7.291429],[25.331429,5.405714]],[[-19.674286,-30.8],[-19.674286,-44.0],[28.977143,-44.0],[28.977143,-30.8]]]},{"name":"M","center":[379.154286,300.0],"contours":[[[-43.371429,44.0],[-43.371429,-44.0],[-33.314286,-44.0],[3.268571,16.217143],[-3.268571,16.217143],[33.314286,-44.0],[43.371429,-44.0],[43.371429,44.0],[28.914286,44.0],[28.914286,-18.605714],[32.182857,-17.725714],[5.028571,26.902857],[-5.028571,26.902857],[-32.182857,-17.725714],[-28.914286,-18.605714],[-28.914286,44.0]]]},{"name":"O","center":[481.925714,300.0],"contours":[[[0.188571,45.257143],[-2.47965,45.185306],[-5.09656,44.969796],[-7.662157,44.610612],[-10.176443,44.107755],[-12.639417,43.461224],[-15.051079,42.67102],[-17.411429,41.737143],[-19.705073,40.676268],[-21.916618,39.505073],[-24.046064,38.223557],[-26.093411,36.83172],[-28.058659,35.329563],[-29.941808,33.717085],[-31.742857,31.994286],[-33.447697,30.175277],[-35.042216,28.274169],[-36.526414,26.290962],[-37.900292,24.225656],[-39.163848,22.078251],[-40.317085,19.848746],[-41.36,17.537143],[-42.277201,15.160117],[-43.053294,12.734344],[-43.68828,10.259825],[-44.182157,7.73656],[-44.534927,5.164548],[-44.746589,2.54379],[-44.817143,-0.125714],[-44.746589,-2.793936],[-44.534927,-5.410845],[-44.182157,-7.976443],[-43.68828,-10.490729],[-43.053294,-12.953703],[-42.277201,-15.365364],[-41.36,-17.725714],[-40.318367,-20.020641],[-39.16898,-22.236035],[-37.911837,-24.371895],[-36.546939,-26.428222],[-35.074286,-28.405015],[-33.493878,-30.302274],[-31.805714,-32.12],[-30.022624,-33.841516],[-28.157434,-35.450146],[-26.210146,-36.945889],[-24.180758,-38.328746],[-22.069271,-39.598717],[-19.875685,-40.755802],[-17.6,-41.8],[-15.256327,-42.717201],[-12.858776,-43.493294],[-10.407347,-44.12828],[-7.902041,-44.622157],[-5.342857,-44.974927],[-2.729796,-45.186589],[-0.062857,-45.257143],[2.604082,-45.186589],[5.217143,-44.974927],[7.776327,-44.622157],[10.281633,-44.12828],[12.733061,-43.493294],[15.130612,-42.717201],[17.474286,-41.8],[19.751254,-40.755802],[21.948688,-39.598717],[24.066589,-38.328746],[26.104956,-36.945889],[28.06379,-35.450146],[29.94309,-33.841516],[31.742857,-32.12],[33.447697,-30.300991],[35.042216,-28.399883],[36.526414,-26.416676],[37.900292,-24.35137],[39.163848,-22.203965],[40.317085,-19.974461],[41.36,-17.662857],[42.277201,-15.285831],[43.053294,-12.860058],[43.68828,-10.385539],[44.182157,-7.862274],[44.534927,-5.290262],[44.746589,-2.669504],[44.817143,0.0],[44.746589,2.669504],[44.534927,5.290262],[44.182157,7.862274],[43.68828,10.385539],[43.053294,12.860058],[42.277201,15.285831],[41.36,17.662857],[40.318367,19.973178],[39.16898,22.198834],[37.911837,24.339825],[36.546939,26.396152],[35.074286,28.367813],[33.493878,30.25481],[31.805714,32.057143],[30.022624,33.763265],[28.157434,35.361633],[26.210146,36.852245],[24.180758,38.235102],[22.069271,39.510204],[19.875685,40.677551],[17.6,41.737143],[15.258892,42.67102],[12.869038,43.461224],[10.430437,44.107755],[7.94309,44.610612],[5.406997,44.969796],[2.822157,45.185306]],[[-0.062857,31.428571],[2.134196,31.365714],[4.2625,31.177143],[6.322054,30.862857],[8.312857,30.422857],[10.234911,29.857143],[12.088214,29.165714],[13.872768,28.348571],[15.588571,27.405714],[17.224821,26.351875],[18.770714,25.201786],[20.22625,23.955446],[21.591429,22.612857],[22.86625,21.174018],[24.050714,19.638929],[25.144821,18.007589],[26.148571,16.28],[27.047232,14.469911],[27.826071,12.591071],[28.485089,10.643482],[29.024286,8.627143],[29.443661,6.542054],[29.743214,4.388214],[29.922946,2.165625],[29.982857,-0.125714],[29.921746,-2.397302],[29.738413,-4.60254],[29.432857,-6.741429],[29.005079,-8.813968],[28.455079,-10.820159],[27.782857,-12.76],[26.998889,-14.624762],[26.113651,-16.405714],[25.127143,-18.102857],[24.039365,-19.71619],[22.850317,-21.245714],[21.56,-22.691429],[20.178889,-24.041111],[18.71746,-25.28254],[17.175714,-26.415714],[15.553651,-27.440635],[13.85127,-28.357302],[12.068571,-29.165714],[10.21254,-29.857143],[8.290159,-30.422857],[6.301429,-30.862857],[4.246349,-31.177143],[2.124921,-31.365714],[-0.062857,-31.428571],[-2.230446,-31.366696],[-4.333214,-31.181071],[-6.371161,-30.871696],[-8.344286,-30.438571],[-10.252589,-29.881696],[-12.096071,-29.201071],[-13.874732,-28.396696],[-15.588571,-27.468571],[-17.224821,-26.430446],[-18.770714,-25.296071],[-20.22625,-24.065446],[-21.591429,-22.738571],[-22.86625,-21.315446],[-24.050714,-19.796071],[-25.144821,-18.180446],[-26.148571,-16.468571],[-27.047232,-14.673214],[-27.826071,-12.807143],[-28.485089,-10.870357],[-29.024286,-8.862857],[-29.443661,-6.784643],[-29.743214,-4.635714],[-29.922946,-2.416071],[-29.982857,-0.125714],[-29.921746,2.149365],[-29.738413,4.365079],[-29.432857,6.521429],[-29.005079,8.618413],[-28.455079,10.656032],[-27.782857,12.634286],[-27.000635,14.535714],[-26.120635,16.342857],[-25.142857,18.055714],[-24.067302,19.674286],[-22.893968,21.198571],[-21.622857,22.628571],[-20.259206,23.960794],[-18.808254,25.191746],[-17.27,26.321429],[-15.644444,27.349841],[-13.931587,28.276984],[-12.131429,29.102857],[-10.259683,29.813492],[-8.332063,30.394921],[-6.348571,30.847143],[-4.309206,31.170159],[-2.213968,31.363968]]]},{"name":"T","center":[570.805714,300.0],"contours":[[[-7.228571,44.0],[-7.228571,-41.485714],[7.228571,-41.485714],[7.228571,44.0]],[[-35.891429,-30.8],[-35.891429,-44.0],[35.891429,-44.0],[35.891429,-30.8]]]},{"name":"I","center":[626.497143,300.0],"contours":[[[-7.228571,44.0],[-7.228571,-44.0],[7.228571,-44.0],[7.228571,44.0]]]},{"name":"O","center":[693.125714,300.0],"contours":[[[0.188571,45.257143],[-2.47965,45.185306],[-5.09656,44.969796],[-7.662157,44.610612],[-10.176443,44.107755],[-12.639417,43.461224],[-15.051079,42.67102],[-17.411429,41.737143],[-19.705073,40.676268],[-21.916618,39.505073],[-24.046064,38.223557],[-26.093411,36.83172],[-28.058659,35.329563],[-29.941808,33.717085],[-31.742857,31.994286],[-33.447697,30.175277],[-35.042216,28.274169],[-36.526414,26.290962],[-37.900292,24.225656],[-39.163848,22.078251],[-40.317085,19.848746],[-41.36,17.537143],[-42.277201,15.160117],[-43.053294,12.734344],[-43.68828,10.259825],[-44.182157,7.73656],[-44.534927,5.164548],[-44.746589,2.54379],[-44.817143,-0.125714],[-44.746589,-2.793936],[-44.534927,-5.410845],[-44.182157,-7.976443],[-43.68828,-10.490729],[-43.053294,-12.953703],[-42.277201,-15.365364],[-41.36,-17.725714],[-40.318367,-20.020641],[-39.16898,-22.236035],[-37.911837,-24.371895],[-36.546939,-26.428222],[-35.074286,-28.405015],[-33.493878,-30.302274],[-31.805714,-32.12],[-30.022624,-33.841516],[-28.157434,-35.450146],[-26.210146,-36.945889],[-24.180758,-38.328746],[-22.069271,-39.598717],[-19.875685,-40.755802],[-17.6,-41.8],[-15.256327,-42.717201],[-12.858776,-43.493294],[-10.407347,-44.12828],[-7.902041,-44.622157],[-5.342857,-44.974927],[-2.729796,-45.186589],[-0.062857,-45.257143],[2.604082,-45.186589],[5.217143,-44.974927],[7.776327,-44.622157],[10.281633,-44.12828],[12.733061,-43.493294],[15.130612,-42.717201],[17.474286,-41.8],[19.751254,-40.755802],[21.948688,-39.598717],[24.066589,-38.328746],[26.104956,-36.945889],[28.06379,-35.450146],[29.94309,-33.841516],[31.742857,-32.12],[33.447697,-30.300991],[35.042216,-28.399883],[36.526414,-26.416676],[37.900292,-24.35137],[39.163848,-22.203965],[40.317085,-19.974461],[41.36,-17.662857],[42.277201,-15.285831],[43.053294,-12.860058],[43.68828,-10.385539],[44.182157,-7.862274],[44.534927,-5.290262],[44.746589,-2.669504],[44.817143,0.0],[44.746589,2.669504],[44.534927,5.290262],[44.182157,7.862274],[43.68828,10.385539],[43.053294,12.860058],[42.277201,15.285831],[41.36,17.662857],[40.318367,19.973178],[39.16898,22.198834],[37.911837,24.339825],[36.546939,26.396152],[35.074286,28.367813],[33.493878,30.25481],[31.805714,32.057143],[30.022624,33.763265],[28.157434,35.361633],[26.210146,36.852245],[24.180758,38.235102],[22.069271,39.510204],[19.875685,40.677551],[17.6,41.737143],[15.258892,42.67102],[12.869038,43.461224],[10.430437,44.107755],[7.94309,44.610612],[5.406997,44.969796],[2.822157,45.185306]],[[-0.062857,31.428571],[2.134196,31.365714],[4.2625,31.177143],[6.322054,30.862857],[8.312857,30.422857],[10.234911,29.857143],[12.088214,29.165714],[13.872768,28.348571],[15.588571,27.405714],[17.224821,26.351875],[18.770714,25.201786],[20.22625,23.955446],[21.591429,22.612857],[22.86625,21.174018],[24.050714,19.638929],[25.144821,18.007589],[26.148571,16.28],[27.047232,14.469911],[27.826071,12.591071],[28.485089,10.643482],[29.024286,8.627143],[29.443661,6.542054],[29.743214,4.388214],[29.922946,2.165625],[29.982857,-0.125714],[29.921746,-2.397302],[29.738413,-4.60254],[29.432857,-6.741429],[29.005079,-8.813968],[28.455079,-10.820159],[27.782857,-12.76],[26.998889,-14.624762],[26.113651,-16.405714],[25.127143,-18.102857],[24.039365,-19.71619],[22.850317,-21.245714],[21.56,-22.691429],[20.178889,-24.041111],[18.71746,-25.28254],[17.175714,-26.415714],[15.553651,-27.440635],[13.85127,-28.357302],[12.068571,-29.165714],[10.21254,-29.857143],[8.290159,-30.422857],[6.301429,-30.862857],[4.246349,-31.177143],[2.124921,-31.365714],[-0.062857,-31.428571],[-2.230446,-31.366696],[-4.333214,-31.181071],[-6.371161,-30.871696],[-8.344286,-30.438571],[-10.252589,-29.881696],[-12.096071,-29.201071],[-13.874732,-28.396696],[-15.588571,-27.468571],[-17.224821,-26.430446],[-18.770714,-25.296071],[-20.22625,-24.065446],[-21.591429,-22.738571],[-22.86625,-21.315446],[-24.050714,-19.796071],[-25.144821,-18.180446],[-26.148571,-16.468571],[-27.047232,-14.673214],[-27.826071,-12.807143],[-28.485089,-10.870357],[-29.024286,-8.862857],[-29.443661,-6.784643],[-29.743214,-4.635714],[-29.922946,-2.416071],[-29.982857,-0.125714],[-29.921746,2.149365],[-29.738413,4.365079],[-29.432857,6.521429],[-29.005079,8.618413],[-28.455079,10.656032],[-27.782857,12.634286],[-27.000635,14.535714],[-26.120635,16.342857],[-25.142857,18.055714],[-24.067302,19.674286],[-22.893968,21.198571],[-21.622857,22.628571],[-20.259206,23.960794],[-18.808254,25.191746],[-17.27,26.321429],[-15.644444,27.349841],[-13.931587,28.276984],[-12.131429,29.102857],[-10.259683,29.813492],[-8.332063,30.394921],[-6.348571,30.847143],[-4.309206,31.170159],[-2.213968,31.363968]]]},{"name":"N","center":[788.165714,300.0],"contours":[[[-35.514286,44.0],[-35.514286,-44.0],[-25.457143,-44.0],[-21.057143,-27.405714],[-21.057143,44.0]],[[25.457143,44.0],[-27.217143,-24.765714],[-25.457143,-44.0],[27.217143,24.765714]],[[25.457143,44.0],[21.057143,28.537143],[21.057143,-44.0],[35.514286,-44.0],[35.514286,44.0]]]}];

  const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,p)=>p<=0?a:p>=1?b:a+(b-a)*p;
  const ease=n=>{const p=clamp(n);return p*p*p*(p*(p*6-15)+10);};
  const timing=Object.freeze({split:432,revealStart:458,revealEnd:502,settled:510,end:576});
  const circle=(r,n=160)=>Array.from({length:n},(_,i)=>[Math.cos(i*Math.PI*2/n)*r,Math.sin(i*Math.PI*2/n)*r]);
  // 自然字宽和边距，略加字距/词间距；O的内外圈沿用Outfit本身的粗细关系。
  const style=Object.freeze({font:'Outfit Medium',capHeight:88,tracking:1,wordSpace:8,
    oOuter:88*720/700/2,oInner:88*500/700/2,dotRadius:8,ink:'#F4EEDD',accent:'#DA795B'});
  const spaced=glyphs.map((g,i)=>({name:g.name,center:[g.center[0]+i*style.tracking+(i>=4?style.wordSpace:0),g.center[1]],
    contours:g.name==='O'?[circle(style.oOuter),circle(style.oInner).reverse()]:g.contours}));
  const xs=spaced.flatMap(g=>g.contours.flatMap(ring=>ring.map(p=>g.center[0]+p[0]))),ys=spaced.flatMap(g=>g.contours.flatMap(ring=>ring.map(p=>g.center[1]+p[1])));
  const width=Math.max(...xs)-Math.min(...xs),left=(1066-width-22-style.dotRadius)/2,offset=left-Math.min(...xs);
  const layout=spaced.map(g=>({...g,center:[g.center[0]+offset,g.center[1]]}));
  const bounds=Object.freeze({minX:left,maxX:left+width,minY:Math.min(...ys),maxY:Math.max(...ys),width,height:Math.max(...ys)-Math.min(...ys)});
  const accentTarget=Object.freeze({x:bounds.maxX+22,y:300+style.capHeight/2-style.dotRadius});
  function accent(frame){
    const p=ease((frame-timing.split)/(timing.settled-timing.split)),q=1-p;
    return{x:q*q*q*533+3*q*q*p*575+3*q*p*p*(accentTarget.x+55)+p*p*p*accentTarget.x,
      y:q*q*q*300+3*q*q*p*65+3*q*p*p*130+p*p*p*accentTarget.y,r:style.dotRadius,color:style.accent,progress:p,origin:'sun-hole'};
  }
  function reveal(frame){
    const p=ease((frame-timing.revealStart)/(timing.revealEnd-timing.revealStart));
    return{progress:p,left:mix(533,bounds.minX-30,p),right:mix(533,bounds.maxX+30,p),scale:mix(1.08,1,ease((frame-timing.revealStart)/(timing.settled-timing.revealStart)))};
  }
  function state(frame){
    const re=reveal(frame);
    return layout.map((g,i)=>({id:i,x:re.scale===1?g.center[0]:533+(g.center[0]-533)*re.scale,y:re.scale===1?g.center[1]:300+(g.center[1]-300)*re.scale,
      progress:re.progress,spread:re.progress,visible:re.progress>0,origin:'center-reveal',scale:re.scale,clipLeft:re.left,clipRight:re.right,
      contours:re.scale===1?g.contours:g.contours.map(ring=>ring.map(p=>[p[0]*re.scale,p[1]*re.scale]))}));
  }
  function path(c,contours){c.beginPath();for(const points of contours){points.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();}}
  function draw(c,frame){
    if(!Number.isFinite(frame))throw new TypeError('字形时间必须为有限数值');
    const re=reveal(frame);c.save();c.fillStyle=style.ink;
    if(re.progress>0){
      c.save();if(re.progress<1){c.beginPath();c.rect(re.left,0,re.right-re.left,600);c.clip();}
      // Outfit的E/T/N由重叠笔画构成，按原绕向填充；O内圈反向保留孔洞。
      for(const item of state(frame)){c.save();c.translate(item.x,item.y);path(c,item.contours);c.fill('nonzero');c.restore();}
      c.restore();
    }
    const dot=accent(frame);c.fillStyle=dot.color;c.beginPath();c.arc(dot.x,dot.y,dot.r,0,Math.PI*2);c.fill();c.restore();
  }
  window.WiseMotionBrand={glyphs,layout,bounds,style,timing,state,draw,reveal,accent,accentTarget,info:{label:'WISE MOTION',glyphCount:10,contourCount:18,captions:[],font:'Outfit Medium',fontLicense:'SIL OFL 1.1',startFrame:timing.split,settledFrame:timing.settled,endFrame:timing.end,persistentSunAccent:true,circularOGlyphs:[5,8]}};
})();

/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
 * 从本机 Wise Motion 权威目录直接提取完整绘制，不重新描简图。
 * history-nature.js: openingSeeds/Growth/Event/Displacement/Air/Pose/floret。
 * osmanthus-motion.js: wingPath/buildWingAtlas/paintWing/drawButterfly。
 * 适配范围：局部气流数量、时间/坐标、主题颜色；用本地离屏画布替代原绘图库。
 */
(() => {
 'use strict';
 const TAU=Math.PI*2,OPENING_BURST=1.65;
 const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
 const mod=(a,b)=>((a%b)+b)%b;
 class DandelionArtwork {
  constructor(){
      this.threads=Array.from({length:5600},(_,i)=>({
        x:mod(i*557.731,1100)-100, y:mod(i*331.793,1480),
        phase:i*2.39996, length:12+mod(i*7.37,36), tone:i%5,
      }));
      this.openingMotes=Array.from({length:760},(_,i)=>({
        x:mod(i*557.731,1120)-110,y:mod(i*331.793,1480)-140,
        phase:i*2.39996,radius:0.65+mod(i*1.73,1.05),tone:i%3,
      }));
      this.openingSeeds=Array.from({length:96},(_,i)=>{
        const angle=i*2.39996,r=112*Math.sqrt((i+0.5)/96);
        return {id:i,angle,x:Math.cos(angle)*r,y:Math.sin(angle)*r,radius:7+2*r/112};
      });
      this.heroSeed=this.openingSeeds.reduce((best,seed)=>
        Math.hypot(seed.x-78,seed.y+65)<Math.hypot(best.x-78,best.y+65)?seed:best);

      this.filaments=Array.from({length:137},(_,i)=>({id:i,angle:-Math.PI+i*Math.PI/136,dropAt:Infinity}));
   this.threads=this.threads.filter((f,i)=>{
    const y=mod(f.y,1480)-140,x=f.x+37*Math.sin(y*.004-1.65*.7)+18*Math.sin(f.phase+1.65*.6);
    return i%3===0&&Math.hypot(x-(450+Math.sin(1.65*1.3)*7),y-530)<370;
   });
   this.openingMotes=this.openingMotes.filter((f,i)=>{
    const x=f.x+18*Math.sin(1.65*.4+f.phase)-1.65*9,y=mod(f.y+140+1.65*12,1480)-140;
    return i%2===0&&Math.hypot(x-(450+Math.sin(1.65*1.3)*7),y-530)<360;
   });
  }
  distance(){return 0;}
    openingGrowth(seed,t) {
      const rank=Math.hypot(seed.x,seed.y)/112;
      return smooth(0.62+rank*0.18,0.92+rank*0.5,t);
    }
    openingEvent(t) {
      const age=Math.max(0,t-OPENING_BURST);
      return {age,
        cx:450+Math.sin(Math.min(t,OPENING_BURST)*1.3)*7,cy:530+this.distance(t)*0.72,
        color:smooth(OPENING_BURST,OPENING_BURST+0.24,t),
        settle:smooth(2.08,3.15,t),
        release:smooth(OPENING_BURST,OPENING_BURST+0.18,t),
        radius:355*smooth(0,0.62,age)+Math.max(0,age-0.62)*78,
        recoil:28*Math.sin(Math.max(0,age-0.48)*13)*Math.exp(-Math.max(0,age-0.48)*3.1)*smooth(0.48,0.58,age),
        field:smooth(0.03,0.5,t)*(1-smooth(2.65,4.65,t)),
        water:smooth(2.65,4.65,t),
        motes:smooth(0.02,0.32,t)*(1-smooth(2.25,3.75,t)),
        leaves:smooth(2.75,3.65,t),
      };
    }
    openingDisplacement(x,y,event) {
      const rx=x-event.cx,ry=y-event.cy,r=Math.max(1,Math.hypot(rx,ry));
      const nx=rx/r,ny=ry/r,angle=Math.atan2(ry,rx);
      const roughness=1+0.026*Math.sin(angle*7+event.age*2.1)+0.018*Math.sin(angle*13-event.age*1.7);
      const cleared=Math.max(0,(event.radius+event.recoil)*roughness);

      const outward=Math.hypot(r,cleared)-r;
      const edge=Math.hypot(r,cleared)-cleared;
      const jet=Math.exp(-((edge/145)**2))*event.release;
      return {x:x+nx*outward,y:y+ny*outward,nx,ny,jet};
    }
    openingAir(ctx,s,event) {
      const t=s.time,d=this.distance(t),opacity=ctx.globalAlpha;
      ctx.save();ctx.lineCap='round';
      for(let tone=0;tone<5;tone++){
        ctx.strokeStyle=this.colors.air[tone];
        ctx.globalAlpha=[0.13,0.22,0.28,0.43,0.12][tone]*event.field*opacity;
        ctx.lineWidth=tone===3?1.05:0.7;ctx.beginPath();
        for(let i=tone;i<this.threads.length;i+=5){
          const f=this.threads[i],y=mod(f.y+d,1480)-140;
          const x=f.x+37*Math.sin(y*0.004-t*0.7)+18*Math.sin(f.phase+t*0.6);
          const p=this.openingDisplacement(x,y,event);
          const winding=-0.9+0.65*Math.sin(y*0.004+0.7*Math.sin(x*0.005))+0.5*Math.sin(x*0.004-y*0.002+t*0.3);
          const vx=Math.sin(winding)*(1-p.jet)+p.nx*p.jet*1.65;
          const vy=Math.cos(winding)*(1-p.jet)+p.ny*p.jet*1.65;
          const length=f.length*(0.48+smooth(0.1,1.45,t)*0.68)*(1+p.jet*1.55);
          const bend=Math.sin(f.phase+t*0.65)*2.2;
          ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(p.x+vx*length*0.45+bend,p.y+vy*length*0.45,p.x+vx*length,p.y+vy*length);
        }ctx.stroke();
      }

      for(let tone=0;tone<3;tone++){
        ctx.fillStyle=this.colors.motes[tone];
        ctx.globalAlpha=[0.72,0.48,0.32][tone]*event.motes*opacity;ctx.beginPath();
        for(let i=tone;i<this.openingMotes.length;i+=3){
          const f=this.openingMotes[i];
          const x=f.x+18*Math.sin(t*0.4+f.phase)-t*9;
          const y=mod(f.y+140+t*12+d,1480)-140;
          const p=this.openingDisplacement(x,y,event);
          const angle=Math.atan2(p.ny,p.nx),r=f.radius;
          ctx.moveTo(p.x+Math.cos(angle)*r*(1+p.jet*2.1),p.y+Math.sin(angle)*r*(1+p.jet*2.1));
          ctx.ellipse(p.x,p.y,r*(1+p.jet*2.1),r,angle,0,TAU);
        }ctx.fill();
      }
      ctx.restore();
    }
    openingPose(seed,t) {
      const burst=smooth(OPENING_BURST,2.6,t),growth=this.openingGrowth(seed,t);
      const drift=Math.max(0,t-2.3);

      const release=seed.id===this.heroSeed.id?burst:
        1-Math.exp(-Math.max(0,t-OPENING_BURST)*5.2)*(1-smooth(OPENING_BURST,2.6,t));
      const reach=seed.id===this.heroSeed.id?1:1.55;
      const travel=release*(44+mod(seed.id*31,95))*reach+76*(1-Math.exp(-drift*0.8))*smooth(2.3,2.65,t);
      return {x:450+Math.sin(Math.min(t,1.65)*1.3)*7+seed.x*growth+Math.cos(seed.angle)*travel+burst*45,
        y:530+seed.y*growth+Math.sin(seed.angle)*travel,
        radius:seed.radius*growth,angle:seed.angle+Math.PI/2+burst*Math.sin(seed.id)*0.7};
    }
    floret(ctx,x,y,r,angle,alpha=1,filaments=null,stemAlpha=1) {
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalAlpha=alpha*stemAlpha;ctx.strokeStyle=this.colors.ink;ctx.lineWidth=0.85;ctx.beginPath();
      ctx.moveTo(0,0);ctx.quadraticCurveTo(r*0.2,r,0,r*2.1);ctx.stroke();
      const hairs=filaments?filaments.length:(r>20?37:11);
      for(let j=0;j<hairs;j++){
        const opacity=filaments?filaments[j].opacity:1;
        if(opacity<=0)continue;
        ctx.globalAlpha=alpha*opacity;
        const a=filaments?filaments[j].angle:-Math.PI+j*Math.PI/(hairs-1);
        const strand=filaments&&filaments[j],length=r*(strand&&strand.length!=null?strand.length:1),tip=strand&&strand.tip!=null?strand.tip:1;
        const dx=Math.cos(a)*length,dy=Math.sin(a)*length;
        ctx.lineWidth=0.85*(strand&&strand.weight!=null?strand.weight:1);
        ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(dx*0.5,dy*0.7,dx,dy);
        ctx.moveTo(dx-2*tip,dy-2*tip);ctx.lineTo(dx+2*tip,dy+tip);ctx.stroke();
      }
      ctx.globalAlpha=alpha*stemAlpha;ctx.fillStyle=this.colors.seed;ctx.beginPath();ctx.ellipse(0,r*2.15,1.9,r*0.26,0,0,TAU);ctx.fill();ctx.restore();
    }
 }

 const dandelion=new DandelionArtwork();
 const lightMaterials=[
 {root:'#A78D5E',middle:'#DEC799',tip:'#F7ECD3',rim:'#FFF8E8',vein:'#927B58',light:'255,244,218'},
 {root:'#769685',middle:'#BDD1AF',tip:'#E5ECD1',rim:'#F5F1DE',vein:'#648575',light:'241,249,221'}];
 const darkMaterials=[
 {root:'#243B36',middle:'#536D56',tip:'#89A275',rim:'#BCD09C',vein:'#20332E',light:'204,222,178'},
 {root:'#364739',middle:'#747C55',tip:'#A8A477',rim:'#D5C99B',vein:'#293C33',light:'225,222,183'}];
 const WING_TILE_W=44,WING_TILE_H=68,WING_COLUMNS=11,WING_UNIT=32;
 let wingAtlas,wingMaterials;
 function butterflyWing(f,t,side){
  const spread=f.spread,flight=f.morph;
  const bank=Math.sin(t*1.7+f.phase)*.1*flight;
  const width=spread*(1-side*bank*.3),lift=-(1-spread)*.34+side*bank*.36;
  const sheen=Math.exp(-(((spread-.72+side*.07+bank*.3)/.26)**2));
  return {width,lift,sheen};
 }
function wingPath(ctx,n,hind){
    ctx.beginPath();ctx.moveTo(0,n*.04);
    if(hind){
      ctx.bezierCurveTo(n*.36,-n*.02,n*.80,n*.18,n*.76,n*.43);
      ctx.bezierCurveTo(n*.74,n*.55,n*.63,n*.66,n*.54,n*.66);
      ctx.bezierCurveTo(n*.49,n*.74,n*.41,n*.75,n*.36,n*.68);
      ctx.bezierCurveTo(n*.19,n*.68,n*.06,n*.29,0,n*.04);
    }else{
      ctx.bezierCurveTo(n*.20,-n*.43,n*.64,-n*.98,n*.90,-n*.98);
      ctx.bezierCurveTo(n*.99,-n*.98,n,-n*.89,n,-n*.72);
      ctx.bezierCurveTo(n*.97,-n*.42,n*.73,-n*.10,n*.42,n*.06);
      ctx.bezierCurveTo(n*.23,n*.13,n*.08,n*.12,0,n*.04);
    }
    ctx.closePath();
  }
function buildWingAtlas(){
    // 四组前后翅材质：底色/翅脉、九个反光位置、边缘。飞行时只变形与混合。
    const canvas=document.createElement('canvas');
    canvas.width=WING_TILE_W*WING_COLUMNS*2;canvas.height=WING_TILE_H*4*2;
    wingAtlas={canvas,drawingContext:canvas.getContext('2d')};
    wingAtlas.drawingContext.scale(2,2);
    const ctx=wingAtlas.drawingContext,n=WING_UNIT;
    for(let color=0;color<2;color++)for(const hind of [true,false]){
      const material=wingMaterials[color],row=color*2+(hind?0:1);
      for(let col=0;col<WING_COLUMNS;col++){
        ctx.save();ctx.translate(col*WING_TILE_W+4,row*WING_TILE_H+37);
        if(col===10){ctx.strokeStyle=material.rim;ctx.lineWidth=.28*WING_UNIT/9.6;wingPath(ctx,n,hind);ctx.stroke();}
        else{
          wingPath(ctx,n,hind);ctx.clip();
          if(col===0){
            const surface=ctx.createLinearGradient(0,n*.15,n*.92,hind?n*.65:-n*.86);
            surface.addColorStop(0,material.root);surface.addColorStop(.38,material.middle);surface.addColorStop(1,material.tip);
            ctx.globalAlpha=hind?.84:.94;ctx.fillStyle=surface;ctx.fillRect(-n*.1,-n*1.1,n*1.2,n*1.9);
            ctx.globalAlpha=.28;ctx.strokeStyle=material.vein;ctx.lineWidth=.3*WING_UNIT/9.6;ctx.lineCap='round';ctx.beginPath();
            if(hind){
              ctx.moveTo(n*.03,n*.08);ctx.quadraticCurveTo(n*.34,n*.14,n*.65,n*.43);
              ctx.moveTo(n*.03,n*.08);ctx.quadraticCurveTo(n*.25,n*.35,n*.36,n*.63);
            }else{
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.37,-n*.48,n*.87,-n*.88);
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.47,-n*.19,n*.91,-n*.54);
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.35,n*.02,n*.62,-n*.09);
            }
            ctx.stroke();
          }else{
            const x=n*(.48+.13*(col-1)/8),y=n*(hind?.35:-.57),pearl=ctx.createRadialGradient(x,y,0,x,y,n*.58);
            pearl.addColorStop(0,`rgba(${material.light},.8)`);pearl.addColorStop(.42,`rgba(${material.light},.32)`);pearl.addColorStop(1,`rgba(${material.light},0)`);
            ctx.fillStyle=pearl;ctx.fillRect(0,-n*1.1,n*1.1,n*1.9);
          }
        }
        ctx.restore();
      }
    }
  }
function paintWing(ctx,row,col,n,alpha=1){
    if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;
    const scale=n/WING_UNIT;
    ctx.drawImage(wingAtlas.canvas,col*WING_TILE_W*2,row*WING_TILE_H*2,WING_TILE_W*2,WING_TILE_H*2,-4*scale,-37*scale,WING_TILE_W*scale,WING_TILE_H*scale);ctx.restore();
  }
function drawButterfly(ctx,f,t){
    const n=f.wingSize*.64,material=wingMaterials[f.color%2];ctx.save();
    for(const side of [-1,1]){
      const wing=butterflyWing(f,t,side);
      ctx.save();ctx.transform(side*wing.width,wing.lift,0,1,0,0);
      for(const hind of [true,false]){
        const row=f.color%2*2+(hind?0:1),position=clamp(wing.width)*8,index=Math.min(7,Math.floor(position)),fraction=position-index;
        paintWing(ctx,row,0,n);
        const shine=(hind?.84:.94)*(.28+.6*wing.sheen);
        paintWing(ctx,row,1+index,n,shine*(1-fraction));paintWing(ctx,row,2+index,n,shine*fraction);
        paintWing(ctx,row,10,n,.24+.3*wing.sheen);
      }
      ctx.restore();
    }
    const body=ctx.createLinearGradient(-n*.08,0,n*.08,0);
    body.addColorStop(0,material.root);body.addColorStop(.6,material.middle);body.addColorStop(1,material.rim);
    ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(0,n*.1,n*.065,n*.34,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,-n*.24,n*.075,n*.085,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha*=.75;ctx.strokeStyle=material.tip;ctx.lineWidth=.28;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(-n*.04,-n*.29);ctx.quadraticCurveTo(-n*.10,-n*.48,-n*.25,-n*.51);
    ctx.moveTo(n*.04,-n*.29);ctx.quadraticCurveTo(n*.10,-n*.48,n*.25,-n*.51);ctx.stroke();ctx.restore();
  }
 const atlases={};
 for(const [name,materials] of [['light',lightMaterials],['dark',darkMaterials]]){
  wingMaterials=materials;buildWingAtlas();atlases[name]={atlas:wingAtlas,materials};
 }
 function palette(colors){
  const dark=colors.ink==='#263B35';
  dandelion.colors={ink:colors.ink,seed:dark?'#8A7155':'#D8C59D',
   air:Array(5).fill(colors.ink),motes:Array(3).fill(colors.ink)};
  const choice=atlases[dark?'dark':'light'];wingAtlas=choice.atlas;wingMaterials=choice.materials;
 }
 window.WiseMotionNature=Object.freeze({dandelion,palette,drawButterfly,wingPath,
  info:{crownCount:96,wingMaterialLayers:11,airThreads:dandelion.threads.length,airMotes:dandelion.openingMotes.length,
   sources:['history-nature.js','osmanthus-motion.js'],license:'Apache-2.0'}});
})();

/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
 * 同一太阳沿光束落下，正圆触地即回弹；中心O扩成黑底，内孔成为片尾小点。
 * 扩黑借鉴复刻 scenes-middle.js 第六幕，回弹与小点飞行按用户新要求编排。 */
(() => {
 'use strict';
 const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
 const mix=(a,b,p)=>p<=0?a:p>=1?b:a+(b-a)*p;
 const ease=n=>{const p=clamp(n);return p*p*p*(p*(p*6-15)+10);};
 const at=(t,a,b)=>ease((t-a)/(b-a));
 const source=Object.freeze({x:754,y:208,r:68}),ground=Object.freeze({x:533,y:470});
 const impactRadius=18,contact=Object.freeze({x:source.x+(ground.x-source.x)*(ground.y-impactRadius-source.y)/(ground.y-source.y),y:ground.y-impactRadius});
 const target=Object.freeze([533,300]),coverRadius=Math.hypot(533,300)+2;
 const timing=Object.freeze({beam:5.12,beamFull:5.58,channel:5.42,channelEnd:5.78,travel:5.58,impact:6.06,open:6.06,openEnd:6.42,rise:6.06,center:6.7,ring:7.2});
 function state(t,fill,received){
  const channel=at(t,timing.channel,timing.channelEnd),travel=clamp((t-timing.travel)/(timing.impact-timing.travel))**2;
  const lift=clamp((t-timing.impact)/(timing.center-timing.impact)),open=at(t,timing.open,timing.openEnd),zoom=clamp((t-timing.center)/(timing.ring-timing.center));
  const pulse=1+.028*Math.sin(Math.PI*clamp((t-5.15)/.4))**2;
  const sunRadius=source.r*Math.sqrt(fill)*pulse;
  const r=zoom>0?mix(52.5,coverRadius,zoom**2.2):mix(mix(sunRadius,impactRadius,channel),52.5,at(t,timing.impact,timing.impact+.44));
  const x=mix(mix(source.x,contact.x,travel),target[0],ease(lift));
  // 抛起段直接继承触地事件：反向冲量后受重力减速，圆的下沿仅在触地瞬间等于地面。
  const y=lift>0?contact.y+(target[1]-contact.y)*(2*lift-lift*lift):mix(source.y,contact.y,travel);
  const hole=mix(52.5*(500/720)*open,window.WiseMotionBrand.style.dotRadius,ease(zoom)),black=at(t,timing.center,timing.center+.16);
  const color='#'+[21,29,27].map(v=>Math.round(mix(255,v,black)).toString(16).padStart(2,'0')).join('');
  return{fill,received,x,y,r,ry:r,hole,holeY:hole,aspect:1,lift,travel,impact:t>=timing.impact?1:0,channel,open,zoom,color,
   ray:at(fill,.38,1)*(1-at(t,5.10,5.48)),rotation:(t-4.9)*.55,
   beam:{progress:at(t,timing.beam,timing.beamFull),alpha:1-at(t,6.06,6.28),source,ground},
   floor:at(t,5.34,5.80)*(1-at(t,6.12,6.60)),origin:'sun',stage:t<5.12?'sun':t<5.58?'beam':t<6.06?'travel':t<6.7?'rebound-o':'black-expansion'};
 }
 function circle(c,x,y,r){c.moveTo(x+r,y);c.arc(x,y,r,0,TAU);}
 // 参考目录太阳的薄亮边；白色主体保留，长短交错的渐细光芒为本片改造。
 function corona(s){
  return Array.from({length:16},(_,i)=>({angle:i*TAU/16-Math.PI/2+s.rotation*.22,
   root:s.r+9*s.ray,length:(i%2?13:24)*s.ray,halfWidth:(i%2?1:1.5)*s.ray}));
 }
 function draw(c,s,p){
  if(s.fill<=0)return;c.save();
  if(s.floor>0){
   c.save();c.globalAlpha*=s.floor*.24;c.strokeStyle=p.ink;c.lineWidth=1;
   c.beginPath();c.moveTo(contact.x-110,ground.y);c.lineTo(contact.x+110,ground.y);c.stroke();c.restore();
  }
  const beam=s.beam;
  if(beam.progress>0&&beam.alpha>0){
   const e={x:mix(source.x,ground.x,beam.progress),y:mix(source.y,ground.y,beam.progress)},width=66*beam.progress;
   c.save();c.globalAlpha*=beam.alpha;
   const light=c.createLinearGradient(source.x,source.y,e.x,e.y);
   light.addColorStop(0,'rgba(255,255,255,.30)');light.addColorStop(.52,'rgba(255,250,226,.16)');light.addColorStop(1,'rgba(255,250,226,.04)');
   c.fillStyle=light;c.beginPath();c.moveTo(source.x-5,source.y);c.lineTo(source.x+5,source.y);c.lineTo(e.x+width,e.y);c.lineTo(e.x-width,e.y);c.closePath();c.fill();
   c.strokeStyle='#FFF8E6';c.globalAlpha*=.18;c.lineWidth=1.2;c.beginPath();c.moveTo(source.x,source.y);c.lineTo(e.x,e.y);c.stroke();c.restore();
  }
  if(s.ray>0){
   // 亮边只依附日盘，收光时同时消退，不拖到圆形回弹段。
   c.save();c.globalAlpha*=s.ray;
   const halo=c.createRadialGradient(s.x,s.y,s.r*.985,s.x,s.y,s.r*1.10);
   halo.addColorStop(0,'rgba(255,253,244,.24)');halo.addColorStop(.36,'rgba(255,253,244,.08)');halo.addColorStop(1,'rgba(255,253,244,0)');
   c.fillStyle=halo;c.beginPath();circle(c,s.x,s.y,s.r*1.10);c.fill();c.restore();
  }
  c.fillStyle=s.color;c.beginPath();circle(c,s.x,s.y,s.r);if(s.hole>0)circle(c,s.x,s.y,s.hole);c.fill('evenodd');
  // 中心内孔透出陶土橙，外圈扩满后同一色块接给片尾小点。
  if(s.zoom>0){c.fillStyle=window.WiseMotionBrand.style.accent;c.beginPath();circle(c,s.x,s.y,s.hole);c.fill();}
  if(s.ray>0){
   c.fillStyle='#FFFFFF';
   for(const ray of corona(s)){
    c.save();c.translate(s.x,s.y);c.rotate(ray.angle);
    const end=ray.root+ray.length,middle=ray.root+ray.length*.5;
    c.beginPath();c.moveTo(ray.root,0);
    c.quadraticCurveTo(middle,-2*ray.halfWidth,end,0);
    c.quadraticCurveTo(middle,2*ray.halfWidth,ray.root,0);c.closePath();c.fill();c.restore();
   }
  }
  c.restore();
 }
 window.WiseMotionSunlight=Object.freeze({state,draw,corona,source,ground,contact,timing,target,coverRadius,info:{sameObject:true,reference:'scenes-middle.js / scene 6; history-nature.js / sunset-sun-illustration',newDesign:'长短渐细日芒、薄亮边、圆形触地回弹、中心扩黑、内孔接飞行小点'}});
})();

/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
 * 种子落地→蒲公英→同一批冠毛旋转化蝶→抵达形成白色太阳。
 * nature-artwork.js 保留目录完整球簇/冠毛、气流炸开及蝴蝶材质。
 * 本文件只编排落地、生长、径向炸开到群飞的连续衔接；无叶片、无根。
 * 原例的长镜头压缩为本片节拍；不调用原例运行时、位图或随机播放状态。 */
(() => {
  'use strict';
  const TAU=Math.PI*2,COUNT=96,W=1066,H=600;
  const nature=window.WiseMotionNature,original=nature.dandelion,ART_SCALE=.7,BURST_SPEED=1.5;
  const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,p)=>a+(b-a)*p;
  const ease=n=>{const p=clamp(n);return p*p*p*(p*(p*6-15)+10);};
  const at=(t,a,b)=>ease((t-a)/(b-a)),mod=(v,n)=>((v%n)+n)%n;
  const base={x:408,y:442},sunTarget={x:754,y:208,r:68};
  const timing=Object.freeze({fallStart:.12,contact:.9,sprout:.9,flower:1.45,bloomed:2.12,burst:2.36,turn:2.88,sunMove:5.58,ring:7.2});
  const palettes=Object.freeze({
    paper:{bg:'#F1EBDD',ink:'#263B35',accent:'#DA795B',fine:'#7D8B70',stem:'#263B35'},
    lime:{bg:'#DCE4BA',ink:'#263B35',accent:'#DA795B',fine:'#7D8B70',stem:'#263B35'},
    coral:{bg:'#DA795B',ink:'#F4EEDD',accent:'#F4EEDD',fine:'#EBD4B5',stem:'#F4EEDD'},
    night:{bg:'#243B36',ink:'#F4EEDD',accent:'#DCE4BA',fine:'#B9C7A4',stem:'#DCE4BA'},
    sun:{bg:'#DA795B',ink:'#FFFFFF',accent:'#FFFFFF',fine:'#F4EEDD',stem:'#FFFFFF'},
    final:{bg:'#151D1B',ink:'#F4EEDD',accent:'#DA795B',fine:'#B9C7A4',stem:'#F4EEDD'}
  });
  const particles=original.openingSeeds.map(seed=>Object.freeze({
    ...seed,source:seed,phase:seed.id*1.789,size:seed.radius*ART_SCALE,
    release:timing.burst,join:timing.burst+.36+(seed.id%5)*.02,
    flight:2.45+(seed.id%7)*.028
  }));
  function cubic(a,b,c,d,p){const q=1-p;return{x:q*q*q*a.x+3*q*q*p*b.x+3*q*p*p*c.x+p*p*p*d.x,y:q*q*q*a.y+3*q*q*p*b.y+3*q*p*p*c.y+p*p*p*d.y};}
  function outline(start,segments,steps=12){const points=[start];let a=start;for(const [b,c,d] of segments){for(let j=1;j<=steps;j++){const p=cubic({x:a[0],y:a[1]},{x:b[0],y:b[1]},{x:c[0],y:c[1]},{x:d[0],y:d[1]},j/steps);points.push([p.x,p.y]);}a=d;}return points;}
  function closed(c,points){points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
  const circle=(r,n=96)=>Array.from({length:n},(_,i)=>[Math.cos(TAU*i/n)*r,Math.sin(TAU*i/n)*r]);
  function disc(c,x,y,r,color){if(r<=0)return;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  function plantState(t){
    const growth=1-(1-clamp((t-timing.sprout)/(1.84-timing.sprout)))**2,bloom=at(t,timing.flower,timing.bloomed);
    const recoil=at(t,2.14,timing.burst)*(1-at(t,timing.burst,timing.burst+.16));
    const height=188*growth,lean=(22+Math.sin(t*2.5)*6)*growth-9*recoil;
    const clear=at(t,2.44,2.88),alpha=1-clear;
    return{growth,bloom,recoil,height,lean,alpha,base:{...base},head:{x:base.x+lean,y:base.y-height+9*recoil},crownScale:bloom*(1-.18*recoil),clear};
  }
  const sourceOrigin={x:450+Math.sin(1.65*1.3)*7,y:530};
  const burstPlant=plantState(timing.burst);
  function sourceClock(t){
    if(t<timing.flower)return .62;
    if(t<=timing.bloomed)return mix(.62,1.42,clamp((t-timing.flower)/(timing.bloomed-timing.flower)));
    if(t<=timing.burst)return mix(1.42,1.65,clamp((t-timing.bloomed)/(timing.burst-timing.bloomed)));
    return 1.65+(t-timing.burst)*BURST_SPEED;
  }
  function burstPose(p,t){
    const source=original.openingPose(p.source,sourceClock(t)),plant=plantState(t);
    const anchor=t<=timing.burst?plant.head:burstPlant.head;
    const compression=t<=timing.burst?1-.18*plant.recoil:mix(.82,1,at(t,timing.burst,timing.burst+.13));
    const cx=450+Math.sin(Math.min(sourceClock(t),1.65)*1.3)*7;
    return {x:anchor.x+(source.x-cx)*ART_SCALE*compression,
      y:anchor.y+(source.y-530)*ART_SCALE*compression,
      size:source.radius*ART_SCALE*compression,angle:source.angle};
  }
  // 首段沿目录径向推出；之后对全部位置施加同一旋转，整团化蝶，不让各颗独自翻圈。
  const joins=particles.map(p=>{
    const a=burstPose(p,p.join),before=burstPose(p,p.join-.0001),after=burstPose(p,p.join+.0001);
    const span=p.release+p.flight-p.join;
    const vx=(after.x-before.x)/.0002,vy=(after.y-before.y)/.0002;
    const omega=(after.angle-before.angle)/.0002,turnSpan=.65,turnEnd=p.join+turnSpan;
    const endBank=.36+Math.sin(turnEnd*2.8+p.phase)*.2,direction=omega>=0?1:-1;
    const turns=Math.round((a.angle-endBank)/TAU); // 只沿最短方向回到飞行姿态，不安排单颗自转。
    return {a,b:{x:a.x+vx*span/3,y:a.y+vy*span/3},
      c:{x:630+(p.id%9)*20,y:360+Math.sin(p.phase)*65},span,omega,turnSpan,turnEnd,turns,direction,
      endAngle:endBank+TAU*turns,endOmega:.56*Math.cos(turnEnd*2.8+p.phase)};
  });
  function particleBasePose(item,t){
    const p=typeof item==='number'?particles[item]:item,age=Math.max(0,t-p.release);
    const u=clamp(age/p.flight),attached=t<=p.release;
    let q=burstPose(p,Math.min(t,p.join));
    if(t>p.join){
      const j=joins[p.id],progress=clamp((t-p.join)/j.span);
      const curve=cubic(j.a,j.b,j.c,sunTarget,progress),envelope=Math.sin(Math.PI*progress)**2;
      q={...q,x:curve.x+Math.sin(6*Math.PI*progress+p.phase)*10*envelope,
        y:curve.y+Math.cos(4*Math.PI*progress+p.phase)*7*envelope};
    }
    const morph=at(t,p.release+.42+(p.id%7)*.009,p.release+.99+(p.id%7)*.009);
    const depth=mix(1,.58,at(u,.44,1));
    const flap=.22+.78*(.5+.5*Math.sin(age*18+p.phase));
    const spread=mix(.84,flap,at(t,p.release+.95,p.release+1.2));
    const j=joins[p.id];let angle=q.angle;
    if(t>p.join){
      if(t>=j.turnEnd)angle=.36+Math.sin(t*2.8+p.phase)*.2+TAU*j.turns;
      else{
        const v=clamp((t-p.join)/j.turnSpan),v2=v*v,v3=v2*v;
        angle=(2*v3-3*v2+1)*j.a.angle+(v3-2*v2+v)*j.turnSpan*j.omega
          +(-2*v3+3*v2)*j.endAngle+(v3-v2)*j.turnSpan*j.endOmega;
      }
    }
    const arrival=at(u,.91,1);
    return{id:p.id,x:q.x,y:q.y,angle,size:q.size,depth,morph,spread,arrival,
      alpha:(1-arrival)*original.openingGrowth(p.source,sourceClock(t)),u,attached};
  }
  const groupTiming=Object.freeze({start:2.8,end:3.86,turn:Math.PI*1.25});
  function groupState(t,raw){
    const p=clamp((t-groupTiming.start)/(groupTiming.end-groupTiming.start));
    const home=at(t,groupTiming.end,4.48);
    return{x:mix(raw.reduce((n,q)=>n+q.x,0)/COUNT,sunTarget.x,home),y:mix(raw.reduce((n,q)=>n+q.y,0)/COUNT,sunTarget.y,home),
      angle:groupTiming.turn*ease(p),progress:p};
  }
  let cachedTime=null,cachedFlock=null,cachedGroup=null;
  function flockAt(t){
    if(t===cachedTime)return cachedFlock;
    const raw=particles.map(p=>particleBasePose(p,t)),group=groupState(t,raw),co=Math.cos(group.angle),si=Math.sin(group.angle);
    cachedFlock=raw.map(q=>{
      const dx=q.x-group.x,dy=q.y-group.y;
      return group.angle===0?q:{...q,x:group.x+dx*co-dy*si,y:group.y+dx*si+dy*co};
    });
    cachedTime=t;cachedGroup=group;return cachedFlock;
  }
  function particlePose(item,t){return flockAt(t)[typeof item==='number'?item:item.id];}
  function sunState(t,flock){
    return window.WiseMotionSunlight.state(t,flock.reduce((sum,p)=>sum+p.arrival,0)/COUNT,flock.filter(p=>p.arrival>=.99999).length);
  }
  function paletteState(t,sun){
    // 每次新形态建立时，从它所在位置展开新背景，并在同一范围换主体明暗。
    const events=[
      {t:1.02,d:.24,to:'lime',x:base.x,y:base.y},
      {t:1.65,d:.27,to:'coral',x:plantState(1.65).head.x,y:plantState(1.65).head.y},
      {t:2.36,d:.28,to:'night',x:plantState(2.36).head.x,y:plantState(2.36).head.y},
      {t:3.25,d:.28,to:'lime',x:500,y:318},
      {t:4.56,d:.31,to:'sun',x:sunTarget.x,y:sunTarget.y},
      // 片尾由中心O自身扩成黑底，不再另起一轮地面换色。
    ];
    let from='paper';for(const event of events){
      if(t<event.t)break;
      if(t<event.t+event.d)return{from,to:event.to,p:at(t,event.t,event.t+event.d),x:event.x,y:event.y};
      from=event.to;
    }
    return{from,to:from,p:1,x:533,y:300};
  }
  function state(frame){
    if(!Number.isFinite(frame))throw new TypeError('画面时间必须为有限数值');
    const t=Math.max(0,Math.min(7.2,frame/60)),plant=plantState(t),flock=flockAt(t),group={...cachedGroup};
    const sun=sunState(t,flock),palette=paletteState(t,sun);
    const fall=clamp((t-timing.fallStart)/(timing.contact-timing.fallStart));
    const landing=clamp((t-timing.contact)/.16),compression=Math.sin(Math.PI*landing)**2;
    const seed={x:mix(452,base.x,ease(fall))+Math.sin(Math.PI*fall)*24,
      y:t<timing.contact?mix(-36,428,fall*fall):base.y-14*(1-.32*compression),angle:mix(-.65,0,ease(fall)),
      sx:1+.34*compression,sy:1-.32*compression,alpha:1-at(t,.9,1.12)};
    return{frame:t*60,t,plant,flock,group,sun,palette,seed,camera:.7+.3*at(t,0,1.05),bg:palettes[palette.to].bg};
  }
  const seedShape=outline([0,-15],[[[12,-9],[11,5],[0,14]],[[-8,7],[-11,-7],[0,-15]]]);
  // 直接采用目录的前翅、后翅贝塞尔轮廓；尺寸、配色与起翅节拍改为本片。
  const wingFore=outline([0,.04],[[[.20,-.43],[.64,-.98],[.90,-.98]],[[.99,-.98],[1,-.89],[1,-.72]],[[.97,-.42],[.73,-.10],[.42,.06]],[[.23,.13],[.08,.12],[0,.04]]]);
  const wingHind=outline([0,.04],[[[.36,-.02],[.80,.18],[.76,.43]],[[.74,.55],[.63,.66],[.54,.66]],[[.49,.74],[.41,.75],[.36,.68]],[[.19,.68],[.06,.29],[0,.04]]]);
  function drawSeed(c,s,p){
    if(s.alpha<=0)return;c.save();c.globalAlpha*=s.alpha;c.translate(s.x,s.y);c.rotate(s.angle);c.scale(s.sx,s.sy);
    c.fillStyle=p.accent;c.beginPath();closed(c,seedShape);c.fill();
    c.strokeStyle=p.ink;c.globalAlpha*=.35;c.lineWidth=1;c.beginPath();c.moveTo(0,-10);c.quadraticCurveTo(-3,0,0,10);c.stroke();c.restore();
  }
  function drawPlant(c,s,p){
    if(s.growth<=0||s.alpha<=0)return;c.save();c.globalAlpha*=s.alpha;c.lineCap='round';
    const retract=1-s.clear,height=(s.height-9*s.recoil)*retract,lean=s.lean*retract;
    c.strokeStyle=p.stem;c.lineWidth=1.7;
    c.beginPath();c.moveTo(base.x,base.y);c.bezierCurveTo(base.x-8,base.y-height*.35,base.x+lean+8,base.y-height*.68,base.x+lean,base.y-height);c.stroke();
    c.restore();
  }
  function drawFloret(c,item,p,source,t){
    if(item.size<.001||item.alpha<=0)return;
    const m=item.morph,n=item.size*1.75*item.depth;
    c.save();c.translate(item.x,item.y);c.rotate(item.angle);
    if(m<1){
      // 原冠毛含末梢小叉、完整弯柄和末端种子，不再简画成扇形。
      const scale=item.size*item.depth/source.source.radius;
      c.save();c.scale(scale,scale);
      original.floret(c,0,0,source.source.radius,0,item.alpha*(1-m),null,1-m);c.restore();
    }
    if(m>0){
      c.save();c.globalAlpha*=item.alpha*m;c.scale(m,.55+.45*m);
      nature.drawButterfly(c,{wingSize:n/.64,color:item.id%2,phase:source.phase,
        spread:item.spread,morph:m},t);c.restore();
    }
    c.restore();
  }
  function drawBurstAir(c,s,p){
    const age=s.t-timing.burst;
    if(age<=0||age>=.76)return;
    const fade=at(age,0,.065)*(1-at(age,.35,.76));
    const sourceTime=sourceClock(s.t),event=original.openingEvent(sourceTime);
    c.save();c.translate(burstPlant.head.x,burstPlant.head.y);c.scale(ART_SCALE,ART_SCALE);
    c.translate(-sourceOrigin.x,-sourceOrigin.y);c.globalAlpha*=fade;
    original.openingAir(c,{time:sourceTime},event);c.restore();
  }
  function drawSun(c,s,p){window.WiseMotionSunlight.draw(c,s,p);}
  function objects(c,s,p){
    nature.palette(p);
    if(show('air'))drawBurstAir(c,s,p);if(show('plant')){drawSeed(c,s.seed,p);drawPlant(c,s.plant,p);}
    // 保留原目录球簇的96枚完整冠毛；不另画从中心向外的粗辐条。
    if(show('sun'))drawSun(c,s.sun,p,s.t);
    if(show('flock'))for(const item of s.flock)drawFloret(c,item,p,particles[item.id],s.t);
  }
  function draw(c,frame){
    const s=state(frame),{palette}=s,p=palettes[palette.from];
    c.fillStyle=p.bg;c.fillRect(0,0,W,H);objects(c,s,p);
    if(palette.from!==palette.to&&palette.p>0){
      const next=palettes[palette.to],radius=Math.hypot(Math.max(palette.x,W-palette.x),Math.max(palette.y,H-palette.y))*palette.p;
      c.save();c.beginPath();c.arc(palette.x,palette.y,radius,0,TAU);c.clip();
      c.fillStyle=next.bg;c.fillRect(0,0,W,H);objects(c,s,next);c.restore();
    }
    return s;
  }
  window.WiseMotionMorph={state,draw,drawSeed,drawPlant,drawFloret,drawBurstAir,particlePose,particleBasePose,groupState,groupTiming,plantState,burstPose,joins,particles,palettes,timing,endFrame:432,COUNT,wingFore,wingHind,info:{sources:['history-nature.js','osmanthus-motion.js','scenes-middle.js'],license:'Apache-2.0'}};
})();

/* 单一时间轴；缩放的是整张作品画面，主体仍按自己的动作前进。 */
(() => {
  'use strict';
  const canvas=document.getElementById('stage'),ctx=canvas.getContext('2d',{alpha:false});
  const brand=window.WiseMotionBrand,morph=window.WiseMotionMorph,fps=60;
  // 本片唯一播放时间表：[实际帧，已有动作秒数]。动作路径保留，压缩生长/飞行，投光多留一点时间。
  const beats=Object.freeze([[0,0],[120,2.36],[246,4.978],[280,5.58],[340,6.7],[364,7.2],[432,8.5],[492,9.6]].map(([frame,source])=>Object.freeze({time:frame/fps,source})));
  const duration=beats.at(-1).time,endFrame=Math.round(duration*fps),settledFrame=Math.round(beats.at(-2).time*fps);
  const slopes=beats.slice(1).map((b,i)=>(b.source-beats[i].source)/(b.time-beats[i].time));
  const tangents=beats.map((b,i)=>i===0?slopes[0]:i===beats.length-1?slopes.at(-1):2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
  function sourceTime(seconds){
    const t=Math.max(0,Math.min(duration,seconds));
    if(t===duration)return beats.at(-1).source;
    const i=beats.findIndex((b,j)=>j<beats.length-1&&t>=b.time&&t<beats[j+1].time),a=beats[i],b=beats[i+1],span=b.time-a.time;
    const u=(t-a.time)/span,u2=u*u,u3=u2*u;
    return (2*u3-3*u2+1)*a.source+(u3-2*u2+u)*span*tangents[i]+(-2*u3+3*u2)*b.source+(u3-u2)*span*tangents[i+1];
  }
  function presentationTime(source){
    const exact=beats.find(b=>b.source===source);if(exact)return exact.time;
    let lo=0,hi=duration;for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(sourceTime(mid)<source)lo=mid;else hi=mid;}return(lo+hi)/2;
  }
  const stages=[
    [0,54,'画面推近 · 种子落下'],[54,90,'落定发芽'],[90,142,'蒲公英展开'],
    [142,177,'花冠炸开'],[177,211,'旋转化蝶'],[211,302,'小蝶群弧线飞行'],
    [302,335,'太阳照出光束'],[335,364,'光核沿束触地'],[364,402,'圆形 O 回弹到中心'],[402,432,'O 放大成为黑底'],[432,458,'圆心飞出'],[458,510,'字标展开 · 小点落位'],[510,576,'WISE MOTION']
  ].map(([start,end,label])=>({start:presentationTime(start/fps),end:presentationTime(end/fps),label}));
  let time=0;const errors=[];
  function render(seconds){
    if(!Number.isFinite(seconds))throw new TypeError('播放位置必须是有限数值');
    time=Math.max(0,Math.min(duration,seconds));const frame=sourceTime(time)*fps;
    ctx.save();
    try{
      ctx.setTransform(canvas.width/1066,0,0,canvas.height/600,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
      ctx.fillStyle='#151D1B';ctx.fillRect(0,0,1066,600);
      const camera=frame<morph.endFrame?morph.state(frame).camera:1;
      ctx.translate(533,300);ctx.scale(camera,camera);ctx.translate(-533,-300);
      ctx.beginPath();ctx.roundRect(0,0,1066,600,(1-camera)*30);ctx.clip();
      if(frame<brand.timing.split)morph.draw(ctx,frame);
      else{ctx.fillStyle='#151D1B';ctx.fillRect(0,0,1066,600);if(show('wordmark'))brand.draw(ctx,frame);}
    }catch(error){if(errors.length<8)errors.push(String(error));throw error;}finally{ctx.restore();}
    return time;
  }
  window.WiseMotionFilm={render,canvas,fps,duration,endFrame,settledFrame,beats,sourceTime,presentationTime,stages,errors,brand,morph,get time(){return time;}};
  window.__render=render;window.__ready=Promise.resolve();render(0);
})();

  const film=window.WiseMotionFilm,morph=window.WiseMotionMorph,brand=window.WiseMotionBrand;
  const ctx=canvas.getContext('2d');
  function render(seconds,layers=null){if(dead)return;visible=layers;return film.render(seconds);}
  // Independent action painters call only their actual objects, not a hidden full film.
  function drawAction(id,seconds){
    if(dead)return;if(!Number.isFinite(seconds))throw TypeError('时间必须是有限数字');
    const segment=segments[id];if(!segment)throw Error('Unknown action: '+id);
    const t=segment.start+Math.max(0,Math.min(segment.duration,seconds));
    const frame=film.sourceTime(t)*60,s=morph.state(frame),p=morph.palettes[s.palette.to];
    ctx.save();
    try{
      ctx.setTransform(canvas.width/1066,0,0,canvas.height/600,0,0);
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
      ctx.fillStyle=id==='circle-expand-wordmark'&&frame>=brand.timing.split?'#151D1B':p.bg;ctx.fillRect(0,0,1066,600);
      window.WiseMotionNature.palette(p);
      if(id==='seed-sprout-bloom'){
        ctx.translate(533,300);ctx.scale(s.camera,s.camera);ctx.translate(-533,-300);
        morph.drawSeed(ctx,s.seed,p);morph.drawPlant(ctx,s.plant,p);
        for(const q of s.flock)morph.drawFloret(ctx,q,p,morph.particles[q.id],s.t);
      }else if(id==='flock-turn-gather'){
        morph.drawBurstAir(ctx,s,p);
        window.WiseMotionSunlight.draw(ctx,s.sun,p);
        for(const q of s.flock)morph.drawFloret(ctx,q,p,morph.particles[q.id],s.t);
      }else if(id==='sunbeam-circle-rebound'){
        window.WiseMotionSunlight.draw(ctx,s.sun,p);
      }else if(frame<brand.timing.split){window.WiseMotionSunlight.draw(ctx,s.sun,p);}
      else brand.draw(ctx,frame);
    }finally{ctx.restore();}
    return t;
  }
  return {render,drawAction,film,brand,morph,sun:window.WiseMotionSunlight,
    dispose(){if(dead)return;dead=true;textures.forEach(c=>{c.width=1;c.height=1;});textures.length=0;visible=null;}};
}
const segments=Object.freeze({
  'seed-sprout-bloom':{start:0,duration:2},
  'flock-turn-gather':{start:2,duration:2.1},
  'sunbeam-circle-rebound':{start:4.1,duration:340/60-4.1},
  'circle-expand-wordmark':{start:340/60,duration:8.2-340/60}
});
const breakdown=[
  {id:'plant',name:'落种与细茎生长',actions:['seed-sprout-bloom'],start:0,end:2450,time:'0–2.45秒',detail:'种子落地即长出细茎；96枚冠毛从茎顶展开，炸开后细茎收回。'},
  {id:'air',name:'径向气流与微粒',actions:['dandelion-radial-release'],start:2000,end:2670,time:'2.00–2.67秒',detail:'494根细气流和98枚微尘随花冠一起向外推开，随后淡去。'},
  {id:'flock',name:'花冠与整体旋转的蝶群',actions:['flock-turn-gather'],start:1200,end:4100,time:'1.20–4.10秒',detail:'96枚完整冠毛炸开；群体整体转225度并化为小蝴蝶，振翅飞向同一目标。'},
  {id:'sun',name:'白日盘、光束与圆形承接',actions:['sunbeam-circle-rebound','circle-expand-wordmark'],start:2800,end:6066.666667,time:'2.80–6.07秒',detail:'蝶群到达形成白色太阳；16束日芒收起，沿光束触地即回弹成正圆O，再扩成近黑底。'},
  {id:'wordmark',name:'字标展开与圆点落位',actions:['circle-expand-wordmark'],start:6066.666667,end:8200,time:'6.07–8.20秒',detail:'O的内孔接成陶土橙圆点，绕过文字落在右下；Outfit Medium字标从中间展开，7.20秒落定并保持1秒。'}
];
function make(root,kit,def={}){
  const doc=root.ownerDocument,box=doc.createElement('div'),canvas=doc.createElement('canvas');
  Object.assign(box.style,{position:'absolute',inset:'0',overflow:'hidden',background:'#151D1B'});
  canvas.width=2132;canvas.height=1200;
  // 1066:600 differs slightly from 16:9. Preserve the source ratio rather than stretching.
  Object.assign(canvas.style,{position:'absolute',width:'639.6px',height:'360px',left:'.2px',top:'0'});
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',def.name||'生长化蝶与光形字标');
  box.append(canvas);root.replaceChildren(box);
  const part=segments[def.id]?def.id:null;
  const markers=part?[]:breakdown.map(row=>{const node=doc.createElement('span');node.dataset.layer=row.id;node.hidden=true;box.append(node);return node;});
  const engine=canvas.getContext('2d')?createEngine(canvas):null;
  let dead=false,last=0;
  const layers=()=>markers.some(n=>n.hasAttribute('data-composition-hidden'))?new Set(markers.filter(n=>!n.hasAttribute('data-composition-hidden')).map(n=>n.dataset.layer)):null;
  function render(ms){
    if(dead)return;if(!Number.isFinite(ms))throw TypeError('时间必须是有限数字');
    last=Math.max(0,Math.min(ms,def.duration_ms||8200));box.dataset.time=String(last);
    if(part)engine?.drawAction(part,last/1000);else engine?.render(last/1000,layers());
  }
  const Observer=doc.defaultView?.MutationObserver;
  const observer=!part&&Observer?new Observer(()=>render(last)):null;
  observer?.observe(box,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
  render.frameRate=60;render.ready=Promise.resolve();
  render.inspect=()=>engine?{time:last,sourceTime:engine.film.sourceTime(part?segments[part].start+last/1000:last/1000),part:part||'composition'}:null;
  render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();engine?.dispose();markers.forEach(n=>n.remove());if(!preserve){canvas.width=1;canvas.height=1;root.replaceChildren();}};
  render(0);return render;
}
const F=global.MotionFactories=global.MotionFactories||{};
for(const id of [...Object.keys(segments),'seed-bloom-brand-sequence'])F[id]=(root,kit,def)=>make(root,kit,def);
F['seed-bloom-brand-sequence'].breakdown=breakdown;
global.WiseSeedBloom=Object.freeze({createEngine,segments,breakdown,width:2132,height:1200,fps:60,duration:8.2});
})(globalThis);
