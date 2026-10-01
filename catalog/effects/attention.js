/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['count-up'] = (root, M) => {
    const s = M.scene(root, '<div class="big-number">0</div><div class="number-caption">每一步，走向确定的结果。</div>');
    return (t, o) => { s.one('.big-number').textContent = String(Math.round(M.clamp(M.span(t, 200, 2600, o.ease)) * 128)); };
  };
  F['type-reveal'] = (root, M) => {
    const text = '把想法讲清楚。'; const s = M.scene(root, '<div class="headline" style="font-size:42px">' + [...text].map(c => `<span>${c}</span>`).join('') + '</div>');
    const chars = s.all('.headline span');
    return (t, o) => { const p = M.span(t, 200, 2600, o.ease); chars.forEach((c, i) => { c.style.opacity = p >= (i + 1) / chars.length ? '1' : '0'; }); };
  };
  F.highlight = (root, M) => {
    const s = M.scene(root, '<div class="word-line"><span>清楚</span><span>自然</span><span>有重点</span></div>'); const words = s.all('.word-line span');
    return (t, o) => { const p = M.clamp(M.span(t, 200, 4200, o.ease)); const n = Math.min(2, Math.floor(p * 3)); words.forEach((w, i) => { w.className = i === n ? 'is-mark' : 'is-idle'; M.pose(w, {scale: i === n ? 1.03 : 1}); }); };
  };
  F['focus-zoom'] = (root, M) => {
    const s = M.scene(root, M.cardSet(3)); const cards = s.all('.mini-card'); cards.forEach((c, i) => { c.style.left = `${148 + i * 118}px`; c.style.top = '125px'; });
    return (t, o) => { const p = M.span(t, 600, 2200, o.ease); cards.forEach((c, i) => M.pose(c, {scale: i === 1 ? 1 + p * .38 : 1 - p * .08, opacity: i === 1 ? 1 : 1 - p * .58, x: i === 1 ? 0 : (i - 1) * p * 18})); };
  };
})(globalThis.MotionFactories);
