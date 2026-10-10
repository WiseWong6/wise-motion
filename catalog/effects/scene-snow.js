/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.snow=function(S,opt,def){

 with(S.env){
// p5.js v1.9.4 noise subset, LGPL-2.1; source and full license: THIRD-PARTY.json.
// 2026-09-15: extracted noise/noiseSeed only; prototype exports changed to globals.
// Original provenance retained from p5.js:
// http://mrl.nyu.edu/~perlin/noise/
// Adapting from PApplet.java, which was adapted from toxi,
// which was adapted from the german demo group farbrausch,
// as used in their demo "art": http://www.farb-rausch.de/fr010src.zip
(() => {
const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; // default to medium smooth
let perlin_amp_falloff = 0.5; // 50% reduction/octave

// 噪声每次更新要调用数十万次；固定数学函数，避免反复查找场景环境。
const noiseCos = Math.cos;
const noiseFloor = Math.floor;
const noisePi = Math.PI;
const scaled_cosine = i => 0.5 * (1.0 - noiseCos(i * noisePi));

let perlin; // will be initialized lazily by noise() or noiseSeed()

globalThis.noise = function(x, y = 0, z = 0) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = window.random();
    }
  }

  if (x < 0) {
    x = -x;
  }
  if (y < 0) {
    y = -y;
  }
  if (z < 0) {
    z = -z;
  }

  let xi = noiseFloor(x),
    yi = noiseFloor(y),
    zi = noiseFloor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
};
globalThis.noiseSeed = function(seed) {
  // Linear Congruential Generator
  // Variant of a Lehman Generator
  const lcg = (() => {
    // Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
    // m is basically chosen to be large (as it is the max period)
    // and for its relationships to a and c
    const m = 4294967296;
    // a - 1 should be divisible by m's prime factors
    const a = 1664525;
    // c and m should be co-prime
    const c = 1013904223;
    let seed, z;
    return {
      setSeed(val) {
        // pick a random seed if val is undefined or null
        // the >>> 0 casts the seed to an unsigned 32-bit integer
        z = seed = (val == null ? window.random() * m : val) >>> 0;
      },
      getSeed() {
        return seed;
      },
      rand() {
        // define the recurrence relationship
        z = (a * z + c) % m;
        // return a float in [0, 1)
        // if z = m then z / m = 0 therefore (z % m) / m < 1 always
        return z / m;
      }
    };
  })();

  lcg.setSeed(seed);
  perlin = new Array(PERLIN_SIZE + 1);
  for (let i = 0; i < PERLIN_SIZE + 1; i++) {
    perlin[i] = lcg.rand();
  }
};
})();

