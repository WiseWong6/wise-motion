/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  // 每个抽取动作只创建自己需要的对象；组合和独立示例共用以下绘制函数。
  const tag = (nodes, id) => (Array.isArray(nodes) ? nodes : [nodes]).forEach(node => { node.dataset.layer = id; });
  const row = (id, name, start, end, detail, clock, actions = []) => {
    const time = value => clock ? Math.round(clock[2] + Math.min(1, Math.max(0, (value-clock[0])/(clock[1]-clock[0]))) * (clock[3]-clock[2])) : value;
    const a=time(start),b=time(end),seconds=value=>String(Math.round(value/100)/10);
    return {id,name,start:a,end:b,time:`${seconds(a)}–${seconds(b)} 秒`,detail,actions};
  };
  const subtitleMarkup = '<div class="subtitle-block"><div class="subtitle-cell">想</div><div class="subtitle-cell">达</div><div class="subtitle-cell">见</div></div>';
  const statementMarkup = '<div class="statement">让视线，跟着讲述走。</div>';
  function drawSubtitleFocus(cells, t, appearance) {
    const focus = t >= 1800 && (t < 4900 || t >= 7600) ? Math.min(2, Math.floor((t - 1800) / 650)) : -1;
    cells.forEach((node, i) => {
      const active = i === focus;
      node.style.opacity = String((appearance ? appearance[i] : 1) * (focus < 0 || active ? 1 : .45));
      node.className = active ? 'subtitle-cell is-on' : 'subtitle-cell is-idle';
    });
  }
  function drawSubtitleShift(M, node, t, o) {
    const up = M.span(t, 4100, 5200, o.ease), back = M.span(t, 7600, 9000, o.ease);
    M.pose(node, {y: -up * 53 + back * 99, scale: 1 + back * .18});
  }
  function drawStatement(M, node, t, o) {
    const enter = M.span(t, 4900, 5800, o.ease), exit = M.span(t, 6900, 7600, o.ease);
    M.pose(node, {y: 30 * (1 - enter) - 20 * exit, opacity: M.clamp(enter) * (1 - M.clamp(exit))});
  }
  F['subtitle-cell-focus'] = (root, M) => {
    const s = M.scene(root, subtitleMarkup), cells = s.all('.subtitle-cell');
    return t => drawSubtitleFocus(cells, t);
  };
  F['subtitle-block-shift'] = (root, M) => {
    const s = M.scene(root, subtitleMarkup), block = s.one('.subtitle-block');
    return (t, o) => drawSubtitleShift(M, block, t, o);
  };
  F['dual-scroll'] = (root, M) => {
    const cards = M.cardSet(4, 'mini-card strip-card'); const track = `<div class="scroll-track">${cards}${cards}${cards}</div>`;
    const s = M.scene(root, `<div class="strip-row">${track}</div><div class="strip-row lower">${track}</div>`); const tracks = s.all('.scroll-track'), rows = s.all('.strip-row');
    rows.forEach((node,i)=>tag(node,i?'lower':'upper'));
    return (t, o) => { const p = t / o.duration % 1, intro = 1 - M.span(o.elapsed, 0, 1000, 'outCubic'); M.pose(rows[0], {x: -intro * 640}); M.pose(rows[1], {x: intro * 640}); M.pose(tracks[0], {x: -672 + p * 672}); M.pose(tracks[1], {x: -p * 672}); };
  };
  F['subtitle-focus'] = (root, M) => {
    const s = M.scene(root, subtitleMarkup + statementMarkup), cells = s.all('.subtitle-cell'), block = s.one('.subtitle-block'), statement = s.one('.statement');
    tag(block,'cells');tag(statement,'statement');
    return (t, o) => {
      const appearance = F['stagger-in'].draw(M, cells, t, o, {start:200, end:900, gap:450, distance:25});
      drawSubtitleFocus(cells, t, appearance);
      drawSubtitleShift(M, block, t, o);
      drawStatement(M, statement, t, o);
    };
  };
  F['title-content'] = (root, M) => {
    const s = M.scene(root, '<div class="product-title">好想法，从这里开始。</div>' + ['表达','节奏','重点'].map((word, i) => `<div class="feature-card" style="left:${98 + i * 154}px">${word}<small>让内容被看见</small></div>`).join('')), cards = s.all('.feature-card'), title = s.one('.product-title');
    tag(title,'title');tag(cards,'content');
    return (t, o) => {
      const reveal = M.span(t, 200, 1800, o.ease);
      title.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
      F['stagger-in'].draw(M, cards, t, o, {start:2000, end:3300, gap:350, distance:30});
    };
  };
  const buttonMarkup = '<div class="action-button">开始整理</div>';
  const progressMarkup = '<div class="progress-track"><div class="progress-fill"></div></div>';
  const resultMarkup = '<div class="result">✓ 已整理完成</div>';
  function drawPointer(M, node, t, o) {
    const p = M.span(t, 300, 1600, o.ease);
    M.pose(node, {x: M.mix(460, 345, p), y: M.mix(276, 179, p), opacity: 1 - M.span(t, 2100, 2700)});
  }
  function drawButton(M, node, t) {
    const press = t < 1600 ? 0 : Math.sin(M.clamp((t - 1600) / 550) * Math.PI);
    M.pose(node, {scale: 1 - press * .045});
    node.textContent = t < 2150 ? '开始整理' : t < 5300 ? '正在整理' : '整理完成';
  }
  function drawProgress(M, track, fill, t) {
    fill.style.transform = `scaleX(${M.span(t, 2150, 5300, 'linear')})`;
    M.pose(track, {opacity: M.span(t, 2150, 2500) * (1 - M.span(t, 5300, 5900))});
  }
  F['button-press-status'] = (root, M) => {
    const s = M.scene(root, '<div class="operation">' + buttonMarkup + '</div>'), button = s.one('.action-button');
    return t => drawButton(M, button, t);
  };
  F['progress-fill-exit'] = (root, M) => {
    // 保留原进度条的绝对落点；空按钮不属于这个动作，不创建占位按钮。
    const s = M.scene(root, '<div class="operation" style="padding-top:64px">' + progressMarkup + '</div>'), track = s.one('.progress-track'), fill = s.one('.progress-fill');
    return t => drawProgress(M, track, fill, t);
  };
  F['interface-feedback'] = (root, M) => {
    const s = M.scene(root, '<div class="operation">' + buttonMarkup + progressMarkup + resultMarkup + '</div><div class="pointer"></div>');
    const pointer = s.one('.pointer'), button = s.one('.action-button'), track = s.one('.progress-track'), fill = s.one('.progress-fill'), result = s.one('.result');
    for(const [node,id] of [[pointer,'pointer'],[button,'button'],[track,'progress'],[result,'result']])tag(node,id);
    return (t, o) => {
      drawPointer(M, pointer, t, o);
      drawButton(M, button, t);
      drawProgress(M, track, fill, t);
      F['fade-rise'].draw(M, result, t, o, {start:5300, end:6100, distance:10});
    };
  };
  const subtitleClock=[200,9000,150,3750];
  F['subtitle-focus'].breakdown = [
    row('cells','字幕格呈现、切重点和让位',200,9000,'三个字格先错峰出现，再依次提亮；整组上移为陈述让位，最后下移放大。逐项入场、重点轮换和整体让位分别复用独立动作。',subtitleClock,['stagger-in','subtitle-cell-focus','subtitle-block-shift']),
    {...row('statement','陈述上移显现与淡出',4900,7600,'字格开始让位后，陈述才由下方淡入；陈述淡出后，重心交回字格。',subtitleClock),reason:'组合中的陈述仅作为整段画面的文字层使用，无独立参考。'}
  ];
  const titleClock=[200,4000,150,2550];
  F['title-content'].breakdown = [
    {...row('title','标题遮罩揭示',200,1800,'保持标题位置不动，仅从左向右打开遮罩，标题先于内容建立。',titleClock),reason:'标题揭示仅作为完整组合的标题层保留，无独立参考。'},
    row('content','三个内容模块错峰上移',2000,4000,'标题揭示结束后，三个模块分别从下方淡入，开始时间逐个错开。',titleClock,['stagger-in'])
  ];
  const interfaceClock=[300,6100,150,3750];
  F['interface-feedback'].breakdown = [
    {...row('pointer','指针靠近后离场',300,2700,'指针从右下方移到按钮，按下后逐渐隐藏。',interfaceClock),reason:'指针仅作为完整界面反馈组合的操作示意层保留，无独立参考。'},
    row('button','按钮按压与状态改写',1600,5300,'按钮轻微缩小后恢复，同时依处理阶段把文案改为正在整理、整理完成。',interfaceClock,['button-press-status']),
    row('progress','处理进度填充与收起',2150,5900,'按下后出现细进度条，从左向右匀速填满，完成后淡出。',interfaceClock,['progress-fill-exit']),
    row('result','完成结果淡入上移',5300,6100,'进度填满后，完成文案由下方轻微上移并显现。',interfaceClock,['fade-rise'])
  ];
})(globalThis.MotionFactories);
