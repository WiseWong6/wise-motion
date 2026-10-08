/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.letter=function(S,opt,def){

const sceneTheme=opt.theme==='blue'?'blue':'ink',sceneBackground=sceneTheme==='blue'?'#164df2':'#080a0e';
const originalStage=document.createElement('div');originalStage.className='scene-letter-inner';originalStage.dataset.theme=sceneTheme;
originalStage.style.cssText='position:absolute;width:660px;height:880px;container-type:inline-size;font-family:霞鹜文楷,serif;color:#f9f3fb;--white:#f9f3fb;box-sizing:border-box;background:transparent;left:50%;top:50%;transform-origin:center';
// Fit in the logical stage; its parent already applies preview/thumbnail scale.
const rect=rootSize();function rootSize(){return {width:S.root.clientWidth||640,height:S.root.clientHeight||360};}
originalStage.style.transform=`translate(-50%,-50%) scale(${Math.min(rect.width/660,rect.height/880)})`;
originalStage.innerHTML="<style>@font-face{font-family:'\u971e\u9e5c\u6587\u6977';src:url('fonts/LXGWWenKai-Regular.woff2') format('woff2')}@font-face{font-family:'Ma Shan Zheng';src:url('assets/scene-sources/letter/fonts/MaShanZheng-Regular.ttf')}.scene-letter-inner *{box-sizing:border-box}.scene-letter-inner .composer{position:absolute;z-index:3;left:50%;top:70%;transform:translate(-50%,-50%);width:72%}\n.scene-letter-inner[data-font=\"brush\"] .composer{font-family:'Ma Shan Zheng','\u971e\u9e5c\u6587\u6977',serif}\n.scene-letter-inner .field{position:relative;border:.65px solid #ffffff60;border-top-color:#ffffff9c;border-bottom-color:#ffffff38;background:linear-gradient(145deg,#ffffff29 0%,#ffffff0d 54%,#ffffff17 100%);-webkit-backdrop-filter:blur(10px) saturate(135%);backdrop-filter:blur(10px) saturate(135%);box-shadow:inset 0 1px 0 #ffffff29,inset 0 -1px 0 #ffffff0d,0 5px 18px #08258c20;border-radius:999px;height:8cqw;min-height:38px;display:flex;align-items:center;padding:0 2.7cqw;transition:border-color .3s}\n.scene-letter-inner .field:focus-within{border-color:#ffffffa3}\n.scene-letter-inner .field::before,.scene-letter-inner .field::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:var(--source-light,0)}\n.scene-letter-inner .field::before{background:linear-gradient(180deg,#f5faff14,#ffffff03 48%,transparent)}\n.scene-letter-inner .field::after{inset:0 auto auto 4%;width:92%;height:1px;background:linear-gradient(90deg,transparent,#f5faffbd 12%,#f5faffbd 88%,transparent);box-shadow:0 -1px 7px #e8f4ff1c}\n.scene-letter-inner .words{position:relative;z-index:1;display:flex;align-items:center;white-space:pre;overflow:hidden;width:calc(100% - 5.2cqw);height:100%;font-size:clamp(12px,2.7cqw,20px);line-height:1.35;letter-spacing:.025em;font-weight:400}\n.scene-letter-inner .words span{display:inline-block;flex-shrink:0}\n.scene-letter-inner #input{position:absolute;z-index:2;left:2.7cqw;top:0;width:calc(100% - 10.6cqw);height:100%;border:0;outline:0;background:transparent;color:transparent;caret-color:transparent;font:inherit;opacity:0}\n.scene-letter-inner button{font:inherit;color:inherit;cursor:pointer}\n.scene-letter-inner #send{position:absolute;z-index:2;right:1.1cqw;top:50%;transform:translateY(-50%);width:4.5cqw;height:4.5cqw;min-width:24px;min-height:24px;border:0;border-radius:50%;background:transparent;display:grid;place-items:center;padding:0;transition:background .25s}\n.scene-letter-inner #send:hover{background:#ffffff12}\n.scene-letter-inner #send:active{background:#ffffff26}\n.scene-letter-inner #send:disabled{cursor:default}\n.scene-letter-inner #send svg{grid-area:1/1;width:2.5cqw;height:2.5cqw;min-width:14px;min-height:14px;transform-origin:center;pointer-events:none}\n.scene-letter-inner #send .send-progress{opacity:0;transform:scale(.9);width:2.9cqw;height:2.9cqw;min-width:18px;min-height:18px}\n.scene-letter-inner[data-theme=\"ink\"]{background:#080a0e}\n.scene-letter-inner[data-theme=\"ink\"] .field{background:linear-gradient(145deg,#ffffff16,#ffffff05 54%,#ffffff0b);border-color:#ffffff40;border-top-color:#ffffff72;box-shadow:inset 0 1px 0 #ffffff1c,0 5px 18px #0003}\n</style><section class=\"composer\" aria-label=\"\u661f\u6708\u8f93\u5165\u6846\">\n<div class=\"field\">\n<div class=\"words\" aria-hidden=\"true\"></div>\n<input id=\"input\" aria-label=\"\u5199\u4e0b\u4e00\u53e5\u8bdd\uff0c\u56de\u8f66\u53d1\u9001\" maxlength=\"28\" autocomplete=\"off\">\n<button id=\"send\" data-state=\"idle\" aria-label=\"\u53d1\u9001\uff0c\u8ba9\u6587\u5b57\u5316\u6210\u661f\u6708\" aria-busy=\"false\">\n<svg class=\"send-arrow\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><path d=\"M12 19V5m-6 6 6-6 6 6\" stroke=\"currentColor\" stroke-width=\"1.15\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n<svg class=\"send-progress\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"10.2\" stroke=\"currentColor\" stroke-opacity=\".18\" stroke-width=\"1.1\"/><circle class=\"send-spinner\" cx=\"12\" cy=\"12\" r=\"10.2\" stroke=\"currentColor\" stroke-width=\"1.1\" stroke-dasharray=\"18 46.1\" stroke-linecap=\"round\"/><rect x=\"8.6\" y=\"8.6\" width=\"6.8\" height=\"6.8\" rx=\"1\" fill=\"currentColor\"/></svg>\n</button>\n</div>\n</section>\n";originalStage.innerHTML=originalStage.innerHTML.replace(/url\('([^']+)'\)/g,(_m,path)=>"url('"+global.WiseSceneRuntime.assetURL(path)+"')");originalStage.dataset.layer='composer';S.root.append(originalStage);

 with(S.env){
// 从 galaxy-sky.webp 读取的亮星位置与颜色，不是星座目录。
const GALAXY_STARS = [[0.491713,0.039365,250,255,255,0.9476,0.0275],[0.662063,0.595994,255,255,255,0.9465,0.0314],[0.123389,0.482044,255,255,255,0.9465,0.0431],[0.969613,0.142956,255,255,255,0.9414,0.0392],[0.64733,0.125,250,252,255,0.9398,0.0471],[0.94291,0.073204,255,255,255,0.9388,0.0275],[0.641805,0.071133,255,255,255,0.9363,0.0275],[0.433702,0.55732,255,255,255,0.9363,0.0431],[0.828729,0.042818,250,251,255,0.9345,0.0196],[0.676796,0.07942,254,255,255,0.9337,0.0275],[0.248619,0.564917,255,255,255,0.9337,0.0235],[0.673112,0.305249,253,254,255,0.9324,0.098],[0.813996,0.553177,251,255,255,0.9273,0.0745],[0.446593,0.060083,255,244,252,0.9241,0.0392],[0.256906,0.595994,253,254,255,0.9241,0.0196],[0.953959,0.053867,240,248,255,0.9214,0.0275],[0.953959,0.11395,253,255,255,0.912,0.0314],[0.534991,0.132597,250,255,255,0.9116,0.0706],[0.56814,0.077348,237,255,255,0.909,0.0353],[0.332413,0.594613,255,255,255,0.9082,0.0235],[0.883057,0.566989,238,255,255,0.9065,0.0667],[0.937385,0.243785,255,255,255,0.9055,0.0627],[0.717311,0.124309,240,247,255,0.8994,0.0353],[0.56814,0.597376,239,243,255,0.8992,0.0314],[0.106814,0.461326,246,245,255,0.8982,0.0471],[0.214549,0.434392,250,255,255,0.8967,0.1255],[0.417127,0.053177,236,240,255,0.8953,0.0471],[0.567219,0.180249,255,255,255,0.8929,0.1255],[0.628913,0.566989,244,244,255,0.8914,0.051],[0.42081,0.101519,255,255,255,0.8904,0.0706],[0.285451,0.561464,241,248,255,0.8898,0.0314],[0.80663,0.131215,237,251,255,0.8896,0.0353],[0.313076,0.040746,243,255,255,0.8875,0.0824],[0.268877,0.049724,251,255,255,0.8865,0.1137],[0.043278,0.150552,255,255,255,0.8827,0.2235],[0.152855,0.455801,246,248,255,0.8806,0.0588],[0.778085,0.522099,254,255,255,0.8802,0.1333],[0.325046,0.058702,236,244,255,0.8739,0.098],[0.870166,0.208564,251,255,255,0.8737,0.0588],[0.056169,0.341851,255,255,253,0.8735,0.149],[0.168508,0.384669,255,255,255,0.8725,0.1882],[0.22744,0.531768,253,253,255,0.8716,0.0314],[0.520258,0.163674,238,252,255,0.868,0.1176],[0.836096,0.098066,251,252,255,0.868,0.0275],[0.438306,0.597376,230,239,255,0.8645,0.0235],[0.689687,0.514503,245,254,255,0.8641,0.1176],[0.028545,0.411602,231,247,255,0.861,0.0549],[0.151013,0.05732,248,255,255,0.8596,0.1333],[0.700737,0.11326,231,243,255,0.8586,0.0353],[0.714549,0.154696,242,255,255,0.8569,0.0471],[0.64733,0.30663,242,252,255,0.8567,0.098],[0.228361,0.463398,255,255,255,0.8547,0.0863],[0.048803,0.492403,246,248,255,0.8537,0.0235],[0.056169,0.439917,229,237,255,0.8535,0.0471],[0.774401,0.339088,235,254,255,0.8476,0.1647],[0.343462,0.513122,245,248,255,0.8475,0.0627],[0.880295,0.282459,254,255,255,0.8471,0.1255],[0.559853,0.577348,233,244,255,0.8447,0.0392],[0.678637,0.558011,225,242,255,0.8441,0.0627],[0.504604,0.542127,247,251,255,0.8427,0.0588],[0.674954,0.125,214,233,255,0.8408,0.0431],[0.837937,0.243785,222,247,255,0.8392,0.0824],[0.358195,0.574586,230,233,255,0.839,0.0275],[0.882136,0.244475,221,241,255,0.8388,0.0745],[0.760589,0.371547,250,253,255,0.8386,0.1333],[0.686004,0.20442,237,240,255,0.8376,0.0824],[0.606814,0.531768,235,247,255,0.8376,0.0824],[0.569061,0.205801,234,247,255,0.8371,0.1569],[0.76151,0.086326,255,255,255,0.8369,0.0353],[0.878453,0.081492,220,230,255,0.8357,0.0275],[0.561694,0.100138,248,252,255,0.8357,0.0431],[0.60221,0.149171,216,235,255,0.8345,0.0745],[0.047882,0.453729,255,252,251,0.8343,0.0392],[0.233886,0.482044,235,245,255,0.8341,0.0667],[0.074586,0.558011,242,241,255,0.8324,0.0196],[0.654696,0.56768,255,255,255,0.8318,0.0549],[0.314917,0.562845,255,255,255,0.8318,0.0353],[0.210866,0.483425,232,244,255,0.8302,0.0549],[0.814917,0.294199,239,253,255,0.8286,0.1725],[0.549724,0.531077,226,245,255,0.8261,0.0784],[0.875691,0.13674,222,235,255,0.8245,0.0314],[0.805709,0.277624,235,243,255,0.8239,0.149],[0.209024,0.505525,246,246,255,0.8233,0.0392],[0.646409,0.54558,240,246,255,0.8225,0.0745],[0.276243,0.494475,245,248,255,0.8214,0.0667],[0.921731,0.16989,205,226,255,0.821,0.0431],[0.10221,0.040746,234,255,255,0.821,0.1412],[0.286372,0.471685,229,238,255,0.8206,0.102],[0.80663,0.520718,250,250,255,0.8198,0.1412],[0.346225,0.071133,228,238,255,0.8194,0.0941],[0.139963,0.498619,224,237,255,0.818,0.0431],[0.395028,0.51174,219,250,255,0.8176,0.0784],[0.540516,0.03453,244,242,255,0.8171,0.0235],[0.82965,0.571133,205,228,255,0.8145,0.0549],[0.895948,0.475138,255,255,255,0.8139,0.149],[0.500921,0.087707,200,236,255,0.8137,0.0431],[0.793738,0.144337,224,238,255,0.8127,0.0353],[0.475138,0.160912,231,244,255,0.8125,0.1412],[0.255985,0.080801,245,255,255,0.8124,0.1843],[0.101289,0.440608,255,255,255,0.8114,0.0627],[0.546041,0.145718,233,243,255,0.8108,0.0784],[0.906077,0.310083,215,251,255,0.81,0.1647],[0.641805,0.245856,239,247,255,0.8086,0.149],[0.909761,0.595304,210,228,255,0.8065,0.0431],[0.759669,0.144337,203,227,255,0.8057,0.0353],[0.637201,0.108425,255,252,244,0.8047,0.0431],[0.11418,0.598757,236,240,255,0.8035,0.0157],[0.03407,0.316989,255,240,222,0.8033,0.1608],[0.658379,0.160221,246,253,255,0.8029,0.0549],[0.671271,0.044199,235,240,255,0.801,0.0196],[0.600368,0.039365,233,236,255,0.7984,0.0235],[0.565378,0.246547,242,252,255,0.798,0.2353],[0.120626,0.075276,229,255,255,0.7978,0.1804],[0.690608,0.250691,255,254,253,0.7973,0.1137],[0.282689,0.074586,224,248,255,0.7961,0.1569],[0.202578,0.593923,223,231,255,0.7935,0.0196],[0.655617,0.225138,227,244,255,0.7933,0.1216],[0.521179,0.524171,226,238,255,0.7914,0.0863],[0.462247,0.150552,241,245,255,0.7912,0.1255],[0.953039,0.597376,255,255,255,0.791,0.051],[0.032228,0.54489,229,236,255,0.7898,0.0196],[0.058932,0.359807,234,239,255,0.7892,0.1216],[0.628913,0.378453,255,255,255,0.7884,0.2431],[0.567219,0.486188,239,250,255,0.7859,0.1882],[0.341621,0.539365,223,240,255,0.7845,0.0431],[0.903315,0.187845,255,255,255,0.7833,0.0549],[0.382136,0.040055,255,255,254,0.7833,0.0627],[0.093002,0.126381,255,255,255,0.7833,0.2392],[0.149171,0.341851,251,253,255,0.7806,0.3098],[0.531308,0.503453,214,231,255,0.7804,0.1294],[0.251381,0.525552,235,241,255,0.7788,0.0392],[0.090239,0.222376,254,255,255,0.7782,0.4157],[0.154696,0.429558,255,252,253,0.7775,0.0863],[0.903315,0.210635,212,233,255,0.7765,0.0588],[0.839779,0.403315,210,240,255,0.7761,0.149],[0.882136,0.456492,231,241,255,0.7755,0.149],[0.538674,0.398481,253,254,255,0.7753,0.2588],[0.278085,0.098066,239,255,255,0.7739,0.2078],[0.71639,0.290746,218,241,255,0.7725,0.1333],[0.596685,0.562155,218,232,255,0.7718,0.051],[0.736648,0.259669,219,239,255,0.7716,0.1216],[0.850829,0.166436,219,236,255,0.7714,0.0392],[0.759669,0.208564,237,241,255,0.7702,0.0706],[0.593923,0.109807,246,250,255,0.7702,0.0431],[0.543278,0.218923,240,255,255,0.7702,0.2078],[0.808471,0.256906,205,233,255,0.77,0.1098],[0.706262,0.527624,240,246,255,0.7692,0.0941],[0.585635,0.319751,229,238,255,0.7688,0.1647],[0.850829,0.131906,216,221,255,0.7686,0.0314],[0.787293,0.277624,235,249,255,0.7682,0.1569],[0.955801,0.417127,221,234,255,0.7676,0.1569],[0.51105,0.130525,210,225,255,0.7653,0.0745],[0.058011,0.312155,240,249,255,0.7633,0.1922],[0.55709,0.51174,213,230,255,0.7629,0.1176],[0.395028,0.474448,234,245,255,0.7618,0.1529],[0.639963,0.180939,232,237,255,0.7614,0.0824],[0.360037,0.441989,244,255,255,0.7588,0.251],[0.101289,0.15953,217,228,255,0.7576,0.2392],[0.779006,0.236878,214,232,255,0.7565,0.0941],[0.864641,0.412983,203,232,255,0.7563,0.1373],[0.269797,0.525552,227,239,255,0.7555,0.0431],[0.957643,0.523481,217,239,255,0.7553,0.0941],[0.965009,0.343923,217,245,255,0.7549,0.1961],[0.735727,0.142956,232,240,255,0.7543,0.0392],[0.876611,0.226519,234,246,255,0.7533,0.0627],[0.160221,0.092541,240,244,255,0.7533,0.1765],[0.947514,0.43163,224,234,255,0.7527,0.1176],[0.947514,0.133287,222,230,255,0.7525,0.0353],[0.529466,0.554558,221,229,255,0.7516,0.051],[0.669429,0.236188,235,238,255,0.7502,0.1216],[0.219153,0.390193,255,241,221,0.7484,0.2784],[0.123389,0.507597,255,255,252,0.7451,0.0431],[0.3407,0.116713,216,233,255,0.7447,0.1608],[0.183241,0.123619,216,228,255,0.7441,0.1882],[0.440147,0.095994,251,251,255,0.7425,0.0588],[0.899632,0.276934,230,247,255,0.7418,0.1098],[0.679558,0.373619,235,249,255,0.7416,0.2392],[0.778085,0.197514,233,245,255,0.7386,0.0549],[0.762431,0.311464,208,228,255,0.7378,0.1765],[0.887661,0.038674,232,238,255,0.7373,0.0235],[0.868324,0.055939,215,222,255,0.7369,0.0196],[0.027624,0.372238,237,248,255,0.7365,0.0863],[0.967772,0.20511,205,225,255,0.7359,0.0471],[0.582873,0.064917,236,242,255,0.7359,0.0275],[0.61418,0.29558,243,243,255,0.7357,0.1451],[0.6593,0.280387,229,244,255,0.7355,0.1098],[0.481584,0.178177,217,236,255,0.7343,0.1765],[0.947514,0.187155,219,233,255,0.7333,0.0431],[0.059853,0.399171,255,252,255,0.7324,0.0706],[0.435543,0.528315,219,232,255,0.7308,0.0627],[0.673112,0.40884,238,244,255,0.7306,0.2431],[0.71547,0.338398,230,243,255,0.7302,0.1451],[0.567219,0.287983,234,247,255,0.73,0.2353],[0.541436,0.476519,219,244,255,0.728,0.2118],[0.609576,0.354972,217,234,255,0.7275,0.2],[0.728361,0.530387,212,229,255,0.7261,0.0941],[0.073665,0.335635,212,234,255,0.7261,0.1804],[0.861878,0.382597,210,230,255,0.7257,0.2118],[0.447514,0.435083,255,255,255,0.7247,0.3098],[0.163904,0.566989,237,239,255,0.7239,0.0196],[0.459484,0.493785,210,230,255,0.7239,0.1176],[0.927256,0.435083,223,233,255,0.7233,0.1098],[0.511971,0.565608,226,237,255,0.7227,0.0431],[0.266114,0.122238,251,253,255,0.7216,0.2353],[0.878453,0.583564,209,222,255,0.7202,0.051],[0.30663,0.428177,255,255,254,0.7196,0.2784],[0.476059,0.19268,226,237,255,0.7194,0.2196],[0.748619,0.493785,207,231,255,0.7178,0.2078],[0.494475,0.112569,216,233,255,0.7165,0.0627],[0.030387,0.064917,250,255,255,0.7157,0.2392],[0.383057,0.45442,236,242,255,0.7151,0.2157],[0.293738,0.45511,206,230,255,0.7151,0.149],[0.481584,0.221685,255,250,248,0.7147,0.3216],[0.460405,0.116713,255,251,247,0.7141,0.0745],[0.71639,0.220304,226,240,255,0.7133,0.0941],[0.391344,0.059392,232,240,255,0.7127,0.0627],[0.516575,0.251381,223,238,255,0.7124,0.3255],[0.598527,0.180249,255,255,255,0.712,0.1176],[0.119705,0.399862,228,244,255,0.712,0.102],[0.11326,0.349448,205,230,255,0.7114,0.2118],[0.556169,0.549033,230,236,255,0.7112,0.0588],[0.404236,0.127072,210,237,255,0.711,0.1176],[0.400552,0.210635,238,243,255,0.711,0.2431],[0.461326,0.100138,209,217,255,0.7102,0.0588],[0.63628,0.149171,228,238,255,0.71,0.0588],[0.106814,0.369475,232,242,255,0.7086,0.149],[0.070902,0.581492,240,243,255,0.708,0.0157],[0.918969,0.13674,212,227,255,0.7071,0.0353],[0.514733,0.147099,232,241,255,0.7067,0.0941],[0.063536,0.15884,238,239,255,0.7055,0.251],[0.81768,0.450967,223,237,255,0.7053,0.2235],[0.42081,0.439227,220,243,255,0.7051,0.2902],[0.372007,0.502072,226,234,255,0.7049,0.0863],[0.027624,0.241022,247,255,255,0.7039,0.3765],[0.510129,0.486188,255,241,236,0.7025,0.1647],[0.89779,0.357044,231,250,255,0.7008,0.2549],[0.094843,0.542818,246,246,255,0.7004,0.0235],[0.823204,0.210635,222,239,255,0.6992,0.0549],[0.043278,0.471685,226,234,255,0.699,0.0314],[0.373849,0.194751,242,250,255,0.6982,0.2157],[0.119705,0.43232,245,246,255,0.6982,0.0745],[0.872928,0.323895,216,236,255,0.6978,0.1961],[0.709945,0.356354,242,247,255,0.6978,0.1647],[0.134438,0.388812,255,243,222,0.6978,0.1333],[0.378453,0.54558,248,250,255,0.6967,0.0431],[0.054328,0.084945,226,244,255,0.6965,0.2863],[0.767035,0.107044,231,242,255,0.6965,0.0353],[0.805709,0.343923,217,237,255,0.6951,0.2078],[0.3407,0.472376,224,236,255,0.6941,0.1333],[0.790976,0.482735,255,244,245,0.6927,0.2588],[0.834254,0.31768,203,227,255,0.6918,0.2078],[0.074586,0.127072,235,240,255,0.69,0.2353],[0.860037,0.082182,222,234,255,0.6898,0.0275],[0.089319,0.381215,197,222,255,0.6892,0.1098],[0.405157,0.372238,255,255,255,0.689,0.4353],[0.836096,0.275552,219,240,255,0.6888,0.1294],[0.19337,0.111878,241,246,255,0.6882,0.1765],[0.396869,0.247238,232,243,255,0.6875,0.2549],[0.913444,0.54558,207,236,255,0.6873,0.102],[0.696133,0.39779,208,236,255,0.6865,0.2667],[0.160221,0.210635,251,252,255,0.6849,0.3451],[0.395948,0.102901,208,227,255,0.6845,0.0863],[0.813076,0.399171,210,225,255,0.6841,0.149],[0.3186,0.265193,231,239,255,0.6829,0.2588],[0.841621,0.342541,222,242,255,0.6816,0.2588],[0.262431,0.476519,247,249,255,0.6816,0.0824],[0.785451,0.40953,227,232,255,0.6814,0.1569],[0.360958,0.461326,228,238,255,0.6806,0.1804],[0.703499,0.484807,226,245,255,0.6804,0.2],[0.437385,0.457182,232,239,255,0.6786,0.2275],[0.590239,0.337707,193,221,255,0.6784,0.1765],[0.854512,0.303867,220,239,255,0.6776,0.1686],[0.748619,0.35221,194,224,255,0.6773,0.1451],[0.642726,0.357044,221,244,255,0.6769,0.2],[0.796501,0.377762,222,235,255,0.6767,0.1569],[0.8407,0.539365,214,228,255,0.6765,0.098],[0.118785,0.116713,225,238,255,0.6765,0.2431],[0.672192,0.493785,210,228,255,0.6763,0.1765],[0.531308,0.187155,220,235,255,0.6761,0.1569],[0.576427,0.51105,188,218,255,0.6759,0.1216],[0.480663,0.448204,215,233,255,0.6757,0.2627],[0.085635,0.167818,246,242,255,0.6753,0.2706],[0.479742,0.406077,238,247,255,0.6749,0.3216],[0.436464,0.138122,185,215,255,0.6749,0.1176],[0.48895,0.382597,238,243,255,0.6745,0.2824],[0.864641,0.107735,216,227,255,0.6741,0.0275],[0.655617,0.188536,222,237,255,0.6739,0.0784],[0.395028,0.085635,240,237,255,0.6735,0.0706],[0.720994,0.55663,212,229,255,0.6733,0.0588],[0.592081,0.088398,228,241,255,0.6729,0.0353],[0.516575,0.266575,236,247,255,0.6727,0.3373],[0.745856,0.220994,224,235,255,0.6722,0.0863],[0.624309,0.321133,224,234,255,0.6718,0.1294],[0.909761,0.332873,192,227,255,0.6716,0.2118],[0.632597,0.267265,224,237,255,0.6714,0.1529],[0.573665,0.558011,203,223,255,0.6708,0.051],[0.62523,0.492403,195,224,255,0.6706,0.1725],[0.585635,0.276934,211,244,255,0.6692,0.2353],[0.788214,0.052486,227,239,255,0.6688,0.0235],[0.371087,0.145718,208,227,255,0.6684,0.1608],[0.179558,0.239641,246,247,255,0.6682,0.4627],[0.694291,0.220994,243,249,255,0.6675,0.098],[0.372928,0.319751,215,228,255,0.6675,0.3255],[0.100368,0.089088,202,222,255,0.6675,0.2275],[0.565378,0.383978,223,235,255,0.6673,0.2078],[0.93186,0.588398,201,221,255,0.6665,0.0549],[0.762431,0.291436,205,228,255,0.6651,0.1647],[0.856354,0.227901,210,227,255,0.6641,0.0667],[0.657459,0.480663,218,238,255,0.6637,0.2196],[0.224678,0.372928,240,246,255,0.6635,0.3882],[0.655617,0.095994,224,230,255,0.6624,0.0353],[0.101289,0.526243,220,233,255,0.6612,0.0314],[0.421731,0.160221,211,235,255,0.661,0.1725],[0.14733,0.549033,219,224,255,0.661,0.0235],[0.947514,0.559392,220,239,255,0.6606,0.0784],[0.478821,0.543508,222,232,255,0.6604,0.0549],[0.927256,0.371547,211,242,255,0.6575,0.2706],[0.464088,0.336326,215,225,255,0.6573,0.2],[0.548803,0.446133,226,239,255,0.6567,0.2863],[0.609576,0.515193,221,240,255,0.6561,0.1137]];
// 横向位置、星带中轴高度、上侧宽度、下侧宽度，均按画幅归一化。
const GALAXY_RIDGE = [[0.0,0.202434,0.083583,0.068333],[0.03125,0.207225,0.086045,0.070967],[0.0625,0.216413,0.089044,0.074332],[0.09375,0.230064,0.090548,0.076141],[0.125,0.245931,0.088515,0.074868],[0.15625,0.261476,0.08414,0.072075],[0.1875,0.274863,0.082304,0.070766],[0.21875,0.285277,0.087265,0.072825],[0.25,0.293994,0.09791,0.077319],[0.28125,0.303743,0.108976,0.081088],[0.3125,0.315241,0.116136,0.082431],[0.34375,0.325269,0.118426,0.083488],[0.375,0.329921,0.117107,0.087429],[0.40625,0.328859,0.113425,0.094678],[0.4375,0.325427,0.108684,0.103129],[0.46875,0.324377,0.105672,0.110096],[0.5,0.329342,0.107049,0.113278],[0.53125,0.34049,0.11228,0.111448],[0.5625,0.355032,0.118046,0.105134],[0.59375,0.370086,0.120849,0.096526],[0.625,0.383745,0.118174,0.088237],[0.65625,0.394717,0.110499,0.081636],[0.6875,0.402698,0.103241,0.076786],[0.71875,0.407983,0.101537,0.074149],[0.75,0.40994,0.103347,0.075274],[0.78125,0.407325,0.102502,0.081067],[0.8125,0.400925,0.096477,0.089642],[0.84375,0.394111,0.088021,0.096982],[0.875,0.389515,0.080462,0.099882],[0.90625,0.387026,0.074447,0.096985],[0.9375,0.385867,0.069546,0.08874],[0.96875,0.385953,0.065997,0.078754],[1.0,0.386837,0.063944,0.071216]];

'use strict';
const stage=originalStage;
const canvas=S.canvas(660,880),ctx=canvas.getContext('2d');
const galaxyCanvas=S.canvas(660,880),galaxyCtx=galaxyCanvas.getContext('2d');
const illuminationCanvas=S.canvas(660,880),illuminationCtx=illuminationCanvas.getContext('2d');
let galaxyImage;const galaxyReady=S.image("assets/scene-sources/letter/galaxy-sky.webp").then(i=>{galaxyImage=i;});
let galaxyFrameTime=-1,galaxyFrameCycle=null,galaxyRevealMask=null,galaxyMaskPixels=null;
const words = originalStage.querySelector('.words'), input = originalStage.querySelector('#input');
const send = originalStage.querySelector('#send'), field = originalStage.querySelector('.field');
const sendArrow=send.querySelector('.send-arrow'),sendProgress=send.querySelector('.send-progress'),sendSpinner=send.querySelector('.send-spinner');
const composer = originalStage.querySelector('.composer');
const sound={setEvents(){}};const StarLetterMusic={sustainDuration:80,createScore:()=>[]};
const reduce=false;
const W = 660, H = 880;
const BURST_COUNT = 126;
const SKY_LOOP = 9;
const FLIGHT_RATE = 1.44;
const TYPE_INTERVAL = .175;
const TRAIL_FADE = 2.4;
const TRANSFORM_RATE = 1.2;
const WATER_LEAD = 1.35 / TRANSFORM_RATE;
const WATER_SPEED = 91 * TRANSFORM_RATE;
const MATERIALS = {
  white: {color:'#ffffff',light:'#ffffff',trail:'#ffffff'},
  silver: {color:'#f1f4f8',light:'#ffffff',trail:'#f1f4f8'},
  gold: {color:'#ffe39a',light:'#fff9e6',trail:'#ffe39a'}
};
let particles = [], text = '', busy = false, composing = false, clock = 0;
let theme = sceneTheme, cycle = null, typing = null, editing = false;
const playback = {time:0, duration:30, playing:false, rate:1, stamp:null, ready:false};
const DEFAULT_TEXT = '那些凌晨时分敲下的代码，是不会说谎的星星。';
const controls = {
  toggle:originalStage.querySelector('#play-toggle'), progress:originalStage.querySelector('#play-progress'),
  speed:originalStage.querySelector('#play-speed'), theme:originalStage.querySelector('#play-theme'),
  time:originalStage.querySelector('#play-time'), sound:originalStage.querySelector('#play-sound'),
  font:originalStage.querySelector('#play-font')
};
let water = null, viewScale = 1;
const random=(a,b)=>S.env.random(a,b);
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = x => {x=clamp(x);return x*x*(3-2*x);};




function setText(value){
  text=value;input.value=value;words.replaceChildren();
  for(const ch of Array.from(value)){const s=document.createElement('span');s.textContent=ch;words.append(s);}
  words.scrollLeft=words.scrollWidth;send.disabled=busy||!value.trim();
  if(editing)updateSendState(clock);
}

// 打字、波纹、飞行和控制条共用同一个可暂停、可回看的时间。
function prepareTyping(value){
  setText(value);
  const spans=[...words.querySelectorAll('span')],fontSize=parseFloat(getComputedStyle(words).fontSize);
  // DOM bounds include both preview transforms; em widths use unscaled font size.
  const scale=W/stage.getBoundingClientRect().width;
  typing={value,chars:Array.from(value),spans,widths:spans.map(s=>s.getBoundingClientRect().width*scale/fontSize),previous:[]};
}

function sendWorkingAt(time){
  return !editing&&Boolean(cycle)&&time>=cycle.sendAt&&time<cycle.transformEnd;
}

function updateSendState(time){
  const working=sendWorkingAt(time);
  send.dataset.state=working?'working':'idle';
  send.setAttribute('aria-busy',String(working));
  send.setAttribute('aria-label',working?'停止变化':'发送，让文字化成星月');
  send.disabled=working?false:busy||!text.trim();
  // 完成后仍保留一小段图标交接：圆环减速收住，箭头渐显，回看与暂停保持一致。
  const elapsed=cycle?time-cycle.sendAt:0,finish=cycle?time-cycle.transformEnd:0;
  const mix=editing||!cycle?0:reduce?Number(working):smooth(elapsed/.22)*(1-smooth(finish/.64));
  if(!editing){
    const decel=clamp(finish/.64);
    const rotationTime=cycle?Math.max(0,Math.min(time,cycle.transformEnd)-cycle.sendAt)+.64*(decel-decel*decel/2):0;
    sendSpinner.setAttribute('transform',`rotate(${reduce?0:rotationTime*260%360} 12 12)`);
  }
  sendProgress.style.opacity=String(mix);
  sendProgress.style.transform=`scale(${.9+.1*mix})`;
  sendArrow.style.opacity=String(1-mix);
  sendArrow.style.transform=`translateY(${2*mix}px) scale(${1-.12*mix})`;
  send.style.opacity=String(send.disabled ? .4+.6*mix : 1);
}

function drawTyping(time){
  if(!typing||editing)return;
  const progress=cycle.instant?typing.chars.length:Math.max(0,(time-.65)/TYPE_INTERVAL);
  const sent=time>=cycle.sendAt;
  words.style.visibility=sent?'hidden':'visible';
  for(let i=0;i<typing.spans.length;i++){
    const amount=clamp(progress-i);if(typing.previous[i]===amount)continue;
    const span=typing.spans[i];span.style.width=`${typing.widths[i]*amount}em`;
    span.style.opacity=String(clamp(amount*2));span.style.overflow='hidden';typing.previous[i]=amount;
  }
  text=sent?'':typing.chars.slice(0,Math.ceil(progress)).join('');
  if(input.value!==text)input.value=text;
  words.scrollLeft=words.scrollWidth;
  busy=sent&&time<playback.duration;input.disabled=busy;updateSendState(time);
}

// 每侧上下翅是一张固定轮廓，展翅只改变它绕身体转动后的可见宽度。
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

function createParticle(x,y,index,start){
  const kinds=['spark','star','moon','diamond','heart','note','star','butterfly','moon','spark','flower','star',
    'moon','notes','spark','cross','star','heart','moon','butterfly','note','flower','star','spark'];
  const kind=kinds[index%kinds.length],r=['flower','butterfly','heart','note','notes'].includes(kind)?random(8.4,10.5):kind==='moon'?random(7.7,9.8):random(6.3,9.1);
  const outline=kind==='heart'?index%2===0:(['star','moon','diamond','flower'].includes(kind)&&index%3!==0);
  // 快、中、慢三组交错分配，速度、深度与造型相互独立。
  const band=(index*37)%10;
  const speed=(band<3?random(240,312):band<7?random(176,228):random(116,156))*FLIGHT_RATE;
  // 三层分别拉开尺寸、透明度和终点，物品不会挤在同一张平面上。
  const layerSlot=(index*3)%7,layer=layerSlot<2?0:layerSlot<5?1:2;
  const depths=[{scale:[.94,1.04],depth:[.9,1.5],light:1},
    {scale:[.79,.9],depth:[1.7,2.5],light:.88},
    {scale:[.65,.75],depth:[2.8,3.8],light:.7}],depth=depths[layer];
  const endX=random(W*.72,W*1.16),endY=random(-H*.12,H*(.13+layer*.09));
  const p={type:'symbol',x,y,kind,r,outline,path:makeShape(kind,r),
    start,speed,revealDuration:1.4/TRANSFORM_RATE,hasTrail:index%5===0,
    layer,luminosity:depth.light,
    endX:Math.max(x+95,endX),endY,
    gust:random(3,6)*(1-layer*.17),wave:random(1,2),
    depthEnd:random(...depth.depth),nearScale:random(...depth.scale),
    phase:random(0,Math.PI*2),spin:random(-.9,.9),
    material:['white','silver','gold','white','silver','gold','white'][index%7]};
  if(kind==='butterfly')p.wings=[makeButterflyWing(r,-1),makeButterflyWing(r,1)];
  // 按画面中的路径长度分配时间，消除透视投影造成的前快后慢。
  p.flight=buildFlight(p);
  p.duration=p.flight.at(-1).distance/p.speed;
  p.flashAt=p.revealDuration*.5+p.duration*random(.12,.25);p.flashGap=p.duration*random(.23,.37);
  return p;
}

function flightEnd(p){
  if(p.settle)return p.duration;
  const end=p.duration+(p.revealDuration||0)*.5;
  if(!p.kite)return end;
  const {brakeAt,releaseAt,departSpeed}=p.kite;
  return releaseAt+.3+(end-brakeAt-.3)/departSpeed;
}

function chooseKites(burst){
  const pool=burst.slice(),selected=[];
  const count=Math.min(burst.length,Math.floor(random(1,4)));
  for(let i=0;i<count;i++){
    // 全部远近层均可被抽中，不固定造型、颜色或前后位置，也不重复选取。
    selected.push(pool.splice(Math.floor(S.env.random()*pool.length),1)[0]);
  }
  const lastOther=Math.max(0,...pool.map(p=>p.start+flightEnd(p)+(p.hasTrail?TRAIL_FADE:0)));
  for(const p of selected){
    p.duration=Math.max(2.4,p.duration);p.speed=p.flight.at(-1).distance/p.duration;
    const brakeAt=Math.max(p.revealDuration,p.revealDuration*.5+p.duration*random(.4,.64)-.3);
    p.hasTrail=true;p.kite={brakeAt,releaseAt:0,departSpeed:.65,recoil:random(2.8,4.2)*p.nearScale};
  }
  // 等所有普通物品及残留光丝退场，再给被勾住的物品至少 3 秒独立尾声。
  const soloAt=Math.max(lastOther,...selected.map(p=>p.start+p.kite.brakeAt+.6));
  // 同一阵风从左下扫向右上，按被牵住的位置先后触达。
  const held=selected.map(p=>({p,q:position(p,p.kite.brakeAt-.4)}));
  const fronts=held.map(({q})=>q.x-q.y),low=Math.min(...fronts),span=Math.max(1,Math.max(...fronts)-low);
  held.forEach(({p,q})=>{
    const arrival=(q.x-q.y-low)/span;
    p.kite.windAt=soloAt+1.7+arrival*.45-p.start;
    p.kite.releaseAt=p.kite.windAt+1.3+random(0,.12);
    p.kite.windPush=random(11,16)*(.75+.25*p.nearScale);
    p.kite.windSway=random(4,6)*(.8+.2*p.nearScale);
  });
  return selected;
}

function prepareBurst(at){
  water=reduce?null:{start:at};if(water)measureWater();
  const rect=stage.getBoundingClientRect(),scale=W/rect.width,bounds=words.getBoundingClientRect();
  const css=getComputedStyle(words),font=`400 ${parseFloat(css.fontSize)}px ${css.fontFamily}`;
  const left=(bounds.left-rect.left)*scale,right=(bounds.right-rect.left)*scale;
  const centerY=(bounds.y+bounds.height/2-rect.top)*scale;
  const center=water?waterCenter():{x:(left+right)/2,y:centerY};
  const arrival=(x,y)=>at+WATER_LEAD+Math.hypot(x-center.x,y-center.y)/WATER_SPEED;
  cycle.origin={left,right,centerY};
  const spans=[...words.querySelectorAll('span')];
  spans.forEach((s,i)=>{
    const b=s.getBoundingClientRect();
    if(!s.textContent.trim())return;
    const hidden=b.right<=bounds.left||b.left>=bounds.right;
    const x=(Math.max(bounds.left,Math.min(bounds.right,b.x+b.width/2))-rect.left)*scale;
    const y=(b.y+b.height/2-rect.top)*scale;
    // 涟漪中心的文字先模糊，再按距波心的距离向左右散开。
    particles.push({type:'text',sourceIndex:i,hidden,ch:s.textContent,x,y,font,start:reduce?at:arrival(x,y),duration:reduce?.5:2.05/TRANSFORM_RATE});
  });
  let finishAt=at+4.5;
  if(!reduce){
    const burst=[];
    // 物品与文字共用向外扩散的时序，显形后继续沿各自的飞行轨迹离开。
    for(let i=0;i<BURST_COUNT;i++){
      const x=random(left+9,right-9),y=centerY+random(-6,6);
      burst.push(createParticle(x,y,i,arrival(x,y)+random(.12,.38)));
    }
    arrangeStarfield(burst);
    cycle.lightEnd=Math.max(...burst.map(p=>p.start+p.duration))+.8;
    particles.push(...burst);
    finishAt=Math.max(finishAt,...burst.map(p=>p.start+flightEnd(p)+(p.hasTrail?TRAIL_FADE:0)));
  }
  return finishAt;
}

function release(){
  if(busy||!text.trim()||composing||!playback.ready)return;
  const value=text;editing=false;buildCycle(value,true);playback.playing=true;
  playback.stamp=null;paint();updateControls();
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

// 参考动作库“自身轨迹光丝”：回看本体的真实历史位置，不另造飘带。
function motionRibbon(p,age,current){
  if(reduce||!p.hasTrail||age<=.12)return [];
  const depth=Math.sqrt(current.scale),progress=flightAgeAt(p,age);
  // 停留中的物品按已走过的路程取样，避免停留时间挤成折线或松开时整条变形。
  const history=p.kite?progress:age-.12;
  const duration=Math.min(17.28,1872*depth/p.speed,history);
  const gain=smooth((age-.12)/.3),points=[],sway=windSway(p,age);
  const segments=24;
  for(let i=0;i<=segments;i++){
    const lag=duration*i/segments;
    const q=i===0?current:p.kite?position(p,progress-lag):poseAt(p,age-lag);
    // 受风时光丝跟随头部柔和弯动，尾端留在原处；风弱后连续收回。
    const follow=i===0?0:(1-i/segments)**2;
    points.push({x:q.x+sway.x*follow,y:q.y+sway.y*follow,alpha:gain*(1-i/segments)**1.2});
  }
  return points;
}

function trailState(p,age){
  const end=flightEnd(p);
  // 本体到达终点后，保留最后走过的光丝，缓慢淡去，不继续编造路径。
  const sampleAge=Math.min(age,end),current=poseAt(p,sampleAge);
  const fade=1-smooth((age-(end-.6))/(TRAIL_FADE+.6));
  const alpha=smooth(age/p.revealDuration)*p.luminosity*
    (.68+.32*Math.sqrt(current.scale/p.nearScale))*fade;
  return {sampleAge,current,alpha};
}

function drawTrail(p,age,alpha,current){
  const points=motionRibbon(p,age,current);if(points.length<2)return;
  const depth=Math.sqrt(current.scale);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
  ctx.strokeStyle=MATERIALS[p.material].trail;
  // 淡外光与细亮芯均直接描线，无实时模糊；远处随物体一起变细、变淡。
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    for(const [width,gain] of [[2.2,.045],[.7,.46]]){
      ctx.globalAlpha=alpha*b.alpha*gain;ctx.lineWidth=width*depth;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  ctx.restore();
}

function measureWater(){
  const stageRect=stage.getBoundingClientRect(),box=field.getBoundingClientRect(),scale=W/stageRect.width;
  Object.assign(water,{x:(box.left-stageRect.left)*scale,y:(box.top-stageRect.top)*scale,
    width:box.width*scale,height:box.height*scale});
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

let sourceBeamTexture=null;
let sourceBeamBounds=null;
function sourceLight(time){
  if(!water||!cycle||reduce||editing)return {glow:0,beam:0};
  const age=time-water.start,fade=1-smooth((time-cycle.lightEnd+2.4)/2.4);
  return {glow:smooth(age/.24)*fade,beam:smooth((age-.06)/.3)*fade};
}

function drawSourceBeam(light){
  illuminationCtx.clearRect(0,0,W,H);
  if(light.beam<=0)return;
  const sourceLeft=(water.x+water.width*.025)/W*320;
  const sourceRight=(water.x+water.width*.975)/W*320;
  if(!sourceBeamTexture){
    sourceBeamTexture=document.createElement('canvas');sourceBeamTexture.width=320;sourceBeamTexture.height=512;
  }
  if(!sourceBeamBounds||Math.abs(sourceBeamBounds[0]-sourceLeft)>.01||Math.abs(sourceBeamBounds[1]-sourceRight)>.01){
    const g=sourceBeamTexture.getContext('2d'),pixels=g.createImageData(320,512);
    const sourceRow=492;
    for(let row=0;row<512;row++){
      const distance=Math.max(0,(sourceRow-row-.5)/sourceRow);
      // 两条光边分别连接输入框两端与画面两个上角，全程保持直线。
      const left=sourceLeft*(1-distance),right=sourceRight+(320-sourceRight)*distance;
      const ends=smooth((sourceRow-row+2.5)/6);
      for(let col=0;col<320;col++){
        const x=col+.5,dy=row+.5-sourceRow,across=(2*x-left-right)/(right-left);
        const edge=smooth((x-left)/5)*smooth((right-x)/5);
        // 亮度写进颜色后整体轻叠，保留更多渐变层级；薄光面不会盖灰底图。
        const sheet=218*(.96+.04*Math.exp(-across*across*2))/(1+distance*4.5);
        const rim=smooth((x-sourceLeft)/5)*smooth((sourceRight-x)/5);
        const aperture=37*Math.exp(-dy*dy/2)*rim;
        const luminance=Math.min(255,sheet+aperture),index=(row*320+col)*4;
        pixels.data[index]=Math.round(luminance*.96);pixels.data[index+1]=Math.round(luminance*.985);pixels.data[index+2]=Math.round(luminance);
        pixels.data[index+3]=Math.round(255*ends*edge);
      }
    }
    g.putImageData(pixels,0,0);
    sourceBeamBounds=[sourceLeft,sourceRight];
  }
  const x=water.x+water.width/2,y=water.y+water.height*.025;
  illuminationCtx.save();illuminationCtx.globalAlpha=light.beam*.16;
  illuminationCtx.translate(x,y);
  // 整个框面一起向上照亮，只改变亮度，光的边界与长度保持稳定。
  illuminationCtx.drawImage(sourceBeamTexture,-x,-y,W,y*512/492);illuminationCtx.restore();
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

// 落点来自底图真实亮星的像素位置，形状、疏密和色彩由同一张底图保持一致。
function galaxyTargets(){
  const points=GALAXY_STARS.map(([x,y,r,g,b,strength,cloud])=>({x:x*W,y:y*H,color:`rgb(${r},${g},${b})`,strength,cloud}));
  for(let i=points.length-1;i>0;i--){const j=Math.floor(random(0,i+1));[points[i],points[j]]=[points[j],points[i]];}
  return points;
}

function galaxyBand(x){
  const at=clamp(x/W)*(GALAXY_RIDGE.length-1),index=Math.min(GALAXY_RIDGE.length-2,Math.floor(at)),t=at-index;
  const a=GALAXY_RIDGE[index],b=GALAXY_RIDGE[index+1],mix=i=>(a[i]+(b[i]-a[i])*t)*H;
  return {center:mix(1),upper:mix(2),lower:mix(3)};
}

function prepareGalaxyReveal(stars){
  const regions=stars.filter(p=>p.settle.anchor).map(p=>({x:p.endX,y:p.endY,
    born:p.start+p.duration+.55,source:p}));
  // 先让物品一一落在底图星位，留下持续闪烁的星点，再展开整条星带。
  const start=Math.max(...stars.map(p=>p.start+p.duration))+.55;
  const width=Math.ceil(W/3),height=Math.ceil(H/3),onsets=new Float32Array(width*height),rise=2.8;
  let last=0;
  // 中轴来自原图星云的弯曲走向，两侧按各自宽度柔和展开；没有圆斑或横向扫光。
  for(let col=0;col<width;col++){
    const band=galaxyBand((col+.5)/width*W);
    for(let row=0;row<height;row++){
      const across=(row+.5)/height*H-band.center;
      const distance=Math.abs(across)/(across<0?band.upper:band.lower);
      const at=start+3.2*(1-Math.exp(-distance*.9));
      onsets[row*width+col]=at;last=Math.max(last,at);
    }
  }
  return {start,end:last+rise,regions,width,height,onsets,rise};
}

function clearGalaxySky(){
  if(galaxyFrameTime!==0||galaxyFrameCycle!==cycle)galaxyCtx.clearRect(0,0,W,H);
  galaxyFrameTime=0;galaxyFrameCycle=cycle;
}

function drawGalaxySky(){
  const sky=cycle?.sky;
  if(!sky||reduce||editing||!galaxyImage.complete||!galaxyImage.naturalWidth){clearGalaxySky();return;}
  if(clock<=sky.start){clearGalaxySky();return;}
  // 完整亮起后底图保持静止；只有上面的少量星芒继续闪烁。
  const complete=clock>=sky.end,frame=complete?Infinity:clock;
  if(galaxyFrameCycle===cycle&&galaxyFrameTime===frame)return;
  galaxyFrameCycle=cycle;galaxyFrameTime=frame;
  galaxyCtx.clearRect(0,0,W,H);
  galaxyCtx.drawImage(galaxyImage,0,0,W,H);
  if(complete)return;
  if(!galaxyRevealMask){
    galaxyRevealMask=document.createElement('canvas');galaxyRevealMask.width=sky.width;galaxyRevealMask.height=sky.height;
    galaxyMaskPixels=galaxyRevealMask.getContext('2d').createImageData(sky.width,sky.height);
    for(let i=0;i<galaxyMaskPixels.data.length;i+=4)galaxyMaskPixels.data.fill(255,i,i+3);
  }
  const mask=galaxyRevealMask.getContext('2d');
  for(let i=0;i<sky.onsets.length;i++)galaxyMaskPixels.data[i*4+3]=Math.round(255*smooth((clock-sky.onsets[i])/sky.rise));
  mask.putImageData(galaxyMaskPixels,0,0);
  galaxyCtx.save();galaxyCtx.globalCompositeOperation='destination-in';
  galaxyCtx.drawImage(galaxyRevealMask,0,0,W,H);galaxyCtx.restore();
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

function nearestStar(point,stars){
  let source=stars[0],distance=Infinity;
  for(const star of stars){const d=Math.hypot(point.x-star.endX,point.y-star.endY);if(d<distance){distance=d;source=star;}}
  return {source,distance,arrival:source.start+source.duration+.65};
}

function arrangeStarfield(burst){
  const points=galaxyTargets(),anchors=[];
  // 在银河亮部横向选六颗星，背景亮度来自底图采样，避免落点全散在空暗处。
  for(let i=0;i<6;i++){
    const candidates=points.filter(p=>p.x>=W*i/6&&p.x<W*(i+1)/6);
    const target=candidates.sort((a,b)=>b.cloud*(.8+.2*b.strength)-a.cloud*(.8+.2*a.strength))[0];
    if(target)anchors.push(target);
  }
  const maxCloud=Math.max(...points.map(p=>p.cloud));
  const remainder=points.filter(p=>!anchors.includes(p)).map(p=>({point:p,
    priority:-Math.log(Math.max(.0001,random(0,1)))/(.08+8*(p.cloud/maxCloud)**1.8)
  })).sort((a,b)=>a.priority-b.priority).map(p=>p.point);
  const targets=[...anchors,...remainder.slice(0,burst.length-anchors.length)];
  const accents=[],ranked=targets.slice().sort((a,b)=>(b.strength*.45+b.cloud/maxCloud*.55)-(a.strength*.45+a.cloud/maxCloud*.55));
  // 在银河内部选出清楚的主星，其余星芒分散在画幅内。
  const inner=ranked.filter(p=>p.x>W*.26&&p.x<W*.74&&p.y>H*.07&&p.y<H*.56);
  for(const [pool,limit] of [[inner,4],[ranked,6]]){
    for(const target of pool){
      if(accents.length>=limit)break;
      if(accents.every(q=>Math.hypot(q.x-target.x,q.y-target.y)>85))accents.push(target);
    }
  }
  targets.sort((a,b)=>a.x-b.x);
  const ordered=burst.slice().sort((a,b)=>a.x-b.x);
  const firstAnchor=Math.max(...burst.map(p=>p.start))+4.1;
  const arrivalOffsets=anchors.map(()=>random(0,.7));
  ordered.forEach((p,i)=>{
    const target=targets[i],dx=target.x-p.x,dy=target.y-p.y,length=Math.hypot(dx,dy)||1;
    const approach=Math.min(length*.2,random(35,66)),accent=accents.includes(target),anchor=anchors.indexOf(target);
    p.endX=target.x;p.endY=target.y;
    p.settle={accent,anchor:anchor>=0,period:accent?random(3.4,5):random(5.2,7.8),offset:random(0,8.2),scale:anchor>=0?.54:random(.23,.43),color:target.color,
      radius:accent?random(.7,1.05):random(.32,.6),brightness:accent?random(.85,1):random(.55,.8),
      twinkleSize:accent?9:anchor>=0?7.2:4+target.strength*1.5,twinkleGain:accent||anchor>=0?1:.72,
      c1:{x:p.x+dx*.18,y:p.y+dy*.43},c2:{x:target.x-dx*.13,y:target.y+approach}};
    p.duration=anchor>=0?firstAnchor+arrivalOffsets[anchor]-p.start:random(6.8,9.8)/FLIGHT_RATE;
    p.hasTrail=anchor>=0||i%10===0;p.flashAt=p.duration*.46;p.flashGap=p.duration*.38;
    p.flight=buildFlight(p);p.speed=p.flight.at(-1).distance/p.duration;
  });
  cycle.symbols=burst;
  cycle.firstSettle=Math.min(...burst.map(p=>p.start+p.duration+.65));
  cycle.sky=prepareGalaxyReveal(burst);
  cycle.composerExit={start:cycle.firstSettle+.25,end:Math.max(...burst.map(p=>p.start+p.duration))+.8};
  // 底图已有细星，只加少量与底图位置重合的动态亮星。
  const unselected=points.filter(p=>!targets.includes(p));
  cycle.dust=unselected.slice(0,32).map((point,i)=>{
    const trigger=nearestStar(point,burst),depth=i%8===0?0:2;
    return {...point,depth,r:depth===0?random(.6,.85):random(.25,.45),alpha:depth===0?.8:.55,
      phase:random(0,Math.PI*2),source:trigger.source,
      born:trigger.arrival+.2+Math.min(1,trigger.distance/180),rise:1.8,
      rate:Math.PI*2/SKY_LOOP*(i%3===0?2:1),sparkle:null};
  });
  for(const point of cycle.dust){
    if(point.depth!==0||accents.some(q=>Math.hypot(q.x-point.x,q.y-point.y)<85))continue;
    point.sparkle={period:random(7,11),offset:random(0,11),size:random(5.5,7)};
    accents.push(point);
  }
  cycle.settledAt=Math.max(cycle.sky.end,...burst.map(p=>p.start+p.duration+2.5),
    ...cycle.dust.map(p=>p.born+p.rise));
  cycle.loopStart=cycle.settledAt+1;
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
function drawStarfield(){
  drawGalaxySky();
  if(!cycle.symbols||reduce)return;
  const clarity=skySparkleStrength(clock);
  ctx.save();
  for(const p of cycle.dust){
    const appear=smooth((clock-p.born)/p.rise);if(appear<=0)continue;
    const shimmer=p.depth===2?.95+.05*Math.sin(clock*p.rate+p.phase):
      .88+.08*Math.sin(clock*p.rate+p.phase)+.04*Math.sin(clock*p.rate*2+p.phase*2);
    if(p.depth<2)drawStarGlow(p.x,p.y,p.r*(p.depth===0?10:6),appear*p.alpha*shimmer*.52);
    ctx.globalAlpha=appear*p.alpha*shimmer;ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    if(p.sparkle){
      const flash=starTwinkle(clock-p.born,p.sparkle.period,p.sparkle.offset);
      ctx.globalAlpha=appear;glint(p.x,p.y,flash,p.sparkle.size*(1+.4*clarity),'star');
    }
  }
  ctx.restore();
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

function composerOpacity(time){
  if(reduce||editing||!cycle?.composerExit)return 1;
  const {start,end}=cycle.composerExit;
  return 1-smooth((time-start)/(end-start));
}

function paint(){
  clock=playback.time;ctx.clearRect(0,0,W,H);
  if(!cycle)return;
  const opacity=composerOpacity(clock);
  composer.style.opacity=String(opacity);composer.inert=opacity===0;
  composer.style.pointerEvents=opacity===0?'none':'';
  const light=sourceLight(clock);field.style.setProperty('--source-light',light.glow.toFixed(3));
  if(editing)return;
  drawTyping(clock);drawSourceBeam(light);drawStarfield();
  if(clock<cycle.sendAt)return;
  const waves=waterWaves(clock);drawWater(waves);
  for(const p of particles){
    if(p.type==='text'&&!p.hidden&&clock-p.start<p.duration)drawDepartingText(p,clock-p.start,waves);
  }
  // 光丝先整体画在后面，本体再由远及近绘制，避免近处形状被后方线条穿过。
  for(const p of cycle.drawOrder){
    const age=clock-p.start;
    if(age<0||!p.hasTrail||reduce||age>flightEnd(p)+TRAIL_FADE)continue;
    const trail=trailState(p,age);if(trail.alpha>.005)drawTrail(p,trail.sampleAge,trail.alpha,trail.current);
  }
  for(const p of cycle.drawOrder){
    const age=clock-p.start;if(age<0)continue;
    if(p.settle){drawSettlingItem(p,age);continue;}
    if(age>flightEnd(p))continue;
    const q=poseAt(p,age),alpha=smooth(age/p.revealDuration)*q.alpha;
    if(alpha<.005)continue;
    ctx.save();ctx.translate(q.x,q.y);ctx.scale(q.scale,q.scale);drawSymbol(p,age,alpha,q.scale);ctx.restore();
  }
}



function buildCycle(value=DEFAULT_TEXT,instant=false){
  for(const icon of [send,sendArrow,sendProgress])(icon.getAnimations?.()||[]).forEach(animation=>animation.cancel());
  particles=[];busy=false;editing=false;input.disabled=false;words.style.visibility='visible';
  cycle={value,instant,sendAt:instant?.35:.65+Array.from(value).length*TYPE_INTERVAL+1.05};
  setText(value);
  const finish=prepareBurst(cycle.sendAt);
  cycle.transformEnd=Math.max(cycle.sendAt+.6,...particles.map(p=>p.start+(p.type==='text'?p.duration:p.revealDuration)));
  cycle.drawOrder=particles.filter(p=>p.type==='symbol').sort((a,b)=>b.layer-a.layer||a.start-b.start);
  playback.duration=!reduce?cycle.loopStart+StarLetterMusic.sustainDuration:finish+1.2;
  playback.time=0;clock=0;playback.stamp=null;

  prepareTyping(value);
}


 function drawGalaxyLayer(){
  S.ctx.fillStyle=sceneBackground;S.ctx.fillRect(0,0,W,H);
  S.ctx.save();
  // 原作银河只叠加亮部，蓝底不会被图片里的黑色覆盖。
  if(sceneTheme==='blue')S.ctx.globalCompositeOperation='screen';
  S.ctx.drawImage(galaxyCanvas,0,0);S.ctx.restore();
 }
 const ready=Promise.all([galaxyReady,global.document.fonts?.load("17.82px '霞鹜文楷'")]).then(()=>{buildCycle();});
 return {ready,draw(t,mode,part){clock=playback.time=t;ctx.clearRect(0,0,W,H);illuminationCtx.clearRect(0,0,W,H);
  if(mode==='symbols'){
   originalStage.style.visibility='hidden';
   const group=(opt.symbol||'all')==='all';
   const items=group?particles.filter(p=>p.type==='symbol').slice(0,24):
    [particles.find(p=>p.kind===opt.symbol)||particles.find(p=>p.type==='symbol')];
   // 整组沿用原独立符号预览的四列六行；单件仍可按原选项查看。
   items.forEach((p,i)=>{
    ctx.save();ctx.translate(group?100+(i%4)*153:W/2,group?150+Math.floor(i/4)*116:H/2);
    const scale=group?2.4:7;ctx.scale(scale,scale);drawSymbol(p,t,1,1);ctx.restore();
   });
   S.ctx.drawImage(canvas,0,0);return;
  }
  if(mode==='galaxy'){originalStage.style.visibility='hidden';clock=cycle.sky.start+t;drawStarfield();drawGalaxyLayer();S.ctx.drawImage(canvas,0,0);return;}
  originalStage.style.visibility='visible';const size=rootSize();originalStage.style.transform=`translate(-50%,-50%) scale(${Math.min(size.width/660,size.height/880)})`;paint();if(part==='art'||part==='galaxy')drawGalaxyLayer();if(part==='art'||part==='flight'){S.ctx.drawImage(illuminationCanvas,0,0);S.ctx.drawImage(canvas,0,0);}
 },inspect:t=>({send:cycle?.sendAt,galaxy:cycle?.sky&&{start:cycle.sky.start,end:cycle.sky.end},count:particles.filter(p=>p.type==='symbol').length}),destroy(preserve=false){if(!preserve)originalStage.remove();}};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("galaxy-axis-reveal",{"family": "letter", "mode": "galaxy", "start": 0, "width": 660, "height": 880});
WiseSceneRuntime.register("letter-symbol-illustration",{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"all","variants":{"all":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"all"},"star":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"star"},"moon":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"moon"},"flower":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"flower"},"heart":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"heart"},"note":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"note"},"butterfly":{"family":"letter","mode":"symbols","start":0,"width":660,"height":880,"symbol":"butterfly"}}});
WiseSceneRuntime.register("letter-galaxy-illustration",{"family": "letter", "mode": "galaxy", "start": 0, "width": 660, "height": 880});
WiseSceneRuntime.register("star-letter-journey",{"family":"letter","mode":"full","start":0,"width":660,"height":880,"breakdown":[{"id":"galaxy","name":"夜空与银河展开","start":0,"end":25000,"time":"0—25秒","detail":"银河亮星位置固定，天空按旋转、缩放与遮罩范围逐步展开。","actions":["galaxy-axis-reveal","letter-galaxy-illustration"]},{"id":"flight","name":"发送光面、水波、群飞与落星","start":0,"end":25000,"time":"0—25秒","detail":"发送后水波展开，126件符号分别飞向固定亮星落点，抵达后显星并继续闪烁。","actions":["letter-ripple","symbol-flight-settle","arrival-star-reveal","arrival-star-sparkle","letter-symbol-illustration"]},{"id":"composer","name":"逐字输入与发送界面","start":0,"end":25000,"time":"0—25秒","detail":"圆角输入框逐字出现文字，箭头转为发送进度，发送与背景光面保持同一时间。","actions":["type-reveal"]}],"layers":["galaxy","flight"]});
WiseSceneRuntime.register("star-letter-blue-journey",{"family":"letter","mode":"full","start":0,"width":660,"height":880,"breakdown":[{"id":"galaxy","name":"蓝色夜空与银河展开","start":0,"end":25000,"time":"0—25秒","detail":"正蓝底色#164df2；银河亮星位置固定，天空按旋转、缩放与遮罩范围逐步展开。","actions":["galaxy-axis-reveal","letter-galaxy-illustration"]},{"id":"flight","name":"发送光面、水波、群飞与落星","start":0,"end":25000,"time":"0—25秒","detail":"发送后水波展开，126件符号分别飞向固定亮星落点，抵达后显星并继续闪烁。","actions":["letter-ripple","symbol-flight-settle","arrival-star-reveal","arrival-star-sparkle","letter-symbol-illustration"]},{"id":"composer","name":"逐字输入与发送界面","start":0,"end":25000,"time":"0—25秒","detail":"圆角输入框逐字出现文字，箭头转为发送进度，发送与背景光面保持同一时间。","actions":["type-reveal"]}],"layers":["galaxy","flight"],"theme":"blue"});