const originalScore={"duration":24.89469387755102,"sections":[{"name":"\u521d\u96ea","from":0,"to":6.223673469387755,"intensity":0.45},{"name":"\u7a97\u706f","from":6.223673469387755,"to":12.44734693877551,"intensity":0.52},{"name":"\u96ea\u5149","from":12.44734693877551,"to":18.671020408163265,"intensity":0.58},{"name":"\u56de\u73af","from":18.671020408163265,"to":24.89469387755102,"intensity":0.48}],"visuals":[{"id":"piano-0","at":0.039909297052154194,"strength":0.7835033750685994,"visual":{"kind":"snowflake","size":8.05360540010976,"flight":3.8742261812740098,"brightness":0.9675255062602899,"turn":0.2,"x":0.348}},{"id":"piano-1","at":0.3891156462585034,"strength":0.3320331101014737,"visual":{"kind":"snowflake","size":7.331252976162357,"flight":3.716211588535516,"brightness":0.899804966515221,"turn":-0.2,"x":0.63829416}},{"id":"piano-2","at":1.0775510204081633,"strength":0.46962369136989585,"visual":{"kind":"snowflake","size":7.551397906191833,"flight":3.7643682919794634,"brightness":0.9204435537054844,"turn":0.2,"x":0.16858832000000007}},{"id":"piano-3","at":1.7759637188208617,"strength":0.404065680665484,"visual":{"kind":"snowflake","size":7.446505089064774,"flight":3.7414229882329195,"brightness":0.9106098520998226,"turn":-0.2,"x":0.4588824800000001}},{"id":"piano-4","at":2.1052154195011337,"strength":0.20885626932411622,"visual":{"kind":"snowflake","size":7.134170030918586,"flight":3.6730996942634406,"brightness":0.8813284403986175,"turn":0.2,"x":0.7491766400000002}},{"id":"piano-5","at":2.4444444444444446,"strength":0.3219777116192427,"visual":{"kind":"snowflake","size":7.3151643385907885,"flight":3.712692199066735,"brightness":0.8982966567428864,"turn":-0.2,"x":0.27947080000000013}},{"id":"piano-6","at":2.8036281179138323,"strength":0.2379697447660111,"visual":{"kind":"snowflake","size":7.180751591625618,"flight":3.683289410668104,"brightness":0.8856954617149017,"turn":0.2,"x":0.56976496}},{"id":"piano-7","at":3.4820861678004533,"strength":0.198255252207648,"visual":{"kind":"snowflake","size":7.117208403532237,"flight":3.6693893382726768,"brightness":0.8797382878311472,"turn":-0.2,"x":0.8600591199999998}},{"id":"piano-8","at":3.8213151927437643,"strength":0.08275696618206328,"visual":{"kind":"cross","size":5.8,"flight":3.628964938163722,"brightness":0.8624135449273095,"turn":0.16,"x":0.39035328}},{"id":"piano-9","at":4.170521541950113,"strength":0.5007258338898232,"visual":{"kind":"snowflake","size":7.6011613342237165,"flight":3.775254041861438,"brightness":0.9251088750834735,"turn":-0.2,"x":0.6806474400000002}},{"id":"piano-10","at":4.868934240362812,"strength":0.22739293742675853,"visual":{"kind":"snowflake","size":7.163828699882814,"flight":3.6795875280993657,"brightness":0.8841089406140138,"turn":0.2,"x":0.2109416000000004}},{"id":"piano-11","at":5.198185941043084,"strength":0.2830939201993762,"visual":{"kind":"snowflake","size":7.252950272319001,"flight":3.699082872069782,"brightness":0.8924640880299064,"turn":-0.2,"x":0.5012357599999999}},{"id":"piano-12","at":5.557369614512472,"strength":0.5528407151643393,"visual":{"kind":"snowflake","size":7.684545144262943,"flight":3.7934942503075186,"brightness":0.9329261072746509,"turn":0.2,"x":0.7915299200000001}},{"id":"piano-13","at":5.8965986394557826,"strength":0.4737264212244104,"visual":{"kind":"snowflake","size":7.557962273959056,"flight":3.7658042474285436,"brightness":0.9210589631836615,"turn":-0.2,"x":0.3218240800000003}},{"id":"piano-14","at":6.595011337868481,"strength":0.27380347090634566,"visual":{"kind":"snowflake","size":7.238085553450153,"flight":3.695831214817221,"brightness":0.8910705206359518,"turn":0.2,"x":0.6121182399999998}},{"id":"piano-15","at":6.934240362811791,"strength":0.15951933536441615,"visual":{"kind":"snowflake","size":7.055230936583065,"flight":3.6558317673775456,"brightness":0.8739279003046624,"turn":-0.2,"x":0.1424124}},{"id":"piano-16","at":7.283446712018141,"strength":0.7341389876075958,"visual":{"kind":"snowflake","size":7.974622380172153,"flight":3.8569486456626585,"brightness":0.9601208481411393,"turn":0.2,"x":0.4327065600000002}},{"id":"piano-17","at":7.642630385487529,"strength":0.1278961166462897,"visual":{"kind":"snowflake","size":7.004633786634063,"flight":3.6447636408262016,"brightness":0.8691844174969434,"turn":-0.2,"x":0.7230007200000004}},{"id":"piano-18","at":7.971882086167801,"strength":0.1601261737613286,"visual":{"kind":"snowflake","size":7.0562018780181255,"flight":3.656044160816465,"brightness":0.8740189260641993,"turn":0.2,"x":0.25329488000000056}},{"id":"piano-19","at":8.640362811791384,"strength":0.28728074956787236,"visual":{"kind":"cross","size":5.8,"flight":3.7005482623487556,"brightness":0.8930921124351808,"turn":0.16,"x":0.5435890400000001}},{"id":"piano-20","at":9.00952380952381,"strength":0.42856084083040535,"visual":{"kind":"snowflake","size":7.485697345328648,"flight":3.749996294290642,"brightness":0.9142841261245608,"turn":0.2,"x":0.8338832000000003}},{"id":"piano-21","at":9.34875283446712,"strength":0.4367516251741334,"visual":{"kind":"snowflake","size":7.498802600278613,"flight":3.752863068810947,"brightness":0.91551274377612,"turn":-0.2,"x":0.36417736000000045}},{"id":"piano-22","at":9.69795918367347,"strength":0.1529780610901152,"visual":{"kind":"snowflake","size":7.044764897744184,"flight":3.6535423213815403,"brightness":0.8729467091635172,"turn":0.2,"x":0.6544715200000006}},{"id":"piano-23","at":11.064852607709751,"strength":0.5101176635638679,"visual":{"kind":"snowflake","size":7.616188261702188,"flight":3.778541182247354,"brightness":0.9265176495345802,"turn":-0.2,"x":0.18476568000000085}},{"id":"piano-24","at":11.404081632653062,"strength":0.7754192949448925,"visual":{"kind":"snowflake","size":8.040670871911828,"flight":3.8713967532307123,"brightness":0.9663128942417338,"turn":0.2,"x":0.47505984000000107}},{"id":"piano-25","at":11.743310657596371,"strength":0.5701268554541027,"visual":{"kind":"snowflake","size":7.712202968726564,"flight":3.799544399408936,"brightness":0.9355190283181154,"turn":-0.2,"x":0.7653540000000012}},{"id":"piano-26","at":12.092517006802721,"strength":1,"visual":{"kind":"snowflake","size":8.4,"flight":3.95,"brightness":1,"turn":0.2,"x":0.29564816000000144}},{"id":"piano-27","at":13.120181405895691,"strength":0.8662212353979318,"visual":{"kind":"snowflake","size":8.185953976636691,"flight":3.9031774323892763,"brightness":0.9799331853096898,"turn":-0.2,"x":0.5859423200000016}},{"id":"piano-28","at":13.46938775510204,"strength":0.5611110422414809,"visual":{"kind":"snowflake","size":7.69777766758637,"flight":3.7963888647845185,"brightness":0.9341666563362221,"turn":0.2,"x":0.8762364800000004}},{"id":"piano-29","at":14.157823129251701,"strength":0.8228865180694169,"visual":{"kind":"snowflake","size":8.116618428911067,"flight":3.888010281324296,"brightness":0.9734329777104125,"turn":-0.2,"x":0.40653064000000066}},{"id":"piano-30","at":14.517006802721088,"strength":0.8443899808800783,"visual":{"kind":"cross","size":5.8,"flight":3.8955364933080276,"brightness":0.9766584971320117,"turn":0.16,"x":0.6968248000000008}},{"id":"piano-31","at":14.866213151927438,"strength":0.2873195490818089,"visual":{"kind":"snowflake","size":7.259711278530894,"flight":3.700561842178633,"brightness":0.8930979323622713,"turn":-0.2,"x":0.22711896000000104}},{"id":"piano-32","at":15.554648526077097,"strength":0.10754087383245753,"visual":{"kind":"snowflake","size":6.972065398131932,"flight":3.6376393058413603,"brightness":0.8661311310748686,"turn":0.2,"x":0.5174131200000012}},{"id":"piano-33","at":15.903854875283447,"strength":0.1660719383283156,"visual":{"kind":"snowflake","size":7.065715101325305,"flight":3.6581251784149105,"brightness":0.8749107907492473,"turn":-0.2,"x":0.8077072800000014}},{"id":"piano-34","at":16.23310657596372,"strength":0.09390739663361138,"visual":{"kind":"snowflake","size":6.950251834613778,"flight":3.632867588821764,"brightness":0.8640861094950417,"turn":0.2,"x":0.3380014400000016}},{"id":"piano-35","at":16.592290249433105,"strength":0.2968418637909844,"visual":{"kind":"snowflake","size":7.2749469820655746,"flight":3.7038946523268446,"brightness":0.8945262795686476,"turn":-0.2,"x":0.6282956000000017}},{"id":"piano-36","at":16.941496598639457,"strength":0.16951481520118747,"visual":{"kind":"snowflake","size":7.0712237043219,"flight":3.6593301853204157,"brightness":0.8754272222801781,"turn":0.2,"x":0.15858976000000197}},{"id":"piano-37","at":17.270748299319727,"strength":0.11833131054417144,"visual":{"kind":"snowflake","size":6.989330096870674,"flight":3.64141595869046,"brightness":0.8677496965816257,"turn":-0.2,"x":0.4488839200000008}},{"id":"piano-38","at":17.629931972789116,"strength":0.22766591567472425,"visual":{"kind":"snowflake","size":7.164265465079558,"flight":3.6796830704861536,"brightness":0.8841498873512086,"turn":0.2,"x":0.739178080000001}},{"id":"piano-39","at":17.969160997732427,"strength":0.23346388752861916,"visual":{"kind":"snowflake","size":7.173542220045791,"flight":3.6817123606350166,"brightness":0.8850195831292929,"turn":-0.2,"x":0.2694722400000012}},{"id":"piano-40","at":18.318367346938775,"strength":0.11214708784287937,"visual":{"kind":"snowflake","size":6.979435340548607,"flight":3.639251480745008,"brightness":0.8668220631764318,"turn":0.2,"x":0.5597664000000013}},{"id":"piano-41","at":19.356009070294785,"strength":0.8056875250431024,"visual":{"kind":"cross","size":5.8,"flight":3.881990633765086,"brightness":0.9708531287564653,"turn":0.16,"x":0.8500605600000016}},{"id":"piano-42","at":20.01451247165533,"strength":0.7011305902833709,"visual":{"kind":"snowflake","size":7.921808944453393,"flight":3.84539570659918,"brightness":0.9551695885425056,"turn":0.2,"x":0.3803547200000004}},{"id":"piano-43","at":20.70294784580499,"strength":0.6625463225276452,"visual":{"kind":"snowflake","size":7.860074116044232,"flight":3.831891212884676,"brightness":0.9493819483791468,"turn":-0.2,"x":0.670648880000002}},{"id":"piano-44","at":21.072108843537414,"strength":0.4351238649368394,"visual":{"kind":"snowflake","size":7.496198183898943,"flight":3.752293352727894,"brightness":0.9152685797405259,"turn":0.2,"x":0.2009430400000008}},{"id":"piano-45","at":21.740589569161,"strength":0.37184518416775625,"visual":{"kind":"snowflake","size":7.39495229466841,"flight":3.730145814458715,"brightness":0.9057767776251634,"turn":-0.2,"x":0.4912372000000023}},{"id":"piano-46","at":22.109750566893425,"strength":0.2675322306323721,"visual":{"kind":"snowflake","size":7.228051569011795,"flight":3.6936362807213303,"brightness":0.8901298345948558,"turn":0.2,"x":0.7815313600000012}},{"id":"piano-47","at":22.448979591836736,"strength":0.3258029597339934,"visual":{"kind":"snowflake","size":7.321284735574389,"flight":3.7140310359068978,"brightness":0.898870443960099,"turn":-0.2,"x":0.31182552000000274}},{"id":"piano-48","at":22.788208616780047,"strength":0.24107828391571273,"visual":{"kind":"snowflake","size":7.18572525426514,"flight":3.6843773993704994,"brightness":0.8861617425873569,"turn":0.2,"x":0.6021196800000015}}]};
const W = 900;
// 只裁去底部 120 像素留白，楼体坐标和宽高比例不变。
const H = 1080;
const CITY_BASE_Y = 900;
const INK = "#0B0B0E";
const PAPER = "#F5F0CE";
const FALLING_SHAPES = ["cross", "snowflake"];
const ANIMATION_STEP = 1 / 60;
const FOG_FPS = 8;
const DROP_MERGE_SECONDS = 0.55;

