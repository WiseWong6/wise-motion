/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['dual-scroll'] = (root, M) => {
    const cards = M.cardSet(4, 'mini-card strip-card'); const track = `<div class="scroll-track">${cards}${cards}${cards}</div>`;
    const s = M.scene(root, `<div class="strip-row">${track}</div><div class="strip-row lower">${track}</div>`); const tracks = s.all('.scroll-track'), rows = s.all('.strip-row');
    return (t, o) => { const p = t / o.duration % 1, intro = 1 - M.span(o.elapsed, 0, 1000, 'outCubic'); M.pose(rows[0], {x: -intro * 640}); M.pose(rows[1], {x: intro * 640}); M.pose(tracks[0], {x: -672 + p * 672}); M.pose(tracks[1], {x: -p * 672}); };
  };
  F['subtitle-focus'] = (root, M) => {
    const s = M.scene(root, '<div class="subtitle-block"><div class="subtitle-cell">想</div><div class="subtitle-cell">达</div><div class="subtitle-cell">见</div></div><div class="statement">让视线，跟着讲述走。</div>'); const cells = s.all('.subtitle-cell');
    return (t, o) => { const focus = t >= 1800 && (t < 4900 || t >= 7600) ? Math.min(2, Math.floor((t - 1800) / 650)) : -1; cells.forEach((c, i) => { const p = M.span(t, 200 + i * 450, 900 + i * 450, o.ease), active = i === focus; M.pose(c, {y: 25 * (1 - p), opacity: p * (focus < 0 || active ? 1 : .45)}); c.className = active ? 'subtitle-cell is-on' : 'subtitle-cell is-idle'; }); const up = M.span(t, 4100, 5200, o.ease), back = M.span(t, 7600, 9000, o.ease); M.pose(s.one('.subtitle-block'), {y: -up * 53 + back * 99, scale: 1 + back * .18}); const enter = M.span(t, 4900, 5800, o.ease), exit = M.span(t, 6900, 7600, o.ease); M.pose(s.one('.statement'), {y: 30 * (1 - enter) - 20 * exit, opacity: M.clamp(enter) * (1 - M.clamp(exit))}); };
  };
  F['arc-cards'] = (root, M) => {
    const s = M.scene(root, M.cardSet(5)); const cards = s.all('.mini-card'); cards.forEach(c => { c.style.left = '266px'; c.style.top = '117px'; });
    return (t, o) => cards.forEach((c, i) => { const a = (M.ease(t / o.duration, o.ease) + i / 5) * Math.PI * 2; const z = Math.cos(a); M.pose(c, {x: Math.sin(a) * 235, y: (1 - z) * 28, scale: .67 + (z + 1) * .21, ry: -Math.sin(a) * 30, opacity: .5 + (z + 1) * .25}); c.style.zIndex = String(Math.round((z + 1) * 50)); });
  };
  F['title-content'] = (root, M) => {
    const s = M.scene(root, '<div class="product-title">好想法，从这里开始。</div>' + ['表达','节奏','重点'].map((word, i) => `<div class="feature-card" style="left:${98 + i * 154}px">${word}<small>让内容被看见</small></div>`).join('')); const cards = s.all('.feature-card');
    return (t, o) => { const title = M.span(t, 200, 1800, o.ease); s.one('.product-title').style.clipPath = `inset(0 ${(1 - title) * 100}% 0 0)`; cards.forEach((c, i) => { const p = M.span(t, 2000 + i * 350, 3300 + i * 350, o.ease); M.pose(c, {y: (1 - p) * 30, opacity: p}); }); };
  };
  F['interface-feedback'] = (root, M) => {
    const s = M.scene(root, '<div class="operation"><div class="action-button">开始整理</div><div class="progress-track"><div class="progress-fill"></div></div><div class="result">✓ 已整理完成</div></div><div class="pointer"></div>');
    return (t, o) => { const p = M.span(t, 300, 1600, o.ease); M.pose(s.one('.pointer'), {x: M.mix(460, 345, p), y: M.mix(276, 179, p), opacity: 1 - M.span(t, 2100, 2700)}); const press = t < 1600 ? 0 : Math.sin(M.clamp((t - 1600) / 550) * Math.PI); M.pose(s.one('.action-button'), {scale: 1 - press * .045}); const progress = M.span(t, 2150, 5300, 'linear'); s.one('.progress-fill').style.transform = `scaleX(${progress})`; s.one('.action-button').textContent = t < 2150 ? '开始整理' : t < 5300 ? '正在整理' : '整理完成'; M.pose(s.one('.progress-track'), {opacity: M.span(t, 2150, 2500) * (1 - M.span(t, 5300, 5900))}); M.pose(s.one('.result'), {opacity: M.span(t, 5300, 6100, o.ease), y: 10 * (1 - M.span(t, 5300, 6100, o.ease))}); };
  };
  F['environment-chain'] = (root, M) => {
    const plants = Array.from({length: 7}, (_, i) => `<div class="chain-plant" style="left:${150 + i * 27}px;top:${230 + i % 2 * 14}px"></div>`).join('');
    const s = M.scene(root, plants + '<div class="chain-water"></div><div class="traveler">✦</div><div class="orb" style="left:-14px;top:-14px"></div>' + Array.from({length: 3}, () => '<div class="ripple-ring" style="left:460px;top:252px;width:20px;height:20px"></div>').join('')); const grass = s.all('.chain-plant'), rings = s.all('.ripple-ring');
    return (t, o) => { const p = t / o.duration, x = -60 + p * 760, y = 180 + Math.sin(p * Math.PI * 2) * 22; M.pose(s.one('.traveler'), {x, y}); M.pose(s.one('.orb'), {x: x - 35, y: 180 + Math.sin((p - .05) * Math.PI * 2) * 22, scale: .45, opacity: .6}); grass.forEach((c, i) => { const distance = Math.abs(x - (156 + i * 27)); const q = M.clamp(1 - distance / 62); M.pose(c, {rotate: q * 32}); }); rings.forEach((c, i) => { const q = M.span(t, 6900 + i * 180, 8500 + i * 180, o.ease); M.pose(c, {scale: 1 + q * 7, opacity: t > 6900 + i * 180 ? (1 - M.clamp(q)) * .65 : 0}); }); };
  };
})(globalThis.MotionFactories);
