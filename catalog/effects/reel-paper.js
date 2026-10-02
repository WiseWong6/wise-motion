/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  // 原片 4–10 秒的完整剪纸片头。固定文字转为原 Futura Bold 轮廓，避免异步字体改变排版。
  const glyphs={" ":"",".":"M53 96Q53 120 62.0 141.5Q71 163 87.0 179.0Q103 195 124.5 204.0Q146 213 170 213Q194 213 215.5 204.0Q237 195 253.0 179.0Q269 163 278.0 141.5Q287 120 287 96Q287 72 278.0 50.5Q269 29 253.0 13.0Q237 -3 215.5 -12.0Q194 -21 170 -21Q146 -21 124.5 -12.0Q103 -3 87.0 13.0Q71 29 62.0 50.5Q53 72 53 96Z","0":"M214 378Q214 328 223.0 287.0Q232 246 248.5 216.0Q265 186 288.0 169.5Q311 153 340 153Q368 153 391.5 169.5Q415 186 431.0 216.0Q447 246 456.0 287.0Q465 328 465 378Q465 427 456.0 468.5Q447 510 431.0 539.5Q415 569 391.5 585.5Q368 602 340 602Q311 602 288.0 585.5Q265 569 248.5 539.5Q232 510 223.0 468.5Q214 427 214 378ZM20 378Q20 468 43.5 541.5Q67 615 109.5 667.0Q152 719 210.5 747.5Q269 776 340 776Q410 776 469.0 747.5Q528 719 570.0 667.0Q612 615 635.5 541.5Q659 468 659 378Q659 288 635.5 214.5Q612 141 570.0 88.5Q528 36 469.0 7.5Q410 -21 340 -21Q269 -21 210.5 7.5Q152 36 109.5 88.5Q67 141 43.5 214.5Q20 288 20 378Z","1":"M265 588H155V754H461V0H265Z","5":"M560 588H299L286 505Q304 507 319.0 508.5Q334 510 350 510Q407 510 456.0 490.0Q505 470 540.0 435.0Q575 400 595.0 351.0Q615 302 615 244Q615 183 592.5 134.0Q570 85 529.0 50.5Q488 16 429.0 -2.5Q370 -21 298 -21Q230 -21 168.5 -4.5Q107 12 53 46L82 230Q132 187 184.0 164.5Q236 142 283 142Q343 142 378.0 174.5Q413 207 413 255Q413 311 366.0 345.5Q319 380 243 380Q209 380 173.0 372.5Q137 365 102 349L165 754H560Z","9":"M141 0 355 246H351Q323 229 305.0 225.5Q287 222 273 222Q218 222 171.5 243.0Q125 264 91.5 300.5Q58 337 39.0 386.0Q20 435 20 491Q20 551 42.0 602.5Q64 654 105.5 692.5Q147 731 206.0 753.0Q265 775 339 775Q414 775 473.0 753.0Q532 731 573.5 693.0Q615 655 637.0 604.5Q659 554 659 497Q659 433 630.5 358.5Q602 284 543 212L368 0ZM465 495Q465 521 455.0 543.5Q445 566 428.0 583.0Q411 600 388.5 610.0Q366 620 340 620Q314 620 291.5 610.0Q269 600 252.0 583.0Q235 566 225.0 543.5Q215 521 215 495Q215 469 225.0 446.5Q235 424 252.0 407.0Q269 390 291.5 380.0Q314 370 340 370Q366 370 388.5 380.0Q411 390 428.0 407.0Q445 424 455.0 446.5Q465 469 465 495Z","A":"M489 280 401 531 313 280ZM541 131H261L216 0H7L294 754H508L795 0H586Z","B":"M275 152H318Q392 152 424.0 171.0Q456 190 456 232Q456 274 424.0 293.0Q392 312 318 312H275ZM275 458H311Q403 458 403 531Q403 604 311 604H275ZM79 754H371Q475 754 529.0 704.0Q583 654 583 560Q583 503 562.5 465.5Q542 428 500 402Q542 394 571.5 377.5Q601 361 619.5 337.0Q638 313 646.0 283.0Q654 253 654 219Q654 166 635.5 125.0Q617 84 583.5 56.0Q550 28 502.0 14.0Q454 0 394 0H79Z","C":"M622 502Q554 585 454 585Q410 585 372.5 569.0Q335 553 308.0 525.5Q281 498 265.5 460.0Q250 422 250 378Q250 333 265.5 295.0Q281 257 308.5 229.0Q336 201 373.0 185.0Q410 169 453 169Q547 169 622 249V17L602 10Q557 -6 518.0 -13.5Q479 -21 441 -21Q363 -21 291.5 8.5Q220 38 165.5 91.5Q111 145 78.0 218.5Q45 292 45 379Q45 466 77.5 538.5Q110 611 164.5 663.5Q219 716 291.0 745.5Q363 775 442 775Q487 775 530.5 765.5Q574 756 622 736Z","E":"M508 588H275V462H495V296H275V166H508V0H79V754H508Z","H":"M275 463H558V754H754V0H558V311H275V0H79V754H275Z","I":"M275 754V0H79V754Z","J":"M450 754V231Q450 198 446.5 170.0Q443 142 435 122Q422 90 399.5 63.5Q377 37 347.0 18.5Q317 0 280.5 -10.5Q244 -21 204 -21Q83 -21 7 90L135 221Q140 187 157.0 167.0Q174 147 199 147Q254 147 254 234V754Z","L":"M275 754V166H510V0H79V754Z","M":"M45 0 173 754H367L518 352L668 754H862L990 0H795L730 434L552 0H474L305 434L240 0Z","N":"M79 0V754H275L637 293V754H832V0H637L275 461V0Z","O":"M250 377Q250 332 267.0 294.0Q284 256 313.0 228.0Q342 200 380.5 184.5Q419 169 462 169Q505 169 543.5 184.5Q582 200 611.5 228.0Q641 256 658.0 294.0Q675 332 675 377Q675 422 658.0 460.0Q641 498 611.5 526.0Q582 554 543.5 569.5Q505 585 462 585Q419 585 380.5 569.5Q342 554 313.0 526.0Q284 498 267.0 460.0Q250 422 250 377ZM45 377Q45 461 76.0 533.5Q107 606 162.0 660.0Q217 714 293.5 744.5Q370 775 462 775Q553 775 630.0 744.5Q707 714 762.5 660.0Q818 606 849.0 533.5Q880 461 880 377Q880 293 849.0 220.5Q818 148 762.5 94.0Q707 40 630.0 9.5Q553 -21 462 -21Q370 -21 293.5 9.5Q217 40 162.0 94.0Q107 148 76.0 220.5Q45 293 45 377Z","P":"M275 408H340Q448 408 448 502Q448 596 340 596H275ZM275 0H79V754H391Q518 754 585.5 688.0Q653 622 653 502Q653 382 585.5 316.0Q518 250 391 250H275Z","Q":"M45 377Q45 461 76.0 533.5Q107 606 162.0 660.0Q217 714 293.5 744.5Q370 775 462 775Q553 775 630.0 744.5Q707 714 762.5 660.0Q818 606 849.0 533.5Q880 461 880 377Q880 299 854.5 232.0Q829 165 781 113L909 -21L729 -49L660 22Q616 2 566.5 -9.5Q517 -21 462 -21Q370 -21 293.5 9.5Q217 40 162.0 94.0Q107 148 76.0 220.5Q45 293 45 377ZM250 377Q250 332 267.0 294.0Q284 256 313.0 228.0Q342 200 380.5 184.5Q419 169 462 169Q488 169 514 175L402 293L587 316L639 261Q675 311 675 377Q675 422 658.0 460.0Q641 498 611.5 526.0Q582 554 543.5 569.5Q505 585 462 585Q419 585 380.5 569.5Q342 554 313.0 526.0Q284 498 267.0 460.0Q250 422 250 377Z","R":"M275 417H312Q370 417 401.0 441.0Q432 465 432 510Q432 555 401.0 579.0Q370 603 312 603H275ZM706 0H462L275 290V0H79V754H384Q447 754 494.0 735.5Q541 717 571.5 685.0Q602 653 617.5 611.0Q633 569 633 521Q633 435 591.5 381.5Q550 328 469 309Z","S":"M493 561Q461 587 429.0 599.5Q397 612 367 612Q329 612 305.0 594.0Q281 576 281 547Q281 527 293.0 514.0Q305 501 324.5 491.5Q344 482 368.5 475.0Q393 468 417 460Q513 428 557.5 374.5Q602 321 602 235Q602 177 582.5 130.0Q563 83 525.5 49.5Q488 16 433.5 -2.5Q379 -21 310 -21Q167 -21 45 64L129 222Q173 183 216.0 164.0Q259 145 301 145Q349 145 372.5 167.0Q396 189 396 217Q396 234 390.0 246.5Q384 259 370.0 269.5Q356 280 333.5 289.0Q311 298 279 309Q241 321 204.5 335.5Q168 350 139.5 374.0Q111 398 93.5 434.5Q76 471 76 527Q76 583 94.5 628.5Q113 674 146.5 706.5Q180 739 228.5 757.0Q277 775 337 775Q393 775 454.0 759.5Q515 744 571 714Z","T":"M365 588V0H169V588H8V754H526V588Z","U":"M275 754V344Q275 311 277.5 276.5Q280 242 292.5 214.0Q305 186 332.0 168.5Q359 151 408 151Q457 151 483.5 168.5Q510 186 523.0 214.0Q536 242 538.5 276.5Q541 311 541 344V754H736V317Q736 141 655.5 60.0Q575 -21 408 -21Q241 -21 160.0 60.0Q79 141 79 317V754Z","W":"M205 754 335 267 495 754H651L811 267L941 754H1146L921 0H721L573 437L425 0H225L0 754Z","Y":"M261 362 -14 754H220L360 548L499 754H733L457 362V0H261Z","—":"M0 343H867V192H0Z"};
  const rows=[{"id":"era","text":"ERA 01 — THE TITLE SEQUENCE","x":120,"base":360,"size":26,"track":6,"start":0.6,"stagger":0.012,"duration":0.4,"fill":"#111","letters":[{"ch":"E","x":120},{"ch":"R","x":140.82},{"ch":"A","x":165.25400000000002},{"ch":" ","x":192.106},{"ch":"0","x":206.94600000000003},{"ch":"1","x":230.626},{"ch":" ","x":252.98000000000002},{"ch":"—","x":267.82000000000005},{"ch":" ","x":296.362},{"ch":"T","x":311.202},{"ch":"H","x":331.086},{"ch":"E","x":358.744},{"ch":" ","x":379.564},{"ch":"T","x":394.404},{"ch":"I","x":414.288},{"ch":"T","x":429.492},{"ch":"L","x":449.37600000000003},{"ch":"E","x":469.208},{"ch":" ","x":490.028},{"ch":"S","x":504.868},{"ch":"E","x":527.664},{"ch":"Q","x":548.4839999999999},{"ch":"U","x":578.534},{"ch":"E","x":605.7239999999999},{"ch":"N","x":626.544},{"ch":"C","x":656.23},{"ch":"E","x":679.832}],"width":574.652},{"id":"year","text":"1959","x":108,"base":640,"size":300,"track":-4,"start":0.9,"stagger":0.09,"duration":0.5,"fill":"#f1e4c8","letters":[{"ch":"1","x":108},{"ch":"9","x":308.0},{"ch":"5","x":491.5},{"ch":"9","x":691.5}],"width":787.5},{"id":"caption1","text":"SAUL BASS CUTS PAPER.","x":120,"base":740,"size":38,"track":3,"start":1.8,"stagger":0.02,"duration":0.4,"fill":"#111","letters":[{"ch":"S","x":120},{"ch":"A","x":147.548},{"ch":"U","x":180.49200000000002},{"ch":"L","x":213.664},{"ch":" ","x":236.88},{"ch":"B","x":252.79999999999998},{"ch":"A","x":282.096},{"ch":"S","x":315.154},{"ch":"S","x":342.702},{"ch":" ","x":370.25},{"ch":"C","x":386.16999999999996},{"ch":"U","x":414.51599999999996},{"ch":"T","x":448.486},{"ch":"S","x":471.778},{"ch":" ","x":499.36400000000003},{"ch":"P","x":515.2840000000001},{"ch":"A","x":544.048},{"ch":"P","x":575.9280000000001},{"ch":"E","x":604.692},{"ch":"R","x":629.3520000000001},{"ch":".","x":659.2940000000001}],"width":552.214},{"id":"caption2","text":"JOHN WHITNEY WIRES A COMPUTER.","x":120,"base":792,"size":38,"track":3,"start":2.3,"stagger":0.02,"duration":0.4,"fill":"#111","letters":[{"ch":"J","x":120},{"ch":"O","x":143.14},{"ch":"H","x":181.29},{"ch":"N","x":215.944},{"ch":" ","x":253.56199999999998},{"ch":"W","x":269.48199999999997},{"ch":"H","x":316.03},{"ch":"I","x":350.68399999999997},{"ch":"T","x":367.13599999999997},{"ch":"N","x":390.428},{"ch":"E","x":428.046},{"ch":"Y","x":452.706},{"ch":" ","x":483.18},{"ch":"W","x":499.1},{"ch":"I","x":545.648},{"ch":"R","x":562.1},{"ch":"E","x":592.042},{"ch":"S","x":616.702},{"ch":" ","x":644.25},{"ch":"A","x":660.17},{"ch":" ","x":693.646},{"ch":"C","x":709.5659999999999},{"ch":"O","x":737.9119999999999},{"ch":"M","x":776.4799999999999},{"ch":"P","x":818.81},{"ch":"U","x":847.574},{"ch":"T","x":881.544},{"ch":"E","x":904.836},{"ch":"R","x":929.496},{"ch":".","x":959.438}],"width":852.358}];
  const bars=[
    {y:108,h:64,w:980,d:1,at:.1,rot:-.012},
    {y:196,h:24,w:560,d:1,at:.35,rot:.01},
    {y:872,h:92,w:1180,d:-1,at:.55,rot:.008},
    {y:990,h:26,w:720,d:1,at:.8,rot:-.01},
    {y:262,h:12,w:1500,d:-1,at:1.05,rot:.004}
  ];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const prog=(t,a,b)=>clamp((t-a)/(b-a));
  const outExpo=p=>p>=1?1:1-Math.pow(2,-10*p);
  const outCubic=p=>1-Math.pow(1-p,3);
  const outBack=p=>1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const set=(node,key,value)=>{const next=String(value);if(node.getAttribute(key)!==next)node.setAttribute(key,next);};
  const content=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const monoWidth=(value,size,track)=>value.length*(size*.60205078125+track)-track;
  const text=(part,value,x,y,size,extra='')=>`<text data-part="${part}" x="${x}" y="${y}" font-size="${size}" letter-spacing="3" fill="#111" style="font-family:Menlo,'SF Mono',monospace;font-weight:500" ${extra}>${value}</text>`;
  const paperPaths=bars.map((b,i)=>[0,1,2].map(boil=>{
    const n=Math.max(2,Math.floor(b.w/40)),points=[];
    for(let j=0;j<=n;j++)points.push(`${b.w*j/n} ${(hash(i*31+j*1.7+boil)-.5)*6}`);
    for(let j=n;j>=0;j--)points.push(`${b.w*j/n} ${b.h+(hash(i*31+j*2.3+boil+50)-.5)*6}`);
    return 'M'+points.join('L')+'Z';
  }));
  // 原曲线不是等长描边：以角度推进绘制，提前计算点，保留末尾减速和自转叠加。
  const spiralPoints=[],angles=[],scale=360*.92/(7-3+4.2);
  for(let a=0;a<=6*Math.PI;a+=.02){
    angles.push(a);
    spiralPoints.push(`${((7-3)*Math.cos(a)+4.2*Math.cos((7-3)/3*a))*scale} ${((7-3)*Math.sin(a)-4.2*Math.sin((7-3)/3*a))*scale}`);
  }
  const paperMarkup=()=>bars.map((b,i)=>`<path data-layer="paper" data-part="paper${i}" d="${paperPaths[i][0]}" fill="#111" visibility="hidden"/>`).join('');
  const spiralMarkup='<path data-layer="spiral" data-part="spiral" fill="none" stroke="#111" stroke-width="3.2" stroke-linejoin="round"/>';
  const orbitMarkup='<circle data-layer="orbit" data-part="satellite" r="0" fill="#111"/>';
  // 独立条目和完整组合使用同一份动作，不用视觉近似的目录项充当组成动作。
  function paperMotion(root) {
    const papers=bars.map((_,i)=>root.querySelector(`[data-part="paper${i}"]`));
    return (q,frame)=>bars.forEach((bar,i)=>{
      const p=outExpo(prog(q,bar.at,bar.at+.5));
      const x=bar.d>0?-bar.w+p*(bar.w+60+i*20):1920-p*(bar.w+40);
      set(papers[i],'visibility',p>0?'visible':'hidden');
      set(papers[i],'transform',`translate(${x} ${bar.y}) rotate(${bar.rot*180/Math.PI})`);
      set(papers[i],'d',paperPaths[i][frame%3]);
    });
  }
  function spiralMotion(root,cx=1400,cy=540) {
    const spiral=root.querySelector('[data-part="spiral"]');
    let previousCount=-1;
    return q=>{
      set(spiral,'visibility',outBack(prog(q,.15,.75))>.2?'visible':'hidden');
      const theta=6*Math.PI*outCubic(prog(q,.5,4.6));
      let lo=0,hi=angles.length;
      while(lo<hi){const mid=(lo+hi)>>>1;if(angles[mid]<=theta)lo=mid+1;else hi=mid;}
      if(lo!==previousCount){set(spiral,'d','M'+spiralPoints.slice(0,lo).join('L'));previousCount=lo;}
      set(spiral,'transform',`translate(${cx} ${cy}) rotate(${q*.35*180/Math.PI})`);
    };
  }
  function orbitMotion(root,cx=1400,cy=540) {
    const satellite=root.querySelector('[data-part="satellite"]');
    return q=>{
      set(satellite,'cx',cx+Math.cos(q*1.6)*400);set(satellite,'cy',cy+Math.sin(q*1.6)*400);
      set(satellite,'r',14*outBack(prog(q,.15,.75)));
    };
  }
  function stepped(draw,duration=6000) {
    let previous=-1;
    return ms=>{
      const frame=Math.floor(clamp(ms,0,duration)/1000*12);
      if(frame===previous)return;
      draw(frame/12,frame);previous=frame;
    };
  }
  function standalone(root,title,markup) {
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>${title}</title><rect data-part="bg" width="1920" height="1080" fill="#e8541e"/>${markup}</svg>`;
  }
  F['paper-strip-stagger']=root=>{
    standalone(root,'剪纸条双向错峰滑入',paperMarkup());
    return stepped(paperMotion(root),2000);
  };
  F['spiral-draw-spin']=root=>{
    standalone(root,'螺线描画并自转','<circle data-guide="disc" cx="960" cy="540" r="360" fill="#f1e4c8"/>'+spiralMarkup);
    return stepped(spiralMotion(root,960,540));
  };
  F['planar-dot-orbit']=root=>{
    standalone(root,'圆点平面公转','<circle data-guide="orbit" cx="960" cy="540" r="400" fill="none" stroke="#f1e4c8" stroke-width="2"/><circle data-guide="center" cx="960" cy="540" r="8" fill="#f1e4c8"/>'+orbitMarkup);
    return stepped(orbitMotion(root,960,540));
  };
  let serial=0;
  F['paper-spiral-sequence']=root=>{
    const id='motion-paper-sequence-'+ ++serial;
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>剪纸图盘逐格展开</title><defs>'+
      rows.map(row=>`<clipPath id="${id}-${row.id}"><rect x="${row.x-row.size}" y="${row.base-row.size*1.05}" width="${row.width+row.size*2}" height="${row.size*1.35}"/></clipPath>`).join('')+
      `<clipPath id="${id}-hud-era"><rect x="920" y="44" width="940" height="36"/></clipPath></defs>`+
      '<rect data-part="bg" width="1920" height="1080" fill="#e8541e"/>'+
      paperMarkup()+
      '<circle data-layer="disc" data-part="disc" cx="1400" cy="540" r="0" fill="#f1e4c8"/>'+
      spiralMarkup+
      '<circle data-layer="disc" data-part="disc-center" cx="1400" cy="540" r="0" fill="#e8541e"/>'+
      orbitMarkup+
      rows.map(row=>`<g data-layer="text" data-line="${row.id}" data-font="Futura Bold" aria-label="${row.text}" fill="${row.fill}" clip-path="url(#${id}-${row.id})">`+
        row.letters.map((letter,i)=>`<g data-char="${i}" transform="translate(${letter.x} ${row.base})"><path data-glyph="${letter.ch}" d="${glyphs[letter.ch]}" transform="scale(${row.size/1000} ${-row.size/1000})"/></g>`).join('')+'</g>').join('')+
      '<g data-layer="labels" data-part="hud" opacity="0">'+
      text('title','CLAUDE  /  MOTION REEL  ’26',72,70,15)+
      `<g clip-path="url(#${id}-hud-era)"><g data-part="era-motion"><rect x="${1848-monoWidth('1959  —  THE TITLE SEQUENCE',15,3)-26}" y="58" width="12" height="12" fill="#111"/>`+
      text('era-label','1959  —  THE TITLE SEQUENCE',1848,70,15,'text-anchor="end"')+'</g></g>'+
      '<g fill="#111" opacity=".25"><rect x="72" y="1028" width="1776" height="1"/>'+
      [4,10,16,22,30,38,46,54].map(t=>`<rect x="${72+1776*t/60-.5}" y="1023" width="1" height="11"/>`).join('')+'</g>'+
      '<rect data-part="hud-progress" x="72" y="1027" width="0" height="3" fill="#111"/>'+
      text('shot','SHOT 01 / 08',72,1010,14)+text('timecode','',1848,1010,14,'text-anchor="end"')+'</g></svg>';
    const part=name=>root.querySelector(`[data-part="${name}"]`);
    const drawPaper=paperMotion(root),drawSpiral=spiralMotion(root),drawOrbit=orbitMotion(root);
    const disc=part('disc'),center=part('disc-center');
    const lines=rows.map(row=>[...root.querySelectorAll(`[data-line="${row.id}"] [data-char]`)]);
    const hud=part('hud'),era=part('era-motion'),progress=part('hud-progress'),timecode=part('timecode');
    let previousFrame=-1;
    return ms=>{
      const local=clamp(ms,0,6000)/1000,t=local+4,frame=Math.floor(local*12),q=frame/12;
      // 所有逐格几何只在原片下一格到达时更新；边角读数和圆心脉冲仍保留连续时间。
      if(frame!==previousFrame){
        drawPaper(q,frame);drawSpiral(q);drawOrbit(q);
        const dp=outBack(prog(q,.15,.75));
        set(disc,'r',360*dp);set(center,'visibility',dp>.2?'visible':'hidden');
        rows.forEach((row,i)=>lines[i].forEach((node,j)=>{
          const p=(row.id==='year'?outBack:outExpo)(prog(q,row.start+j*row.stagger,row.start+j*row.stagger+row.duration));
          set(node,'visibility',p>0?'visible':'hidden');
          set(node,'transform',`translate(${row.letters[j].x} ${row.base+(1-p)*row.size*1.1})`);
        }));
        previousFrame=frame;
      }
      // 原共享节拍在这一页每半秒一次；只保留图形响应，不加载或复制声音。
      const lastBeat=4+Math.floor(local/.5)*.5;
      set(center,'r',26+10*Math.exp(-(t-lastBeat)*6));
      set(hud,'opacity',prog(t,3.9,4.4));
      set(era,'transform',`translate(0 ${(1-outExpo(prog(local,0,.6)))*30})`);
      set(progress,'width',1776*t/60);
      content(timecode,`00:00:${String(Math.floor(t)).padStart(2,'0')}:${String(Math.floor(t*30)%30).padStart(2,'0')}`);
    };
  };
  // 拆解只切换原画中的图层，不另画示意图，也不改动共同的原片时钟。
  F['paper-spiral-sequence'].breakdown = [
    {id:'paper',actions:['paper-strip-stagger'],name:'纸条滑入',start:1000/6,end:19000/12,time:'0.17–1.58 秒',detail:'五条纸条从左右错峰进入；到位后边缘仍逐格轻颤。时间条标出滑入区间。'},
    {id:'disc',actions:[],name:'圆盘弹入',start:1000/6,end:750,time:'0.17–0.75 秒',detail:'奶油色圆盘放大后回弹落定。圆心从 0.25 秒起出现，每半秒胀缩一次。时间条标出圆盘弹入区间。'},
    {id:'spiral',actions:['spiral-draw-spin'],name:'螺线绘转',start:7000/12,end:6000,time:'0.58 秒起',detail:'螺线从右侧起笔，边画边自转，约 4.33 秒画齐后继续旋转；描画越接近末尾越慢。'},
    {id:'orbit',actions:['planar-dot-orbit'],name:'圆点公转',start:1000/6,end:6000,time:'0.17 秒起',detail:'外圈黑点随圆盘一起长大，沿圆周持续绕行，与螺线同时运动。'},
    {id:'text',actions:[],name:'文字升入',start:2000/3,end:10000/3,time:'0.67–3.33 秒',detail:'年代标题、年份、两行字幕依次逐字升入；年份带回弹，各行有自己的裁剪框。'}
  ];
})(globalThis.MotionFactories);