// 隔湖视角，沿用用户照片的取景范围；来源和取舍见 references/shenzhen-skyline-sources.md。
// 横纵使用同一比例，保留真实楼体宽高关系。roof 为从左到右的楼顶折线。
const SKYLINE_SCALE = W / 1106;
const BUILDING_SPECS = [
  { id: "west-podium", x: -18, w: 138, top: 650, depth: 0,
    roof: [[0, 7], [0.19, 7], [0.19, 0], [0.7, 4], [0.7, 10], [1, 10]] },
  { id: "west-rear", x: 184, w: 91, top: 551, depth: 0,
    roof: [[0, 3], [0.8, 0], [1, 7]], seam: 0.8 },
  { id: "west-ribbed", x: 107, w: 82, top: 557, depth: 1,
    roof: [[0, 4], [0.53, 0], [1, 5]], detail: "vertical", seam: 0.76 },
  { id: "west-low-front", x: 49, w: 175, top: 691, depth: 2,
    roof: [[0, 5], [0.38, 5], [0.38, 0], [0.81, 0], [0.81, 10], [1, 10]] },
  { id: "west-link", x: 346, w: 91, top: 542, depth: 0,
    roof: [[0, 13], [0.33, 13], [0.33, 0], [0.74, 0], [0.74, 8], [1, 8]] },
  { id: "diagrid-high", x: 317, w: 81, top: 503, depth: 1,
    roof: [[0, 5], [0.4, 0], [0.82, 3], [1, 10]], detail: "diagrid", seam: 0.82,
    shoulders: { at: 36, left: 0.1, right: 0.94 } },
  { id: "diagrid-low", x: 271, w: 73, top: 602, depth: 2,
    roof: [[0, 6], [0.45, 0], [0.83, 3], [1, 9]], detail: "diagrid", seam: 0.83,
    shoulders: { at: 28, left: 0.14, right: 0.88 } },
  { id: "bamboo-left-slab", x: 423, w: 103, top: 504, depth: 2,
    roof: [[0, 7], [0.57, 0], [0.73, 1], [1, 15]], seam: 0.65 },
  { id: "bamboo-rear", x: 521, w: 44, top: 535, depth: 0,
    roof: [[0, 12], [0.3, 12], [0.3, 0], [0.7, 0], [0.7, 10], [1, 10]] },
  { id: "spring-bamboo", x: 538, w: 136, top: 35, depth: 1, style: "springBamboo" },
  { id: "east-link", x: 675, w: 74, top: 588, depth: 0,
    roof: [[0, 13], [0.17, 13], [0.17, 0], [0.64, 0], [0.64, 20], [1, 20]] },
  { id: "andaz", x: 748, w: 92, top: 329, depth: 1,
    roof: [[0, 9], [0.58, 0], [0.76, 2], [1, 17]], seam: 0.62 },
  { id: "east-grid-rear", x: 837, w: 107, top: 566, depth: 0,
    roof: [[0, 0], [0.17, 0], [0.17, 11], [0.75, 11], [0.75, 6], [1, 6]] },
  { id: "east-grid-front", x: 854, w: 80, top: 579, depth: 2,
    roof: [[0, 0], [0.84, 0], [0.84, 5], [1, 5]], detail: "frame", seam: 0.82 },
  { id: "east-small", x: 947, w: 40, top: 677, depth: 1,
    roof: [[0, 6], [0.3, 6], [0.3, 0], [0.8, 0], [0.8, 9], [1, 9]] },
  { id: "east-roof", x: 987, w: 32, top: 589, depth: 0,
    roof: [[0, 7], [0.24, 7], [0.24, 0], [0.7, 0], [0.7, 5], [1, 5]] },
  { id: "east-slim", x: 1022, w: 36, top: 608, depth: 0,
    roof: [[0, 5], [0.23, 0], [0.82, 0], [1, 7]] },
  { id: "east-low", x: 1008, w: 79, top: 665, depth: 1,
    roof: [[0, 8], [0.2, 8], [0.2, 0], [0.65, 0], [0.65, 6], [1, 6]] },
  { id: "east-edge", x: 1070, w: 65, top: 666, depth: 1,
    roof: [[0, 9], [0.14, 9], [0.14, 0], [0.59, 0], [0.59, 4], [1, 4]] },
  { id: "waterfront-podium", x: 649, w: 120, top: 727, depth: 2,
    roof: [[0, 8], [0.23, 8], [0.23, 0], [0.7, 0], [0.7, 4], [1, 4]], noWindows: true },
  { id: "sports-roof", x: 916, w: 227, top: 716, depth: 2, style: "sportsRoof", noWindows: true },
].map((spec) => Object.assign({}, spec, {
  x: spec.x * SKYLINE_SCALE,
  w: spec.w * SKYLINE_SCALE,
  top: CITY_BASE_Y + (spec.top - 770) * SKYLINE_SCALE,
}));

// [距尖顶的高度比例, 半宽占最大半宽的比例]：顶部弧肩、中下部近直立、柱脚微收。
const BAMBOO_PROFILE = [
  [0, 0], [0.015, 0.06], [0.05, 0.19], [0.1, 0.35],
  [0.16, 0.5], [0.24, 0.66], [0.34, 0.8], [0.46, 0.9],
  [0.62, 0.97], [0.8, 1], [0.93, 1], [1, 0.965],
];

let buildings = [];
let windows = [];
let drops = [];
let snow = [];
let grainLayer;
let fogLayer;
let sceneTime = 0;
let animationRemainder = 0;
let nextDropAt = 0;
let nextSnowAt = 0;
let fogFrame = -1;
let nextMeteorAt = 0;
let shootingStar = null;
let previousDropKind = null;
let musicTransport = null;
const musicDropEvents = new Map();

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("canvas-wrap");
  pixelDensity(1);
  frameRate(60);
  randomSeed(24);
  noiseSeed(24);

  makeCity();
  makeGrain();
  fogLayer = createGraphics(180, 160);
  fogLayer.pixelDensity(1);

  for (let i = 0; i < 96; i++) {
    snow.push(createSnowflake(true));
  }

  for (let i = 0; i < 4; i++) {
    const drop = createDrop();
    if (!drop) continue;
    drop.fallAge = drop.cruiseDuration * random(0.25, 0.78);
    drops.push(drop);
  }
  updateFallingDrops(0);
  nextDropAt = random(0.9, 1.8);
  nextSnowAt = random(0.2, 0.5);
  nextMeteorAt = random(3.5, 6.5);
}

