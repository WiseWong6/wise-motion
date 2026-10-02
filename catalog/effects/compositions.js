/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  // 拆解只标记原画面中的对象；单层预览继续使用下面同一组绘制和时钟。
  const tag = (nodes, id) => (Array.isArray(nodes) ? nodes : [nodes]).forEach(node => { node.dataset.layer = id; });
  const row = (id, name, start, end, detail, clock) => {
    const time = value => clock ? Math.round(clock[2] + Math.min(1, Math.max(0, (value-clock[0])/(clock[1]-clock[0]))) * (clock[3]-clock[2])) : value;
    const a=time(start),b=time(end),seconds=value=>String(Math.round(value/100)/10);
    return {id,name,start:a,end:b,time:`${seconds(a)}–${seconds(b)} 秒`,detail};
  };
  F['dual-scroll'] = (root, M) => {
    const cards = M.cardSet(4, 'mini-card strip-card'); const track = `<div class="scroll-track">${cards}${cards}${cards}</div>`;
    const s = M.scene(root, `<div class="strip-row">${track}</div><div class="strip-row lower">${track}</div>`); const tracks = s.all('.scroll-track'), rows = s.all('.strip-row');
    rows.forEach((node,i)=>tag(node,i?'lower':'upper'));
    return (t, o) => { const p = t / o.duration % 1, intro = 1 - M.span(o.elapsed, 0, 1000, 'outCubic'); M.pose(rows[0], {x: -intro * 640}); M.pose(rows[1], {x: intro * 640}); M.pose(tracks[0], {x: -672 + p * 672}); M.pose(tracks[1], {x: -p * 672}); };
  };
  F['subtitle-focus'] = (root, M) => {
    const s = M.scene(root, '<div class="subtitle-block"><div class="subtitle-cell">想</div><div class="subtitle-cell">达</div><div class="subtitle-cell">见</div></div><div class="statement">让视线，跟着讲述走。</div>'); const cells = s.all('.subtitle-cell');
    tag(s.one('.subtitle-block'),'cells');tag(s.one('.statement'),'statement');
    return (t, o) => { const focus = t >= 1800 && (t < 4900 || t >= 7600) ? Math.min(2, Math.floor((t - 1800) / 650)) : -1; cells.forEach((c, i) => { const p = M.span(t, 200 + i * 450, 900 + i * 450, o.ease), active = i === focus; M.pose(c, {y: 25 * (1 - p), opacity: p * (focus < 0 || active ? 1 : .45)}); c.className = active ? 'subtitle-cell is-on' : 'subtitle-cell is-idle'; }); const up = M.span(t, 4100, 5200, o.ease), back = M.span(t, 7600, 9000, o.ease); M.pose(s.one('.subtitle-block'), {y: -up * 53 + back * 99, scale: 1 + back * .18}); const enter = M.span(t, 4900, 5800, o.ease), exit = M.span(t, 6900, 7600, o.ease); M.pose(s.one('.statement'), {y: 30 * (1 - enter) - 20 * exit, opacity: M.clamp(enter) * (1 - M.clamp(exit))}); };
  };
  F['arc-cards'] = (root, M) => {
    const s = M.scene(root, M.cardSet(5)); const cards = s.all('.mini-card'); cards.forEach(c => { c.style.left = '266px'; c.style.top = '117px'; });
    cards.forEach((node,i)=>tag(node,'card-'+i));
    return (t, o) => cards.forEach((c, i) => { const a = (M.ease(t / o.duration, o.ease) + i / 5) * Math.PI * 2; const z = Math.cos(a); M.pose(c, {x: Math.sin(a) * 235, y: (1 - z) * 28, scale: .67 + (z + 1) * .21, ry: -Math.sin(a) * 30, opacity: .5 + (z + 1) * .25}); c.style.zIndex = String(Math.round((z + 1) * 50)); });
  };
  F['title-content'] = (root, M) => {
    const s = M.scene(root, '<div class="product-title">好想法，从这里开始。</div>' + ['表达','节奏','重点'].map((word, i) => `<div class="feature-card" style="left:${98 + i * 154}px">${word}<small>让内容被看见</small></div>`).join('')); const cards = s.all('.feature-card');
    tag(s.one('.product-title'),'title');tag(cards,'content');
    return (t, o) => { const title = M.span(t, 200, 1800, o.ease); s.one('.product-title').style.clipPath = `inset(0 ${(1 - title) * 100}% 0 0)`; cards.forEach((c, i) => { const p = M.span(t, 2000 + i * 350, 3300 + i * 350, o.ease); M.pose(c, {y: (1 - p) * 30, opacity: p}); }); };
  };
  F['interface-feedback'] = (root, M) => {
    const s = M.scene(root, '<div class="operation"><div class="action-button">开始整理</div><div class="progress-track"><div class="progress-fill"></div></div><div class="result">✓ 已整理完成</div></div><div class="pointer"></div>');
    for(const [selector,id] of [['.pointer','pointer'],['.action-button','button'],['.progress-track','progress'],['.result','result']])tag(s.one(selector),id);
    return (t, o) => { const p = M.span(t, 300, 1600, o.ease); M.pose(s.one('.pointer'), {x: M.mix(460, 345, p), y: M.mix(276, 179, p), opacity: 1 - M.span(t, 2100, 2700)}); const press = t < 1600 ? 0 : Math.sin(M.clamp((t - 1600) / 550) * Math.PI); M.pose(s.one('.action-button'), {scale: 1 - press * .045}); const progress = M.span(t, 2150, 5300, 'linear'); s.one('.progress-fill').style.transform = `scaleX(${progress})`; s.one('.action-button').textContent = t < 2150 ? '开始整理' : t < 5300 ? '正在整理' : '整理完成'; M.pose(s.one('.progress-track'), {opacity: M.span(t, 2150, 2500) * (1 - M.span(t, 5300, 5900))}); M.pose(s.one('.result'), {opacity: M.span(t, 5300, 6100, o.ease), y: 10 * (1 - M.span(t, 5300, 6100, o.ease))}); };
  };
  F['environment-chain'] = (root, M) => {
    const plants = Array.from({length: 7}, (_, i) => `<div class="chain-plant" style="left:${150 + i * 27}px;top:${230 + i % 2 * 14}px"></div>`).join('');
    const s = M.scene(root, plants + '<div class="chain-water"></div><div class="traveler">✦</div><div class="orb" style="left:-14px;top:-14px"></div>' + Array.from({length: 3}, () => '<div class="ripple-ring" style="left:460px;top:252px;width:20px;height:20px"></div>').join('')); const grass = s.all('.chain-plant'), rings = s.all('.ripple-ring');
    tag(s.one('.traveler'),'traveler');tag(s.one('.orb'),'follower');tag(grass,'plants');tag([s.one('.chain-water'),...rings],'water');
    return (t, o) => { const p = t / o.duration, x = -60 + p * 760, y = 180 + Math.sin(p * Math.PI * 2) * 22; M.pose(s.one('.traveler'), {x, y}); M.pose(s.one('.orb'), {x: x - 35, y: 180 + Math.sin((p - .05) * Math.PI * 2) * 22, scale: .45, opacity: .6}); grass.forEach((c, i) => { const distance = Math.abs(x - (156 + i * 27)); const q = M.clamp(1 - distance / 62); M.pose(c, {rotate: q * 32}); }); rings.forEach((c, i) => { const q = M.span(t, 6900 + i * 180, 8500 + i * 180, o.ease); M.pose(c, {scale: 1 + q * 7, opacity: t > 6900 + i * 180 ? (1 - M.clamp(q)) * .65 : 0}); }); };
  };
  F['dual-scroll'].breakdown = [
    row('upper','上排进入后向右滚动',0,8000,'上排从左侧进入，四张内容重复成整条轨道；进入位移与向右滚动同时发生。'),
    row('lower','下排进入后向左滚动',0,8000,'下排从右侧进入，沿相反方向持续滚动；与上排共用相同周期。')
  ];
  const subtitleClock=[200,9000,150,3750];
  F['subtitle-focus'].breakdown = [
    row('cells','字幕格呈现、切重点和让位',200,9000,'三个字格先错峰出现，再依次提亮；整组上移为陈述让位，最后下移放大。同一组字格共同完成这些变化。',subtitleClock),
    row('statement','陈述上移显现与淡出',4900,7600,'字格开始让位后，陈述才由下方淡入；陈述淡出后，重心交回字格。',subtitleClock)
  ];
  F['arc-cards'].breakdown = Array.from({length:5},(_,i)=>row('card-'+i,`第${['一','二','三','四','五'][i]}张卡片沿弧面循环`,0,6000,'这张卡片沿同一弧面经过前景与后景，位置、大小、侧转和透明度由同一个轨道位置决定；五张卡片只错开起点。'));
  const titleClock=[200,4000,150,2550];
  F['title-content'].breakdown = [
    row('title','标题遮罩揭示',200,1800,'保持标题位置不动，仅从左向右打开遮罩，标题先于内容建立。',titleClock),
    row('content','三个内容模块错峰上移',2000,4000,'标题揭示结束后，三个模块分别从下方淡入，开始时间逐个错开。',titleClock)
  ];
  const interfaceClock=[300,6100,150,3750];
  F['interface-feedback'].breakdown = [
    row('pointer','指针靠近后离场',300,2700,'指针从右下方移到按钮，按下后逐渐隐藏。',interfaceClock),
    row('button','按钮按压与状态改写',1600,5300,'按钮轻微缩小后恢复，同时依处理阶段把文案改为正在整理、整理完成。',interfaceClock),
    row('progress','处理进度填充与收起',2150,5900,'按下后出现细进度条，从左向右匀速填满，完成后淡出。',interfaceClock),
    row('result','完成结果淡入上移',5300,6100,'进度填满后，完成文案由下方轻微上移并显现。',interfaceClock)
  ];
  const environmentClock=[0,9300,0,6000];
  F['environment-chain'].breakdown = [
    row('traveler','主体沿起伏路线前进',0,9300,'主体从左向右穿过画面，同时沿一条缓慢起伏的路线行进。',environmentClock),
    row('follower','伴随圆点延后跟行',0,9300,'圆点位于主体后方，沿相同波形延后行进，保留前后距离。',environmentClock),
    row('plants','草叶按距离偏转',154/760*9300,440/760*9300,'草叶只在主体靠近时偏转，离开后恢复；偏转幅度由主体与每根草叶的距离决定。',environmentClock),
    row('water','水面涟漪依次扩散',6900,8860,'主体经过草叶、靠近水面后，三圈涟漪错开扩张并淡出；水面与涟漪同属这一层。',environmentClock)
  ];
})(globalThis.MotionFactories);