function makeCity() {
  windows = [];
  buildings = BUILDING_SPECS.map((spec) => Object.assign({}, spec, {
    outline: makeBuildingOutline(spec), windows: [], lastDropAt: -Infinity,
  })).sort((a, b) => a.depth - b.depth);

  buildings.forEach((building, buildingIndex) => {
    if (building.noWindows) return;
    const cols = max(1, floor((building.w - 14) / 17));
    const rows = floor((CITY_BASE_Y - building.top - 24) / 27);
    const gapX = (building.w - 14) / cols;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const code = (row * 7 + col * 11 + buildingIndex * 13) % 23;
        if (code === 0 || code === 8 || code === 19) continue;
        const win = {
          x: building.x + 7 + (col + 0.5) * gapX + random(-0.7, 0.7),
          y: building.top + 24 + row * 27,
          w: random(2.2, 3.6),
          h: random(5, 8),
          light: code === 4 ? random(0.18, 0.3) : 0,
          flash: 0,
          depth: building.depth,
          buildingId: building.id,
          reserved: false,
          illumination: null,
        };
        win.baseLight = win.light;
        win.x -= win.w / 2;
        if (!windowFitsBuilding(win, building)) continue;
        if (buildings.slice(buildingIndex + 1).some((front) => windowTouchesBuilding(win, front))) continue;
        building.windows.push(win);
        windows.push(win);
      }
    }
  });
}

function makeBuildingOutline(building) {
  const { x, w, top } = building;
  const base = CITY_BASE_Y;
  if (building.style === "springBamboo") {
    const right = [];
    for (let i = 0; i <= 100; i++) {
      const y = top + (base - top) * i / 100;
      right.push({ x: x + w / 2 + springBambooHalfWidth(building, y), y });
    }
    return right.concat(right.slice(1).reverse().map((point) => ({ x: 2 * x + w - point.x, y: point.y })));
  }
  if (building.style === "sportsRoof") {
    const roof = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const rise = 19 * sin(PI * t) + 7 * sin(3 * PI * t);
      roof.push({ x: x + w * t, y: top + (26 - rise) * SKYLINE_SCALE });
    }
    return roof.concat([{ x: x + w, y: base }, { x, y: base }]);
  }

  const roof = building.roof.map(([px, py]) => ({ x: x + w * px, y: top + py * SKYLINE_SCALE }));
  if (!building.shoulders) return roof.concat([{ x: x + w, y: base }, { x, y: base }]);
  const { at, left, right } = building.shoulders;
  const shoulderY = top + at * SKYLINE_SCALE;
  return roof.concat([
    { x: x + w, y: shoulderY }, { x: x + w * right, y: shoulderY },
    { x: x + w * right, y: base }, { x: x + w * left, y: base },
    { x: x + w * left, y: shoulderY }, { x, y: shoulderY },
  ]);
}

function springBambooHalfWidth(building, y) {
  const progress = constrain((y - building.top) / (CITY_BASE_Y - building.top), 0, 1);
  for (let i = 1; i < BAMBOO_PROFILE.length; i++) {
    const [p1, width1] = BAMBOO_PROFILE[i];
    if (progress > p1) continue;
    const [p0, width0] = BAMBOO_PROFILE[i - 1];
    // 单调三次插值，使取样点之间平滑衔接且不会鼓出轮廓。
    const before = BAMBOO_PROFILE[max(0, i - 2)];
    const after = BAMBOO_PROFILE[min(BAMBOO_PROFILE.length - 1, i + 1)];
    const slope = (width1 - width0) / (p1 - p0);
    const previousSlope = i > 1 ? (width0 - before[1]) / (p0 - before[0]) : slope;
    const nextSlope = i + 1 < BAMBOO_PROFILE.length ? (after[1] - width1) / (after[0] - p1) : slope;
    const tangent = (a, b) => a * b <= 0 ? 0 : 2 * a * b / (a + b);
    const t = (progress - p0) / (p1 - p0);
    const width = (2 * t ** 3 - 3 * t ** 2 + 1) * width0 +
      (t ** 3 - 2 * t ** 2 + t) * (p1 - p0) * tangent(previousSlope, slope) +
      (-2 * t ** 3 + 3 * t ** 2) * width1 +
      (t ** 3 - t ** 2) * (p1 - p0) * tangent(slope, nextSlope);
    return building.w * 0.5 * width;
  }
  return building.w * 0.5 * BAMBOO_PROFILE[BAMBOO_PROFILE.length - 1][1];
}

function buildingBoundsAtY(building, y) {
  const intersections = [];
  const points = building.outline;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      intersections.push(a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y));
    }
  }
  if (intersections.length < 2) return null;
  return { left: min(...intersections), right: max(...intersections) };
}

function windowFitsBuilding(win, building) {
  for (let offset = 0; offset <= Math.ceil(win.h); offset++) {
    const bounds = buildingBoundsAtY(building, win.y + min(offset, win.h));
    if (!bounds || win.x < bounds.left + 3 || win.x + win.w > bounds.right - 3) return false;
  }
  return true;
}

function windowTouchesBuilding(win, building) {
  for (let offset = 0; offset <= Math.ceil(win.h); offset++) {
    const bounds = buildingBoundsAtY(building, win.y + min(offset, win.h));
    if (bounds && win.x + win.w > bounds.left && win.x < bounds.right) return true;
  }
  return false;
}


function makeGrain() {
  grainLayer = createGraphics(W, H);
  grainLayer.pixelDensity(1);
  grainLayer.loadPixels();
  for (let i = 0; i < grainLayer.pixels.length; i += 4) {
    const value = random() < 0.5 ? 255 : 0;
    const alpha = random(3, 13);
    grainLayer.pixels[i] = value;
    grainLayer.pixels[i + 1] = value;
    grainLayer.pixels[i + 2] = value;
    grainLayer.pixels[i + 3] = alpha;
  }
  grainLayer.updatePixels();
}



// 所有可见动画共用秒钟和固定步长；切回后台页面时不补发一大批落物。
function advanceAnimation(elapsedSeconds) {
  if (!Number.isFinite(elapsedSeconds)) return;
  syncMusicDrops();
  animationRemainder += constrain(elapsedSeconds, 0, 0.1);
  while (animationRemainder + 1e-9 >= ANIMATION_STEP) {
    animationRemainder = max(0, animationRemainder - ANIMATION_STEP);
    sceneTime += ANIMATION_STEP;
    updateFallingDrops(ANIMATION_STEP);
    updateWindows();
    updateSnow(ANIMATION_STEP);
    updateShootingStar();
    if (!musicTransport && sceneTime >= nextDropAt) {
      const drop = createDrop();
      if (drop) drops.push(drop);
      nextDropAt = sceneTime + random(0.85, 1.2) * lerp(2.25, 1.05, snowfallStrength());
    }
  }
  if (musicTransport) {
    updateFallingDrops(0, true);
    updateWindows();
  }
}

function syncMusicDrops() {
  const transport = globalThis.cityScore && globalThis.cityAudio && globalThis.cityAudio.transport
    ? globalThis.cityAudio.transport() : null;
  if ((transport ? transport.session : null) !== (musicTransport ? musicTransport.session : null)) {
    // 开关配乐时让旧落物轻轻隐去，既不突然清屏，也不留下抢拍的落点。
    for (const drop of drops) {
      if (drop.phase === "retiring") continue;
      drop.phase = "retiring";
      drop.retireAge = 0;
      drop.retireOpacity = drop.opacity;
      drop.retireTrailOpacity = drop.trailOpacity;
      drop.music = null;
    }
    musicDropEvents.clear();
    nextDropAt = sceneTime + 1;
  }
  musicTransport = transport;
  if (!transport || transport.time < 0) return;
  const score = globalThis.cityScore;
  const cycleDuration = transport.duration == null ? score.duration : transport.duration;
  const cycle = Math.floor(transport.time / cycleDuration);
  for (const [key, landedAt] of musicDropEvents) {
    if (landedAt < transport.time - 1) musicDropEvents.delete(key);
  }
  // 下一轮的首句需要提前落下，循环接缝才不会让音符先响、雪花后到。
  for (let lap = Math.max(0, cycle - 1); lap <= cycle + 1; lap++) {
    for (const note of score.visuals) {
      const landedAt = lap * cycleDuration + note.at;
      // 开场便有旋律：首批雪花已在半空，不把完整飞行挤进不足一秒。
      const startedAt = landedAt - note.visual.flight;
      if (transport.time < startedAt || transport.time > landedAt + DROP_MERGE_SECONDS) continue;
      const key = `${lap}:${note.id}`;
      if (musicDropEvents.has(key)) continue;
      musicDropEvents.set(key, landedAt);
      const target = chooseMusicTarget(note.visual.x);
      const drop = createDrop(target, 150, note.visual);
      if (!drop) continue;
      const flight = Math.max(0.1, landedAt - startedAt);
      drop.speed = (drop.landingY - drop.startY + drop.approachDistance) / flight;
      drop.cruiseDuration = (drop.landingY - drop.startY - drop.approachDistance) / drop.speed;
      drop.approachDuration = drop.approachDistance * 2 / drop.speed;
      drop.music = { startedAt, landedAt, rotation: drop.rotation, key };
      drops.push(drop);
    }
  }
}

function chooseMusicTarget(position) {
  const available = windows.filter(win => !win.reserved);
  const dark = available.filter(win => win.light < 0.4);
  const candidates = dark.length ? dark : available;
  if (!candidates.length) return null;
  // 横向呼应旋律的声像，纵向保留变化，避免一直落到同一排窗。
  candidates.sort((a, b) => Math.abs(a.x / W - position) - Math.abs(b.x / W - position));
  return random(candidates.slice(0, 7));
}

function snowfallStrength() {
  if (musicTransport) {
    const score = globalThis.cityScore;
    if (score.sections[0].from !== undefined) {
      const time = max(0, musicTransport.time) % (musicTransport.duration == null ? score.duration : musicTransport.duration);
      const index = Math.max(0, score.sections.findIndex(part => time >= part.from && time < part.to));
      const section = score.sections[index];
      return lerp(score.sections[(index + score.sections.length - 1) % score.sections.length].intensity,
        section.intensity, smoothstep(0, 1.8, time - section.from));
    }
    const bar = max(0, musicTransport.time) % score.duration / (score.beatSeconds * 4);
    const index = Math.floor(bar / 8);
    return lerp(score.sections[(index + 3) % 4].intensity, score.sections[index].intensity,
      smoothstep(0, 1.25, bar % 8));
  }
  return 0.5 + 0.3 * sin(sceneTime * 0.12 - 0.8) + 0.2 * sin(sceneTime * 0.23 + 1.7);
}

function updateShootingStar() {
  if (shootingStar && sceneTime >= shootingStar.startedAt + shootingStar.duration) {
    shootingStar = null;
    nextMeteorAt = sceneTime + random(9, 18);
  }
  if (!shootingStar && sceneTime >= nextMeteorAt) {
    shootingStar = {
      startedAt: sceneTime,
      duration: random(2.3, 2.9),
      startX: W + 180,
      startY: random(28, 175),
      travelX: -(W + 380),
      travelY: random(235, 360),
      length: random(135, 180),
    };

  }
}

function drawShootingStars() {
  if (shootingStar) drawShootingStar(shootingStar);
}

function drawShootingStar(config) {
  const progress = constrain((sceneTime - config.startedAt) / config.duration, 0, 1);
  const visibility = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.94, 1, progress));
  // 匀速穿过整个天空，仅在画外淡入淡出，尾端不减速悬停。
  const x = config.startX + config.travelX * progress;
  const y = config.startY + config.travelY * progress;
  const angle = atan2(config.travelY, config.travelX);
  const tailX = x - cos(angle) * config.length;
  const tailY = y - sin(angle) * config.length;

  const ctx = drawingContext;
  ctx.save();
  const trail = ctx.createLinearGradient(tailX, tailY, x, y);
  trail.addColorStop(0, "rgba(240,244,255,0)");
  trail.addColorStop(0.72, `rgba(240,244,255,${0.22 * visibility})`);
  trail.addColorStop(1, `rgba(255,250,215,${0.9 * visibility})`);
  ctx.strokeStyle = trail;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(255,248,210,0.9)";
  fill(255, 249, 220, 220 * visibility);
  noStroke();
  circle(x, y, 3.5);
  ctx.restore();
}

function drawSky() {
  push();
  const ctx = drawingContext;
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#2149F2");
  gradient.addColorStop(0.3, "#173BCB");
  gradient.addColorStop(0.62, "#0D206C");
  gradient.addColorStop(0.82, "#080B1D");
  gradient.addColorStop(1, "#08090F");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // 主蓝色不变，光从左上轻轻铺开，避免整片天空像一张平涂色纸。
  const glow = ctx.createRadialGradient(W * 0.28, 210, 30, W * 0.28, 210, 650);
  glow.addColorStop(0, "rgba(66,103,255,0.28)");
  glow.addColorStop(0.5, "rgba(42,78,246,0.12)");
  glow.addColorStop(1, "rgba(8,18,76,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 820);

  const horizon = ctx.createLinearGradient(0, 540, 0, CITY_BASE_Y);
  horizon.addColorStop(0, "rgba(49,74,169,0)");
  horizon.addColorStop(0.62, "rgba(49,74,169,0.12)");
  horizon.addColorStop(1, "rgba(49,74,169,0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 540, W, CITY_BASE_Y - 540);

  // 暗角只作用于楼后的天空，黑色建筑和暖窗不会被压暗。
  const edge = ctx.createRadialGradient(W * 0.46, 360, 180, W * 0.46, 360, 760);
  edge.addColorStop(0, "rgba(4,9,39,0)");
  edge.addColorStop(0.55, "rgba(4,9,39,0.035)");
  edge.addColorStop(1, "rgba(4,9,39,0.32)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);

  noStroke();
  for (let i = 0; i < 40; i++) {
    const x = (i * 223 + 71) % W;
    const y = (i * 97 + 43) % 430;
    fill(224, 228, 204, 25 + 18 * sin(sceneTime * 0.72 + i));
    circle(x, y, i % 9 === 0 ? 2 : 1);
  }
  pop();
}

function drawFog() {
  // 按固定时间格取样，连续播放和回拖共用同一张云雾，不逐帧重算。
  const frame = Math.floor(sceneTime * FOG_FPS + 1e-7);
  if (frame !== fogFrame) {
    updateFogTexture(frame / FOG_FPS);
    fogFrame = frame;
  }
  const ctx = drawingContext;
  ctx.save();
  ctx.filter = "blur(8px)";
  image(fogLayer, -12, 70, W + 24, 820);
  ctx.restore();
}

function updateFogTexture(seconds) {
  // 小尺寸连续噪声配合宽窄不一的云带，留出清澈天空，不铺一层灰罩。
  const layer = fogLayer;
  layer.loadPixels();
  const { width, height, pixels } = layer;
  const sampleNoise = noise;
  const { sin, pow, exp, min, max, PI } = Math;
  const time = seconds * 0.018;
  const centers = Array.from({ length: width }, (_, x) =>
    0.3 + x / width * 0.3 + 0.055 * sin(x * 0.025 + time * 0.3));
  for (let y = 0; y < height; y++) {
    const progress = y / (height - 1);
    const edgeFade = pow(sin(PI * progress), 1.5);
    for (let x = 0; x < width; x++) {
      const broad = sampleNoise(x * 0.026 + time * 0.4, y * 0.038 - time * 0.12, time);
      const detail = sampleNoise(x * 0.064 + 31, y * 0.075 - time * 0.3, time * 0.65);
      const ribbon = exp(-(((progress - centers[x]) / 0.2) ** 2));
      const amount = min(1, max(0, (broad * 0.76 + detail * 0.24 - 0.34) / (0.7 - 0.34)));
      const density = amount * amount * (3 - 2 * amount);
      const index = (y * width + x) * 4;
      pixels[index] = 75;
      pixels[index + 1] = 106;
      pixels[index + 2] = 218;
      pixels[index + 3] = density * edgeFade * (8 + ribbon * 26);
    }
  }
  layer.updatePixels();
}

function createSnowflake(initial = false) {
  const layer = random();
  const depth = layer < 0.62 ? random(0.12, 0.45) : layer < 0.92 ? random(0.46, 0.76) : random(0.8, 1);
  const originX = random(-16, W + 16);
  return {
    x: originX,
    originX,
    y: initial ? random(H) : random(-40, -8),
    size: lerp(0.65, 3.1, depth * depth),
    speed: lerp(15, 105, depth * depth),
    sway: random(0.4, 0.85),
    offset: random(TWO_PI),
    depth,
  };
}

function updateSnow(dt) {
  for (let i = snow.length - 1; i >= 0; i--) {
    const flake = snow[i];
    flake.y += flake.speed * dt;
    flake.x = flake.originX + sin(sceneTime * flake.sway + flake.offset) * lerp(4, 19, flake.depth) +
      sin(sceneTime * 0.13 + flake.offset) * flake.depth * 12;
    if (flake.y > H + 12) snow.splice(i, 1);
  }
  if (sceneTime >= nextSnowAt) {
    if (snow.length < 180) snow.push(createSnowflake());
    nextSnowAt = sceneTime + random(0.75, 1.25) / lerp(1.55, 3.1, snowfallStrength());
  }
}

function drawSnow(foreground) {
  push();
  noStroke();
  for (const flake of snow) {
    if ((flake.depth > 0.58) !== foreground) continue;
    const edgeFade = smoothstep(-16, 32, flake.y) * (1 - smoothstep(H - 45, H + 10, flake.y));
    const softness = smoothstep(0.8, 1, flake.depth);
    const alpha = (24 + flake.depth * 106) * edgeFade;
    const ctx = drawingContext;
    push();
    // 只让极少数最近的雪点轻微虚化，远雪仍细小，主旋律雪花仍清晰。
    if (softness > 0) ctx.filter = `blur(${(softness * 0.85).toFixed(3)}px)`;
    fill(224, 233, 249, alpha);
    circle(flake.x, flake.y, flake.size * (1 + softness * 0.16));
    pop();
  }
  pop();
}

function drawCity() {
  push();
  for (const building of buildings) {
    drawBuilding(building);
    drawWindows(building.windows);
  }
  noStroke();
  fill(INK);
  rect(0, CITY_BASE_Y, W, H - CITY_BASE_Y);
  pop();
}


function smoothstep(edge0, edge1, value) {
  const amount = constrain((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function traceBuildingOutline(ctx, building) {
  ctx.beginPath();
  building.outline.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function drawBuilding(building) {
  const { x, w, top } = building;
  const center = x + w / 2;
  const base = CITY_BASE_Y;
  push();
  const ctx = drawingContext;
  traceBuildingOutline(ctx, building);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.clip();
  noFill();
  strokeWeight(0.65);
  stroke(76, 80, 96, 34);
  const detailStrength = [0.105, 0.135, 0.15][building.depth];
  const structure = ctx.createLinearGradient(x, top, x, base);
  structure.addColorStop(0, `rgba(98,116,160,${detailStrength})`);
  structure.addColorStop(0.42, `rgba(98,116,160,${detailStrength * 0.6})`);
  structure.addColorStop(1, "rgba(98,116,160,0)");
  ctx.strokeStyle = structure;

  if (building.style === "springBamboo") {
    // 内部结构直接沿已经绘出的边线取样，始终在楼体内。
    for (let rib = -5; rib <= 5; rib++) {
      const amount = sin(rib / 6 * HALF_PI);
      beginShape();
      for (const edge of building.outline.slice(0, 101)) {
        vertex(center + (edge.x - center) * amount, edge.y);
      }
      endShape();
    }
    for (const progress of [0.34, 0.61, 0.84]) {
      const bandY = top + (base - top) * progress;
      const bounds = buildingBoundsAtY(building, bandY);
      line(bounds.left + 2, bandY, bounds.right - 2, bandY);
    }
  } else if (building.detail === "diagrid") {
    const crownBottom = top + building.shoulders.at * SKYLINE_SCALE;
    // 实拍中是盒状楼冠里的斜撑，斜撑不改变外轮廓。
    for (let rib = 0; rib < 7; rib++) {
      const ribX = x + w * rib / 6;
      line(ribX, top + 2, ribX + w * 0.19, crownBottom);
      line(ribX, top + 2, ribX - w * 0.19, crownBottom);
    }
    line(x, crownBottom - 3, x + w, crownBottom - 3);
    const left = x + w * building.shoulders.left;
    const right = x + w * building.shoulders.right;
    line(left + 3, crownBottom, left + 3, base);
    line(right - 3, crownBottom, right - 3, base);
  } else if (building.detail === "vertical") {
    for (let rib = 1; rib < 7; rib++) {
      const ribX = x + w * rib / 7;
      line(ribX, top + 6, ribX, base);
    }
  } else if (building.detail === "frame") {
    for (let col = 1; col < 4; col++) {
      line(x + w * col / 4, top + 9, x + w * col / 4, base);
    }
    for (let y = top + 21; y < base; y += 31) {
      line(x + 3, y, x + w - 3, y);
    }
  } else if (building.style === "sportsRoof") {
    for (let rib = -1; rib < 16; rib++) {
      const ribX = x + rib * w / 14;
      line(ribX, top, ribX + 28, top + 43 * SKYLINE_SCALE);
      line(ribX, top, ribX - 28, top + 43 * SKYLINE_SCALE);
    }
  }

  if (building.seam !== undefined) {
    ctx.save();
    ctx.globalAlpha *= 0.62;
    const seamX = x + w * building.seam;
    line(seamX, top, seamX, base);
    ctx.restore();
  }

  // 统一黑色楼体，仅在楼冠内侧留一丝天空反光，往下消失；不是整栋描边。
  const rim = ctx.createLinearGradient(0, top, 0, min(base, top + 105));
  rim.addColorStop(0, "rgba(114,139,200,0.22)");
  rim.addColorStop(0.35, "rgba(96,120,175,0.07)");
  rim.addColorStop(1, "rgba(96,120,175,0)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.25;
  traceBuildingOutline(ctx, building);
  ctx.stroke();
  pop();
}

function startWindowLight(win, startedAt, kind = "snowflake") {
  win.illumination = {
    startedAt,
    from: win.light,
    peak: max(win.light, random(0.76, 0.96)),
    rise: DROP_MERGE_SECONDS + 0.15,
    hold: random(10, 24),
    fade: random(14, 26),
  };

}

function updateWindows() {
  for (const win of windows) {
    const light = win.illumination;
    if (!light) {
      win.light = win.baseLight;
      win.flash = 0;
      continue;
    }
    const age = max(0, sceneTime - light.startedAt);
    if (age < light.rise) {
      win.light = lerp(light.from, light.peak, smoothstep(0, light.rise, age));
    } else if (age < light.rise + light.hold) {
      win.light = light.peak;
    } else {
      const fadeAge = age - light.rise - light.hold;
      win.light = lerp(light.peak, win.baseLight, smoothstep(0, light.fade, fadeAge));
      if (fadeAge >= light.fade) win.illumination = null;
    }
    win.flash = sin(PI * constrain(age / 1.3, 0, 1)) * 0.55;
  }
}

function drawWindows(buildingWindows) {
  push();
  noStroke();
  const ctx = drawingContext;
  for (const win of buildingWindows) {
    if (win.light <= 0.002) continue;
    const depthFactor = [0.82, 0.91, 1][win.depth];
    const centerX = win.x + win.w / 2;
    const centerY = win.y + win.h / 2;
    // 用坐标给每扇窗少量固定色温差，不消耗动画的随机数，也不改变落点。
    const warmth = (Math.floor(win.x * 7 + win.y * 11) % 9) / 8;
    const radius = 8 + win.light * 6 + win.flash * 2;
    const halo = (win.light * 0.075 + win.flash * 0.13) * depthFactor;
    const intensity = pow(win.light, 0.72) * depthFactor;
    push();
    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    glow.addColorStop(0, `rgba(255,226,159,${halo})`);
    glow.addColorStop(0.35, `rgba(255,226,159,${halo * 0.35})`);
    glow.addColorStop(1, "rgba(255,226,159,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    // 亮度接近零时也连续淡去，不再跨过阈值突然熄灭。
    fill(255, 224 + warmth * 14, 166 + warmth * 27, 255 * intensity);
    rect(win.x, win.y, win.w, win.h, 0.6);
    // 亮芯留在窗内，窗外只保留很轻的暖晕，不给楼体罩上大光斑。
    fill(255, 249, 219 + warmth * 12, 205 * intensity);
    rect(win.x + win.w * 0.2, win.y + 0.6, win.w * 0.6, win.h * 0.5, 0.35);
    pop();
  }
  pop();
}

function chooseDropTarget() {
  const collect = (darkOnly) => buildings.map((building) => {
    const candidates = building.windows.filter((win) => !win.reserved && (!darkOnly || win.light < 0.4));
    const recentFactor = lerp(0.4, 1, constrain((sceneTime - building.lastDropAt) / 6, 0, 1));
    return { candidates, weight: sqrt(candidates.length) * recentFactor };
  }).filter((group) => group.candidates.length);
  let groups = collect(true);
  if (!groups.length) groups = collect(false);
  if (!groups.length) return null;

  // 先选楼、再选窗，弱化大楼窗户数量对掉落位置的垄断。
  let choice = random(groups.reduce((sum, group) => sum + group.weight, 0));
  for (const group of groups) {
    choice -= group.weight;
    if (choice <= 0) return random(group.candidates);
  }
  return random(groups[groups.length - 1].candidates);
}

function chooseDropKind() {
  // 雪花为主，十字少量点缀；限制连发后长期占比约为 15%。
  const crossChance = previousDropKind === "cross" ? 0 : 0.18;
  previousDropKind = random() < crossChance ? FALLING_SHAPES[0] : FALLING_SHAPES[1];
  return previousDropKind;
}

function createDrop(target = null, speed = random(115, 180), profile = null) {
  target = target || chooseDropTarget();
  if (!target || target.reserved || drops.length >= 32) return null;
  target.reserved = true;
  const building = buildings.find((item) => item.id === target.buildingId);
  if (building) building.lastDropAt = sceneTime;
  const startY = random(-100, -24);
  const landingY = target.y + target.h / 2;
  const approachDistance = 40;
  return {
    x: target.x + target.w / 2,
    y: startY,
    startY,
    landingY,
    target,
    kind: profile && profile.kind != null ? profile.kind : chooseDropKind(),
    size: profile && profile.size != null ? profile.size : random(6, 9),
    brightness: profile && profile.brightness != null ? profile.brightness : 1,
    speed,
    rotation: random(TWO_PI),
    turn: profile && profile.turn != null ? profile.turn : random(-0.6, 0.6),
    trailLength: random(130, 205),
    phase: "falling",
    fallAge: 0,
    cruiseDuration: (landingY - approachDistance - startY) / speed,
    approachDistance,
    approachDuration: approachDistance * 2 / speed,
    mergeAge: 0,
    opacity: 1,
    trailOpacity: 1,
  };
}

function updateFallingDrops(dt, musicOnly = false) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];
    if (Boolean(drop.music) !== musicOnly) continue;
    if (drop.phase === "retiring") {
      drop.retireAge += dt;
      const fade = 1 - smoothstep(0, 0.35, drop.retireAge);
      drop.opacity = drop.retireOpacity * fade;
      drop.trailOpacity = drop.retireTrailOpacity * fade;
      if (fade <= 0) {
        drop.target.reserved = false;
        drops.splice(i, 1);
      }
      continue;
    }
    if (drop.music) {
      drop.fallAge = max(0, musicTransport.time - drop.music.startedAt);
      drop.mergeAge = max(0, musicTransport.time - drop.music.landedAt);
      drop.rotation = drop.music.rotation + drop.turn * Math.min(drop.fallAge, drop.music.landedAt - drop.music.startedAt);
    }
    if (drop.phase === "falling") {
      if (!drop.music) {
        drop.fallAge += dt;
        drop.rotation += drop.turn * dt;
      }
      if (drop.fallAge < drop.cruiseDuration) {
        drop.y = drop.startY + drop.speed * drop.fallAge;
      } else {
        const approach = constrain((drop.fallAge - drop.cruiseDuration) / drop.approachDuration, 0, 1);
        drop.y = drop.landingY - drop.approachDistance * (1 - approach) ** 2;
        if (approach >= 1 - 1e-9) {
          drop.phase = "merging";
          drop.mergeAge = max(0, drop.fallAge - drop.cruiseDuration - drop.approachDuration);
          startWindowLight(drop.target, sceneTime - drop.mergeAge, drop.kind);
        }
      }
    } else if (!drop.music) {
      drop.mergeAge += dt;
      drop.rotation += drop.turn * dt * drop.opacity;
    }

    if (drop.phase === "merging") {
      drop.opacity = 1 - smoothstep(0, DROP_MERGE_SECONDS, drop.mergeAge);
      drop.trailOpacity = 1 - smoothstep(0, DROP_MERGE_SECONDS * 0.72, drop.mergeAge);
      if (drop.mergeAge >= DROP_MERGE_SECONDS) {
        drop.target.reserved = false;
        drops.splice(i, 1);
      }
    }
    if (drop.music && drop.music.startedAt < 0 && drop.phase === "falling") {
      const entrance = smoothstep(0, 0.18, musicTransport.time);
      drop.opacity = entrance;
      drop.trailOpacity = entrance;
    }
  }
}

function drawFallingDrops() {
  for (const drop of drops) {
    drawDropTrail(drop);
    drawDropIcon(drop);
  }
}

function drawDropTrail(drop) {
  if (drop.trailOpacity <= 0) return;
  const topY = max(-4, drop.y - drop.trailLength);
  const endY = drop.y - drop.size - 3;
  if (endY <= topY) return;
  const ctx = drawingContext;
  ctx.save();
  const trail = ctx.createLinearGradient(drop.x, topY, drop.x, endY);
  trail.addColorStop(0, "rgba(229,236,251,0)");
  trail.addColorStop(0.3, `rgba(229,236,251,${0.05 * drop.trailOpacity})`);
  trail.addColorStop(1, `rgba(240,242,219,${0.21 * drop.trailOpacity})`);
  ctx.strokeStyle = trail;
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(drop.x, topY);
  ctx.lineTo(drop.x, endY);
  ctx.stroke();
  ctx.restore();
}

function drawDropIcon(drop) {
  if (drop.opacity <= 0) return;
  push();
  // 每片雪花自身明暗起伏，不加放射光线；不同落点错开呼吸，避免整屏同闪。
  const phase = drop.x * 0.037 + drop.landingY * 0.011;
  const shimmer = pow(0.5 + 0.5 * sin(drop.fallAge * 2.15 + phase), 4);
  drawingContext.globalAlpha *= drop.opacity * (drop.brightness == null ? 1 : drop.brightness) * (0.74 + shimmer * 0.26);
  drawingContext.shadowColor = "rgba(255,243,195,0.6)";
  drawingContext.shadowBlur = 2 + shimmer * 4;
  translate(drop.x, drop.y);
  rotate(drop.rotation);
  scale(0.84 + drop.opacity * 0.16);
  if (drop.kind === "cross") drawCross(drop.size);
  if (drop.kind === "snowflake") drawSnowCrystal(drop.size);
  pop();
}


function drawCross(size) {
  stroke(PAPER);
  strokeWeight(1.5);
  strokeCap(ROUND);
  line(-size, 0, size, 0);
  line(0, -size, 0, size);
  noStroke();
}

function drawSnowCrystal(size) {
  noFill();
  stroke(PAPER);
  strokeWeight(1.1);
  strokeCap(ROUND);
  for (let arm = 0; arm < 6; arm++) {
    push();
    rotate(arm * PI / 3);
    line(0, 0, 0, -size);
    line(0, -size * 0.58, -size * 0.25, -size * 0.78);
    line(0, -size * 0.58, size * 0.25, -size * 0.78);
    pop();
  }
  noStroke();
}


function drawGrain() {
  tint(255, 88);
  image(grainLayer, 0, 0);
  noTint();
}



 function clone(v){return Array.isArray(v)?v.map(clone):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clone(x)])):v;}
 setup();const initializedSeed=seedState(),initial=clone({buildings,drops,snow,nextDropAt,nextSnowAt,nextMeteorAt,previousDropKind});
 if(opt.score!==false){S.env.cityScore=originalScore;S.env.cityAudio={transport:()=>({session:'original-events',time:sceneTime,duration:originalScore.duration})};}
 function reset(){seedState(initializedSeed);buildings=clone(initial.buildings);windows=buildings.flatMap(b=>b.windows);drops=clone(initial.drops).map(d=>({...d,target:windows.find(w=>w.x===d.target.x&&w.y===d.target.y)}));snow=clone(initial.snow);sceneTime=0;animationRemainder=0;nextDropAt=initial.nextDropAt;nextSnowAt=initial.nextSnowAt;nextMeteorAt=initial.nextMeteorAt;shootingStar=null;previousDropKind=initial.previousDropKind;musicTransport=null;musicDropEvents.clear();}
 function seek(t){const frame=Math.floor(t*60+1e-7);if(frame<Math.round(sceneTime*60))reset();while(Math.round(sceneTime*60)<frame)advanceAnimation(1/60);syncMusicDrops();if(musicTransport){updateFallingDrops(0,true);updateWindows();}}
 return {prepare(t){seek(t);},draw(t,mode,part){
  if(mode==='full'){const show=id=>part==='art'||part===id;if(show('sky')){drawSky();drawShootingStars();drawFog();}if(show('back-snow'))drawSnow(false);if(show('city'))drawCity();if(show('arrival'))drawFallingDrops();if(show('front-snow')){drawSnow(true);drawGrain();}return;}
  // 楼影插画保留原夜景美术：蓝色天空和云雾垫底，纸纹覆盖楼群与窗灯。
  if(mode==='city'){drawSky();drawFog();drawCity();drawGrain();return;}
  if(mode==='snowfall'){drawSnow(false);drawSnow(true);return;}
  // 窗灯落雪保留原作环境和遮挡关系，避免黑色楼群融进黑底。
  if(mode==='arrival'){drawSky();drawFog();drawSnow(false);drawCity();drawFallingDrops();drawSnow(true);drawGrain();return;}
  if(mode==='meteor'){drawShootingStars();return;}
  push();translate(450,540);stroke(PAPER);strokeWeight(3);if(opt.symbol==='cross')drawCross(70);else drawSnowCrystal(70);pop();
 },inspect:t=>({frame:Math.floor(t*60),drops:drops.map(d=>({x:d.x,y:d.y,age:d.fallAge})),lights:windows.map(w=>[w.x,w.y,w.light,w.flash,w.reserved,w.illumination])})};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("snow-arrival-window",{"family": "snow", "mode": "arrival", "start": 0, "width": 900, "height": 1080});
WiseSceneRuntime.register("shenzhen-skyline-illustration",{"family": "snow", "mode": "city", "start": 0, "width": 900, "height": 1080});
WiseSceneRuntime.register("snow-crystal-illustration",{"family": "snow", "mode": "symbol", "start": 0, "width": 900, "height": 1080, "symbol": "snowflake", "variants": {"snowflake": {"family": "snow", "mode": "symbol", "start": 0, "width": 900, "height": 1080, "symbol": "snowflake"}, "cross": {"family": "snow", "mode": "symbol", "start": 0, "width": 900, "height": 1080, "symbol": "cross"}}});
WiseSceneRuntime.register("shenzhen-snow-journey",{"family": "snow", "mode": "full", "start": 0, "width": 900, "height": 1080, "breakdown": [{"id": "sky", "name": "纸色天空、流星与云雾", "start": 0, "end": 25000, "time": "0—25秒", "detail": "纸色底上缓慢漂移的云雾与流星共同构成远景。", "actions": []}, {"id": "back-snow", "name": "远景雪幕", "start": 0, "end": 25000, "time": "0—25秒", "detail": "较细雪点在楼群后方下落，保持固定噪声与分层距离。", "actions": ["snow-crystal-illustration"]}, {"id": "city", "name": "深圳湾楼群与窗灯", "start": 0, "end": 25000, "time": "0—25秒", "detail": "建筑折线、窗格与遮挡保持，雪光抵达后窗灯亮度接续。", "actions": ["shenzhen-skyline-illustration", "snow-arrival-window"]}, {"id": "arrival", "name": "落向楼窗的雪光", "start": 0, "end": 25000, "time": "0—25秒", "detail": "雪晶和十字光点按节拍事件选择楼窗，沿实际路线抵达。", "actions": ["snow-arrival-window", "snow-crystal-illustration"]}, {"id": "front-snow", "name": "前景雪幕与纸纹", "start": 0, "end": 25000, "time": "0—25秒", "detail": "较大的雪点位于楼群前方，纸纹覆盖在最前层。", "actions": ["snow-crystal-illustration"]}], "layers": ["sky", "back-snow", "city", "arrival", "front-snow"]});
